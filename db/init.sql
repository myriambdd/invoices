CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS supplier (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  tax_id TEXT UNIQUE,                 -- important pour ON CONFLICT
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  iban TEXT,
  bic TEXT,
  rib TEXT,
  website TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- utile si tu veux aussi dédupliquer par (name,email)
CREATE UNIQUE INDEX IF NOT EXISTS supplier_name_email_uidx
  ON supplier (name, COALESCE(email, '')) WHERE tax_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
    CREATE TYPE invoice_status AS ENUM ('draft','extracted','awaiting_payment','partially_paid','paid','overdue','canceled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS invoice (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES supplier(id) ON DELETE CASCADE,
  number TEXT,
  date DATE,
  due_date DATE,
  payment_terms TEXT,
  currency TEXT,
  subtotal NUMERIC(20,4),
  tax_amount NUMERIC(20,4),
  total_amount NUMERIC(20,4),
  status invoice_status NOT NULL DEFAULT 'extracted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_item (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
  description TEXT,
  quantity NUMERIC(20,4),
  unit_price NUMERIC(20,4),
  total_price NUMERIC(20,4),
  tax_rate NUMERIC(6,3)
);

CREATE TABLE IF NOT EXISTS payment_reminder (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  channel TEXT NOT NULL,  -- email|sms|push|webhook
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL,   -- pending|sent|failed
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_invoice_supplier ON invoice(supplier_id);
CREATE INDEX IF NOT EXISTS idx_reminder_due ON payment_reminder(due_date);
