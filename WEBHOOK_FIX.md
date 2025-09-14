# 🔧 Railway Environment Variables Fix

## Critical Issue: Invalid Webhook Address

The webhook registration is failing because Shopify requires HTTPS webhook URLs and proper environment variable configuration.

## ✅ Required Environment Variables

Add these to your Railway **main application service** (not Postgres):

### 1. Webhook Base URL
```
WEBHOOK_BASE_URL=https://ravishing-determination-production.up.railway.app
```

### 2. App URL (fallback)
```
APP_URL=https://ravishing-determination-production.up.railway.app
```

### 3. Railway Public Domain (fallback)
```
RAILWAY_PUBLIC_DOMAIN=https://ravishing-determination-production.up.railway.app
```

### 4. Webhook Secret (for verification)
```
SHOPIFY_WEBHOOK_SECRET=your-secure-webhook-secret-123
```

## 🚀 How to Add Environment Variables in Railway

1. **Go to Railway Dashboard**
2. **Select your project** (pacific-amazement)
3. **Click on your main app service** (NOT the Postgres service)
4. **Go to Variables tab**
5. **Add each variable above**

## 🔍 How to Identify the Right Service

You have two services:
- **Postgres** - Database service (you're currently linked to this)
- **Main App** - Your Node.js application (this is where you need to add variables)

To switch to your main app service:
```bash
# List all services in your project
railway service

# Select your main app service (not Postgres)
```

## ✅ Expected Webhook URLs

After fixing, these URLs should be registered:
- `https://ravishing-determination-production.up.railway.app/webhooks/orders/create`
- `https://ravishing-determination-production.up.railway.app/webhooks/customers/create`
- `https://ravishing-determination-production.up.railway.app/webhooks/products/create`
- (and more...)

## 🎯 After Adding Variables

1. **Deploy the updated code** with improved logging
2. **Redeploy your Railway app** to pick up new environment variables
3. **Try connecting a store again** 
4. **Check logs** for successful webhook registration:
   ```
   📍 Webhook base URL: https://your-app.railway.app
   🎯 Attempting to register: orders/create → https://your-app.railway.app/webhooks/orders/create
   ✅ Registered webhook: orders/create → https://your-app.railway.app/webhooks/orders/create
   ```

## 🚨 Common Issues

- **Missing HTTPS**: Webhook URLs must use HTTPS (not HTTP)
- **Wrong service**: Environment variables must be in main app service, not Postgres
- **Missing variables**: All webhook-related variables must be set
- **Typos in domain**: Ensure domain matches your Railway app exactly

Deploy the updated code first, then add the environment variables!