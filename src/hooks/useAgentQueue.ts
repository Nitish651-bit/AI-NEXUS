import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AgentType =
  | "planner" | "research" | "coding" | "document"
  | "image" | "automation" | "validator" | "orchestrator";

export type AgentJobStatus =
  | "pending" | "running" | "completed"
  | "failed" | "validated" | "rejected" | "cancelled";

export interface AgentJob {
  id: string;
  user_id: string;
  parent_job_id: string | null;
  conversation_id: string | null;
  agent_type: AgentType;
  status: AgentJobStatus;
  priority: number;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  validation: { passed: boolean; notes?: string; score?: number } | null;
  error: string | null;
  attempts: number;
  max_attempts: number;
  claimed_by: string | null;
  claimed_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

async function call<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke("agent-queue", {
    body: { action, ...payload },
  });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}

export function useAgentQueue() {
  const [jobs, setJobs] = useState<AgentJob[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const refresh = useCallback(async (status_filter?: AgentJobStatus) => {
    setLoading(true);
    try {
      const { jobs } = await call<{ jobs: AgentJob[] }>("list", { status_filter });
      setJobs(jobs);
    } finally { setLoading(false); }
  }, []);

  const enqueue = useCallback(async (
    agent_type: AgentType,
    input: Record<string, unknown>,
    opts?: { priority?: number; parent_job_id?: string; conversation_id?: string; max_attempts?: number },
  ) => {
    const { job } = await call<{ job: AgentJob }>("enqueue", {
      job: { agent_type, input, ...opts },
    });
    setJobs((prev) => [job, ...prev]);
    return job;
  }, []);

  const claim = useCallback(async (agent_types?: AgentType[], worker?: string) => {
    const { job } = await call<{ job: AgentJob | null }>("claim", { agent_types, worker });
    return job;
  }, []);

  const complete = useCallback(async (job_id: string, output: Record<string, unknown>) => {
    const { job } = await call<{ job: AgentJob }>("complete", { job_id, output });
    setJobs((prev) => prev.map((j) => (j.id === job.id ? job : j)));
    return job;
  }, []);

  const fail = useCallback(async (job_id: string, error: string) => {
    const { job } = await call<{ job: AgentJob }>("fail", { job_id, error });
    setJobs((prev) => prev.map((j) => (j.id === job.id ? job : j)));
    return job;
  }, []);

  const validate = useCallback(async (
    job_id: string,
    validation: { passed: boolean; notes?: string; score?: number },
  ) => {
    const { job } = await call<{ job: AgentJob }>("validate", { job_id, validation });
    setJobs((prev) => prev.map((j) => (j.id === job.id ? job : j)));
    return job;
  }, []);

  const cancel = useCallback(async (job_id: string) => {
    const { job } = await call<{ job: AgentJob }>("cancel", { job_id });
    setJobs((prev) => prev.map((j) => (j.id === job.id ? job : j)));
    return job;
  }, []);

  const getEvents = useCallback(async (job_id: string) => {
    const { events } = await call<{ events: any[] }>("events", { job_id });
    return events;
  }, []);

  // Live updates for the current user's jobs
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id;
      if (!uid || cancelled) return;
      const channel = supabase
        .channel(`agent_jobs:${uid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "agent_jobs", filter: `user_id=eq.${uid}` },
          (payload) => {
            setJobs((prev) => {
              if (payload.eventType === "INSERT") return [payload.new as AgentJob, ...prev];
              if (payload.eventType === "DELETE")
                return prev.filter((j) => j.id !== (payload.old as AgentJob).id);
              return prev.map((j) =>
                j.id === (payload.new as AgentJob).id ? (payload.new as AgentJob) : j,
              );
            });
          },
        )
        .subscribe();
      channelRef.current = channel;
    })();
    return () => {
      cancelled = true;
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  return {
    jobs, loading, refresh,
    enqueue, claim, complete, fail, validate, cancel, getEvents,
  };
}
