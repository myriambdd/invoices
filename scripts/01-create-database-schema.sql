-- Invoice Management System Database Schema
-- PostgreSQL 17 compatible

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Suppliers table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    tax_id VARCHAR(100),
    iban VARCHAR(50),
    bic VARCHAR(20),
    rib VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Currencies table
CREATE TABLE currencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(3) NOT NULL UNIQUE, -- EUR, USD, TND, etc.
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10),
    is_base BOOLEAN DEFAULT FALSE, -- TND as base currency
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exchange rates table
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency_id UUID REFERENCES currencies(id),
    to_currency_id UUID REFERENCES currencies(id),
    rate DECIMAL(15, 6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_currency_id, to_currency_id)
);

-- Invoice statuses enum
CREATE TYPE invoice_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');

-- Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(100),
    supplier_id UUID REFERENCES suppliers(id),
    issue_date DATE,
    due_date DATE,
    total_amount DECIMAL(15, 2) NOT NULL,
    currency_id UUID REFERENCES currencies(id),
    total_amount_tnd DECIMAL(15, 2), -- Converted to TND
    exchange_rate DECIMAL(15, 6),
    status invoice_status DEFAULT 'pending',
    payment_terms VARCHAR(255),
    notes TEXT,
    original_file_path VARCHAR(500), -- Path to original PDF/image
    extracted_data JSONB, -- Raw extracted data from AI
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice items table
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 3) DEFAULT 1,
    unit_price DECIMAL(15, 2) NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Articles/Products master table for analytics
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    unit VARCHAR(50), -- kg, pieces, liters, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Link invoice items to articles for analytics
CREATE TABLE invoice_item_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_item_id UUID REFERENCES invoice_items(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment reminders table
CREATE TABLE payment_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    reminder_date DATE NOT NULL,
    reminder_type VARCHAR(50), -- 'before_due', 'on_due', 'after_due'
    days_offset INTEGER, -- -7 for 7 days before, 0 for due date, 7 for 7 days after
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings table for application configuration
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_invoices_supplier_id ON invoices(supplier_id);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_payment_reminders_invoice_id ON payment_reminders(invoice_id);
CREATE INDEX idx_payment_reminders_reminder_date ON payment_reminders(reminder_date);
CREATE INDEX idx_exchange_rates_currencies ON exchange_rates(from_currency_id, to_currency_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exchange_rates_updated_at BEFORE UPDATE ON exchange_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
