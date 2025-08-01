/*
  # Create deliveries table for tracking meal deliveries

  1. New Tables
    - `deliveries`
      - `id` (uuid, primary key)
      - `subscription_id` (uuid, foreign key to subscriptions)
      - `mess_id` (uuid, foreign key to messes)
      - `customer_id` (uuid, foreign key to users)
      - `date` (date)
      - `meal_type` (meal_type enum)
      - `status` (enum: scheduled, skipped, delivered, cancelled)
      - `skip_reason` (text, optional)
      - `skip_requested_at` (timestamptz, optional)
      - `delivered_at` (timestamptz, optional)
      - `delivery_notes` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `deliveries` table
    - Add policies for different user roles
*/

-- Create enum for delivery status
CREATE TYPE delivery_status AS ENUM ('scheduled', 'skipped', 'delivered', 'cancelled');

-- Create deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  mess_id uuid NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL,
  meal_type meal_type NOT NULL,
  status delivery_status DEFAULT 'scheduled',
  skip_reason text,
  skip_requested_at timestamptz,
  delivered_at timestamptz,
  delivery_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one delivery per subscription per date per meal type
  UNIQUE(subscription_id, date, meal_type)
);

-- Enable RLS
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Customers can read own deliveries"
  ON deliveries
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid()::text);

CREATE POLICY "Customers can update own delivery status (skip meals)"
  ON deliveries
  FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid()::text)
  WITH CHECK (customer_id = auth.uid()::text);

CREATE POLICY "Mess owners can read their mess deliveries"
  ON deliveries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messes 
      WHERE id = mess_id AND owner_id = auth.uid()::text
    )
  );

CREATE POLICY "Mess owners can update delivery status"
  ON deliveries
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messes 
      WHERE id = mess_id AND owner_id = auth.uid()::text
    )
  );

CREATE POLICY "System can create deliveries"
  ON deliveries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage all deliveries"
  ON deliveries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_deliveries_updated_at 
  BEFORE UPDATE ON deliveries 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_deliveries_subscription_id ON deliveries(subscription_id);
CREATE INDEX idx_deliveries_mess_id ON deliveries(mess_id);
CREATE INDEX idx_deliveries_customer_id ON deliveries(customer_id);
CREATE INDEX idx_deliveries_date ON deliveries(date);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_date_meal_type ON deliveries(date, meal_type);