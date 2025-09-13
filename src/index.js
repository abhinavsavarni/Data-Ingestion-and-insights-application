

import pool from './db.js';
import config from './config.js';
import { registerWebhooks, unregisterWebhooks } from './registerWebhooks.js';
import express from 'express';
import dotenv from 'dotenv';
import { getShopifyAuthUrl, exchangeCodeForToken, storeTenant, linkStoreToUser } from './shopifyAuth.js';
import { ingestCustomers, ingestProducts, ingestOrders, ingestEvents } from './ingest.js';
import admin from "./firebaseAdmin.js";
import { webhookHandlers } from './webhookHandlers.js';
import { webhookVerificationMiddleware } from './webhookVerification.js';
import { getTenantIdByShop } from './helpers.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.raw({ type: 'application/json', verify: (req, res, buf) => { req.rawBody = buf; } }));

import cors from "cors";
app.use(cors({
  origin: config.cors.origin,
  credentials: true
})); 


// Simple /api/shop endpoint
app.get("/api/shop", async (req, res) => {
  const client = await pool.connect();
  try {
    // For testing: return the first shop in tenants table
    const result = await client.query("SELECT shopify_domain FROM tenants LIMIT 1");

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No shop found in tenants table" });
    }

    res.json({ shop: result.rows[0].shopify_domain });
  } catch (err) {
    console.error("Error fetching shop:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});


// Metrics API for dashboard
app.get('/api/metrics', async (req, res) => {
  const { shop, start, end } = req.query;
  const tenantId = await getTenantIdByShop(shop);
  if (!tenantId) return res.status(404).send('Tenant not found');

  // Build optional date filter
  const dateFilter = [];
  const params = [tenantId];
  if (start) {
    params.push(start);
    dateFilter.push(`created_at >= $${params.length}`);
  }
  if (end) {
    params.push(end);
    dateFilter.push(`created_at <= $${params.length}`);
  }
  const whereOrders = [`tenant_id = $1`].concat(dateFilter).join(' AND ');

  const client = await pool.connect();
  try {
    // Total customers (all-time, not filtered)
    const customersRes = await client.query('SELECT COUNT(*) FROM customers WHERE tenant_id = $1', [tenantId]);

    // Total orders and revenue (date-filtered if provided)
    const ordersRes = await client.query(`
      SELECT COUNT(*) AS orders, COALESCE(SUM(total_price),0) AS revenue
      FROM orders
      WHERE ${whereOrders}
    `, params);

    // Average order value (AOV)
    const aovRes = await client.query(`
      SELECT COALESCE(AVG(total_price),0) AS aov
      FROM orders
      WHERE ${whereOrders}
    `, params);

    // Orders by date
    const ordersByDateRes = await client.query(`
      SELECT DATE(created_at) AS date, COUNT(*) AS orders
      FROM orders
      WHERE ${whereOrders}
      GROUP BY DATE(created_at)
      ORDER BY date
    `, params);

    // Revenue trend by date
    const revenueTrendRes = await client.query(`
      SELECT DATE(created_at) AS date, COALESCE(SUM(total_price),0) AS revenue
      FROM orders
      WHERE ${whereOrders}
      GROUP BY DATE(created_at)
      ORDER BY date
    `, params);

    // Top 5 customers by spend (date-filtered spend)
    const topCustomersRes = await client.query(`
      SELECT COALESCE(c.email, 'Guest') AS name, COALESCE(SUM(o.total_price),0) AS spend
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE c.tenant_id = $1
      ${dateFilter.length ? `AND o.created_at IS NOT NULL AND ${dateFilter.map((_, idx) => idx === 0 ? dateFilter[idx] : dateFilter[idx]).join(' AND ')}` : ''}
      GROUP BY c.email
      ORDER BY spend DESC
      LIMIT 5
    `, [tenantId, ...params.slice(1)]);

    // Repeat purchase rate (customers with 2+ orders / customers with >=1 order in range)
    const repeatRateRes = await client.query(`
      WITH orders_in_range AS (
        SELECT customer_id, COUNT(*) AS cnt
        FROM orders
        WHERE ${whereOrders}
        GROUP BY customer_id
      )
      SELECT 
        COALESCE(
          (SELECT COUNT(*) FROM orders_in_range WHERE cnt >= 2)::decimal /
          NULLIF((SELECT COUNT(*) FROM orders_in_range WHERE cnt >= 1), 0)
        , 0) AS repeat_rate
    `, params);

    res.json({
      customers: parseInt(customersRes.rows[0].count),
      orders: parseInt(ordersRes.rows[0].orders),
      revenue: parseFloat(ordersRes.rows[0].revenue),
      aov: parseFloat(aovRes.rows[0].aov),
      repeatRate: parseFloat(repeatRateRes.rows[0].repeat_rate),
      topCustomers: topCustomersRes.rows,
      ordersByDate: ordersByDateRes.rows,
      trends: revenueTrendRes.rows,
    });
  } catch (err) {
    console.error('Metrics error', err);
    res.status(500).send('Error: ' + err.message);
  } finally {
    client.release();
  }
});

// Endpoint to register webhooks for a shop
app.post('/register-webhooks', async (req, res) => {
  const { shop } = req.body;
  if (!shop) return res.status(400).send('Missing shop');
  try {
    await registerWebhooks(shop);
    res.send('Webhooks registered');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});
import { handleWebhookEvent } from './webhooks.js';
// Shopify webhook endpoints
app.post('/webhook/customers', async (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'];
  await handleWebhookEvent('customer', shop, req.body);
  res.status(200).send('Customer webhook received');
});

app.post('/webhook/orders', async (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'];
  await handleWebhookEvent('order', shop, req.body);
  res.status(200).send('Order webhook received');
});

app.post('/webhook/products', async (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'];
  await handleWebhookEvent('product', shop, req.body);
  res.status(200).send('Product webhook received');
});

app.post('/webhook/carts', async (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'];
  await handleWebhookEvent('cart', shop, req.body);
  res.status(200).send('Cart webhook received');
});


// Health check / root endpoint
app.get('/', (req, res) => {
  res.send('Shopify Data Ingestion App Backend');
});

// Shopify OAuth Step 1: Redirect to Shopify (with Firebase UID)
app.get('/shopify/auth', (req, res) => {
  const { shop, firebase_uid } = req.query;
  if (!shop) return res.status(400).send('Missing shop parameter');
  if (!firebase_uid) return res.status(400).send('Missing firebase_uid parameter');
  
  // Store firebase_uid in session or pass as state
  const url = getShopifyAuthUrl(shop) + `&state=${firebase_uid}`;
  res.redirect(url);
});

// Shopify OAuth Step 2: Callback and token exchange
app.get('/shopify/callback', async (req, res) => {
  const { shop, code, state } = req.query;
  if (!shop || !code) return res.status(400).send('Missing shop or code');
  if (!state) return res.status(400).send('Missing Firebase UID');
  
  try {
    const accessToken = await exchangeCodeForToken(shop, code);
    await storeTenant(shop, accessToken);
    await linkStoreToUser(state, shop);
    
    // Register webhooks for real-time data sync
    try {
      await registerWebhooks(shop);
      console.log(`✅ Webhooks registered for ${shop}`);
    } catch (webhookError) {
      console.error(`❌ Failed to register webhooks for ${shop}:`, webhookError);
      // Don't fail the entire flow if webhooks fail
    }
    
    res.send(`Shop ${shop} connected successfully! Webhooks registered for real-time data sync. You can now close this window and return to the dashboard.`);
  } catch (err) {
    res.status(500).send('OAuth error: ' + err.message);
  }
});

// Ingest customers
app.post('/ingest/customers', async (req, res) => {
  const { shop } = req.body;
  if (!shop) return res.status(400).send('Missing shop');
  try {
    await ingestCustomers(shop);
    res.send('Customers ingested');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

// Ingest products
app.post('/ingest/products', async (req, res) => {
  const { shop } = req.body;
  if (!shop) return res.status(400).send('Missing shop');
  try {
    await ingestProducts(shop);
    res.send('Products ingested');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

// Ingest orders
app.post('/ingest/orders', async (req, res) => {
  const { shop } = req.body;
  if (!shop) return res.status(400).send('Missing shop');
  try {
    await ingestOrders(shop);
    res.send('Orders ingested');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

// Ingest custom events
app.post('/ingest/events', async (req, res) => {
  const { shop, eventType, payload } = req.body;
  if (!shop || !eventType || !payload) return res.status(400).send('Missing parameters');
  try {
    await ingestEvents(shop, eventType, payload);
    res.send('Event ingested');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

// Middleware to verify Firebase token
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  
  // Temporary bypass for testing - remove this in production
  if (token === "test-token") {
    req.user = { uid: "zZtJ29j0pferHhI1gjhAd6egVVg1" };
    return next();
  }
  
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // Firebase user info
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).json({ error: "Invalid token" });
  }
}

// Get all stores for a user (multi-tenant)
app.get("/api/stores", verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT t.id, t.name, t.shopify_domain, us.created_at as connected_at
      FROM user_stores us
      JOIN tenants t ON us.tenant_id = t.id
      WHERE us.firebase_uid = $1
      ORDER BY us.created_at DESC
    `, [req.user.uid]);

    res.json({ stores: result.rows });
  } catch (err) {
    console.error("Error fetching stores:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

// Get specific store for metrics (legacy compatibility)
app.get("/api/shop", verifyToken, async (req, res) => {
  const { store_id } = req.query;
  const client = await pool.connect();
  try {
    if (store_id) {
      // Get specific store by ID
      const result = await client.query(`
        SELECT t.shopify_domain
        FROM user_stores us
        JOIN tenants t ON us.tenant_id = t.id
        WHERE us.firebase_uid = $1 AND t.id = $2
      `, [req.user.uid, store_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Store not found or access denied" });
      }

      res.json({ shop: result.rows[0].shopify_domain });
    } else {
      // Get first store (legacy behavior)
      const result = await client.query(`
        SELECT t.shopify_domain
        FROM user_stores us
        JOIN tenants t ON us.tenant_id = t.id
        WHERE us.firebase_uid = $1
        ORDER BY us.created_at DESC
        LIMIT 1
      `, [req.user.uid]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "No stores found for this user" });
      }

      res.json({ shop: result.rows[0].shopify_domain });
    }
  } catch (err) {
    console.error("Error fetching shop:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

// Connect a new store
app.post("/api/connect-store", verifyToken, async (req, res) => {
  const { shop } = req.body;
  if (!shop) return res.status(400).json({ error: "Missing shop parameter" });
  
  try {
    // Check if store already exists
    const client = await pool.connect();
    try {
      const existingStore = await client.query(
        "SELECT id FROM tenants WHERE shopify_domain = $1",
        [shop]
      );
      
      if (existingStore.rows.length === 0) {
        return res.status(404).json({ error: "Store not found. Please connect via Shopify OAuth first." });
      }
      
      // Link user to existing store
      await linkStoreToUser(req.user.uid, shop);
      res.json({ message: "Store connected successfully" });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error connecting store:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Webhook endpoints
app.post('/webhooks/orders/create', webhookVerificationMiddleware, (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'];
  webhookHandlers['orders/create'](shop, req.body);
  res.status(200).send('OK');
});

app.post('/webhooks/orders/updated', webhookVerificationMiddleware, (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'];
  webhookHandlers['orders/updated'](shop, req.body);
  res.status(200).send('OK');
});

app.post('/webhooks/orders/paid', webhookVerificationMiddleware, (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'];
  webhookHandlers['orders/paid'](shop, req.body);
  res.status(200).send('OK');
});

app.post('/webhooks/orders/cancelled', webhookVerificationMiddleware, (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'];
  webhookHandlers['orders/cancelled'](shop, req.body);
  res.status(200).send('OK');
});

app.post('/webhooks/customers/create', webhookVerificationMiddleware, (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'];
  webhookHandlers['customers/create'](shop, req.body);
  res.status(200).send('OK');
});

app.post('/webhooks/customers/update', webhookVerificationMiddleware, (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'];
  webhookHandlers['customers/update'](shop, req.body);
  res.status(200).send('OK');
});

app.post('/webhooks/products/create', webhookVerificationMiddleware, (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'];
  webhookHandlers['products/create'](shop, req.body);
  res.status(200).send('OK');
});

app.post('/webhooks/products/update', webhookVerificationMiddleware, (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'];
  webhookHandlers['products/update'](shop, req.body);
  res.status(200).send('OK');
});

// Webhook management endpoints
app.post('/api/register-webhooks', async (req, res) => {
  const { shop } = req.body;
  if (!shop) return res.status(400).json({ error: 'Missing shop' });

  try {
    await registerWebhooks(shop);
    res.json({ message: `Webhooks registered for ${shop}` });
  } catch (error) {
    console.error('Webhook registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/unregister-webhooks', async (req, res) => {
  const { shop } = req.body;
  if (!shop) return res.status(400).json({ error: 'Missing shop' });

  try {
    await unregisterWebhooks(shop);
    res.json({ message: `Webhooks unregistered for ${shop}` });
  } catch (error) {
    console.error('Webhook unregistration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (config.server.nodeEnv === 'production') {
  app.use(express.static('dist'));
  app.get('*', (req, res) => {
    res.sendFile('dist/index.html', { root: '.' });
  });
}

const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${config.server.nodeEnv}`);
  console.log(`🔗 Webhook base URL: ${config.webhooks.baseUrl}`);
});
