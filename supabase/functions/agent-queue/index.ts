// Shared agent task queue: enqueue / claim / complete / fail / validate / list / get
// Authenticated only. Uses service role internally so we can atomically claim jobs
// via the SECURITY DEFINER `claim_agent_job` function.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

const AGENT_TYPES = [
  "planner", "research", "coding", "document",
  "image", "automation", "validator", "orchestrator",
] as const;
type AgentType = typeof AGENT_TYPES[number];

interface Payload {
  action:
    | "enqueue" | "claim" | "complete" | "fail"
    | "validate" | "cancel" | "list" | "get" | "events";
  job?: {
    agent_type?: AgentType;
    input?: Record<string, unknown>;
    priority?: number;
    max_attempts?: number;
    parent_job_id?: string | null;
    conversation_id?: string | null;
  };
  job_id?: string;
  worker?: string;
  agent_types?: AgentType[];
  output?: Record<string, unknown>;
  validation?: { passed: boolean; notes?: string; score?: number };
  error?: string;
  status_filter?: string;
  limit?: number;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Missing auth" }, 401);

    // Verify user with anon client bound to the caller's JWT
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const user = userData.user;
    if ((user as any).is_anonymous) return json({ error: "Anonymous not allowed" }, 403);
    const userId = user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const body = (await req.json().catch(() => ({}))) as Payload;
    const action = body.action;

    const logEvent = async (
      jobId: string,
      event_type: string,
      message?: string,
      data?: Record<string, unknown>,
    ) => {
      await admin.from("agent_job_events").insert({
        job_id: jobId, user_id: userId, event_type, message, data,
      });
    };

    switch (action) {
      case "enqueue": {
        const j = body.job ?? {};
        if (!j.agent_type || !AGENT_TYPES.includes(j.agent_type)) {
          return json({ error: "Invalid agent_type" }, 400);
        }
        const { data, error } = await admin.from("agent_jobs").insert({
          user_id: userId,
          agent_type: j.agent_type,
          input: j.input ?? {},
          priority: Math.min(Math.max(j.priority ?? 5, 1), 10),
          max_attempts: Math.min(Math.max(j.max_attempts ?? 3, 1), 10),
          parent_job_id: j.parent_job_id ?? null,
          conversation_id: j.conversation_id ?? null,
        }).select("*").single();
        if (error) return json({ error: error.message }, 400);
        await logEvent(data.id, "enqueued", "Job created", { agent_type: j.agent_type });
        return json({ job: data });
      }

      case "claim": {
        const types = (body.agent_types?.length ? body.agent_types : AGENT_TYPES) as AgentType[];
        const worker = body.worker || `worker-${crypto.randomUUID().slice(0, 8)}`;
        const { data, error } = await admin.rpc("claim_agent_job", {
          _user_id: userId, _agent_types: types, _worker: worker,
        });
        if (error) return json({ error: error.message }, 400);
        return json({ job: data ?? null });
      }

      case "complete": {
        if (!body.job_id) return json({ error: "job_id required" }, 400);
        const { data, error } = await admin.from("agent_jobs").update({
          status: "completed",
          output: body.output ?? {},
          completed_at: new Date().toISOString(),
          error: null,
        }).eq("id", body.job_id).eq("user_id", userId).select("*").single();
        if (error) return json({ error: error.message }, 400);
        await logEvent(data.id, "completed", "Agent finished", { output_keys: Object.keys(body.output ?? {}) });
        return json({ job: data });
      }

      case "fail": {
        if (!body.job_id) return json({ error: "job_id required" }, 400);
        const { data: current } = await admin.from("agent_jobs")
          .select("attempts, max_attempts").eq("id", body.job_id).eq("user_id", userId).single();
        const willRetry = current && current.attempts < current.max_attempts;
        const { data, error } = await admin.from("agent_jobs").update({
          status: willRetry ? "pending" : "failed",
          error: body.error?.slice(0, 2000) ?? "Unknown error",
          completed_at: willRetry ? null : new Date().toISOString(),
          claimed_by: null,
          claimed_at: null,
        }).eq("id", body.job_id).eq("user_id", userId).select("*").single();
        if (error) return json({ error: error.message }, 400);
        await logEvent(data.id, willRetry ? "retry" : "failed", body.error ?? "Failure", {});
        return json({ job: data });
      }

      case "validate": {
        if (!body.job_id || !body.validation) return json({ error: "job_id & validation required" }, 400);
        const passed = !!body.validation.passed;
        const { data, error } = await admin.from("agent_jobs").update({
          status: passed ? "validated" : "rejected",
          validation: body.validation,
        }).eq("id", body.job_id).eq("user_id", userId).select("*").single();
        if (error) return json({ error: error.message }, 400);
        await logEvent(data.id, passed ? "validated" : "rejected",
          body.validation.notes ?? null, body.validation);
        return json({ job: data });
      }

      case "cancel": {
        if (!body.job_id) return json({ error: "job_id required" }, 400);
        const { data, error } = await admin.from("agent_jobs").update({
          status: "cancelled", completed_at: new Date().toISOString(),
        }).eq("id", body.job_id).eq("user_id", userId).select("*").single();
        if (error) return json({ error: error.message }, 400);
        await logEvent(data.id, "cancelled", "Job cancelled by user", {});
        return json({ job: data });
      }

      case "list": {
        let q = admin.from("agent_jobs").select("*")
          .eq("user_id", userId).order("created_at", { ascending: false })
          .limit(Math.min(body.limit ?? 50, 200));
        if (body.status_filter) q = q.eq("status", body.status_filter);
        const { data, error } = await q;
        if (error) return json({ error: error.message }, 400);
        return json({ jobs: data ?? [] });
      }

      case "get": {
        if (!body.job_id) return json({ error: "job_id required" }, 400);
        const { data, error } = await admin.from("agent_jobs").select("*")
          .eq("id", body.job_id).eq("user_id", userId).single();
        if (error) return json({ error: error.message }, 400);
        return json({ job: data });
      }

      case "events": {
        if (!body.job_id) return json({ error: "job_id required" }, 400);
        const { data, error } = await admin.from("agent_job_events").select("*")
          .eq("job_id", body.job_id).eq("user_id", userId)
          .order("created_at", { ascending: true }).limit(500);
        if (error) return json({ error: error.message }, 400);
        return json({ events: data ?? [] });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (err) {
    console.error("agent-queue error", err);
    return json({ error: (err as Error).message }, 500);
  }
});
