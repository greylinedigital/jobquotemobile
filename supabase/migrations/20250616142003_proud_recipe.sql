/*
  # Add GST amount column to quotes table

  1. Changes
    - Add `gst_amount` column to `quotes` table
    - Column type: numeric to store monetary values
    - Column is nullable to maintain compatibility with existing records

  2. Notes
    - This column will store the calculated GST amount for quotes
    - Existing quotes will have NULL values for this column initially
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'gst_amount'
  ) THEN
    ALTER TABLE quotes ADD COLUMN gst_amount numeric;
  END IF;
END $$;