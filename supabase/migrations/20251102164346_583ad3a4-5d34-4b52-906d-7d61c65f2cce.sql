-- Drop the security definer view and recreate without security definer
DROP VIEW IF EXISTS public.daily_activity_summary;

-- Create a regular view without security definer
CREATE VIEW public.daily_activity_summary WITH (security_invoker=true) AS
SELECT 
  DATE(created_at) as activity_date,
  COUNT(*) as total_activities,
  COUNT(DISTINCT user_id) as unique_users,
  tool_name,
  tool_category
FROM public.user_activity
GROUP BY DATE(created_at), tool_name, tool_category
ORDER BY activity_date DESC;