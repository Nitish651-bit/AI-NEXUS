import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map friendly voice names to ElevenLabs voice IDs
const voiceMapping: Record<string, string> = {
  alloy: "Xb7hH8MSUJpSbSDYk0k2",   // Alice
  echo: "JBFqnCBsd6RMkjVDRZzb",     // George
  fable: "N2lVS1w4EtoT3dr4eOWO",    // Callum
  onyx: "nPczCjzI2devNBz1zQrb",     // Brian
  nova: "EXAVITQu4vr4xnSDxMaL",     // Sarah
  shimmer: "FGY2WhTYpPnrIDTdsKH5",  // Laura
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log("Authenticated user:", claimsData.claims.sub);

    const body = await req.json();
    const text = (body.text || "").trim();
    const voice = body.voice || "nova";

    if (!text) {
      return new Response(
        JSON.stringify({ success: false, error: "Text cannot be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (text.length > 5000) {
      return new Response(
        JSON.stringify({ success: false, error: "Text must be less than 5000 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    const voiceId = voiceMapping[voice] || voiceMapping.nova;
    console.log("Generating speech with ElevenLabs, text length:", text.length, "voiceId:", voiceId);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs TTS error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Rate limit exceeded. Please wait a moment and try again.",
            errorCode: "RATE_LIMIT",
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 401) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "ElevenLabs API key is invalid. Please check your API key.",
            errorCode: "UNAUTHORIZED",
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`ElevenLabs TTS error: ${response.status} - ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const audioContent = base64Encode(audioBuffer);

    console.log("Speech generated successfully with ElevenLabs TTS");

    return new Response(
      JSON.stringify({ success: true, audioContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in TTS function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
