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

interface RouterRequest {
  userRequest: string;
  availableTools: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { userRequest, availableTools } = inputSchema.parse(body);
    
    console.log('AI Tool Router - Analyzing request, length:', userRequest.length);
    console.log('Available tools count:', availableTools.length);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Use Lovable AI (Gemini) to analyze and recommend tools
    const systemPrompt = `You are an AI tool recommendation engine. Analyze the user's request and recommend the most suitable AI tools from the available list. Return a JSON response with:
- recommendedTools: array of tool names that best match the request
- reasoning: brief explanation of why these tools were selected
- estimatedCost: rough cost estimate (low/medium/high)
- complexity: task complexity (simple/moderate/complex)`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `User request: "${userRequest}"\n\nAvailable tools: ${availableTools.join(', ')}\n\nRecommend the best tools for this task.` 
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI Router analysis:', aiResponse);

    // Parse AI response
    let recommendation;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendation = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback if AI doesn't return JSON
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
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('AI Tool Router Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
