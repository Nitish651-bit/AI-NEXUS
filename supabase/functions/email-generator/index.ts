import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { context, tone, purpose, imageData } = await req.json();
    
    if (!context) {
      throw new Error("Context is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating email response:", { 
      context, 
      tone, 
      purpose, 
      hasImage: !!imageData 
    });

    const systemPrompt = `You are a professional email writer with the ability to analyze images and files. Generate clear, professional, and effective email responses.
Tone: ${tone || 'Professional'}
Purpose: ${purpose || 'Response'}

Create email responses that:
- Are clear and concise
- Use appropriate professional language
- Have a proper structure (greeting, body, closing)
- Match the specified tone
- Address the context effectively
- When images or files are provided, analyze them thoroughly and incorporate relevant details into your response`;

    // Build messages array with multimodal support
    const messages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    // If image data is provided, use multimodal content format
    if (imageData) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `Generate an email response for: ${context}\n\nPlease analyze the attached image/file and incorporate relevant information into your response.`
          },
          {
            type: "image_url",
            image_url: {
              url: imageData  // Can be data:image/png;base64,... or https://...
            }
          }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: `Generate an email response for: ${context}`
      });
    }

    // Use gemini-2.5-flash which supports multimodal inputs
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Rate limit exceeded. Please try again in a moment." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "AI credits exhausted. Please add credits to continue." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    console.log("Email response generated successfully with multimodal support");

    return new Response(
      JSON.stringify({ success: true, output: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in email-generator function:", error);
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