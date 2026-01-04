-- Fix 1: Enable RLS on daily_activity_summary view
-- Note: Views in Supabase inherit security from underlying tables
-- We need to create a security-invoker function or restrict the view

-- Create a policy on the underlying user_activity table that the view reads from
-- The view already aggregates data from user_activity which has RLS

-- Fix 2: Add DELETE policy for user_activity table (GDPR right to erasure)
CREATE POLICY "Users can delete their own activity" 
ON public.user_activity 
FOR DELETE 
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- For the daily_activity_summary view, since it's a view (not a table),
-- we need to ensure it respects RLS. Views run with definer's permissions by default.
-- Let's drop and recreate it with security_invoker = true
DROP VIEW IF EXISTS public.daily_activity_summary;

CREATE VIEW public.daily_activity_summary 
WITH (security_invoker = true)
AS
SELECT 
  DATE(created_at) as activity_date,
  tool_name,
  tool_category,
  COUNT(*) as total_activities,
  COUNT(DISTINCT user_id) as unique_users
FROM public.user_activity
GROUP BY DATE(created_at), tool_name, tool_category;