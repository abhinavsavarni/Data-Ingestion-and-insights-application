import pool from './db.js';
import { getTenantIdByShop } from './helpers.js';

// Webhook event handlers
export const webhookHandlers = {
  // Order webhooks
  'orders/create': async (shop, data) => {
    console.log(`📦 Order created in ${shop}:`, data.id);
    await handleOrderWebhook(shop, data, 'create');
  },

  'orders/updated': async (shop, data) => {
    console.log(`📦 Order updated in ${shop}:`, data.id);
    await handleOrderWebhook(shop, data, 'update');
  },

  'orders/paid': async (shop, data) => {
    console.log(`💰 Order paid in ${shop}:`, data.id);
    await handleOrderWebhook(shop, data, 'update');
  },

  'orders/cancelled': async (shop, data) => {
    console.log(`❌ Order cancelled in ${shop}:`, data.id);
    await handleOrderWebhook(shop, data, 'update');
  },

  // Customer webhooks
  'customers/create': async (shop, data) => {
    console.log(`👤 Customer created in ${shop}:`, data.id);
    await handleCustomerWebhook(shop, data, 'create');
  },

  'customers/update': async (shop, data) => {
    console.log(`👤 Customer updated in ${shop}:`, data.id);
    await handleCustomerWebhook(shop, data, 'update');
  },

  // Product webhooks
  'products/create': async (shop, data) => {
    console.log(`🛍️ Product created in ${shop}:`, data.id);
    await handleProductWebhook(shop, data, 'create');
  },

  'products/update': async (shop, data) => {
    console.log(`🛍️ Product updated in ${shop}:`, data.id);
    await handleProductWebhook(shop, data, 'update');
  }
};

// Order webhook handler
async function handleOrderWebhook(shop, orderData, action) {
  const client = await pool.connect();
  try {
    const tenantId = await getTenantIdByShop(shop);
    if (!tenantId) {
      console.error(`Tenant not found for shop: ${shop}`);
      return;
    }

    // Get or create customer
    let customerId = null;
    if (orderData.customer) {
      const customerRes = await client.query(
        'SELECT id FROM customers WHERE tenant_id = $1 AND shopify_customer_id = $2',
        [tenantId, orderData.customer.id]
      );
      
      if (customerRes.rows.length === 0) {
        // Create customer if doesn't exist
        const newCustomerRes = await client.query(
          'INSERT INTO customers (tenant_id, shopify_customer_id, email, first_name, last_name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
          [
            tenantId,
            orderData.customer.id,
            orderData.customer.email,
            orderData.customer.first_name,
            orderData.customer.last_name,
            orderData.customer.created_at,
            orderData.customer.updated_at
          ]
        );
        customerId = newCustomerRes.rows[0].id;
      } else {
        customerId = customerRes.rows[0].id;
      }
    }

    // Handle order
    if (action === 'create') {
      await client.query(
        'INSERT INTO orders (tenant_id, shopify_order_id, customer_id, total_price, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (tenant_id, shopify_order_id) DO NOTHING',
        [tenantId, orderData.id, customerId, orderData.total_price, orderData.created_at, orderData.updated_at]
      );
    } else if (action === 'update') {
      await client.query(
        'UPDATE orders SET customer_id = $1, total_price = $2, updated_at = $3 WHERE tenant_id = $4 AND shopify_order_id = $5',
        [customerId, orderData.total_price, orderData.updated_at, tenantId, orderData.id]
      );
    }

    console.log(`✅ Order ${action} processed for ${shop}`);
  } catch (error) {
    console.error(`❌ Error processing order webhook for ${shop}:`, error);
  } finally {
    client.release();
  }
}

// Customer webhook handler
async function handleCustomerWebhook(shop, customerData, action) {
  const client = await pool.connect();
  try {
    const tenantId = await getTenantIdByShop(shop);
    if (!tenantId) {
      console.error(`Tenant not found for shop: ${shop}`);
      return;
    }

    if (action === 'create') {
      await client.query(
        'INSERT INTO customers (tenant_id, shopify_customer_id, email, first_name, last_name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (tenant_id, shopify_customer_id) DO NOTHING',
        [
          tenantId,
          customerData.id,
          customerData.email,
          customerData.first_name,
          customerData.last_name,
          customerData.created_at,
          customerData.updated_at
        ]
      );
    } else if (action === 'update') {
      await client.query(
        'UPDATE customers SET email = $1, first_name = $2, last_name = $3, updated_at = $4 WHERE tenant_id = $5 AND shopify_customer_id = $6',
        [customerData.email, customerData.first_name, customerData.last_name, customerData.updated_at, tenantId, customerData.id]
      );
    }

    console.log(`✅ Customer ${action} processed for ${shop}`);
  } catch (error) {
    console.error(`❌ Error processing customer webhook for ${shop}:`, error);
  } finally {
    client.release();
  }
}

// Product webhook handler
async function handleProductWebhook(shop, productData, action) {
  const client = await pool.connect();
  try {
    const tenantId = await getTenantIdByShop(shop);
    if (!tenantId) {
      console.error(`Tenant not found for shop: ${shop}`);
      return;
    }

    if (action === 'create') {
      await client.query(
        'INSERT INTO products (tenant_id, shopify_product_id, title, price, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (tenant_id, shopify_product_id) DO NOTHING',
        [tenantId, productData.id, productData.title, productData.variants?.[0]?.price, productData.created_at, productData.updated_at]
      );
    } else if (action === 'update') {
      await client.query(
        'UPDATE products SET title = $1, price = $2, updated_at = $3 WHERE tenant_id = $4 AND shopify_product_id = $5',
        [productData.title, productData.variants?.[0]?.price, productData.updated_at, tenantId, productData.id]
      );
    }

    console.log(`✅ Product ${action} processed for ${shop}`);
  } catch (error) {
    console.error(`❌ Error processing product webhook for ${shop}:`, error);
  } finally {
    client.release();
  }
}
