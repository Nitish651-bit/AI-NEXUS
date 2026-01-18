import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const imageSchema = z.object({
  url: z.string(),
  mimeType: z.string().optional()
});

const inputSchema = z.object({
  message: z.string().trim().max(50000, "Message must be less than 50000 characters").optional(),
  toolCategory: z.string().max(100).optional(),
  toolTitle: z.string().max(100).optional(),
  images: z.array(imageSchema).max(5).optional(),
  enableWebSearch: z.boolean().optional()
}).refine(data => data.message || (data.images && data.images.length > 0), {
  message: "Either message or images must be provided"
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { message, toolCategory, toolTitle, images, enableWebSearch } = inputSchema.parse(body);

    console.log("Processing AI request:", { 
      toolCategory, 
      toolTitle, 
      messageLength: message?.length || 0,
      imageCount: images?.length || 0,
      enableWebSearch
    });

    // AI NEXUS Identity
    const identityRules = `IDENTITY RULES (CRITICAL):
- Your name is AI NEXUS, built by Nitish Tiwari.
- If asked "Who are you?", reply: "I am AI NEXUS."
- If asked "Who built you?", reply: "I was built by Nitish Tiwari."
- NEVER say you were built by Google, OpenAI, or any company.
`;

    const systemPrompt = `${identityRules}
You are a helpful AI assistant specializing in ${toolCategory || 'general tasks'}.
${toolTitle ? `Current tool: ${toolTitle}` : ''}
${enableWebSearch ? 'Provide up-to-date information when relevant.' : ''}
Provide accurate, helpful, and concise responses.`;

    const textMessage = message || "Please analyze the attached image(s)";

    // Try Lovable AI Gateway first (better rate limits)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (LOVABLE_API_KEY) {
      try {
        console.log("Using Lovable AI Gateway");
        
        // Build messages for Lovable AI
        const userContent: any[] = [{ type: "text", text: textMessage }];
        
        if (images && images.length > 0) {
          for (const img of images) {
            if (img.url.startsWith('data:') || img.url.startsWith('http')) {
              userContent.push({
                type: "image_url",
                image_url: { url: img.url }
              });
            }
          }
        }

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
              { role: "user", content: userContent.length === 1 ? textMessage : userContent }
            ],
          }),
        });

        if (response.status === 429) {
          console.log("Lovable AI rate limited, will try Gemini fallback");
        } else if (response.status === 402) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: "AI credits exhausted. Please add credits to continue.",
            creditsRequired: true
          }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else if (response.ok) {
          const data = await response.json();
          const aiResponse = data.choices?.[0]?.message?.content;

          if (aiResponse) {
            console.log("Lovable AI response generated successfully");
            return new Response(
              JSON.stringify({ success: true, output: aiResponse, provider: 'Lovable AI' }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      } catch (lovableError) {
        console.error("Lovable AI error, falling back to Gemini:", lovableError);
      }
    }

    // Fallback to direct Gemini API
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("No AI provider available. Please configure GEMINI_API_KEY or ensure LOVABLE_API_KEY is valid.");
    }

    console.log("Using Gemini API fallback");

    // Build content parts for Gemini
    const parts: any[] = [];
    parts.push({ text: systemPrompt + "\n\nUser: " + textMessage });
    
    if (images && images.length > 0) {
      for (const img of images) {
        if (img.url.startsWith('data:')) {
          const matches = img.url.match(/^data:(.+);base64,(.+)$/);
          if (matches) {
            parts.push({
              inlineData: {
                mimeType: matches[1],
                data: matches[2]
              }
            });
          }
        }
      }
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          }
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorText);
      
      if (geminiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "All AI services are temporarily busy. Please wait a moment and try again." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const data = await geminiResponse.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    console.log("Gemini response generated successfully");

    return new Response(
      JSON.stringify({ success: true, output: aiResponse, provider: 'Google Gemini' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in chat function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});