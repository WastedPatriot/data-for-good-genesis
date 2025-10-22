-- Add sensor_data column to data_submissions table to store device and location data
ALTER TABLE public.data_submissions 
ADD COLUMN IF NOT EXISTS sensor_data JSONB DEFAULT '{}'::jsonb;

-- Add index for querying sensor data
CREATE INDEX IF NOT EXISTS idx_data_submissions_sensor_data ON public.data_submissions USING gin(sensor_data);

-- Add comment explaining the sensor data structure
COMMENT ON COLUMN public.data_submissions.sensor_data IS 'Stores optional sensor data including geolocation, device info, and connection info collected with user consent';