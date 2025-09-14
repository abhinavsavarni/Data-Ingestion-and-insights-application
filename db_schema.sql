
CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  shopify_domain VARCHAR(255) UNIQUE NOT NULL,
  shopify_access_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE user_stores (
  id SERIAL PRIMARY KEY,
  firebase_uid VARCHAR(255) NOT NULL,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (firebase_uid, tenant_id)
);


CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  shopify_customer_id VARCHAR(255),
  email VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE (tenant_id, shopify_customer_id)
);


CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  shopify_product_id VARCHAR(255),
  title VARCHAR(255),
  price NUMERIC,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE (tenant_id, shopify_product_id)
);


CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  shopify_order_id VARCHAR(255),
  customer_id INTEGER REFERENCES customers(id),
  total_price NUMERIC,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE (tenant_id, shopify_order_id)
);


CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  event_type VARCHAR(255),
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
