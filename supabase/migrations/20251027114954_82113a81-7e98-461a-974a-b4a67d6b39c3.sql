-- Extension user tracking and gamification
CREATE TABLE IF NOT EXISTS public.extension_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  extension_id TEXT NOT NULL,
  install_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_sites_tracked INTEGER DEFAULT 0,
  total_co2_awareness NUMERIC DEFAULT 0,
  badge_tier TEXT DEFAULT 'bronze',
  points INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company carbon footprint data
CREATE TABLE IF NOT EXISTS public.company_carbon_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  annual_co2_tons NUMERIC,
  scope_1_emissions NUMERIC,
  scope_2_emissions NUMERIC,
  scope_3_emissions NUMERIC,
  last_report_date DATE,
  sustainability_score INTEGER CHECK (sustainability_score >= 0 AND sustainability_score <= 100),
  data_sources JSONB DEFAULT '[]'::jsonb,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track every site visit via extension
CREATE TABLE IF NOT EXISTS public.extension_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extension_user_id UUID REFERENCES extension_users(id) ON DELETE CASCADE,
  visited_domain TEXT NOT NULL,
  company_id UUID REFERENCES company_carbon_data(id),
  co2_data_shown BOOLEAN DEFAULT false,
  duration_seconds INTEGER,
  impact_score INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gamification: Challenges
CREATE TABLE IF NOT EXISTS public.extension_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL, -- 'visit_count', 'co2_awareness', 'share_count', 'purchase_dataset'
  target_value INTEGER NOT NULL,
  reward_points INTEGER DEFAULT 0,
  reward_badge TEXT,
  active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User challenge progress
CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extension_user_id UUID REFERENCES extension_users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES extension_challenges(id) ON DELETE CASCADE,
  current_value INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(extension_user_id, challenge_id)
);

-- Marketing conversation takeover
CREATE TABLE IF NOT EXISTS public.marketing_takeovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id),
  taken_over_by UUID REFERENCES auth.users(id),
  takeover_reason TEXT,
  ai_disabled BOOLEAN DEFAULT true,
  takeover_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_extension_users_user_id ON extension_users(user_id);
CREATE INDEX IF NOT EXISTS idx_company_carbon_domain ON company_carbon_data(domain);
CREATE INDEX IF NOT EXISTS idx_extension_activity_user ON extension_activity(extension_user_id);
CREATE INDEX IF NOT EXISTS idx_extension_activity_timestamp ON extension_activity(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_user ON user_challenge_progress(extension_user_id);

-- Triggers for updated_at
CREATE TRIGGER update_company_carbon_updated_at
  BEFORE UPDATE ON company_carbon_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE extension_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_carbon_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE extension_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE extension_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_takeovers ENABLE ROW LEVEL SECURITY;

-- Extension users can view their own data
CREATE POLICY "Users can view own extension data"
  ON extension_users FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own extension data"
  ON extension_users FOR UPDATE
  USING (auth.uid() = user_id);

-- Company carbon data is publicly readable
CREATE POLICY "Anyone can view company carbon data"
  ON company_carbon_data FOR SELECT
  TO authenticated, anon
  USING (true);

-- Admins can manage company data
CREATE POLICY "Admins can manage company carbon data"
  ON company_carbon_data FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view their own activity
CREATE POLICY "Users can view own extension activity"
  ON extension_activity FOR SELECT
  USING (
    extension_user_id IN (
      SELECT id FROM extension_users WHERE user_id = auth.uid()
    )
  );

-- Users can insert their own activity
CREATE POLICY "Users can insert own extension activity"
  ON extension_activity FOR INSERT
  WITH CHECK (
    extension_user_id IN (
      SELECT id FROM extension_users WHERE user_id = auth.uid()
    )
  );

-- Challenges are publicly viewable
CREATE POLICY "Anyone can view active challenges"
  ON extension_challenges FOR SELECT
  TO authenticated, anon
  USING (active = true);

-- Admins can manage challenges
CREATE POLICY "Admins can manage challenges"
  ON extension_challenges FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view their own progress
CREATE POLICY "Users can view own challenge progress"
  ON user_challenge_progress FOR SELECT
  USING (
    extension_user_id IN (
      SELECT id FROM extension_users WHERE user_id = auth.uid()
    )
  );

-- Users can update their own progress
CREATE POLICY "Users can update own challenge progress"
  ON user_challenge_progress FOR ALL
  USING (
    extension_user_id IN (
      SELECT id FROM extension_users WHERE user_id = auth.uid()
    )
  );

-- Admins can view all takeovers
CREATE POLICY "Admins can view marketing takeovers"
  ON marketing_takeovers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage marketing takeovers"
  ON marketing_takeovers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Insert sample company carbon data
INSERT INTO company_carbon_data (company_name, domain, annual_co2_tons, scope_1_emissions, scope_2_emissions, scope_3_emissions, sustainability_score, last_report_date, verified, data_sources) VALUES
('Amazon', 'amazon.com', 71540000, 13700000, 5850000, 51990000, 42, '2023-12-31', true, '[{"source": "Amazon Sustainability Report 2023", "url": "https://sustainability.aboutamazon.com"}]'),
('Google', 'google.com', 10173000, 0, 2700000, 7473000, 78, '2023-12-31', true, '[{"source": "Google Environmental Report 2023"}]'),
('Microsoft', 'microsoft.com', 13859000, 100000, 500000, 13259000, 72, '2023-12-31', true, '[{"source": "Microsoft Sustainability Report"}]'),
('Apple', 'apple.com', 20890000, 560000, 2040000, 18290000, 68, '2023-12-31', true, '[{"source": "Apple Environmental Progress Report"}]'),
('Meta', 'facebook.com', 5317000, 0, 273000, 5044000, 65, '2023-12-31', true, '[{"source": "Meta Sustainability Report"}]'),
('Walmart', 'walmart.com', 142000000, 17300000, 6700000, 118000000, 48, '2023-12-31', true, '[{"source": "Walmart ESG Report"}]'),
('Tesla', 'tesla.com', 532000, 50000, 82000, 400000, 85, '2023-12-31', true, '[{"source": "Tesla Impact Report"}]'),
('ExxonMobil', 'exxonmobil.com', 120000000, 117000000, 2500000, 500000, 18, '2023-12-31', true, '[{"source": "ExxonMobil Sustainability Report"}]')
ON CONFLICT (domain) DO NOTHING;

-- Insert sample challenges
INSERT INTO extension_challenges (title, description, challenge_type, target_value, reward_points, reward_badge) VALUES
('Carbon Detective', 'Check the carbon footprint of 10 different companies', 'visit_count', 10, 100, 'detective'),
('Sustainability Scholar', 'Research 50 companies and view their emissions data', 'visit_count', 50, 500, 'scholar'),
('Data Champion', 'Purchase a dataset through the extension', 'purchase_dataset', 1, 1000, 'champion'),
('Climate Activist', 'Share carbon impact data on social media 5 times', 'share_count', 5, 250, 'activist'),
('Awareness Builder', 'Help raise awareness of 100 million tons of CO2 emissions', 'co2_awareness', 100000000, 2000, 'awareness_hero')
ON CONFLICT DO NOTHING;