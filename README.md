# Shopify Data Ingestion App

Backend service to ingest Shopify Customers, Orders, Products, and Events for multiple tenants (stores) with data isolation. Uses Node.js/Express and PostgreSQL.

## Features
- Multi-tenant support (OAuth per store)
- Ingests customers, orders, products, custom events
- Stores data in PostgreSQL
- API endpoints for ingestion

## Setup
1. Install dependencies: `npm install`
2. Configure PostgreSQL connection in `.env`
3. Start server: `npm start`

## Next Steps
- Scaffold Express app
- Add database models
- Implement Shopify OAuth
- Create ingestion endpoints
