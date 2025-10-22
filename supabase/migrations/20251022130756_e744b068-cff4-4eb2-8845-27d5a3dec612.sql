-- Create data submissions table
CREATE TABLE public.data_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  age_range TEXT,
  location TEXT,
  interests TEXT[],
  device_ownership TEXT,
  ev_ownership TEXT,
  sustainability TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public submissions don't need user restrictions)
ALTER TABLE public.data_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous submissions
CREATE POLICY "Allow public submissions" 
ON public.data_submissions 
FOR INSERT 
TO anon
WITH CHECK (true);