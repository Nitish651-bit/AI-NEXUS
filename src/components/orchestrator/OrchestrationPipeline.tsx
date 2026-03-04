import { useState } from "react";
import { useNexusOrchestrator, OrchestrationPhase, OrchestrationResult } from "@/hooks/useNexusOrchestrator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { aiTools } from "@/data/aiToolsData";
import {
  Brain,
  Search,
  Cpu,
  CheckCircle2,
  XCircle,
  Zap,
  ArrowRight,
  Clock,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Wrench,
} from "lucide-react";

const PHASE_CONFIG: Record<OrchestrationPhase, { label: string; icon: any; color: string }> = {
  idle: { label: "Ready", icon: Zap, color: "text-muted-foreground" },
  analyzing: { label: "Analyzing Intent", icon: Brain, color: "text-cyan-400" },
  planning: { label: "Planning Steps", icon: Search, color: "text-purple-400" },
  executing: { label: "Executing", icon: Cpu, color: "text-amber-400" },
  validating: { label: "Validating", icon: CheckCircle2, color: "text-green-400" },
  complete: { label: "Complete", icon: CheckCircle2, color: "text-green-400" },
  error: { label: "Error", icon: XCircle, color: "text-destructive" },
};

const PHASE_ORDER: OrchestrationPhase[] = ["analyzing", "planning", "executing", "validating", "complete"];

export function OrchestrationPipeline() {
  const [command, setCommand] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const { phase, lastResult, isProcessing, orchestrate, reset } = useNexusOrchestrator();

  const toolNames = aiTools.map((t) => t.title);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isProcessing) return;
    setShowDetails(false);
    await orchestrate(command, toolNames, { currentPage: window.location.pathname });
    setShowDetails(true);
  };

  const phaseInfo = PHASE_CONFIG[phase];
  const PhaseIcon = phaseInfo.icon;

  return (
    <div className="space-y-6">
      {/* Command Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Enter command... e.g. 'Generate a blog post about AI trends'"
          className="flex-1 bg-card border-border"
          disabled={isProcessing}
        />
        <Button type="submit" disabled={isProcessing || !command.trim()} className="gap-2">
          {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Execute
        </Button>
        {lastResult && (
          <Button type="button" variant="outline" onClick={reset} size="sm">
            Reset
          </Button>
        )}
      </form>

      {/* Pipeline Visualization */}
      {phase !== "idle" && (
        <Card className="bg-card border-border overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <PhaseIcon size={16} className={phaseInfo.color} />
                <span className={phaseInfo.color}>{phaseInfo.label}</span>
              </CardTitle>
              {lastResult && (
                <Badge variant="outline" className="font-mono text-xs">
                  {lastResult.execution_log.execution_time_ms}ms
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Phase Progress Bar */}
            <div className="flex items-center gap-1 mb-4">
              {PHASE_ORDER.map((p, i) => {
                const currentIdx = PHASE_ORDER.indexOf(phase as any);
                const isActive = i <= currentIdx || phase === "complete";
                const isCurrent = p === phase;
                return (
                  <div key={p} className="flex items-center flex-1">
                    <div
                      className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                        isActive
                          ? isCurrent
                            ? "bg-primary animate-pulse"
                            : "bg-primary"
                          : "bg-muted"
                      }`}
                    />
                    {i < PHASE_ORDER.length - 1 && (
                      <ArrowRight size={12} className={`mx-1 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Phase Labels */}
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-4">
              <span>Intent</span>
              <span>Plan</span>
              <span>Execute</span>
              <span>Validate</span>
              <span>Done</span>
            </div>

            {/* Result */}
            {lastResult && (
              <div className="space-y-4">
                {/* Intent Summary */}
                <div className="bg-muted/30 rounded-lg p-3 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-muted-foreground">INTENT</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {lastResult.orchestration.intent.primary_action}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {Math.round(lastResult.orchestration.intent.confidence * 100)}% confidence
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          lastResult.orchestration.complexity === "simple"
                            ? "border-green-500/50 text-green-400"
                            : lastResult.orchestration.complexity === "moderate"
                            ? "border-amber-500/50 text-amber-400"
                            : "border-red-500/50 text-red-400"
                        }`}
                      >
                        {lastResult.orchestration.complexity}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-foreground">{lastResult.orchestration.intent.summary}</p>
                </div>

                {/* Tools Identified */}
                {lastResult.orchestration.tools_identified.length > 0 && (
                  <div className="bg-muted/30 rounded-lg p-3 border border-border">
                    <span className="text-xs font-mono text-muted-foreground flex items-center gap-1 mb-2">
                      <Wrench size={12} /> TOOLS IDENTIFIED
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {lastResult.orchestration.tools_identified.map((tool, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          #{tool.priority} {tool.tool_name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Execution Plan */}
                {lastResult.orchestration.execution_plan.steps.length > 0 && (
                  <div className="bg-muted/30 rounded-lg p-3 border border-border">
                    <span className="text-xs font-mono text-muted-foreground flex items-center gap-1 mb-2">
                      <Clock size={12} /> EXECUTION PLAN ({lastResult.orchestration.execution_plan.total_steps} steps)
                    </span>
                    <div className="space-y-1.5">
                      {lastResult.orchestration.execution_plan.steps.map((step) => (
                        <div key={step.step_number} className="flex items-start gap-2 text-xs">
                          <span className="font-mono text-primary shrink-0 w-5">{step.step_number}.</span>
                          <span className="text-foreground">{step.action}</span>
                          {step.tool && (
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {step.tool}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Response */}
                <div className="bg-muted/30 rounded-lg p-3 border border-border">
                  <span className="text-xs font-mono text-muted-foreground mb-2 block">RESULT</span>
                  <ScrollArea className="max-h-64">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {lastResult.result}
                    </p>
                  </ScrollArea>
                </div>

                {/* Execution Log Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full text-xs text-muted-foreground gap-1"
                >
                  {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  Execution Log
                </Button>
                {showDetails && (
                  <div className="bg-muted/20 rounded-lg p-3 border border-border font-mono text-[11px] text-muted-foreground space-y-0.5">
                    {lastResult.execution_log.logs.map((log, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-primary shrink-0">[{i}]</span>
                        <span>{log}</span>
                      </div>
                    ))}
                    {lastResult.execution_log.errors.length > 0 && (
                      <div className="text-destructive mt-2">
                        {lastResult.execution_log.errors.map((e, i) => (
                          <div key={i}>ERROR: {e}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
