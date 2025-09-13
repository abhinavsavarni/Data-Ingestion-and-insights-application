import dotenv from 'dotenv';

dotenv.config();

const config = {
  database: process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  } : process.env.DATABASE_PUBLIC_URL ? {
    connectionString: process.env.DATABASE_PUBLIC_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  } : {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shopify_data',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  },

  // Server
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  // CORS
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL, 'https://your-app.railway.app'] 
      : ['http://localhost:5173', 'http://localhost:3000']
  },

  // Shopify
  shopify: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecret: process.env.SHOPIFY_API_SECRET,
    scopes: process.env.SHOPIFY_SCOPES || 'read_orders,read_customers,read_products,write_orders,write_customers,write_products',
    webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET
  },

  // Firebase
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  },

  // Webhooks
  webhooks: {
    baseUrl: process.env.WEBHOOK_BASE_URL || process.env.RAILWAY_PUBLIC_DOMAIN || 'https://your-app.railway.app',
    events: [
      'orders/create',
      'orders/updated', 
      'orders/paid',
      'orders/cancelled',
      'customers/create',
      'customers/update',
      'products/create',
      'products/update'
    ]
  }
};

// Validation
const requiredEnvVars = [
  'SHOPIFY_API_KEY',
  'SHOPIFY_API_SECRET',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.warn(`Missing environment variables: ${missingVars.join(', ')}`);
  if (config.server.nodeEnv === 'production') {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

export default config;
