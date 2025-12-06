import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

// Validate API key for external automation tools
function validateApiKey(req: Request): boolean {
  const apiKey = req.headers.get("x-api-key");
  const WORKFLOW_API_KEY = Deno.env.get("WORKFLOW_API_KEY");
  
  // If WORKFLOW_API_KEY is set, require it for non-authenticated requests
  if (WORKFLOW_API_KEY && apiKey) {
    return apiKey === WORKFLOW_API_KEY;
  }
  
  // Check for Supabase auth header (JWT from frontend)
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return true; // Let Supabase handle JWT validation
  }
  
  return false;
}

const imageSchema = z.object({
  url: z.string(),
  mimeType: z.string().optional()
});

const inputSchema = z.object({
  context: z.string().trim().min(1, "Context cannot be empty").max(5000, "Context must be less than 5000 characters"),
  tone: z.enum(["Professional", "Casual", "Formal", "Friendly"]).optional(),
  purpose: z.enum(["Response", "Request", "Follow-up", "Introduction", "Thank You"]).optional(),
  images: z.array(imageSchema).max(5).optional(),
  enableWebSearch: z.boolean().optional()
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate authentication
  if (!validateApiKey(req)) {
    console.error("Unauthorized request - missing or invalid API key/JWT");
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized - valid API key or authentication required" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { context, tone, purpose, images, enableWebSearch } = inputSchema.parse(body);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating email response:", { 
      contextLength: context.length, 
      tone, 
      purpose,
      imageCount: images?.length || 0,
      enableWebSearch 
    });

    const systemPrompt = `You are a professional email writer with access to real-time information. Generate clear, professional, and effective email responses.
Tone: ${tone || 'Professional'}
Purpose: ${purpose || 'Response'}

Create email responses that:
- Are clear and concise
- Use appropriate professional language
- Have a proper structure (greeting, body, closing)
- Match the specified tone
- Address the context effectively
${enableWebSearch ? '- Include relevant real-time information when appropriate' : ''}
${images?.length ? '- Reference any relevant details from the attached images' : ''}`;

    // Build user content - can be text only or multimodal with images
    let userContent: any;
    if (images && images.length > 0) {
      userContent = [
        { type: "text", text: `Generate an email response for: ${context}` }
      ];
      for (const img of images) {
        userContent.push({
          type: "image_url",
          image_url: { url: img.url }
        });
      }
    } else {
      userContent = `Generate an email response for: ${context}`;
    }

    const requestBody: any = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
    };

    // Enable web search via tools if requested
    if (enableWebSearch) {
      requestBody.tools = [{ type: "web_search_preview" }];
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
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

    console.log("Email response generated successfully");

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
