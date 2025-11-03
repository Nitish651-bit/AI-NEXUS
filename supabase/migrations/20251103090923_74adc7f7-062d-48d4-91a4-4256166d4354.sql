-- Create activity tracking tables for AI Nexus

-- Table to track all AI tool usage
CREATE TABLE IF NOT EXISTS public.ai_tool_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tool_name text NOT NULL,
  tool_category text NOT NULL,
  prompt text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Table to track image generations
CREATE TABLE IF NOT EXISTS public.image_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt text NOT NULL,
  image_url text,
  model text DEFAULT 'google/gemini-2.5-flash-image-preview',
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Table to track text generations (chat, content, etc.)
CREATE TABLE IF NOT EXISTS public.text_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tool_name text NOT NULL,
  input_text text NOT NULL,
  output_text text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Table to track TTS (Text-to-Speech) usage
CREATE TABLE IF NOT EXISTS public.tts_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  provider text NOT NULL,
  voice_id text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.ai_tool_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.text_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tts_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own data
CREATE POLICY "Users can view own tool usage"
  ON public.ai_tool_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tool usage"
  ON public.ai_tool_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own image generations"
  ON public.image_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own image generations"
  ON public.image_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own text generations"
  ON public.text_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own text generations"
  ON public.text_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own TTS usage"
  ON public.tts_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own TTS usage"
  ON public.tts_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_ai_tool_usage_user_id ON public.ai_tool_usage(user_id);
CREATE INDEX idx_ai_tool_usage_created_at ON public.ai_tool_usage(created_at DESC);
CREATE INDEX idx_image_generations_user_id ON public.image_generations(user_id);
CREATE INDEX idx_image_generations_created_at ON public.image_generations(created_at DESC);
CREATE INDEX idx_text_generations_user_id ON public.text_generations(user_id);
CREATE INDEX idx_text_generations_created_at ON public.text_generations(created_at DESC);
CREATE INDEX idx_tts_usage_user_id ON public.tts_usage(user_id);
CREATE INDEX idx_tts_usage_created_at ON public.tts_usage(created_at DESC);