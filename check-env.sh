#!/bin/bash

# Script to check critical environment variables in Railway deployment
# Run this after linking to your main app service (not Postgres)

echo "🔍 Checking critical environment variables for Shopify integration..."
echo "=============================================================="

# Check if we're linked to the right service
echo "Current Railway service:"
railway status

echo ""
echo "🔑 Checking environment variables..."

# This will show all environment variables for the current service
railway variables > temp_vars.txt

# Check for critical Shopify variables
echo "Checking for SHOPIFY_API_KEY..."
if grep -q "SHOPIFY_API_KEY" temp_vars.txt; then
    echo "✅ SHOPIFY_API_KEY found"
else
    echo "❌ SHOPIFY_API_KEY missing - CRITICAL!"
fi

echo "Checking for SHOPIFY_API_SECRET..."
if grep -q "SHOPIFY_API_SECRET" temp_vars.txt; then
    echo "✅ SHOPIFY_API_SECRET found"
else
    echo "❌ SHOPIFY_API_SECRET missing - CRITICAL!"
fi

echo "Checking for FIREBASE_PROJECT_ID..."
if grep -q "FIREBASE_PROJECT_ID" temp_vars.txt; then
    echo "✅ FIREBASE_PROJECT_ID found"
else
    echo "❌ FIREBASE_PROJECT_ID missing - CRITICAL!"
fi

echo "Checking for APP_URL..."
if grep -q "APP_URL" temp_vars.txt; then
    echo "✅ APP_URL found"
else
    echo "❌ APP_URL missing - may cause OAuth issues"
fi

echo "Checking for DATABASE_URL..."
if grep -q "DATABASE_URL" temp_vars.txt; then
    echo "✅ DATABASE_URL found"
else
    echo "❌ DATABASE_URL missing - CRITICAL!"
fi

# Clean up
rm temp_vars.txt

echo ""
echo "=============================================================="
echo "🚀 Next steps:"
echo "1. If any CRITICAL variables are missing, add them in Railway dashboard"
echo "2. Deploy the updated code with fixed routing"
echo "3. Test the /health endpoint to verify API is working"
echo "4. Try the OAuth flow again"