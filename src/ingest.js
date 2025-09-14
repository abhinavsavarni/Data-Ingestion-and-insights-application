import axios from 'axios';
import pool from './db.js';

// Helper to get access token for a tenant
export async function getAccessToken(shop) {
  const client = await pool.connect();
  try {
    console.log(`🔍 Looking up access token for ingestion: ${shop}`);
    const res = await client.query('SELECT shopify_access_token, name FROM tenants WHERE shopify_domain = $1', [shop]);
    
    if (res.rows.length === 0) {
      console.error(`❌ No tenant found for ingestion: ${shop}`);
      throw new Error(`No tenant found for shop: ${shop}. Please connect this store via OAuth first.`);
    }
    
    const accessToken = res.rows[0]?.shopify_access_token;
    const tenantName = res.rows[0]?.name;
    
    console.log(`📋 Tenant for ingestion: ${tenantName}, Access token: ${accessToken ? 'Present' : 'Missing'}`);
    
    if (!accessToken) {
      console.error(`❌ No access token for ingestion: ${shop}`);
      throw new Error(`No access token found for shop: ${shop}. Please reconnect this store via OAuth.`);
    }
    
    return accessToken;
  } finally {
    client.release();
  }
}

// Ingest customers
export async function ingestCustomers(shop) {
  const accessToken = await getAccessToken(shop);
  const url = `https://${shop}/admin/api/2023-07/customers.json`;
  const response = await axios.get(url, {
    headers: { 'X-Shopify-Access-Token': accessToken }
  });
  const customers = response.data.customers;
  const client = await pool.connect();
  try {
    for (const c of customers) {
      await client.query(
        'INSERT INTO customers (tenant_id, shopify_customer_id, email, first_name, last_name, created_at, updated_at) VALUES ((SELECT id FROM tenants WHERE shopify_domain = $1), $2, $3, $4, $5, $6, $7) ON CONFLICT (tenant_id, shopify_customer_id) DO NOTHING',
        [shop, c.id, c.email, c.first_name, c.last_name, c.created_at, c.updated_at]
      );
    }
  } finally {
    client.release();
  }
}

// Ingest products
export async function ingestProducts(shop) {
  const accessToken = await getAccessToken(shop);
  const url = `https://${shop}/admin/api/2023-07/products.json`;
  const response = await axios.get(url, {
    headers: { 'X-Shopify-Access-Token': accessToken }
  });
  const products = response.data.products;
  const client = await pool.connect();
  try {
    for (const p of products) {
      await client.query(
        'INSERT INTO products (tenant_id, shopify_product_id, title, price, created_at, updated_at) VALUES ((SELECT id FROM tenants WHERE shopify_domain = $1), $2, $3, $4, $5, $6) ON CONFLICT (tenant_id, shopify_product_id) DO NOTHING',
        [shop, p.id, p.title, p.variants[0]?.price || 0, p.created_at, p.updated_at]
      );
    }
  } finally {
    client.release();
  }
}

// Parse Shopify Link header for next page URL
function parseNextLink(linkHeader) {
  if (!linkHeader) return null;
  // Example: <https://shop/admin/api/2023-07/orders.json?limit=250&page_info=xxxx>; rel="next"
  const parts = linkHeader.split(',');
  for (const part of parts) {
    const section = part.split(';');
    if (section.length < 2) continue;
    const urlPart = section[0].trim();
    const relPart = section[1].trim();
    if (relPart === 'rel="next"') {
      // Remove angle brackets
      return urlPart.substring(1, urlPart.length - 1);
    }
  }
  return null;
}

// Ingest orders (with pagination, include all statuses)
export async function ingestOrders(shop) {
  const accessToken = await getAccessToken(shop);
  let nextUrl = `https://${shop}/admin/api/2023-07/orders.json?status=any&limit=250`;
  const client = await pool.connect();
  try {
    while (nextUrl) {
      const response = await axios.get(nextUrl, {
        headers: { 'X-Shopify-Access-Token': accessToken }
      });
      const orders = response.data.orders || [];

      for (const o of orders) {
        await client.query(
          'INSERT INTO orders (tenant_id, shopify_order_id, customer_id, total_price, created_at, updated_at) VALUES ((SELECT id FROM tenants WHERE shopify_domain = $1), $2, (SELECT id FROM customers WHERE shopify_customer_id = $3), $4, $5, $6) ON CONFLICT (tenant_id, shopify_order_id) DO NOTHING',
          [shop, o.id, o.customer?.id, o.total_price, o.created_at, o.updated_at]
        );
      }

      nextUrl = parseNextLink(response.headers.link);
    }
  } finally {
    client.release();
  }
}

// Ingest custom events (bonus)
export async function ingestEvents(shop, eventType, payload) {
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO events (tenant_id, event_type, payload) VALUES ((SELECT id FROM tenants WHERE shopify_domain = $1), $2, $3)',
      [shop, eventType, payload]
    );
  } finally {
    client.release();
  }
}
