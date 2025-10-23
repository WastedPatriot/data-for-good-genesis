-- Create storage bucket for dataset files
INSERT INTO storage.buckets (id, name, public)
VALUES ('dataset-files', 'dataset-files', true);

-- RLS policies for dataset-files bucket
CREATE POLICY "Anyone can view dataset files"
ON storage.objects FOR SELECT
USING (bucket_id = 'dataset-files');

CREATE POLICY "Admins can upload dataset files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'dataset-files' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Service role can manage dataset files"
ON storage.objects FOR ALL
USING (bucket_id = 'dataset-files');

CREATE POLICY "Admins can update dataset files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'dataset-files'
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete dataset files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'dataset-files'
  AND has_role(auth.uid(), 'admin'::app_role)
);