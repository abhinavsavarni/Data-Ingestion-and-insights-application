import axios from 'axios';
import pool from './db.js';
import dotenv from 'dotenv';
dotenv.config();

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const APP_URL = process.env.APP_URL || 'https://ravishing-determination-production.up.railway.app/';


export function getShopifyAuthUrl(shop) {
  const redirectUri = `${APP_URL}/shopify/callback`;
  const scopes = [
    'read_customers',
    'read_products',
     'read_orders',
    'read_checkouts'
  ].join(',');
  return `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${scopes}&redirect_uri=${redirectUri}`;
}

export async function exchangeCodeForToken(shop, code) {
  const url = `https://${shop}/admin/oauth/access_token`;
  const response = await axios.post(url, {
    client_id: SHOPIFY_API_KEY,
    client_secret: SHOPIFY_API_SECRET,
    code,
  });
  return response.data.access_token;
}

export async function storeTenant(shop, accessToken) {
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO tenants (name, shopify_domain, shopify_access_token) VALUES ($1, $2, $3) ON CONFLICT (shopify_domain) DO UPDATE SET shopify_access_token = $3',
      [shop, shop, accessToken]
    );
  } finally {
    client.release();
  }
}


export async function linkStoreToUser(firebaseUid, shop) {
  const client = await pool.connect();
  try {

    const tenantRes = await client.query('SELECT id FROM tenants WHERE shopify_domain = $1', [shop]);
    if (tenantRes.rows.length === 0) {
      throw new Error('Store not found');
    }
    const tenantId = tenantRes.rows[0].id;
    
    
    await client.query(
      'INSERT INTO user_stores (firebase_uid, tenant_id) VALUES ($1, $2) ON CONFLICT (firebase_uid, tenant_id) DO NOTHING',
      [firebaseUid, tenantId]
    );
  } finally {
    client.release();
  }
}
