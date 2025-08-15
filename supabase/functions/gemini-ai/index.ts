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
    
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('Gemini API key not found');
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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    const aiOutput = data.candidates[0].content.parts[0].text;

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
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An error occurred while processing your request' 
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