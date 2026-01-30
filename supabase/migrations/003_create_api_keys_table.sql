-- Create API Keys table for managing third-party API access
CREATE TABLE IF NOT EXISTS public_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL, -- Store only prefix for identification (e.g., "tk_live_abc")
  is_active BOOLEAN DEFAULT true,
  rate_limit INTEGER DEFAULT 1000, -- Requests per hour
  allowed_endpoints TEXT[] DEFAULT ARRAY['complete-word', 'suggest-phrase', 'chat'], -- Which endpoints this key can access
  metadata JSONB DEFAULT '{}', -- Store additional info like user email, company, etc.
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration date
  
  -- Indexes for faster lookups
  CONSTRAINT public_api_keys_name_check CHECK (char_length(name) >= 3)
);

-- Create index on key_hash for fast lookup during authentication
CREATE INDEX IF NOT EXISTS idx_public_api_keys_key_hash ON public_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_public_api_keys_is_active ON public_api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_public_api_keys_created_at ON public_api_keys(created_at DESC);

-- Create API usage logs table for tracking and analytics
CREATE TABLE IF NOT EXISTS public_api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES public_api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  request_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on api_key_id and created_at for analytics
CREATE INDEX IF NOT EXISTS idx_public_api_usage_logs_key_id ON public_api_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_public_api_usage_logs_created_at ON public_api_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_api_usage_logs_endpoint ON public_api_usage_logs(endpoint);

-- Enable Row Level Security
ALTER TABLE public_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create policies to allow access
-- Allow all operations for service role
CREATE POLICY "Allow service role full access to public_api_keys" ON public_api_keys
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access to public_api_usage_logs" ON public_api_usage_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anon role to manage API keys (since this is an internal management system)
CREATE POLICY "Allow anon to insert public_api_keys" ON public_api_keys
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to select public_api_keys" ON public_api_keys
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to update public_api_keys" ON public_api_keys
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete public_api_keys" ON public_api_keys
  FOR DELETE
  TO anon
  USING (true);

-- Allow anon role to log API usage
CREATE POLICY "Allow anon to insert public_api_usage_logs" ON public_api_usage_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to select public_api_usage_logs" ON public_api_usage_logs
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to update public_api_usage_logs" ON public_api_usage_logs
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Function to automatically update last_used_at
CREATE OR REPLACE FUNCTION update_public_api_key_last_used()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public_api_keys
  SET last_used_at = NOW()
  WHERE id = NEW.api_key_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_used_at when API is called
CREATE TRIGGER public_api_usage_update_last_used
AFTER INSERT ON public_api_usage_logs
FOR EACH ROW
EXECUTE FUNCTION update_public_api_key_last_used();

-- Add comments for documentation
COMMENT ON TABLE public_api_keys IS 'Stores hashed API keys for third-party access';
COMMENT ON TABLE public_api_usage_logs IS 'Logs all API requests for analytics and monitoring';
COMMENT ON COLUMN public_api_keys.key_hash IS 'SHA-256 hash of the API key for secure storage';
COMMENT ON COLUMN public_api_keys.key_prefix IS 'First few characters of the key for identification (e.g., tk_live_abc)';
COMMENT ON COLUMN public_api_keys.rate_limit IS 'Maximum requests per hour for this key';
