-- Create eSIM purchases table
CREATE TABLE IF NOT EXISTS esim_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  country TEXT NOT NULL,
  data_amount TEXT NOT NULL,
  duration INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'crypto')),
  esim_iccid TEXT,
  esim_activation_code TEXT,
  esim_qr_code TEXT,
  data_used INTEGER DEFAULT 0,
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE esim_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own eSIM purchases"
  ON esim_purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own purchases
CREATE POLICY "Users can create own eSIM purchases"
  ON esim_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own purchases
CREATE POLICY "Users can update own eSIM purchases"
  ON esim_purchases FOR UPDATE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_esim_purchases_updated_at
  BEFORE UPDATE ON esim_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();