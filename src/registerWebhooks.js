import axios from 'axios';
import pool from './db.js';
import config from './config.js';

const webhookConfigs = [
  {
    topic: 'orders/create',
    address: `${config.webhooks.baseUrl}/webhooks/orders/create`
  },
  {
    topic: 'orders/updated',
    address: `${config.webhooks.baseUrl}/webhooks/orders/updated`
  },
  {
    topic: 'orders/paid',
    address: `${config.webhooks.baseUrl}/webhooks/orders/paid`
  },
  {
    topic: 'orders/cancelled',
    address: `${config.webhooks.baseUrl}/webhooks/orders/cancelled`
  },
  {
    topic: 'customers/create',
    address: `${config.webhooks.baseUrl}/webhooks/customers/create`
  },
  {
    topic: 'customers/update',
    address: `${config.webhooks.baseUrl}/webhooks/customers/update`
  },
  {
    topic: 'products/create',
    address: `${config.webhooks.baseUrl}/webhooks/products/create`
  },
  {
    topic: 'products/update',
    address: `${config.webhooks.baseUrl}/webhooks/products/update`
  }
];

// Validate webhook URLs
function validateWebhookUrls() {
  if (!config.webhooks.baseUrl) {
    throw new Error('Webhook base URL is not configured');
  }
  
  if (!config.webhooks.baseUrl.startsWith('https://')) {
    throw new Error(`Webhook base URL must use HTTPS: ${config.webhooks.baseUrl}`);
  }
  
  console.log(`✅ Webhook base URL validated: ${config.webhooks.baseUrl}`);
}

// Validate on module load
validateWebhookUrls();

export async function registerWebhooks(shop) {
  const client = await pool.connect();
  let accessToken;
  try {
    const res = await client.query('SELECT shopify_access_token FROM tenants WHERE shopify_domain = $1', [shop]);
    accessToken = res.rows[0]?.shopify_access_token;
  } finally {
    client.release();
  }
  
  if (!accessToken) {
    throw new Error(`No access token found for shop: ${shop}`);
  }

  console.log(`🔗 Registering webhooks for ${shop}...`);
  console.log(`📍 Webhook base URL: ${config.webhooks.baseUrl}`);

  for (const webhookConfig of webhookConfigs) {
    console.log(`🎯 Attempting to register: ${webhookConfig.topic} → ${webhookConfig.address}`);
    
    try {
      // First, check if webhook already exists
      const existingWebhooks = await axios.get(
        `https://${shop}/admin/api/2023-07/webhooks.json?topic=${webhookConfig.topic}`,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        }
      );

      // Delete existing webhooks for this topic
      for (const webhook of existingWebhooks.data.webhooks) {
        if (webhook.address === webhookConfig.address) {
          await axios.delete(`https://${shop}/admin/api/2023-07/webhooks/${webhook.id}.json`, {
            headers: {
              'X-Shopify-Access-Token': accessToken
            }
          });
          console.log(`🗑️ Deleted existing webhook: ${webhookConfig.topic}`);
        }
      }

      // Create new webhook
      const response = await axios.post(`https://${shop}/admin/api/2023-07/webhooks.json`, {
        webhook: {
          topic: webhookConfig.topic,
          address: webhookConfig.address,
          format: 'json'
        }
      }, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ Registered webhook: ${webhookConfig.topic} → ${webhookConfig.address}`);
    } catch (error) {
      console.error(`❌ Failed to register webhook ${webhookConfig.topic}:`, {
        url: webhookConfig.address,
        error: error.response?.data || error.message,
        status: error.response?.status
      });
    }
  }

  console.log(`🎉 Webhook registration completed for ${shop}`);
}

export async function unregisterWebhooks(shop) {
  const client = await pool.connect();
  let accessToken;
  try {
    const res = await client.query('SELECT shopify_access_token FROM tenants WHERE shopify_domain = $1', [shop]);
    accessToken = res.rows[0]?.shopify_access_token;
  } finally {
    client.release();
  }
  
  if (!accessToken) {
    throw new Error(`No access token found for shop: ${shop}`);
  }

  console.log(`🗑️ Unregistering webhooks for ${shop}...`);

  try {
    const webhooks = await axios.get(`https://${shop}/admin/api/2023-07/webhooks.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    for (const webhook of webhooks.data.webhooks) {
      if (webhook.address.startsWith(config.webhooks.baseUrl)) {
        await axios.delete(`https://${shop}/admin/api/2023-07/webhooks/${webhook.id}.json`, {
          headers: {
            'X-Shopify-Access-Token': accessToken
          }
        });
        console.log(`🗑️ Deleted webhook: ${webhook.topic}`);
      }
    }

    console.log(`🎉 Webhook unregistration completed for ${shop}`);
  } catch (error) {
    console.error(`❌ Failed to unregister webhooks for ${shop}:`, error.response?.data || error.message);
  }
}
