
CREATE TABLE public.voice_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Voice session',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_voice_conversations_user ON public.voice_conversations(user_id, updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_conversations TO authenticated;
GRANT ALL ON public.voice_conversations TO service_role;

ALTER TABLE public.voice_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own voice conversations"
  ON public.voice_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND COALESCE((auth.jwt()->>'is_anonymous')::boolean, false) = false);

CREATE POLICY "Users insert own voice conversations"
  ON public.voice_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND COALESCE((auth.jwt()->>'is_anonymous')::boolean, false) = false);

CREATE POLICY "Users update own voice conversations"
  ON public.voice_conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND COALESCE((auth.jwt()->>'is_anonymous')::boolean, false) = false);

CREATE POLICY "Users delete own voice conversations"
  ON public.voice_conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND COALESCE((auth.jwt()->>'is_anonymous')::boolean, false) = false);

CREATE TRIGGER trg_voice_conversations_updated_at
  BEFORE UPDATE ON public.voice_conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.voice_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.voice_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_voice_messages_conv ON public.voice_messages(conversation_id, created_at ASC);

GRANT SELECT, INSERT, DELETE ON public.voice_messages TO authenticated;
GRANT ALL ON public.voice_messages TO service_role;

ALTER TABLE public.voice_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own voice messages"
  ON public.voice_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND COALESCE((auth.jwt()->>'is_anonymous')::boolean, false) = false);

CREATE POLICY "Users insert own voice messages"
  ON public.voice_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND COALESCE((auth.jwt()->>'is_anonymous')::boolean, false) = false);

CREATE POLICY "Users delete own voice messages"
  ON public.voice_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND COALESCE((auth.jwt()->>'is_anonymous')::boolean, false) = false);
