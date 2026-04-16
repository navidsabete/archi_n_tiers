import type { PoolClient } from 'pg';
import { getPool } from './pool';

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  stock INTEGER NOT NULL CHECK (stock >= 0),
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  image_url TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL,
  vendor_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  provider TEXT NOT NULL,
  card_brand TEXT NOT NULL,
  card_last4 TEXT NOT NULL,
  status TEXT NOT NULL,
  transaction_ref TEXT NOT NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deliveries (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  carrier TEXT,
  tracking_code TEXT,
  started_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  unit_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (unit_price_cents >= 0),
  line_total_cents INTEGER NOT NULL DEFAULT 0 CHECK (line_total_cents >= 0)
);

ALTER TABLE products
ADD COLUMN IF NOT EXISTS price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0);

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS unit_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (unit_price_cents >= 0);

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS line_total_cents INTEGER NOT NULL DEFAULT 0 CHECK (line_total_cents >= 0);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
`;

export async function ensureSchema(client?: PoolClient): Promise<void> {
  if (client) {
    await client.query(SCHEMA_SQL);
    return;
  }
  await getPool().query(SCHEMA_SQL);
}
