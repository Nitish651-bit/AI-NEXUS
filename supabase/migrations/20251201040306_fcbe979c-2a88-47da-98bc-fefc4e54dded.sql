-- Fix remaining function search path issue
CREATE OR REPLACE FUNCTION public.user_activity_broadcast_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'user_activity:' || COALESCE(NEW.user_id::text, OLD.user_id::text),
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;