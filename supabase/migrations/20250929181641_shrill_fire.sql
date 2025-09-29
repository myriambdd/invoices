@@ .. @@
-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
('base_currency', 'TND', 'Base currency for the application'),
+('company_name', 'Your Company', 'Company name for invoices'),
+('company_email', 'admin@company.com', 'Company email for sending notifications'),
+('notification_email', 'admin@company.com', 'Email to receive notifications'),
('reminder_days_before', '7,3,1', 'Days before due date to send reminders'),
-('reminder_days_after', '1,7,14,30', 'Days after due date to send reminders'),
-('company_name', 'Your Company', 'Company name for invoices'),
-('company_email', 'admin@company.com', 'Company email for notifications')
+('reminder_days_after', '1,7,14,30', 'Days after due date to send reminders')
ON CONFLICT (key) DO NOTHING;