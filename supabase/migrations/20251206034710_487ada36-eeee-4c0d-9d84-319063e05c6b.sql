-- Fix ALL remaining RLS policies to block anonymous access
-- Recreate all policies with explicit TO authenticated

-- Fix ai_tool_usage policies
DROP POLICY IF EXISTS "Users can view own tool usage" ON public.ai_tool_usage;
DROP POLICY IF EXISTS "Users can insert own tool usage" ON public.ai_tool_usage;

CREATE POLICY "Users can view own tool usage" 
  ON public.ai_tool_usage 
  FOR SELECT 
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own tool usage" 
  ON public.ai_tool_usage 
  FOR INSERT 
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Fix image_generations policies
DROP POLICY IF EXISTS "Users can view own image generations" ON public.image_generations;
DROP POLICY IF EXISTS "Users can insert own image generations" ON public.image_generations;

CREATE POLICY "Users can view own image generations" 
  ON public.image_generations 
  FOR SELECT 
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own image generations" 
  ON public.image_generations 
  FOR INSERT 
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Fix profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles 
  FOR INSERT 
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- Fix text_generations policies
DROP POLICY IF EXISTS "Users can view own text generations" ON public.text_generations;
DROP POLICY IF EXISTS "Users can insert own text generations" ON public.text_generations;

CREATE POLICY "Users can view own text generations" 
  ON public.text_generations 
  FOR SELECT 
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own text generations" 
  ON public.text_generations 
  FOR INSERT 
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Fix tts_usage policies
DROP POLICY IF EXISTS "Users can view own TTS usage" ON public.tts_usage;
DROP POLICY IF EXISTS "Users can insert own TTS usage" ON public.tts_usage;

CREATE POLICY "Users can view own TTS usage" 
  ON public.tts_usage 
  FOR SELECT 
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own TTS usage" 
  ON public.tts_usage 
  FOR INSERT 
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);