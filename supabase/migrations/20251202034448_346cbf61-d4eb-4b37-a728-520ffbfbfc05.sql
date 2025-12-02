-- Fix RLS Performance Issues
-- Replace auth.uid() with (SELECT auth.uid()) for better performance
-- Remove duplicate policies on user_activity table

-- ============================================
-- Step 1: Remove duplicate policies on user_activity
-- ============================================

-- Drop the duplicate "public" role policies (keeping the "authenticated" ones which already use SELECT)
DROP POLICY IF EXISTS "Users can view their own activity" ON public.user_activity;
DROP POLICY IF EXISTS "Users can insert their own activity" ON public.user_activity;

-- ============================================
-- Step 2: Optimize ai_tool_usage policies
-- ============================================

DROP POLICY IF EXISTS "Users can view own tool usage" ON public.ai_tool_usage;
DROP POLICY IF EXISTS "Users can insert own tool usage" ON public.ai_tool_usage;

CREATE POLICY "Users can view own tool usage" 
ON public.ai_tool_usage 
FOR SELECT 
TO public 
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own tool usage" 
ON public.ai_tool_usage 
FOR INSERT 
TO public 
WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================
-- Step 3: Optimize image_generations policies
-- ============================================

DROP POLICY IF EXISTS "Users can view own image generations" ON public.image_generations;

CREATE POLICY "Users can view own image generations" 
ON public.image_generations 
FOR SELECT 
TO public 
USING ((SELECT auth.uid()) = user_id);

-- Note: INSERT policy already uses (SELECT auth.uid())

-- ============================================
-- Step 4: Optimize text_generations policies
-- ============================================

DROP POLICY IF EXISTS "Users can view own text generations" ON public.text_generations;
DROP POLICY IF EXISTS "Users can insert own text generations" ON public.text_generations;

CREATE POLICY "Users can view own text generations" 
ON public.text_generations 
FOR SELECT 
TO public 
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own text generations" 
ON public.text_generations 
FOR INSERT 
TO public 
WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================
-- Step 5: Optimize tts_usage policies
-- ============================================

DROP POLICY IF EXISTS "Users can view own TTS usage" ON public.tts_usage;
DROP POLICY IF EXISTS "Users can insert own TTS usage" ON public.tts_usage;

CREATE POLICY "Users can view own TTS usage" 
ON public.tts_usage 
FOR SELECT 
TO public 
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own TTS usage" 
ON public.tts_usage 
FOR INSERT 
TO public 
WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================
-- Step 6: Optimize profiles policies
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO public 
USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
TO public 
WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO public 
USING ((SELECT auth.uid()) = id)
WITH CHECK ((SELECT auth.uid()) = id);