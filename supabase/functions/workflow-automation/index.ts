import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stepSchema = z.object({
  id: z.string(),
  toolName: z.string(),
  toolCategory: z.string(),
  prompt: z.string().max(10000),
  order: z.number()
});

const inputSchema = z.object({
  workflowName: z.string().max(200),
  steps: z.array(stepSchema).min(1).max(10),
  previousOutputs: z.array(z.string()).optional()
});

// Map tool names to appropriate AI provider configurations
function getAIConfig(toolName: string, toolCategory: string) {
  const lowerTool = toolName.toLowerCase();
  
  if (lowerTool.includes('chatgpt') || lowerTool.includes('openai') || lowerTool.includes('dall')) {
    return {
      provider: 'openai',
      model: lowerTool.includes('dall') ? 'image' : 'gpt-5-mini',
      systemPrompt: `You are ChatGPT, a helpful AI assistant by OpenAI. Provide accurate, detailed, and helpful responses.`
    };
  }
  
  if (lowerTool.includes('claude') || lowerTool.includes('anthropic')) {
    return {
      provider: 'anthropic',
      model: 'claude-sonnet-4-5',
      systemPrompt: `You are Claude, an AI assistant by Anthropic. Be helpful, harmless, and honest in your responses.`
    };
  }
  
  if (lowerTool.includes('copilot') || lowerTool.includes('code')) {
    return {
      provider: 'code',
      model: 'google/gemini-2.5-flash',
      systemPrompt: `You are an expert programming assistant like GitHub Copilot. Provide clean, efficient, well-documented code solutions. Always explain your code clearly.`
    };
  }
  
  if (lowerTool.includes('jasper') || lowerTool.includes('marketing') || lowerTool.includes('content')) {
    return {
      provider: 'marketing',
      model: 'google/gemini-2.5-flash',
      systemPrompt: `You are an expert marketing AI assistant like Jasper.ai. Create compelling, engaging content that drives conversions. Focus on persuasive copywriting, SEO optimization, and audience engagement.`
    };
  }
  
  if (lowerTool.includes('grammarly') || lowerTool.includes('grammar') || lowerTool.includes('writing')) {
    return {
      provider: 'grammar',
      model: 'google/gemini-2.5-flash',
      systemPrompt: `You are an expert writing assistant like Grammarly. Improve text clarity, grammar, punctuation, and style. Provide the corrected text first, then explain the changes made.`
    };
  }
  
  if (lowerTool.includes('notion') || lowerTool.includes('productivity') || lowerTool.includes('docs')) {
    return {
      provider: 'productivity',
      model: 'google/gemini-2.5-flash',
      systemPrompt: `You are a productivity AI assistant like Notion AI. Help organize information, summarize content, generate ideas, and structure documents clearly.`
    };
  }
  
  // Default configuration
  return {
    provider: 'default',
    model: 'google/gemini-2.5-flash',
    systemPrompt: `You are a helpful AI assistant specializing in ${toolCategory}. Provide accurate and helpful responses.`
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { workflowName, steps, previousOutputs = [] } = inputSchema.parse(body);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Starting workflow execution:", { workflowName, stepCount: steps.length });

    const results: { stepId: string; toolName: string; output: string; success: boolean; error?: string }[] = [];
    let contextFromPreviousSteps = previousOutputs.join("\n\n---\n\n");

    for (const step of steps) {
      try {
        console.log(`Executing step ${step.order}: ${step.toolName}`);

        const config = getAIConfig(step.toolName, step.toolCategory);
        
        // Build the prompt with context from previous steps
        let fullPrompt = step.prompt;
        if (contextFromPreviousSteps) {
          fullPrompt = `Previous workflow outputs for context:\n${contextFromPreviousSteps}\n\n---\n\nCurrent task:\n${step.prompt}`;
        }

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: config.model,
            messages: [
              { role: "system", content: config.systemPrompt },
              { role: "user", content: fullPrompt }
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Step ${step.order} error:`, response.status, errorText);
          
          if (response.status === 429) {
            results.push({
              stepId: step.id,
              toolName: step.toolName,
              output: "",
              success: false,
              error: "Rate limit exceeded. Please try again later."
            });
            break;
          }
          
          if (response.status === 402) {
            results.push({
              stepId: step.id,
              toolName: step.toolName,
              output: "",
              success: false,
              error: "AI credits exhausted. Please add credits to continue."
            });
            break;
          }

          throw new Error(`AI gateway error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices?.[0]?.message?.content || "No response generated";

        results.push({
          stepId: step.id,
          toolName: step.toolName,
          output: aiResponse,
          success: true
        });

        // Add this output to context for next steps
        contextFromPreviousSteps += `\n\n---\n\n[${step.toolName} output]:\n${aiResponse}`;
        
        console.log(`Step ${step.order} completed successfully`);

      } catch (stepError) {
        console.error(`Error in step ${step.order}:`, stepError);
        results.push({
          stepId: step.id,
          toolName: step.toolName,
          output: "",
          success: false,
          error: stepError instanceof Error ? stepError.message : "Step execution failed"
        });
      }
    }

    const allSuccess = results.every(r => r.success);
    console.log("Workflow completed:", { workflowName, success: allSuccess, stepsCompleted: results.filter(r => r.success).length });

    return new Response(
      JSON.stringify({ 
        success: allSuccess, 
        workflowName,
        results,
        completedSteps: results.filter(r => r.success).length,
        totalSteps: steps.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in workflow-automation function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});