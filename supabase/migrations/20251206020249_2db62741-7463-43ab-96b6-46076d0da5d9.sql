-- Fix RLS policies to only allow authenticated users (not anonymous)
-- This addresses the auth_allow_anonymous_sign_ins security warnings

-- Drop and recreate policies for ai_tool_usage
DROP POLICY IF EXISTS "Users can view own tool usage" ON public.ai_tool_usage;
CREATE POLICY "Users can view own tool usage" 
  ON public.ai_tool_usage 
  FOR SELECT 
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Drop and recreate policies for image_generations
DROP POLICY IF EXISTS "Users can view own image generations" ON public.image_generations;
CREATE POLICY "Users can view own image generations" 
  ON public.image_generations 
  FOR SELECT 
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Drop and recreate policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

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

-- Drop and recreate policies for text_generations
DROP POLICY IF EXISTS "Users can view own text generations" ON public.text_generations;
CREATE POLICY "Users can view own text generations" 
  ON public.text_generations 
  FOR SELECT 
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Drop and recreate policies for tts_usage
DROP POLICY IF EXISTS "Users can view own TTS usage" ON public.tts_usage;
CREATE POLICY "Users can view own TTS usage" 
  ON public.tts_usage 
  FOR SELECT 
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Drop and recreate policies for user_activity
DROP POLICY IF EXISTS "user_activity_select_owner" ON public.user_activity;
DROP POLICY IF EXISTS "user_activity_update_owner" ON public.user_activity;
DROP POLICY IF EXISTS "user_activity_delete_owner" ON public.user_activity;
DROP POLICY IF EXISTS "user_activity_insert_owner" ON public.user_activity;

CREATE POLICY "user_activity_select_owner" 
  ON public.user_activity 
  FOR SELECT 
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "user_activity_insert_owner" 
  ON public.user_activity 
  FOR INSERT 
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "user_activity_update_owner" 
  ON public.user_activity 
  FOR UPDATE 
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "user_activity_delete_owner" 
  ON public.user_activity 
  FOR DELETE 
  TO authenticated
  USING ((select auth.uid()) = user_id);