# Shopify Data Ingestion App

This project is a full‑stack application that integrates with Shopify to ingest and persist data (customers, orders, and products) into a PostgreSQL database. It uses **Node.js/Express** for the backend, **React (Vite)** for the frontend, **Firebase** for authentication, and is deployed on **Railway**.

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL (local or cloud‑hosted)
- Shopify Partner account (for API keys & app registration)
- Firebase project (for authentication)
- Railway account (for deployment)

### Environment Variables

Create a `.env` file in the project root with the following keys:

```bash
# Database
DATABASE_URL=postgres://user:password@host:5432/dbname
DB_USER=
DB_PASSWORD=

# Shopify
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SHOPIFY_WEBHOOK_SECRET=
SHOPIFY_ADMIN_ACCESS_TOKEN=

# Firebase
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Frontend also needs a `.env` file in `Frontend/.env`:

```bash
VITE_BACKEND_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

### Installation

```bash
# Install dependencies
npm install

# Build frontend (will run via postinstall)
npm run build

# Run database setup
NODE_ENV=production node src/setup.js

# Start backend
npm start
```

---

## 🏗 Architecture Diagram

```mermaid
graph TD
    A[Shopify Store] -->|OAuth + Webhooks| B[Express Backend]
    B -->|REST API| C[PostgreSQL Database]
    B -->|Auth| D[Firebase]
    E[React Frontend] -->|API Calls| B
    Railway --> B
    Railway --> C
```

---

## 📡 API Endpoints

### Auth & Setup

- `GET /auth` – Initiates Shopify OAuth flow.
- `GET /auth/callback` – Handles OAuth callback, stores tenant & tokens.

### Webhooks

- `POST /webhooks/customers/create`
- `POST /webhooks/customers/update`
- `POST /webhooks/orders/create`
- `POST /webhooks/products/create`

### Ingestion APIs

- `POST /ingest/customers` – Pull customers from Shopify and store.
- `POST /ingest/orders` – Pull orders from Shopify and store.
- `POST /ingest/products` – Pull products from Shopify and store.

### Health

- `GET /health` – Returns 200 if server is healthy.

---

## 🗄 Database Schema (PostgreSQL)

```sql
-- Tenants (one per Shopify store)
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    shopify_domain TEXT UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id),
    shopify_customer_id BIGINT,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id),
    shopify_order_id BIGINT,
    total_price NUMERIC,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id),
    shopify_product_id BIGINT,
    title TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Events (generic webhook logging)
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id),
    event_type TEXT,
    payload JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## ⚠ Known Limitations / Assumptions

- **Webhook verification** must use raw body parsing. Current implementation may require adjustments.

- **GDPR compliance**: App should handle Shopify data deletion requests (`customers/redact`, `shop/redact`) — not yet implemented.

- **Scalability**: Current ingestion is synchronous; no queueing system is implemented.

- **Frontend**: Minimal UI for triggering ingestion; not a complete dashboard.

---

## ✅ Status

- **Backend**: Running on Railway
- **Frontend**: Built and served via backend
- **Database**: PostgreSQL instance connected

---

