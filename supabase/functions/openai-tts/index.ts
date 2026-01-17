import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Google Cloud TTS voices mapping (similar to OpenAI voices)
const voiceMapping: Record<string, { name: string; ssmlGender: string }> = {
  alloy: { name: "en-US-Neural2-C", ssmlGender: "FEMALE" },
  echo: { name: "en-US-Neural2-D", ssmlGender: "MALE" },
  fable: { name: "en-GB-Neural2-B", ssmlGender: "MALE" },
  onyx: { name: "en-US-Neural2-J", ssmlGender: "MALE" },
  nova: { name: "en-US-Neural2-F", ssmlGender: "FEMALE" },
  shimmer: { name: "en-US-Neural2-G", ssmlGender: "FEMALE" },
};

const inputSchema = z.object({
  text: z.string().trim().min(1, "Text cannot be empty").max(5000, "Text must be less than 5000 characters"),
  voice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]).optional()
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { text, voice } = inputSchema.parse(body);

    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is not configured");
    }

    const selectedVoice = voiceMapping[voice || "alloy"];
    console.log("Generating speech with Google TTS, text length:", text.length, "voice:", selectedVoice.name);

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: selectedVoice.name.startsWith("en-GB") ? "en-GB" : "en-US",
            name: selectedVoice.name,
            ssmlGender: selectedVoice.ssmlGender,
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 1.0,
            pitch: 0,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google TTS error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Rate limit exceeded. Please wait a moment and try again.",
            errorCode: "RATE_LIMIT"
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (response.status === 403 || response.status === 400) {
        // Use browser's built-in Web Speech API as fallback indicator
        return new Response(
          JSON.stringify({ 
            success: true, 
            audioContent: null,
            useBrowserTTS: true,
            text: text,
            message: "Using browser's built-in text-to-speech as fallback."
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      throw new Error(`TTS error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.audioContent) {
      throw new Error("No audio content received from Google TTS");
    }

    console.log("Speech generated successfully with Google TTS");

    return new Response(
      JSON.stringify({ success: true, audioContent: data.audioContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in TTS function:", error);
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
