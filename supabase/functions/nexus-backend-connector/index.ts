import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-nexus-server",
};

// Input validation schemas
const chatRequestSchema = z.object({
  type: z.literal("chat"),
  message: z.string().min(1).max(50000),
  context: z.string().optional(),
  images: z.array(z.object({
    url: z.string(),
    mimeType: z.string().optional()
  })).optional(),
  enableWebSearch: z.boolean().optional()
});

const imageRequestSchema = z.object({
  type: z.literal("image"),
  prompt: z.string().min(1).max(2000),
  negativePrompt: z.string().optional(),
  width: z.number().min(256).max(2048).optional(),
  height: z.number().min(256).max(2048).optional(),
  steps: z.number().min(1).max(100).optional()
});

const ttsRequestSchema = z.object({
  type: z.literal("tts"),
  text: z.string().min(1).max(10000),
  voice: z.string().optional(),
  speed: z.number().min(0.5).max(2.0).optional()
});

const sttRequestSchema = z.object({
  type: z.literal("stt"),
  audio: z.string(), // base64 encoded audio
  language: z.string().optional()
});

const toolRequestSchema = z.object({
  type: z.literal("tool"),
  toolName: z.string().min(1),
  parameters: z.record(z.unknown()).optional()
});

const workflowRequestSchema = z.object({
  type: z.literal("workflow"),
  workflowName: z.string().min(1),
  steps: z.array(z.object({
    id: z.string(),
    toolName: z.string(),
    parameters: z.record(z.unknown()).optional()
  }))
});

const inputSchema = z.discriminatedUnion("type", [
  chatRequestSchema,
  imageRequestSchema,
  ttsRequestSchema,
  sttRequestSchema,
  toolRequestSchema,
  workflowRequestSchema
]);

type RequestType = z.infer<typeof inputSchema>;

// Configuration for self-hosted server
interface NexusConfig {
  serverUrl: string;
  timeout: number;
  retries: number;
}

function getNexusConfig(customServerUrl?: string): NexusConfig {
  return {
    serverUrl: customServerUrl || Deno.env.get("NEXUS_SERVER_URL") || "http://localhost:8000",
    timeout: parseInt(Deno.env.get("NEXUS_TIMEOUT") || "30000"),
    retries: parseInt(Deno.env.get("NEXUS_RETRIES") || "2")
  };
}

// Health check for self-hosted server
async function checkNexusHealth(config: NexusConfig): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${config.serverUrl}/health`, {
      method: "GET",
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log("Nexus server health check failed:", error.message);
    return false;
  }
}

// Route request to self-hosted Nexus server
async function routeToNexus(
  config: NexusConfig, 
  request: RequestType,
  endpoint: string
): Promise<Response | null> {
  for (let attempt = 0; attempt < config.retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);
      
      console.log(`Attempting Nexus request to ${config.serverUrl}${endpoint} (attempt ${attempt + 1})`);
      
      const response = await fetch(`${config.serverUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Nexus server responded successfully");
        return new Response(JSON.stringify({
          success: true,
          source: "nexus-local",
          output: data.output || data.result || data
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      console.log(`Nexus server returned status ${response.status}`);
    } catch (error) {
      console.log(`Nexus request failed (attempt ${attempt + 1}):`, error.message);
    }
  }
  
  return null;
}

// Cloud fallback handlers
async function fallbackChat(request: z.infer<typeof chatRequestSchema>): Promise<Response> {
  console.log("Falling back to cloud AI for chat");
  
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  
  // Try Lovable AI Gateway first
  if (lovableApiKey) {
    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are AI Nexus, a helpful AI assistant." },
            { role: "user", content: request.message }
          ]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return new Response(JSON.stringify({
          success: true,
          source: "cloud-lovable",
          output: data.choices?.[0]?.message?.content
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    } catch (error) {
      console.log("Lovable AI fallback failed:", error.message);
    }
  }
  
  // Try Gemini as secondary fallback
  if (geminiApiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: request.message }] }]
          })
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        return new Response(JSON.stringify({
          success: true,
          source: "cloud-gemini",
          output: data.candidates?.[0]?.content?.parts?.[0]?.text
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    } catch (error) {
      console.log("Gemini fallback failed:", error.message);
    }
  }
  
  return new Response(JSON.stringify({
    success: false,
    error: "All AI services unavailable. Please configure your self-hosted Nexus server or add cloud API keys.",
    source: "none"
  }), {
    status: 503,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

async function fallbackImage(request: z.infer<typeof imageRequestSchema>): Promise<Response> {
  console.log("Falling back to cloud AI for image generation");
  
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  
  if (geminiApiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: request.prompt }] }],
            generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
          })
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((p: any) => p.inlineData);
        
        if (imagePart) {
          return new Response(JSON.stringify({
            success: true,
            source: "cloud-gemini",
            output: {
              imageUrl: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
            }
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }
    } catch (error) {
      console.log("Gemini image fallback failed:", error.message);
    }
  }
  
  return new Response(JSON.stringify({
    success: false,
    error: "Image generation unavailable. Please configure your self-hosted Nexus server with Stable Diffusion or add cloud API keys.",
    source: "none"
  }), {
    status: 503,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

async function fallbackTTS(request: z.infer<typeof ttsRequestSchema>): Promise<Response> {
  console.log("Falling back to cloud TTS");
  
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  
  if (openaiApiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "tts-1",
          input: request.text,
          voice: request.voice || "alloy",
          speed: request.speed || 1.0
        })
      });
      
      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
        
        return new Response(JSON.stringify({
          success: true,
          source: "cloud-openai",
          output: {
            audioData: base64Audio,
            format: "mp3"
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    } catch (error) {
      console.log("OpenAI TTS fallback failed:", error.message);
    }
  }
  
  return new Response(JSON.stringify({
    success: false,
    error: "TTS unavailable. Please configure your self-hosted Nexus server with Coqui/Piper TTS or add OpenAI API key.",
    source: "none",
    fallbackHint: "browser-speech-synthesis"
  }), {
    status: 503,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

async function fallbackSTT(request: z.infer<typeof sttRequestSchema>): Promise<Response> {
  console.log("Falling back to cloud STT");
  
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  
  if (openaiApiKey) {
    try {
      // Convert base64 to blob for Whisper API
      const audioBytes = Uint8Array.from(atob(request.audio), c => c.charCodeAt(0));
      const blob = new Blob([audioBytes], { type: "audio/webm" });
      
      const formData = new FormData();
      formData.append("file", blob, "audio.webm");
      formData.append("model", "whisper-1");
      if (request.language) {
        formData.append("language", request.language);
      }
      
      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        return new Response(JSON.stringify({
          success: true,
          source: "cloud-openai",
          output: data.text
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    } catch (error) {
      console.log("OpenAI STT fallback failed:", error.message);
    }
  }
  
  return new Response(JSON.stringify({
    success: false,
    error: "STT unavailable. Please configure your self-hosted Nexus server with Whisper or add OpenAI API key.",
    source: "none"
  }), {
    status: 503,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

async function fallbackTool(request: z.infer<typeof toolRequestSchema>): Promise<Response> {
  // Tools require self-hosted server - no cloud fallback
  return new Response(JSON.stringify({
    success: false,
    error: `Tool '${request.toolName}' requires a self-hosted Nexus server. No cloud fallback available for security tools.`,
    source: "none"
  }), {
    status: 503,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

async function fallbackWorkflow(request: z.infer<typeof workflowRequestSchema>): Promise<Response> {
  // Workflows require self-hosted server - no cloud fallback
  return new Response(JSON.stringify({
    success: false,
    error: `Workflow '${request.workflowName}' requires a self-hosted Nexus server. Autonomous workflows cannot run on cloud APIs.`,
    source: "none"
  }), {
    status: 503,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

// Endpoint mapping
const endpointMap: Record<string, string> = {
  chat: "/api/v1/chat",
  image: "/api/v1/image/generate",
  tts: "/api/v1/voice/synthesize",
  stt: "/api/v1/voice/transcribe",
  tool: "/api/v1/tools/execute",
  workflow: "/api/v1/workflows/run"
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const parseResult = inputSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: "Invalid request format",
        details: parseResult.error.errors
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    const request = parseResult.data;
    const customServerUrl = req.headers.get("x-nexus-server");
    const config = getNexusConfig(customServerUrl || undefined);
    
    console.log(`Processing ${request.type} request`);
    console.log(`Nexus server configured at: ${config.serverUrl}`);
    
    // Check if self-hosted server is available
    const nexusAvailable = await checkNexusHealth(config);
    console.log(`Nexus server available: ${nexusAvailable}`);
    
    // Try self-hosted server first
    if (nexusAvailable) {
      const endpoint = endpointMap[request.type];
      const nexusResponse = await routeToNexus(config, request, endpoint);
      
      if (nexusResponse) {
        return nexusResponse;
      }
    }
    
    // Fallback to cloud APIs
    console.log(`Nexus unavailable, attempting cloud fallback for ${request.type}`);
    
    switch (request.type) {
      case "chat":
        return await fallbackChat(request);
      case "image":
        return await fallbackImage(request);
      case "tts":
        return await fallbackTTS(request);
      case "stt":
        return await fallbackSTT(request);
      case "tool":
        return await fallbackTool(request);
      case "workflow":
        return await fallbackWorkflow(request);
      default:
        return new Response(JSON.stringify({
          success: false,
          error: "Unknown request type"
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
    
  } catch (error) {
    console.error("Nexus connector error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
