import { useEffect, useState } from "react";
import { useAgentQueue, type AgentType, type AgentJob } from "@/hooks/useAgentQueue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SEO } from "@/components/seo/SEO";

const AGENT_TYPES: AgentType[] = [
  "planner", "research", "coding", "document",
  "image", "automation", "validator", "orchestrator",
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-foreground",
  running: "bg-blue-500/20 text-blue-400",
  completed: "bg-emerald-500/20 text-emerald-400",
  validated: "bg-emerald-600/20 text-emerald-300",
  failed: "bg-red-500/20 text-red-400",
  rejected: "bg-orange-500/20 text-orange-400",
  cancelled: "bg-muted text-muted-foreground",
};

export default function AgentQueuePage() {
  const q = useAgentQueue();
  const [agent, setAgent] = useState<AgentType>("planner");
  const [prompt, setPrompt] = useState("");
  const [priority, setPriority] = useState(5);
  const [selected, setSelected] = useState<AgentJob | null>(null);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => { q.refresh().catch((e) => toast.error(e.message)); }, []);
  useEffect(() => {
    if (!selected) { setEvents([]); return; }
    q.getEvents(selected.id).then(setEvents).catch(() => setEvents([]));
    const fresh = q.jobs.find((j) => j.id === selected.id);
    if (fresh && fresh !== selected) setSelected(fresh);
  }, [selected?.id, q.jobs]);

  const submit = async () => {
    if (!prompt.trim()) return toast.error("Provide a prompt / input");
    try {
      await q.enqueue(agent, { prompt: prompt.trim() }, { priority });
      setPrompt("");
      toast.success(`Enqueued ${agent} job`);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <SEO title="Agent Task Queue | AI NEXUS" description="Shared task queue for planner, research, coding, document, image, and automation agents with persisted job state and validation." path="/agents/queue" noindex />
      <div className="max-w-7xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold">Agent Task Queue</h1>
          <p className="text-muted-foreground mt-1">
            Shared queue across planner, research, coding, document, image, and automation agents.
            Every state change is persisted and auditable.
          </p>
        </header>

        <Card className="p-4 space-y-3">
          <div className="grid md:grid-cols-[200px_1fr_120px_auto] gap-3">
            <Select value={agent} onValueChange={(v) => setAgent(v as AgentType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AGENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea
              value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the task input for this agent…" rows={2}
            />
            <Input
              type="number" min={1} max={10} value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              aria-label="Priority (1-10)"
            />
            <Button onClick={submit}>Enqueue</Button>
          </div>
        </Card>

        <div className="grid lg:grid-cols-[1fr_400px] gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Jobs ({q.jobs.length})</h2>
              <Button size="sm" variant="outline" onClick={() => q.refresh()}>Refresh</Button>
            </div>
            <div className="space-y-2 max-h-[70vh] overflow-auto">
              {q.jobs.length === 0 && (
                <p className="text-sm text-muted-foreground">No jobs yet. Enqueue one above.</p>
              )}
              {q.jobs.map((j) => (
                <button
                  key={j.id}
                  onClick={() => setSelected(j)}
                  className={`w-full text-left p-3 rounded-md border transition ${
                    selected?.id === j.id ? "border-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{j.agent_type}</Badge>
                      <Badge className={STATUS_COLORS[j.status] ?? ""}>{j.status}</Badge>
                      <span className="text-xs text-muted-foreground">P{j.priority} · try {j.attempts}/{j.max_attempts}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(j.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm mt-1 line-clamp-2">
                    {String((j.input as any)?.prompt ?? JSON.stringify(j.input))}
                  </p>
                  {j.error && <p className="text-xs text-red-400 mt-1">Error: {j.error}</p>}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold mb-3">Job detail</h2>
            {!selected && <p className="text-sm text-muted-foreground">Select a job to inspect.</p>}
            {selected && (
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{selected.agent_type}</Badge>
                  <Badge className={STATUS_COLORS[selected.status] ?? ""}>{selected.status}</Badge>
                </div>

                <section>
                  <h3 className="text-xs uppercase text-muted-foreground mb-1">Input</h3>
                  <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
{JSON.stringify(selected.input, null, 2)}
                  </pre>
                </section>

                {selected.output && (
                  <section>
                    <h3 className="text-xs uppercase text-muted-foreground mb-1">Output</h3>
                    <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
{JSON.stringify(selected.output, null, 2)}
                    </pre>
                  </section>
                )}

                {selected.validation && (
                  <section>
                    <h3 className="text-xs uppercase text-muted-foreground mb-1">Validation</h3>
                    <pre className="bg-muted p-2 rounded text-xs">
{JSON.stringify(selected.validation, null, 2)}
                    </pre>
                  </section>
                )}

                <div className="flex flex-wrap gap-2">
                  {selected.status === "completed" && (
                    <>
                      <Button size="sm" onClick={async () => {
                        try {
                          await q.validate(selected.id, { passed: true, notes: "Manually approved" });
                          toast.success("Validated");
                        } catch (e: any) { toast.error(e.message); }
                      }}>Mark validated</Button>
                      <Button size="sm" variant="outline" onClick={async () => {
                        try {
                          await q.validate(selected.id, { passed: false, notes: "Manually rejected" });
                          toast.message("Rejected");
                        } catch (e: any) { toast.error(e.message); }
                      }}>Reject</Button>
                    </>
                  )}
                  {(selected.status === "pending" || selected.status === "running") && (
                    <Button size="sm" variant="destructive" onClick={async () => {
                      try { await q.cancel(selected.id); toast.message("Cancelled"); }
                      catch (e: any) { toast.error(e.message); }
                    }}>Cancel</Button>
                  )}
                </div>

                <section>
                  <h3 className="text-xs uppercase text-muted-foreground mb-1">Event log</h3>
                  <div className="space-y-1 max-h-48 overflow-auto">
                    {events.map((ev) => (
                      <div key={ev.id} className="text-xs border-l-2 border-primary/40 pl-2">
                        <span className="font-mono">{ev.event_type}</span>
                        <span className="text-muted-foreground ml-2">
                          {new Date(ev.created_at).toLocaleTimeString()}
                        </span>
                        {ev.message && <div className="text-muted-foreground">{ev.message}</div>}
                      </div>
                    ))}
                    {events.length === 0 && <p className="text-xs text-muted-foreground">No events yet.</p>}
                  </div>
                </section>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
