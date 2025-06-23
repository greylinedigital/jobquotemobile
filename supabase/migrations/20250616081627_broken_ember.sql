/*
  # Create complete database schema for JobQuote app

  1. New Tables
    - `users` - User accounts (extends Supabase auth)
    - `business_profiles` - Business information for each user
    - `clients` - Client contacts for each user
    - `quotes` - Job quotes with pricing
    - `quote_items` - Individual line items for quotes
    - `invoices` - Generated invoices from quotes

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access only their own data
    - Proper foreign key relationships with cascade deletes

  3. Performance
    - Add indexes on frequently queried columns
    - Optimize for user-based data access patterns
*/

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create business_profiles table
CREATE TABLE IF NOT EXISTS business_profiles (
  id uuid PRIMARY KEY,
  business_name text,
  logo_url text,
  abn text,
  phone text,
  email text,
  payment_terms text,
  quote_footer text,
  bank_name text,
  bsb text,
  account_number text,
  account_name text,
  hourly_rate numeric DEFAULT 120,
  gst_enabled boolean DEFAULT true,
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text,
  email text,
  phone text,
  created_at timestamptz DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  client_id uuid,
  job_title text,
  description text,
  status text DEFAULT 'Draft',
  total numeric,
  gst numeric,
  created_at timestamptz DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Create quote_items table
CREATE TABLE IF NOT EXISTS quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid,
  type text,
  name text,
  qty numeric,
  cost numeric,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid,
  total numeric,
  due_date date,
  status text DEFAULT 'Unpaid',
  created_at timestamptz DEFAULT now(),
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for users
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create policies for business_profiles
CREATE POLICY "Users can manage their own business profile"
  ON business_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create policies for clients
CREATE POLICY "Users can manage their own clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for quotes
CREATE POLICY "Users can manage their own quotes"
  ON quotes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for quote_items
CREATE POLICY "Users can manage quote items for their quotes"
  ON quote_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

-- Create policies for invoices
CREATE POLICY "Users can manage invoices for their quotes"
  ON invoices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = invoices.quote_id
      AND quotes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = invoices.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON invoices(quote_id);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user record
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();