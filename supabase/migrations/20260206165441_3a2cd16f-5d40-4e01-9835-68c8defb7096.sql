-- Fix 1: Remove duplicate DELETE policy on user_activity table
DROP POLICY IF EXISTS "Users can delete their own activity" ON public.user_activity;

-- Fix 2: Recreate daily_activity_summary view with security_invoker to inherit RLS
DROP VIEW IF EXISTS public.daily_activity_summary;
CREATE VIEW public.daily_activity_summary
WITH (security_invoker = on) AS
  SELECT date(created_at) AS activity_date,
    tool_name,
    tool_category,
    count(*) AS total_activities,
    count(DISTINCT user_id) AS unique_users
  FROM user_activity
  GROUP BY (date(created_at)), tool_name, tool_category;