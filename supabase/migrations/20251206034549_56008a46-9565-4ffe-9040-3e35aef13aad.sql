-- Fix RLS policies to ensure only authenticated users can access (not anonymous)
-- Drop existing policies and recreate with explicit authenticated role

-- Fix user_activity policies - remove old ones and recreate with TO authenticated
DROP POLICY IF EXISTS "user_activity_select_owner" ON public.user_activity;
DROP POLICY IF EXISTS "user_activity_insert_owner" ON public.user_activity;
DROP POLICY IF EXISTS "user_activity_update_owner" ON public.user_activity;
DROP POLICY IF EXISTS "user_activity_delete_owner" ON public.user_activity;

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

-- Add RLS to daily_activity_summary view (it's a view, so we secure the underlying table)
-- Since it's a view aggregating user_activity, the RLS on user_activity already protects it
-- But we should revoke direct access from anon role
REVOKE ALL ON public.daily_activity_summary FROM anon;
GRANT SELECT ON public.daily_activity_summary TO authenticated;