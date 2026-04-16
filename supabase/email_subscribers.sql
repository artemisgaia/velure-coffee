-- Create email_subscribers table
CREATE TABLE IF NOT EXISTS public.email_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    source TEXT DEFAULT 'website',
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    tags TEXT[] DEFAULT '{}',
    first_name TEXT,
    last_name TEXT
);

-- Enable RLS
ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access on email_subscribers" 
    ON public.email_subscribers 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- No public read/write access (only API endpoint can write via service role)
