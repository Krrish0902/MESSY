/*
  # Create menus table for daily meal management

  1. New Tables
    - `menus`
      - `id` (uuid, primary key)
      - `mess_id` (uuid, foreign key to messes)
      - `date` (date)
      - `meal_type` (enum: breakfast, lunch, dinner)
      - `items` (jsonb array) - name, description, image_url, is_veg
      - `price` (numeric)
      - `is_available` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `menus` table
    - Add policies for different user roles
*/

-- Create enum for meal types
CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner');

-- Create menus table
CREATE TABLE IF NOT EXISTS menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id uuid NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
  date date NOT NULL,
  meal_type meal_type NOT NULL,
  items jsonb NOT NULL DEFAULT '[]',
  price numeric(8,2) NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one menu per mess per date per meal type
  UNIQUE(mess_id, date, meal_type)
);

-- Enable RLS
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read available menus"
  ON menus
  FOR SELECT
  TO authenticated
  USING (
    is_available = true AND
    EXISTS (
      SELECT 1 FROM messes 
      WHERE id = mess_id AND status = 'approved'
    )
  );

CREATE POLICY "Mess owners can manage own menus"
  ON menus
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messes 
      WHERE id = mess_id AND owner_id = auth.uid()::text
    )
  );

CREATE POLICY "Admins can manage all menus"
  ON menus
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_menus_updated_at 
  BEFORE UPDATE ON menus 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_menus_mess_id ON menus(mess_id);
CREATE INDEX idx_menus_date ON menus(date);
CREATE INDEX idx_menus_meal_type ON menus(meal_type);
CREATE INDEX idx_menus_date_meal_type ON menus(date, meal_type);