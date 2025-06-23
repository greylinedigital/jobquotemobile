/*
  # Fix database schema issues

  1. Schema Updates
    - Fix business_profiles foreign key reference
    - Add missing columns to match app expectations
    - Update quote_items table structure
  
  2. Data Integrity
    - Ensure all tables have proper relationships
    - Add missing indexes for performance
*/

-- Fix business_profiles table foreign key reference
ALTER TABLE business_profiles DROP CONSTRAINT IF EXISTS business_profiles_id_fkey;
ALTER TABLE business_profiles ADD CONSTRAINT business_profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add missing columns to business_profiles if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_profiles' AND column_name = 'quote_footer_notes'
  ) THEN
    ALTER TABLE business_profiles ADD COLUMN quote_footer_notes text;
  END IF;
END $$;

-- Add missing columns to clients if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE clients ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Add missing columns to quotes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE quotes ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Add missing columns to quote_items to match app expectations
DO $$
BEGIN
  -- Add quantity column (alias for qty)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_items' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE quote_items ADD COLUMN quantity numeric;
  END IF;

  -- Add unit_price column (alias for cost)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_items' AND column_name = 'unit_price'
  ) THEN
    ALTER TABLE quote_items ADD COLUMN unit_price numeric;
  END IF;

  -- Add total column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_items' AND column_name = 'total'
  ) THEN
    ALTER TABLE quote_items ADD COLUMN total numeric;
  END IF;

  -- Add created_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_items' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE quote_items ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create a function to sync qty/quantity and cost/unit_price values
CREATE OR REPLACE FUNCTION sync_quote_item_values()
RETURNS trigger AS $$
BEGIN
  -- Sync quantity with qty
  IF NEW.quantity IS NOT NULL AND NEW.qty IS NULL THEN
    NEW.qty = NEW.quantity;
  ELSIF NEW.qty IS NOT NULL AND NEW.quantity IS NULL THEN
    NEW.quantity = NEW.qty;
  END IF;

  -- Sync unit_price with cost
  IF NEW.unit_price IS NOT NULL AND NEW.cost IS NULL THEN
    NEW.cost = NEW.unit_price;
  ELSIF NEW.cost IS NOT NULL AND NEW.unit_price IS NULL THEN
    NEW.unit_price = NEW.cost;
  END IF;

  -- Calculate total
  IF NEW.quantity IS NOT NULL AND NEW.unit_price IS NOT NULL THEN
    NEW.total = NEW.quantity * NEW.unit_price;
  ELSIF NEW.qty IS NOT NULL AND NEW.cost IS NOT NULL THEN
    NEW.total = NEW.qty * NEW.cost;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync values
DROP TRIGGER IF EXISTS sync_quote_item_values_trigger ON quote_items;
CREATE TRIGGER sync_quote_item_values_trigger
  BEFORE INSERT OR UPDATE ON quote_items
  FOR EACH ROW EXECUTE FUNCTION sync_quote_item_values();

-- Update existing quote_items to sync values
UPDATE quote_items 
SET 
  quantity = qty,
  unit_price = cost,
  total = COALESCE(qty * cost, 0)
WHERE quantity IS NULL OR unit_price IS NULL OR total IS NULL;

-- Add missing columns to invoices if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'invoice_number'
  ) THEN
    ALTER TABLE invoices ADD COLUMN invoice_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE invoices ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Update invoice status values to match app expectations
UPDATE invoices SET status = 'pending' WHERE status = 'Unpaid';

-- Create updated_at triggers for tables that need them
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();