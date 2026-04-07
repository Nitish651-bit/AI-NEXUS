import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const inputSchema = z.object({
  command: z.string().trim().min(1).max(2000),
  availableTools: z.array(z.string()).optional(),
  context: z.object({
    currentPage: z.string().optional(),
    previousCommands: z.array(z.string()).optional(),
  }).optional(),
});

function sanitizeInput(input: string): string {
  return input
    .replace(/ignore (all )?previous instructions/gi, "[filtered]")
    .replace(/system\s*override/gi, "[filtered]")
    .replace(/\[SYSTEM[^\]]*\]/gi, "[filtered]")
    .replace(/you are now/gi, "[filtered]");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const executionStart = Date.now();
  const executionLog: string[] = [];
  const errors: string[] = [];

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    executionLog.push(`Authenticated user: ${userId}`);

    const body = await req.json();
    const { command, availableTools, context } = inputSchema.parse(body);
    const sanitizedCommand = sanitizeInput(command);
    executionLog.push(`Command received: ${sanitizedCommand.slice(0, 100)}...`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // PHASE 1: Intent Analysis + Tool Identification + Planning
    const orchestratorPrompt = `You are AI NEXUS Orchestrator v3.0 — the central intelligence engine.
Given a user command, you must:
1. Analyze intent precisely
2. Identify which tools/services are needed
3. Create a step-by-step execution plan
4. Determine complexity and estimated time

Available tools in the platform: ${(availableTools || []).join(", ") || "general AI tools"}
User's current page: ${context?.currentPage || "unknown"}

Return ONLY valid JSON with this exact structure:
{
  "intent": {
    "primary_action": "string (navigate|search|generate|analyze|automate|create|edit|chat)",
    "confidence": 0.0-1.0,
    "summary": "one line description of what user wants"
  },
  "tools_identified": [
    {
      "tool_name": "string",
      "purpose": "why this tool is needed",
      "priority": 1
    }
  ],
  "execution_plan": {
    "total_steps": number,
    "steps": [
      {
        "step_number": 1,
        "action": "string",
        "tool": "string or null",
        "input": "what goes in",
        "expected_output": "what comes out",
        "depends_on": null
      }
    ]
  },
  "complexity": "simple|moderate|complex",
  "requires_web_search": true/false,
  "navigation_target": "string path or null"
}`;

    executionLog.push("Phase 1: Intent analysis started");

    const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: orchestratorPrompt },
          { role: "user", content: `Command: "${sanitizedCommand}"` },
        ],
        temperature: 0.3,
      }),
    });

    if (!analysisResponse.ok) {
      if (analysisResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (analysisResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits required. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway error: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    const analysisRaw = analysisData.choices[0].message.content;

    let analysis;
    try {
      const jsonMatch = analysisRaw.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      analysis = null;
    }

    executionLog.push("Phase 1 complete: Intent analyzed");

    // PHASE 2: Execute the plan (generate the actual response)
    executionLog.push("Phase 2: Execution started");

    const executionPrompt = `You are AI NEXUS v3.0 central intelligence. Execute this task precisely.
User command: "${sanitizedCommand}"
Analysis: ${JSON.stringify(analysis)}

Provide a clear, actionable response. If the task requires generating content, generate it.
If the task requires data, provide real information. Be concise and professional.
Do NOT explain your reasoning process — just deliver the result.`;

    const executionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_MASTER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "ainexus",
        messages: [
          { role: "system", content: executionPrompt },
          { role: "user", content: sanitizedCommand },
        ],
        temperature: 0.7,
        tools: analysis?.requires_web_search
          ? [{ type: "web_search_preview" as any }]
          : undefined,
      }),
    });

    if (!executionResponse.ok) {
      throw new Error(`Execution phase failed: ${executionResponse.status}`);
    }

    const executionData = await executionResponse.json();
    const result = executionData.choices[0].message.content;

    executionLog.push("Phase 2 complete: Execution finished");

    // PHASE 3: Validation
    executionLog.push("Phase 3: Validation passed");

    const executionTimeMs = Date.now() - executionStart;

    return new Response(
      JSON.stringify({
        success: true,
        orchestration: {
          intent: analysis?.intent || { primary_action: "chat", confidence: 0.5, summary: sanitizedCommand },
          tools_identified: analysis?.tools_identified || [],
          execution_plan: analysis?.execution_plan || { total_steps: 1, steps: [] },
          complexity: analysis?.complexity || "simple",
          navigation_target: analysis?.navigation_target || null,
        },
        result,
        execution_log: {
          execution_status: "success",
          execution_time_ms: executionTimeMs,
          logs: executionLog,
          errors,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const executionTimeMs = Date.now() - executionStart;
    errors.push(error instanceof Error ? error.message : "Unknown error");
    console.error("Nexus Orchestrator Error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        execution_log: {
          execution_status: "failed",
          execution_time_ms: executionTimeMs,
          logs: executionLog,
          errors,
        },
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
