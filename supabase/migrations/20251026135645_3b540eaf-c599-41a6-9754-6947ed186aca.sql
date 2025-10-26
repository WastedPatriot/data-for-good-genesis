-- Create conversation_threads table to track email conversations
CREATE TABLE IF NOT EXISTS public.conversation_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_submission_id UUID REFERENCES public.contact_submissions(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'bounced', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add severity and priority scoring to contact_submissions
ALTER TABLE public.contact_submissions 
ADD COLUMN IF NOT EXISTS severity_score NUMERIC DEFAULT 0.5 CHECK (severity_score >= 0 AND severity_score <= 1),
ADD COLUMN IF NOT EXISTS priority_level TEXT DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_response_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER;

-- Enable RLS
ALTER TABLE public.conversation_threads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversation_threads
CREATE POLICY "Admins can manage conversation threads"
  ON public.conversation_threads
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_conversation_threads_submission 
  ON public.conversation_threads(contact_submission_id);
CREATE INDEX IF NOT EXISTS idx_conversation_threads_sent_at 
  ON public.conversation_threads(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_severity 
  ON public.contact_submissions(severity_score DESC, priority_level);

-- Add helpful comments
COMMENT ON TABLE public.conversation_threads IS 'Tracks all email conversations (inbound and outbound) for full inbox/outbox threading';
COMMENT ON COLUMN public.contact_submissions.severity_score IS 'AI-calculated severity score from 0-1, higher = more urgent';
COMMENT ON COLUMN public.contact_submissions.priority_level IS 'Human-readable priority level derived from severity_score and context';