import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIRequest {
  input: string;
  toolCategory: string;
  toolTitle: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { input, toolCategory, toolTitle }: AIRequest = await req.json();
    
    console.log('Received request:', { input, toolCategory, toolTitle });
    
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('OpenAI API Key exists:', !!apiKey);
    
    if (!apiKey) {
      console.error('OPENAI_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your Supabase project secrets.',
          debug: 'No API key found in environment'
        }),
        { 
          status: 400,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Generate appropriate prompt based on tool category
    let prompt = "";
    
    switch (toolCategory) {
      case "Text & Writing":
        prompt = `As a professional writing assistant, please help with the following request: ${input}. Provide a well-structured, engaging response that demonstrates high-quality writing and clear communication.`;
        break;
      case "Code Assistant":
        prompt = `As a senior software engineer, please help with this coding request: ${input}. Provide clean, well-commented code with best practices and explanations.`;
        break;
      case "Image Generation":
        prompt = `Describe a detailed image based on this prompt: ${input}. Provide a comprehensive description of what the image would contain, including composition, style, colors, and mood.`;
        break;
      case "Data Analysis":
        prompt = `As a data analyst, please analyze and provide insights for: ${input}. Include key findings, patterns, and actionable recommendations.`;
        break;
      case "Content Creation":
        prompt = `As a content creator, help with: ${input}. Create engaging, original content that captures attention and provides value to the audience.`;
        break;
      default:
        prompt = `Using the ${toolTitle} AI tool, please help with: ${input}. Provide a comprehensive and helpful response.`;
    }

    console.log('Making request to OpenAI API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant that provides high-quality responses based on user prompts.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2048,
        temperature: 0.7
      })
    });

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}. Response: ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI API response received:', !!data);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI API response structure:', JSON.stringify(data));
      throw new Error('Invalid response from OpenAI API - no content generated');
    }

    const aiOutput = data.choices[0].message.content;
    console.log('AI output generated successfully, length:', aiOutput?.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        output: aiOutput,
        toolCategory,
        toolTitle 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Edge Function Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred while processing your request',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});