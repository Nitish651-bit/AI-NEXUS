-- Create user activity tracking tables
CREATE TABLE public.user_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tool_name TEXT NOT NULL,
  tool_category TEXT NOT NULL,
  input_text TEXT,
  output_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Users can view their own activity
CREATE POLICY "Users can view their own activity"
ON public.user_activity
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own activity
CREATE POLICY "Users can insert their own activity"
ON public.user_activity
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_created_at ON public.user_activity(created_at DESC);

-- Create a view for daily activity summary (admin only)
CREATE OR REPLACE VIEW public.daily_activity_summary AS
SELECT 
  DATE(created_at) as activity_date,
  COUNT(*) as total_activities,
  COUNT(DISTINCT user_id) as unique_users,
  tool_name,
  tool_category
FROM public.user_activity
GROUP BY DATE(created_at), tool_name, tool_category
ORDER BY activity_date DESC;