-- Enable realtime for contact submissions
ALTER TABLE public.contact_submissions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_submissions;

-- Enable realtime for purchases
ALTER TABLE public.purchases REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchases;

-- Enable realtime for review queue
ALTER TABLE public.review_queue REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.review_queue;

-- Enable realtime for audit logs
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;