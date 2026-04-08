import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Optional auth - allow public access
    let userId = "anonymous";
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_ANON_KEY") ?? "",
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) userId = user.id;
      } catch {}
    }
    console.log("User:", userId);

    const body = await req.json();
    const recommendSchema = z.object({
      videoDescription: z.string().trim().max(5000).optional(),
      currentFilters: z.array(z.string().max(100)).max(20).optional(),
      clipCount: z.number().int().min(0).max(1000).optional(),
      totalDuration: z.number().min(0).max(86400).optional()
    });
    const { videoDescription, currentFilters, clipCount, totalDuration } = recommendSchema.parse(body);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing video for music recommendations:", { videoDescription, currentFilters, clipCount, totalDuration });

    const systemPrompt = `You are an expert music supervisor and video editor. Your job is to analyze video content and recommend the perfect royalty-free music tracks.

You must respond with a JSON object containing exactly this structure:
{
  "analysis": {
    "mood": "the overall mood of the video",
    "energy": "low/medium/high",
    "pace": "slow/moderate/fast",
    "emotion": "primary emotion conveyed"
  },
  "recommendations": [
    {
      "searchQuery": "specific search term for Jamendo",
      "category": "music category id",
      "reason": "why this fits the video",
      "timing": "when to use this in the video"
    }
  ],
  "mixingTips": ["tip1", "tip2", "tip3"]
}

Available categories: pop, rock, electronic, hiphop, jazz, classical, ambient, folk, country, rnb, metal, punk, reggae, blues, latin, world, soundtrack, cinematic, lofi, chillout, dance, indie, acoustic, piano, orchestral, epic, romantic, happy, sad, energetic, relaxing, dramatic, uplifting, dark, funky

Provide 3-5 music recommendations that would work perfectly with the described video content.`;

    const userPrompt = `Analyze this video and recommend music:

Video Description: ${videoDescription || "No description provided"}
Number of Clips: ${clipCount || 0}
Total Duration: ${totalDuration ? `${Math.round(totalDuration)} seconds` : "Unknown"}
Applied Filters: ${currentFilters?.length ? currentFilters.join(", ") : "None"}

Based on this information, recommend the perfect background music tracks that would enhance this video.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI Response:", content);

    // Parse the JSON response
    let recommendations;
    try {
      // Extract JSON from the response (in case it's wrapped in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return a default structure if parsing fails
      recommendations = {
        analysis: {
          mood: "neutral",
          energy: "medium",
          pace: "moderate",
          emotion: "balanced"
        },
        recommendations: [
          {
            searchQuery: "upbeat background",
            category: "pop",
            reason: "Versatile background music",
            timing: "Throughout the video"
          },
          {
            searchQuery: "cinematic ambient",
            category: "cinematic",
            reason: "Adds professional feel",
            timing: "For dramatic moments"
          },
          {
            searchQuery: "happy acoustic",
            category: "acoustic",
            reason: "Light and pleasant",
            timing: "For lighter sections"
          }
        ],
        mixingTips: [
          "Start music before the first visual for a smooth intro",
          "Lower volume during dialogue or important audio",
          "Use fade out at the end for a professional finish"
        ]
      };
    }

    return new Response(
      JSON.stringify(recommendations),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI Music Recommend error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
