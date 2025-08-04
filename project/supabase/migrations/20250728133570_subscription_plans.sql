/*
  # Add subscription plans and meal pricing tables
  -- This migration adds tables for managing subscription plans and meal pricing
  -- Mess owners can set meal prices and create subscription plans
  -- Customers can subscribe to these plans
*/

-- Ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create meal_pricing table
CREATE TABLE IF NOT EXISTS meal_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id uuid NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
  
  breakfast_price decimal(10,2) NOT NULL DEFAULT 0,
  lunch_price decimal(10,2) NOT NULL DEFAULT 0,
  dinner_price decimal(10,2) NOT NULL DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(mess_id)
);

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id uuid NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  
  -- Plan configuration
  days_of_week text[] NOT NULL,
  meals_included text[] NOT NULL,
  
  -- Pricing
  total_price decimal(10,2) NOT NULL,
  
  -- Plan duration
  duration_type text NOT NULL CHECK (duration_type IN ('weekly', 'monthly')),
  duration_weeks integer NOT NULL,
  
  -- Status
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(mess_id, name)
);

-- Enable RLS on both tables
ALTER TABLE meal_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meal_pricing
CREATE POLICY "Anyone can read meal pricing for approved messes"
  ON meal_pricing
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messes
      WHERE id = mess_id AND status = 'approved'
    )
  );

CREATE POLICY "Mess owners can manage own meal pricing"
  ON meal_pricing
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messes
      WHERE id = mess_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all meal pricing"
  ON meal_pricing
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for subscription_plans
CREATE POLICY "Anyone can read subscription plans for approved messes"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messes
      WHERE id = mess_id AND status = 'approved'
    )
  );

CREATE POLICY "Mess owners can manage own subscription plans"
  ON subscription_plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messes
      WHERE id = mess_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all subscription plans"
  ON subscription_plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_meal_pricing_updated_at
  BEFORE UPDATE ON meal_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_meal_pricing_mess_id ON meal_pricing(mess_id);
CREATE INDEX idx_subscription_plans_mess_id ON subscription_plans(mess_id);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active); 