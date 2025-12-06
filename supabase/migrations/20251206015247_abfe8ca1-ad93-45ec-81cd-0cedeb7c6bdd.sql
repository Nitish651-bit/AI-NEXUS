-- Fix RLS policy performance issues by using (select auth.uid()) instead of auth.uid()
-- This prevents unnecessary re-evaluation for each row

-- Drop and recreate profiles policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id);

-- Drop and recreate text_generations policies
DROP POLICY IF EXISTS "Users can view own text generations" ON public.text_generations;
DROP POLICY IF EXISTS "Users can insert own text generations" ON public.text_generations;

CREATE POLICY "Users can view own text generations" ON public.text_generations
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own text generations" ON public.text_generations
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Drop and recreate tts_usage policies
DROP POLICY IF EXISTS "Users can view own TTS usage" ON public.tts_usage;
DROP POLICY IF EXISTS "Users can insert own TTS usage" ON public.tts_usage;

CREATE POLICY "Users can view own TTS usage" ON public.tts_usage
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own TTS usage" ON public.tts_usage
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Drop and recreate user_activity policies
DROP POLICY IF EXISTS "user_activity_select_owner" ON public.user_activity;
DROP POLICY IF EXISTS "user_activity_insert_owner" ON public.user_activity;
DROP POLICY IF EXISTS "user_activity_update_owner" ON public.user_activity;
DROP POLICY IF EXISTS "user_activity_delete_owner" ON public.user_activity;

CREATE POLICY "user_activity_select_owner" ON public.user_activity
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "user_activity_insert_owner" ON public.user_activity
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "user_activity_update_owner" ON public.user_activity
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "user_activity_delete_owner" ON public.user_activity
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- Drop and recreate ai_tool_usage policies
DROP POLICY IF EXISTS "Users can view own tool usage" ON public.ai_tool_usage;
DROP POLICY IF EXISTS "Users can insert own tool usage" ON public.ai_tool_usage;

CREATE POLICY "Users can view own tool usage" ON public.ai_tool_usage
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own tool usage" ON public.ai_tool_usage
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Drop and recreate image_generations policies
DROP POLICY IF EXISTS "Users can view own image generations" ON public.image_generations;
DROP POLICY IF EXISTS "Users can insert own image generations" ON public.image_generations;

CREATE POLICY "Users can view own image generations" ON public.image_generations
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own image generations" ON public.image_generations
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);