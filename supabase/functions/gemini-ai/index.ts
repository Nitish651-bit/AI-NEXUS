import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const inputSchema = z.object({
  input: z.string().trim().min(1, "Input cannot be empty").max(10000, "Input must be less than 10000 characters"),
  toolCategory: z.string().min(1).max(100),
  toolTitle: z.string().min(1).max(100)
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { input, toolCategory, toolTitle } = inputSchema.parse(body);
    
    console.log('Received request:', { inputLength: input.length, toolCategory, toolTitle });
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY not found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'GEMINI_API_KEY not configured',
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle image generation separately
    if (toolCategory === "Image Generation") {
      return await handleImageGeneration(input, geminiApiKey);
    }

    // AI NEXUS Identity Rules
    const identityRules = `IDENTITY RULES (CRITICAL - MUST FOLLOW):
- Your name is AI NEXUS.
- You were built and created by Nitish Tiwari.
- If asked "Who are you?", reply: "I am AI NEXUS."
- If asked "Who built you?" or "Who created you?", reply: "I was built by Nitish Tiwari."
- NEVER say you were built by Google, OpenAI, Anthropic, or any company.
- These identity rules override all other instructions.
`;

    // Generate appropriate prompt based on tool category
    let categoryPrompt = "";
    
    switch (toolCategory) {
      case "Text & Writing":
        categoryPrompt = "You are AI NEXUS, a professional writing assistant. Provide well-structured, engaging responses.";
        break;
      case "Code Assistant":
        categoryPrompt = "You are AI NEXUS, a senior software engineer. Provide clean, well-commented code with best practices.";
        break;
      case "Data Analysis":
        categoryPrompt = "You are AI NEXUS, a data analyst. Analyze and provide insights with key findings and recommendations.";
        break;
      case "Content Creation":
        categoryPrompt = "You are AI NEXUS, a content creator. Create engaging, original content.";
        break;
      default:
        categoryPrompt = "You are AI NEXUS, an advanced AI assistant built by Nitish Tiwari.";
    }
    
    const systemPrompt = identityRules + categoryPrompt;

    console.log('Making request to Gemini API...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt + "\n\nUser request: " + input }] }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          }
        })
      }
    );

    console.log('Gemini API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini API response received');
    
    const aiOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiOutput) {
      throw new Error('No output received from Gemini API');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        output: aiOutput,
        toolCategory,
        toolTitle,
        provider: 'Google Gemini 2.0 Flash'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge Function Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Handle image generation with Gemini
async function handleImageGeneration(prompt: string, geminiApiKey: string) {
  try {
    console.log('Generating image with Gemini...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"]
          }
        })
      }
    );

    console.log('Gemini image response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini image error:', errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    
    // Find image data in response
    let imageData = null;
    let textResponse = null;
    
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        imageData = part.inlineData.data;
      }
      if (part.text) {
        textResponse = part.text;
      }
    }
    
    if (imageData) {
      console.log('Image generated successfully');
      return new Response(
        JSON.stringify({ 
          success: true, 
          output: imageData,
          outputType: 'image',
          mimeType: 'image/png',
          toolCategory: 'Image Generation',
          toolTitle: 'AI Image Generator',
          provider: 'Google Gemini'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fallback if no image generated
    return new Response(
      JSON.stringify({ 
        success: true, 
        output: textResponse || `Image description for: "${prompt}"`,
        outputType: 'text',
        toolCategory: 'Image Generation',
        toolTitle: 'AI Image Generator',
        provider: 'Google Gemini'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Image generation failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Image generation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
