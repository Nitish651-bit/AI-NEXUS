import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const inputSchema = z.object({
  userRequest: z.string().trim().min(1, "User request cannot be empty").max(1000, "Request must be less than 1000 characters"),
  availableTools: z.array(z.string()).min(1, "At least one tool must be available").max(100, "Too many tools")
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { userRequest, availableTools } = inputSchema.parse(body);
    
    console.log('AI Tool Router - Analyzing request, length:', userRequest.length);
    console.log('Available tools count:', availableTools.length);

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const systemPrompt = `You are an AI tool recommendation engine. Analyze the user's request and recommend the most suitable AI tools from the available list. 

Return ONLY a valid JSON object with this exact structure:
{
  "recommendedTools": ["tool1", "tool2"],
  "reasoning": "brief explanation",
  "estimatedCost": "low|medium|high",
  "complexity": "simple|moderate|complex"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nUser request: "${userRequest}"\n\nAvailable tools: ${availableTools.join(', ')}\n\nRecommend the best tools for this task.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Rate limit exceeded. Please try again later.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    console.log('AI Router analysis:', aiResponse);

    // Parse AI response
    let recommendation;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendation = JSON.parse(jsonMatch[0]);
      } else {
        recommendation = {
          recommendedTools: availableTools.slice(0, 3),
          reasoning: aiResponse,
          estimatedCost: 'medium',
          complexity: 'moderate'
        };
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      recommendation = {
        recommendedTools: availableTools.slice(0, 3),
        reasoning: aiResponse,
        estimatedCost: 'medium',
        complexity: 'moderate'
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        recommendation,
        userRequest,
        provider: 'Google Gemini'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI Tool Router Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
