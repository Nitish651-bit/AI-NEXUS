-- Fix RLS policies to only allow authenticated users (not anonymous)
-- Drop existing policies and recreate with TO authenticated role restriction

-- ai_tool_usage table
DROP POLICY IF EXISTS "Users can view own tool usage" ON public.ai_tool_usage;
DROP POLICY IF EXISTS "Users can insert own tool usage" ON public.ai_tool_usage;
CREATE POLICY "Users can view own tool usage" ON public.ai_tool_usage
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tool usage" ON public.ai_tool_usage
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- image_generations table
DROP POLICY IF EXISTS "Users can view own image generations" ON public.image_generations;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.image_generations;
CREATE POLICY "Users can view own image generations" ON public.image_generations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own image generations" ON public.image_generations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- profiles table (uses 'id' not 'user_id')
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- text_generations table
DROP POLICY IF EXISTS "Users can view own text generations" ON public.text_generations;
DROP POLICY IF EXISTS "Users can insert own text generations" ON public.text_generations;
CREATE POLICY "Users can view own text generations" ON public.text_generations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own text generations" ON public.text_generations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- tts_usage table
DROP POLICY IF EXISTS "Users can view own TTS usage" ON public.tts_usage;
DROP POLICY IF EXISTS "Users can insert own TTS usage" ON public.tts_usage;
CREATE POLICY "Users can view own TTS usage" ON public.tts_usage
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own TTS usage" ON public.tts_usage
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- user_activity table
DROP POLICY IF EXISTS "user_activity_select_owner" ON public.user_activity;
DROP POLICY IF EXISTS "user_activity_insert_owner" ON public.user_activity;
DROP POLICY IF EXISTS "user_activity_update_owner" ON public.user_activity;
DROP POLICY IF EXISTS "user_activity_delete_owner" ON public.user_activity;
CREATE POLICY "user_activity_select_owner" ON public.user_activity
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "user_activity_insert_owner" ON public.user_activity
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_activity_update_owner" ON public.user_activity
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "user_activity_delete_owner" ON public.user_activity
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);