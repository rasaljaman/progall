-- Create prompts table
CREATE TABLE IF NOT EXISTS public.prompts (
    id TEXT PRIMARY KEY,
    author TEXT NOT NULL,
    handle TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    image_urls TEXT[] NOT NULL,
    model TEXT,
    likes INTEGER DEFAULT 0 NOT NULL,
    views INTEGER DEFAULT 0 NOT NULL,
    tweet_url TEXT,
    tweeted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on prompts
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- Policy to allow anonymous read access to prompts
CREATE POLICY "Allow public read access on prompts"
ON public.prompts
FOR SELECT
TO anon, authenticated
USING (true);

-- Ensure storage schema exists and register bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('prompt-images', 'prompt-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow anonymous read access to prompt images
CREATE POLICY "Allow public read access on prompt-images"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'prompt-images');
