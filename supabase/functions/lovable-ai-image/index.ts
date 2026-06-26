import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const inputSchema = z.object({
  prompt: z.string().trim().min(1, "Prompt cannot be empty").max(2000, "Prompt must be less than 2000 characters")
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function getOptionalUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { prompt } = inputSchema.parse(body);
    const user = await getOptionalUser(req);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating image, prompt length:", prompt.length, "user:", user?.id ?? "anonymous");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-image-2",
        prompt,
        quality: "low",
        size: "1024x1024",
        n: 1,
        stream: false,
      }),
      signal: AbortSignal.timeout(90000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return jsonResponse({ 
          success: false, 
          error: "Rate limit exceeded. Please try again in a moment." 
        }, 429);
      }
      
      if (response.status === 402) {
        return jsonResponse({ 
          success: false, 
          error: "AI credits exhausted. Please add credits to continue." 
        }, 402);
      }

      throw new Error(`Image generation failed (${response.status}). ${errorText.slice(0, 300)}`);
    }

    const data = await response.json();
    const b64Json = data?.data?.[0]?.b64_json;
    const directUrl = data?.data?.[0]?.url;
    const imageUrl = b64Json ? `data:image/png;base64,${b64Json}` : directUrl;

    if (!imageUrl) {
      throw new Error("No image generated");
    }

    console.log("Image generated successfully");

    return jsonResponse({ success: true, imageUrl });
  } catch (error) {
    console.error("Error in lovable-ai-image function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const friendlyMessage = message.includes("Timeout") || message.includes("timed out")
      ? "Image generation is taking too long. Please try a shorter prompt."
      : message;

    return jsonResponse({ success: false, error: friendlyMessage }, 500);
  }
});
