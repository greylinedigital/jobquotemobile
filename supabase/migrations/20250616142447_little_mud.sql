/*
  # Fix quotes table schema

  1. Schema Updates
    - Add `subtotal` column to quotes table (numeric type)
    - Rename `gst` column to `gst_amount` for consistency with application code
    - Update any existing data to maintain consistency

  2. Data Migration
    - Calculate subtotal from existing total and gst values where possible
    - Ensure data integrity during the migration

  3. Notes
    - This migration aligns the database schema with the application's expectations
    - The application expects: subtotal, gst_amount, total
    - The current schema has: total, gst (missing subtotal)
*/

-- Add subtotal column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'subtotal'
  ) THEN
    ALTER TABLE quotes ADD COLUMN subtotal numeric;
  END IF;
END $$;

-- Rename gst column to gst_amount if gst exists and gst_amount doesn't
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'gst'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'gst_amount'
  ) THEN
    ALTER TABLE quotes RENAME COLUMN gst TO gst_amount;
  END IF;
END $$;

-- Add gst_amount column if it doesn't exist (in case gst column didn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'gst_amount'
  ) THEN
    ALTER TABLE quotes ADD COLUMN gst_amount numeric;
  END IF;
END $$;

-- Update existing records to calculate subtotal where possible
-- Assuming GST is 10% (0.1), so subtotal = total / 1.1
UPDATE quotes 
SET subtotal = CASE 
  WHEN total IS NOT NULL AND gst_amount IS NOT NULL THEN total - gst_amount
  WHEN total IS NOT NULL THEN total / 1.1
  ELSE NULL
END
WHERE subtotal IS NULL;

-- Update gst_amount for records where it might be null but total and subtotal exist
UPDATE quotes 
SET gst_amount = total - subtotal
WHERE gst_amount IS NULL AND total IS NOT NULL AND subtotal IS NOT NULL;