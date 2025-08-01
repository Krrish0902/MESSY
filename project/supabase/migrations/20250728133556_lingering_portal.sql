/*
  # Create ratings and notifications tables

  1. New Tables
    - `ratings`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key to users)
      - `mess_id` (uuid, foreign key to messes)
      - `delivery_id` (uuid, foreign key to deliveries, optional)
      - `rating` (integer, 1-5)
      - `review` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `title` (text)
      - `message` (text)
      - `type` (enum: mess_cut, delivery, subscription, system, rating)
      - `data` (jsonb, optional)
      - `is_read` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add appropriate policies
*/

-- Create enum for notification types
CREATE TYPE notification_type AS ENUM ('mess_cut', 'delivery', 'subscription', 'system', 'rating');

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mess_id uuid NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
  delivery_id uuid REFERENCES deliveries(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one rating per customer per delivery (if delivery_id is provided)
  UNIQUE(customer_id, mess_id, delivery_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type notification_type NOT NULL,
  data jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for ratings
CREATE POLICY "Customers can read own ratings"
  ON ratings
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid()::text);

CREATE POLICY "Customers can create own ratings"
  ON ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'customer'
    )
  );

CREATE POLICY "Customers can update own ratings"
  ON ratings
  FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid()::text)
  WITH CHECK (customer_id = auth.uid()::text);

CREATE POLICY "Mess owners can read their mess ratings"
  ON ratings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messes 
      WHERE id = mess_id AND owner_id = auth.uid()::text
    )
  );

CREATE POLICY "Admins can read all ratings"
  ON ratings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- Create policies for notifications
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_ratings_updated_at 
  BEFORE UPDATE ON ratings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_ratings_customer_id ON ratings(customer_id);
CREATE INDEX idx_ratings_mess_id ON ratings(mess_id);
CREATE INDEX idx_ratings_delivery_id ON ratings(delivery_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Function to update mess rating average
CREATE OR REPLACE FUNCTION update_mess_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE messes
  SET 
    rating_average = (
      SELECT COALESCE(AVG(rating), 0.00)
      FROM ratings 
      WHERE mess_id = COALESCE(NEW.mess_id, OLD.mess_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM ratings 
      WHERE mess_id = COALESCE(NEW.mess_id, OLD.mess_id)
    )
  WHERE id = COALESCE(NEW.mess_id, OLD.mess_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create trigger to update mess ratings
CREATE TRIGGER update_mess_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_mess_rating();