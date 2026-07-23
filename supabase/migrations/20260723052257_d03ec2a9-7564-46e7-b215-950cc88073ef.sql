
-- Agent types + statuses as enums for validation
DO $$ BEGIN
  CREATE TYPE public.agent_type AS ENUM ('planner','research','coding','document','image','automation','validator','orchestrator');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.agent_job_status AS ENUM ('pending','running','completed','failed','validated','rejected','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.agent_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  parent_job_id UUID REFERENCES public.agent_jobs(id) ON DELETE CASCADE,
  conversation_id UUID,
  agent_type public.agent_type NOT NULL,
  status public.agent_job_status NOT NULL DEFAULT 'pending',
  priority INT NOT NULL DEFAULT 5,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB,
  validation JSONB,
  error TEXT,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  claimed_by TEXT,
  claimed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_jobs_user ON public.agent_jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_status ON public.agent_jobs(status, priority DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_parent ON public.agent_jobs(parent_job_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_jobs TO authenticated;
GRANT ALL ON public.agent_jobs TO service_role;
ALTER TABLE public.agent_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own agent jobs"
  ON public.agent_jobs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  WITH CHECK (auth.uid() = user_id AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);

CREATE TRIGGER trg_agent_jobs_updated
  BEFORE UPDATE ON public.agent_jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Append-only event log
CREATE TABLE IF NOT EXISTS public.agent_job_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.agent_jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  message TEXT,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_job_events_job ON public.agent_job_events(job_id, created_at);

GRANT SELECT, INSERT ON public.agent_job_events TO authenticated;
GRANT ALL ON public.agent_job_events TO service_role;
ALTER TABLE public.agent_job_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own job events"
  ON public.agent_job_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);

CREATE POLICY "Users insert own job events"
  ON public.agent_job_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);

-- Atomic claim: pick the next pending job for a given agent_type for this user and lock it
CREATE OR REPLACE FUNCTION public.claim_agent_job(
  _user_id UUID,
  _agent_types public.agent_type[],
  _worker TEXT
) RETURNS public.agent_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  job public.agent_jobs;
BEGIN
  SELECT * INTO job
  FROM public.agent_jobs
  WHERE user_id = _user_id
    AND status = 'pending'
    AND agent_type = ANY(_agent_types)
    AND attempts < max_attempts
  ORDER BY priority DESC, created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  UPDATE public.agent_jobs
     SET status = 'running',
         claimed_by = _worker,
         claimed_at = now(),
         started_at = COALESCE(started_at, now()),
         attempts = attempts + 1
   WHERE id = job.id
  RETURNING * INTO job;

  INSERT INTO public.agent_job_events(job_id, user_id, event_type, message, data)
  VALUES (job.id, job.user_id, 'claimed', 'Job claimed by worker', jsonb_build_object('worker', _worker));

  RETURN job;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_agent_job(UUID, public.agent_type[], TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_agent_job(UUID, public.agent_type[], TEXT) TO authenticated, service_role;
