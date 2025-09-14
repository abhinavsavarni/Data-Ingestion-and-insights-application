import pool from './db.js';


export async function getTenantIdByShop(shop) {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id FROM tenants WHERE shopify_domain = $1', [shop]);
    return res.rows[0]?.id;
  } finally {
    client.release();
  }
}
