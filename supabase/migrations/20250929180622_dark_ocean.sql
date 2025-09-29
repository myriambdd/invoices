-- Seed initial data for the invoice management system

-- Insert base currencies
INSERT INTO currencies (code, name, symbol, is_base) VALUES
('TND', 'Tunisian Dinar', 'د.ت', TRUE),
('EUR', 'Euro', '€', FALSE),
('USD', 'US Dollar', '$', FALSE),
('GBP', 'British Pound', '£', FALSE)
ON CONFLICT (code) DO NOTHING;

-- Insert initial exchange rates (examples - user should update these)
INSERT INTO exchange_rates (from_currency_id, to_currency_id, rate) 
SELECT 
    eur.id,
    tnd.id,
    3.25 -- Example rate: 1 EUR = 3.25 TND
FROM currencies eur, currencies tnd 
WHERE eur.code = 'EUR' AND tnd.code = 'TND'
ON CONFLICT (from_currency_id, to_currency_id) DO NOTHING;

INSERT INTO exchange_rates (from_currency_id, to_currency_id, rate) 
SELECT 
    usd.id,
    tnd.id,
    3.10 -- Example rate: 1 USD = 3.10 TND
FROM currencies usd, currencies tnd 
WHERE usd.code = 'USD' AND tnd.code = 'TND'
ON CONFLICT (from_currency_id, to_currency_id) DO NOTHING;

INSERT INTO exchange_rates (from_currency_id, to_currency_id, rate) 
SELECT 
    gbp.id,
    tnd.id,
    3.85 -- Example rate: 1 GBP = 3.85 TND
FROM currencies gbp, currencies tnd 
WHERE gbp.code = 'GBP' AND tnd.code = 'TND'
ON CONFLICT (from_currency_id, to_currency_id) DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
('base_currency', 'TND', 'Base currency for the application'),
('reminder_days_before', '7,3,1', 'Days before due date to send reminders'),
('reminder_days_after', '1,7,14,30', 'Days after due date to send reminders'),
('company_name', 'Your Company', 'Company name for invoices'),
('company_email', 'admin@company.com', 'Company email for notifications')
ON CONFLICT (key) DO NOTHING;

-- Insert sample suppliers for testing
INSERT INTO suppliers (name, email, phone, address, tax_id) VALUES
('Tech Solutions SARL', 'contact@techsolutions.tn', '+216 71 123 456', '123 Avenue Habib Bourguiba, Tunis', '1234567A'),
('Office Supplies Co', 'sales@officesupplies.com', '+216 70 987 654', '456 Rue de la République, Sfax', '7654321B'),
('Equipment Import Ltd', 'info@equipment.com', '+216 72 555 777', '789 Boulevard du 7 Novembre, Sousse', '9876543C')
ON CONFLICT (tax_id) DO NOTHING;

-- Insert sample articles for analytics
INSERT INTO articles (name, description, category, unit) VALUES
('Laptop Dell Latitude', 'Professional laptop for business use', 'Electronics', 'pieces'),
('Office Chair', 'Ergonomic office chair', 'Furniture', 'pieces'),
('Printer Paper A4', 'White office paper 80gsm', 'Office Supplies', 'reams'),
('Network Switch', '24-port Gigabit Ethernet switch', 'Networking', 'pieces')
ON CONFLICT DO NOTHING;