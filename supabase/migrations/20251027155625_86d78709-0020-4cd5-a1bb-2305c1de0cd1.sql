-- Add new columns to marketing_campaigns for better email tracking
ALTER TABLE marketing_campaigns 
ADD COLUMN IF NOT EXISTS actual_recipient TEXT,
ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add index for faster status queries
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_sent_at ON marketing_campaigns(sent_at) WHERE sent_at IS NOT NULL;