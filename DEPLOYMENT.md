# 🚀 Railway Deployment Guide

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Push your code to GitHub
3. **Shopify App**: Create a Shopify app in your Partner Dashboard
4. **Firebase Project**: Set up Firebase Authentication

## Step 1: Prepare Your Code

Your project is already configured for Railway deployment with:
- ✅ Production configuration (`src/config.js`)
- ✅ Webhook system for real-time data sync
- ✅ Frontend build process
- ✅ Railway configuration files

## Step 2: Deploy to Railway

### 2.1 Create New Project
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### 2.2 Add PostgreSQL Database
1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically provide connection details

### 2.3 Configure Environment Variables
Add these environment variables in Railway:

```bash
# Database (Railway will auto-populate these)
DATABASE_URL=postgresql://...

# Server
NODE_ENV=production
PORT=3000

# Shopify
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_SCOPES=read_orders,read_customers,read_products,write_orders,write_customers,write_products
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret

# Firebase
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account_email@your-project.iam.gserviceaccount.com

# Webhooks (Railway will provide this)
RAILWAY_PUBLIC_DOMAIN=https://your-app.railway.app
```

### 2.4 Deploy
1. Railway will automatically deploy when you push to GitHub
2. Your app will be available at `https://your-app.railway.app`

## Step 3: Set Up Database

### 3.1 Connect to Railway PostgreSQL
```bash
# Get connection details from Railway dashboard
psql $DATABASE_URL
```

### 3.2 Run Database Schema
```sql
-- Copy and paste the contents of db_schema.sql
-- This will create all necessary tables
```

## Step 4: Configure Shopify App

### 4.1 Update App URLs
In your Shopify Partner Dashboard:
- **App URL**: `https://your-app.railway.app`
- **Allowed redirection URLs**: `https://your-app.railway.app/shopify/callback`

### 4.2 Webhook URLs
Add these webhook endpoints in your Shopify app settings:
- `https://your-app.railway.app/webhooks/orders/create`
- `https://your-app.railway.app/webhooks/orders/updated`
- `https://your-app.railway.app/webhooks/orders/paid`
- `https://your-app.railway.app/webhooks/orders/cancelled`
- `https://your-app.railway.app/webhooks/customers/create`
- `https://your-app.railway.app/webhooks/customers/update`
- `https://your-app.railway.app/webhooks/products/create`
- `https://your-app.railway.app/webhooks/products/update`

## Step 5: Test Your Deployment

### 5.1 Health Check
```bash
curl https://your-app.railway.app/health
```

### 5.2 Test Webhook Registration
When you connect a store through your app, webhooks will be automatically registered.

### 5.3 Test Data Ingestion
```bash
# Test manual ingestion
curl -X POST https://your-app.railway.app/ingest/customers \
  -H "Content-Type: application/json" \
  -d '{"shop":"your-store.myshopify.com"}'
```

## Step 6: Monitor Your App

### 6.1 Railway Dashboard
- View logs in real-time
- Monitor resource usage
- Check deployment status

### 6.2 Webhook Monitoring
- Check Railway logs for webhook events
- Verify data is syncing in real-time

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL` environment variable
   - Ensure PostgreSQL service is running

2. **Webhook Registration Failed**
   - Verify `SHOPIFY_WEBHOOK_SECRET` is set
   - Check Shopify app permissions

3. **CORS Errors**
   - Update `FRONTEND_URL` in environment variables
   - Check `config.cors.origin` settings

4. **Firebase Auth Issues**
   - Verify Firebase service account credentials
   - Check Firebase project configuration

### Debug Commands

```bash
# Check environment variables
railway variables

# View logs
railway logs

# Connect to database
railway connect postgres
```

## 🎉 You're Live!

Your Shopify data ingestion app is now deployed and ready to:
- ✅ Connect multiple Shopify stores
- ✅ Sync data in real-time via webhooks
- ✅ Display beautiful analytics dashboards
- ✅ Handle multi-tenant data isolation

## Next Steps

1. **Custom Domain**: Add a custom domain in Railway
2. **Monitoring**: Set up error tracking (Sentry, etc.)
3. **Backups**: Configure database backups
4. **Scaling**: Monitor performance and scale as needed
