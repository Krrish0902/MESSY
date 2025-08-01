/*
  # Create subscriptions table for meal plans

  1. New Tables
    - `subscriptions`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key to users)
      - `mess_id` (uuid, foreign key to messes)
      - `plan_type` (enum: daily, weekly, monthly)
      - `meal_types` (text array) - breakfast, lunch, dinner
      - `start_date` (date)
      - `end_date` (date)
      - `price_per_meal` (numeric)
      - `total_amount` (numeric)
      - `status` (enum: active, paused, cancelled, expired)
      - `delivery_address` (text)
      - `delivery_instructions` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `subscriptions` table
    - Add policies for different user roles
*/

-- Create enums
CREATE TYPE plan_type AS ENUM ('daily', 'weekly', 'monthly');
CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled', 'expired');

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mess_id uuid NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
  plan_type plan_type NOT NULL,
  meal_types text[] NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  price_per_meal numeric(8,2) NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  status subscription_status DEFAULT 'active',
  delivery_address text NOT NULL,
  delivery_instructions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Customers can read own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid()::text);

CREATE POLICY "Customers can create own subscriptions"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'customer'
    )
  );

CREATE POLICY "Customers can update own subscriptions"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid()::text)
  WITH CHECK (customer_id = auth.uid()::text);

CREATE POLICY "Mess owners can read their mess subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messes 
      WHERE id = mess_id AND owner_id = auth.uid()::text
    )
  );

CREATE POLICY "Mess owners can update subscription status"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messes 
      WHERE id = mess_id AND owner_id = auth.uid()::text
    )
  );

CREATE POLICY "Admins can manage all subscriptions"
  ON subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_mess_id ON subscriptions(mess_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_dates ON subscriptions(start_date, end_date);