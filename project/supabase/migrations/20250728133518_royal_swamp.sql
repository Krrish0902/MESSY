/*
  # Create messes table for mess management

  1. New Tables
    - `messes`
      - `id` (uuid, primary key)
      - `owner_id` (uuid, foreign key to users)
      - `name` (text)
      - `description` (text)
      - `address` (text)
      - `location` (jsonb) - lat, lng
      - `phone` (text)
      - `email` (text, optional)
      - `images` (text array)
      - `operating_hours` (jsonb) - open_time, close_time, days
      - `status` (enum: pending, approved, rejected, suspended)
      - `rating_average` (numeric)
      - `rating_count` (integer)
      - `delivery_radius` (numeric) - in kilometers
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `messes` table
    - Add policies for different user roles
*/

-- Create enum for mess status
CREATE TYPE mess_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');

-- Create messes table
CREATE TABLE IF NOT EXISTS messes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  address text NOT NULL,
  location jsonb NOT NULL,
  phone text NOT NULL,
  email text,
  images text[] DEFAULT '{}',
  operating_hours jsonb NOT NULL,
  status mess_status DEFAULT 'pending',
  rating_average numeric(3,2) DEFAULT 0.00,
  rating_count integer DEFAULT 0,
  delivery_radius numeric(5,2) DEFAULT 5.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE messes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read approved messes"
  ON messes
  FOR SELECT
  TO authenticated
  USING (status = 'approved');

CREATE POLICY "Mess owners can read own messes"
  ON messes
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid()::text);

CREATE POLICY "Mess owners can create messes"
  ON messes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'mess_owner'
    )
  );

CREATE POLICY "Mess owners can update own messes"
  ON messes
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid()::text)
  WITH CHECK (owner_id = auth.uid()::text);

CREATE POLICY "Admins can manage all messes"
  ON messes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_messes_updated_at 
  BEFORE UPDATE ON messes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_messes_owner_id ON messes(owner_id);
CREATE INDEX idx_messes_status ON messes(status);
CREATE INDEX idx_messes_location ON messes USING GIN (location);