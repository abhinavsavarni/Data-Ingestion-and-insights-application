-- Migration script to add missing user_stores table
-- Run this on your Railway PostgreSQL database if the table doesn't exist

-- Check if user_stores table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_stores') THEN
    -- Create user_stores table
    CREATE TABLE user_stores (
      id SERIAL PRIMARY KEY,
      firebase_uid VARCHAR(255) NOT NULL,
      tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (firebase_uid, tenant_id)
    );
    
    RAISE NOTICE 'user_stores table created successfully';
  ELSE
    RAISE NOTICE 'user_stores table already exists';
  END IF;
END
$$;

-- Add missing timestamps to tenants table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'created_at') THEN
    ALTER TABLE tenants ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    ALTER TABLE tenants ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    RAISE NOTICE 'Added timestamps to tenants table';
  ELSE
    RAISE NOTICE 'Timestamps already exist in tenants table';
  END IF;
END
$$;

-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;