import pool from './db.js';


export async function handleWebhookEvent(eventType, shop, payload) {
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
