# Troubleshooting Railway Deployment Issues

## Current Issue: "Store not found. Please connect via Shopify OAuth first."

This error occurs when a user tries to connect a store that hasn't completed the Shopify OAuth flow properly. Here's how to fix it:

### 1. Fixed Issues in This Update

✅ **Fixed Frontend OAuth Flow**: Updated `StoreSelector.jsx` to properly pass Firebase UID to OAuth flow
✅ **Firebase Auth Integration**: Now properly extracts user ID from Firebase authentication

### 2. Verify Railway Environment Variables

Make sure these environment variables are set in your Railway dashboard:

#### Required Database Variables
```
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=production
```

#### Required Shopify Variables
```
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_SCOPES=read_orders,read_customers,read_products,write_orders,write_customers,write_products
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
```

#### Required Firebase Variables
```
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account_email@your-project.iam.gserviceaccount.com
```

#### Required App URLs
```
APP_URL=https://your-app.railway.app
RAILWAY_PUBLIC_DOMAIN=https://your-app.railway.app
FRONTEND_URL=https://your-app.railway.app
```

### 3. Verify Database Schema

Connect to your Railway PostgreSQL and verify tables exist:

```sql
-- Check if tables exist
\dt

-- Should show: tenants, user_stores, customers, orders, products, events

-- If tables don't exist, run the db_schema.sql file
```

### 4. Test the Fixed OAuth Flow

1. **Deploy the frontend changes** (StoreSelector.jsx has been updated)
2. **Clear browser cache** and refresh the app
3. **Try connecting a store** using "Set up new store" button
4. **Verify OAuth flow** completes with Firebase UID parameter

### 5. Debug Steps

#### A. Check App Health
```bash
curl https://your-app.railway.app/health
```

#### B. Check Database Connection
The health endpoint should return `"database": "connected"`

#### C. Check Environment Variables in Railway Logs
Look for warnings about missing environment variables

#### D. Monitor OAuth Flow
1. Click "Set up new store" button
2. Check if OAuth URL includes `&firebase_uid=...` parameter
3. Complete OAuth in popup window
4. Check Railway logs for any errors

### 6. Common Issues and Solutions

#### Issue: "Missing Firebase UID"
**Solution**: Make sure user is logged in before trying to connect store

#### Issue: "Database connection failed"
**Solution**: Verify DATABASE_URL environment variable in Railway

#### Issue: "Invalid Shopify credentials"
**Solution**: Verify SHOPIFY_API_KEY and SHOPIFY_API_SECRET in Railway

#### Issue: "CORS errors"
**Solution**: Make sure FRONTEND_URL matches your Railway domain

### 7. Post-Fix Verification

After applying fixes:

1. ✅ OAuth URL should include Firebase UID
2. ✅ Store should save to tenants table
3. ✅ User-store relationship should save to user_stores table
4. ✅ Dashboard should load store metrics

### 8. Getting Help

If issues persist:

1. Check Railway deployment logs
2. Verify all environment variables are set
3. Test the OAuth flow step by step
4. Check database tables for data

## Updated Files in This Fix

- `Frontend/src/components/StoreSelector.jsx` - Fixed OAuth flow to pass Firebase UID
- `TROUBLESHOOTING.md` - This troubleshooting guide

## Next Steps

1. Deploy the updated frontend code
2. Verify environment variables in Railway
3. Test the store connection flow
4. Monitor Railway logs for any remaining issues