
-- 1) Realtime: scope channel subscriptions to the owner's user_id
--    Our broadcast topics are "user_activity:<uid>"
DROP POLICY IF EXISTS "Users subscribe to their own realtime topics" ON realtime.messages;
CREATE POLICY "Users subscribe to their own realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = ('user_activity:' || (select auth.uid())::text)
);

-- 2) Revoke EXECUTE on SECURITY DEFINER functions — these are trigger-only
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_activity_broadcast_trigger() FROM PUBLIC, anon, authenticated;

-- 3) Remove anon visibility from user-data tables (GraphQL schema exposure)
REVOKE SELECT ON public.user_activity     FROM anon;
REVOKE SELECT ON public.ai_tool_usage     FROM anon;
REVOKE SELECT ON public.image_generations FROM anon;
REVOKE SELECT ON public.text_generations  FROM anon;
REVOKE SELECT ON public.tts_usage         FROM anon;
REVOKE SELECT ON public.profiles          FROM anon;

-- 4) Block anonymous sign-in sessions from user_activity policies
DROP POLICY IF EXISTS user_activity_select_owner ON public.user_activity;
DROP POLICY IF EXISTS user_activity_insert_owner ON public.user_activity;
DROP POLICY IF EXISTS user_activity_update_owner ON public.user_activity;
DROP POLICY IF EXISTS user_activity_delete_owner ON public.user_activity;

CREATE POLICY user_activity_select_owner ON public.user_activity
  FOR SELECT TO authenticated
  USING (
    (select auth.uid()) = user_id
    AND ((select auth.jwt()->>'is_anonymous')::boolean IS NOT TRUE)
  );

CREATE POLICY user_activity_insert_owner ON public.user_activity
  FOR INSERT TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id
    AND ((select auth.jwt()->>'is_anonymous')::boolean IS NOT TRUE)
  );

CREATE POLICY user_activity_update_owner ON public.user_activity
  FOR UPDATE TO authenticated
  USING (
    (select auth.uid()) = user_id
    AND ((select auth.jwt()->>'is_anonymous')::boolean IS NOT TRUE)
  );

CREATE POLICY user_activity_delete_owner ON public.user_activity
  FOR DELETE TO authenticated
  USING (
    (select auth.uid()) = user_id
    AND ((select auth.jwt()->>'is_anonymous')::boolean IS NOT TRUE)
  );
