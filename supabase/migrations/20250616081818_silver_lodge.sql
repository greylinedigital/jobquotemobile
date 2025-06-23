/*
  # Add phone column to clients table

  1. Changes
    - Add `phone` column to `clients` table
    - Column type: text (nullable)
    - This resolves the PGRST204 error where Supabase cannot find the 'phone' column

  2. Notes
    - The phone column is optional (nullable) to maintain compatibility with existing records
    - No default value is set as phone numbers are optional client information
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'phone'
  ) THEN
    ALTER TABLE clients ADD COLUMN phone text;
  END IF;
END $$;