/*
  # Add country support to business profiles

  1. Schema Changes
    - Add `country` column to `business_profiles` table
    - Set default value to 'Australia' for existing records

  2. Security
    - No changes needed - existing RLS policies cover the new column
*/

-- Add country column to business_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_profiles' AND column_name = 'country'
  ) THEN
    ALTER TABLE business_profiles ADD COLUMN country text DEFAULT 'Australia';
  END IF;
END $$;

-- Update existing records to have Australia as default country
UPDATE business_profiles 
SET country = 'Australia' 
WHERE country IS NULL;