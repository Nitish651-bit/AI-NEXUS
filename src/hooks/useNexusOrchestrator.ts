import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface OrchestrationIntent {
  primary_action: string;
  confidence: number;
  summary: string;
}

export interface IdentifiedTool {
  tool_name: string;
  purpose: string;
  priority: number;
}

export interface ExecutionStep {
  step_number: number;
  action: string;
  tool: string | null;
  input: string;
  expected_output: string;
  depends_on: number | null;
}

export interface ExecutionPlan {
  total_steps: number;
  steps: ExecutionStep[];
}

export interface OrchestrationResult {
  success: boolean;
  orchestration: {
    intent: OrchestrationIntent;
    tools_identified: IdentifiedTool[];
    execution_plan: ExecutionPlan;
    complexity: "simple" | "moderate" | "complex";
    navigation_target: string | null;
  };
  result: string;
  execution_log: {
    execution_status: "success" | "failed";
    execution_time_ms: number;
    logs: string[];
    errors: string[];
  };
}

export type OrchestrationPhase = "idle" | "analyzing" | "planning" | "executing" | "validating" | "complete" | "error";

export function useNexusOrchestrator() {
  const [phase, setPhase] = useState<OrchestrationPhase>("idle");
  const [lastResult, setLastResult] = useState<OrchestrationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const orchestrate = useCallback(async (
    command: string,
    availableTools?: string[],
    context?: { currentPage?: string; previousCommands?: string[] }
  ): Promise<OrchestrationResult | null> => {
    if (!command.trim()) return null;

    setIsProcessing(true);
    setPhase("analyzing");

    try {
      // Simulate phase progression for UI feedback
      await new Promise(r => setTimeout(r, 300));
      setPhase("planning");

      await new Promise(r => setTimeout(r, 200));
      setPhase("executing");

      const { data, error } = await supabase.functions.invoke("nexus-orchestrator", {
        body: { command, availableTools, context },
      });

      if (error) throw error;

      setPhase("validating");
      await new Promise(r => setTimeout(r, 200));

      if (!data.success) {
        throw new Error(data.error || "Orchestration failed");
      }

      const result = data as OrchestrationResult;
      setLastResult(result);
      setPhase("complete");

      return result;
    } catch (err) {
      console.error("Orchestration error:", err);
      setPhase("error");
      toast({
        title: "Orchestration Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const reset = useCallback(() => {
    setPhase("idle");
    setLastResult(null);
  }, []);

  return {
    phase,
    lastResult,
    isProcessing,
    orchestrate,
    reset,
  };
}
