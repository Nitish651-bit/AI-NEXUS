/**
 * Ollama Proxy Edge Function
 * 
 * Routes AI requests to a user-hosted Ollama instance via OLLAMA_BASE_URL.
 * Supports both /api/chat and /api/generate endpoints.
 * Falls back to Lovable AI Gateway if Ollama is unreachable.
 * 
 * Required secret: OLLAMA_BASE_URL (e.g. https://your-ollama.ngrok-free.app)
 * Optional secret: OLLAMA_MODEL (defaults to llama3)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const inputSchema = z.object({
  message: z.string().trim().max(50000).optional(),
  toolCategory: z.string().max(100).optional(),
  toolTitle: z.string().max(100).optional(),
  images: z.array(z.object({ url: z.string(), mimeType: z.string().optional() })).max(5).optional(),
  enableWebSearch: z.boolean().optional(),
  // Ollama-specific options
  ollamaEndpoint: z.enum(["chat", "generate"]).optional(), // defaults to "chat"
  model: z.string().max(100).optional(),
  stream: z.boolean().optional(),
}).refine(d => d.message || (d.images && d.images.length > 0), {
  message: "Either message or images must be provided",
});

/** Optional authentication - allow public access */
async function tryAuthenticateUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { id: "anonymous" };
  }
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user || { id: "anonymous" };
  } catch {
    return { id: "anonymous" };
  }
}

/** Build the system prompt based on tool context */
function buildSystemPrompt(toolCategory?: string, toolTitle?: string): string {
  return `You are a helpful AI assistant specializing in ${toolCategory || "general tasks"}. You are part of AI NEXUS, a platform with 910+ AI tools developed by Nitish Tiwari. If anyone asks who built or developed AI Nexus, always answer: "AI Nexus was developed by Nitish Tiwari."
${toolTitle ? `Current tool: ${toolTitle}` : ""}
Provide accurate, helpful, and concise responses.`;
}

/** Try Ollama /api/chat endpoint */
async function callOllamaChat(
  baseUrl: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
  images?: string[],
) {
  const messages: any[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage, ...(images?.length ? { images } : {}) },
  ];

  const resp = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: false }),
    signal: AbortSignal.timeout(60000),
  });

  if (!resp.ok) throw new Error(`Ollama /api/chat returned ${resp.status}`);
  const data = await resp.json();
  return data.message?.content || data.response || "";
}

/** Try Ollama /api/generate endpoint */
async function callOllamaGenerate(
  baseUrl: string,
  model: string,
  prompt: string,
  images?: string[],
) {
  const resp = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      ...(images?.length ? { images } : {}),
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!resp.ok) throw new Error(`Ollama /api/generate returned ${resp.status}`);
  const data = await resp.json();
  return data.response || "";
}

/** Fallback: call Lovable AI Gateway */
async function callLovableAI(
  systemPrompt: string,
  userContent: any,
  enableWebSearch?: boolean,
) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("No fallback available: LOVABLE_API_KEY not set");

  const requestBody: any = {
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
  };
  if (enableWebSearch) {
    requestBody.tools = [{ type: "web_search_preview" }];
  }

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!resp.ok) {
    if (resp.status === 429) throw { status: 429, message: "Rate limit exceeded. Please try again later." };
    if (resp.status === 402) throw { status: 402, message: "AI credits exhausted. Please add credits." };
    throw new Error(`Lovable AI gateway error: ${resp.status}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate
    const user = await authenticateUser(req);
    console.log("Authenticated user:", user.id);

    // Parse & validate input
    const body = await req.json();
    const { message, toolCategory, toolTitle, images, enableWebSearch, ollamaEndpoint, model } =
      inputSchema.parse(body);

    const OLLAMA_BASE_URL = Deno.env.get("OLLAMA_BASE_URL");
    const ollamaModel = model || Deno.env.get("OLLAMA_MODEL") || "llama3";
    const systemPrompt = buildSystemPrompt(toolCategory, toolTitle);
    const textMessage = message || "Please analyze the attached image(s)";

    // Extract base64 images for Ollama (strip data-URL prefix)
    const ollamaImages = images?.map(img => img.url.replace(/^data:[^;]+;base64,/, "")) || [];

    let aiResponse = "";
    let provider = "";

    // Attempt Ollama first if OLLAMA_BASE_URL is configured
    if (OLLAMA_BASE_URL) {
      try {
        console.log(`Trying Ollama at ${OLLAMA_BASE_URL} (model: ${ollamaModel}, endpoint: ${ollamaEndpoint || "chat"})`);

        if (ollamaEndpoint === "generate") {
          // Use /api/generate
          const fullPrompt = `${systemPrompt}\n\nUser: ${textMessage}`;
          aiResponse = await callOllamaGenerate(
            OLLAMA_BASE_URL, ollamaModel, fullPrompt, ollamaImages.length > 0 ? ollamaImages : undefined,
          );
        } else {
          // Default: Use /api/chat
          aiResponse = await callOllamaChat(
            OLLAMA_BASE_URL, ollamaModel, systemPrompt, textMessage, ollamaImages.length > 0 ? ollamaImages : undefined,
          );
        }

        provider = `Ollama (${ollamaModel})`;
        console.log("Ollama response received successfully");
      } catch (ollamaError) {
        console.warn("Ollama failed, falling back to Lovable AI:", ollamaError instanceof Error ? ollamaError.message : ollamaError);
      }
    }

    // Fallback to Lovable AI if Ollama wasn't available or failed
    if (!aiResponse) {
      console.log("Using Lovable AI Gateway fallback");

      let userContent: any;
      if (images && images.length > 0) {
        userContent = [
          { type: "text", text: textMessage },
          ...images.map(img => ({ type: "image_url", image_url: { url: img.url } })),
        ];
      } else {
        userContent = textMessage;
      }

      aiResponse = await callLovableAI(systemPrompt, userContent, enableWebSearch);
      provider = "Lovable AI (Gemini 2.5 Flash)";
    }

    if (!aiResponse) throw new Error("No response from AI");

    return new Response(
      JSON.stringify({ success: true, output: aiResponse, provider }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("ollama-proxy error:", error instanceof Error ? error.message : error);

    const status = error?.status || 500;
    const message = error?.message || (error instanceof Error ? error.message : "Unknown error");

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
