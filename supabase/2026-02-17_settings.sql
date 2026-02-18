-- Migration: settings table for platform configuration
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  company_cnpj TEXT NOT NULL,
  company_email TEXT NOT NULL,
  password_policy TEXT NOT NULL,
  token_expiration INTEGER NOT NULL,
  training_frequency TEXT NOT NULL,
  alert_days INTEGER NOT NULL
);

-- Insert default row (optional)
INSERT INTO settings (
  company_name, company_cnpj, company_email, password_policy, token_expiration, training_frequency, alert_days
) VALUES (
  'Minha Empresa', '00.000.000/0000-00', 'admin@empresa.com', '8', 30, 'Mensal', 7
) ON CONFLICT DO NOTHING;
