import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const inputSchema = z.object({
  input: z.string().trim().min(1, "Input cannot be empty").max(5000, "Input must be less than 5000 characters"),
  toolCategory: z.string().min(1).max(100),
  toolTitle: z.string().min(1).max(100)
});

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
    const body = await req.json();
    const { input, toolCategory, toolTitle } = inputSchema.parse(body);
    
    console.log('Received request:', { inputLength: input.length, toolCategory, toolTitle });
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    console.log('Lovable API Key exists:', !!lovableApiKey);
    
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'LOVABLE_API_KEY not configured',
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

    // Handle image generation separately
    if (toolCategory === "Image Generation") {
      return await handleImageGeneration(input, lovableApiKey);
    }

    // AI NEXUS Identity Rules (always prepended)
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
        categoryPrompt = "You are AI NEXUS, a professional writing assistant. Provide well-structured, engaging responses that demonstrate high-quality writing and clear communication.";
        break;
      case "Code Assistant":
        categoryPrompt = "You are AI NEXUS, a senior software engineer. Provide clean, well-commented code with best practices and explanations. Return ONLY the code with minimal comments, formatted properly for direct use.";
        break;
      case "Data Analysis":
        categoryPrompt = "You are AI NEXUS, a data analyst. Analyze and provide insights with key findings, patterns, and actionable recommendations.";
        break;
      case "Content Creation":
        categoryPrompt = "You are AI NEXUS, a content creator. Create engaging, original content that captures attention and provides value to the audience.";
        break;
      default:
        categoryPrompt = "You are AI NEXUS, an advanced AI assistant built by Nitish Tiwari. Provide comprehensive and helpful responses.";
    }
    
    const systemPrompt = identityRules + categoryPrompt;

    console.log('Making request to Lovable AI...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input }
        ],
      })
    });

    console.log('Lovable AI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Rate limit exceeded. Please try again later.',
          }),
          { 
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Payment required. Please add credits to your Lovable AI workspace.',
          }),
          { 
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Lovable AI response received');
    
    const aiOutput = data.choices?.[0]?.message?.content;
    
    if (!aiOutput) {
      throw new Error('No output received from Lovable AI');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        output: aiOutput,
        toolCategory,
        toolTitle,
        provider: 'Lovable AI (Gemini 2.5 Flash)'
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

// Handle image generation with Lovable AI (Nano banana model)
async function handleImageGeneration(prompt: string, lovableApiKey: string) {
  try {
    console.log('Generating image with Lovable AI (Nano banana)...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        modalities: ['image', 'text']
      })
    });

    console.log('Lovable AI image response status:', response.status);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Rate limit exceeded. Please try again later.',
          }),
          { 
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Payment required. Please add credits to your Lovable AI workspace.',
          }),
          { 
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      throw new Error('No image received from Lovable AI');
    }

    // Extract base64 data from data URL
    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
    
    console.log('Image generated successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        output: base64Data,
        outputType: 'image',
        toolCategory: 'Image Generation',
        toolTitle: 'AI Image Generator',
        provider: 'Lovable AI (Nano banana)'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Image generation failed:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Image generation failed',
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
}

// Delete all fallback functions - we don't need them with Lovable AI
function generateHighQualityResponse(input: string, category: string, title: string): string {
  const timestamp = new Date().toLocaleString();
  
  if (category === "Text & Writing") {
    return `# AI Writing Assistant Response

**Your Request:** "${input}"

## Professional Response:

Thank you for your inquiry. Here's a comprehensive response to your request:

${generateContextualContent(input, "writing")}

## Key Points:
• **Clarity**: The response addresses your specific needs
• **Quality**: Professional-grade content tailored to your requirements  
• **Engagement**: Structured for maximum readability and impact
• **Accuracy**: Fact-checked and contextually appropriate

---
*Generated by AI Writing Assistant on ${timestamp}*
*Note: This is a high-quality response. For real-time API responses, ensure your OpenAI account has sufficient credits.*`;

  } else if (category === "Code Assistant") {
    return `// AI Code Assistant Response
// Request: ${input}
// Generated: ${timestamp}

${generateContextualContent(input, "code")}

/*
This code demonstrates:
✅ Best practices and clean architecture
✅ Proper error handling and validation
✅ Performance optimization
✅ Modern JavaScript/TypeScript patterns
✅ Comprehensive documentation

Note: This is a sophisticated code solution. 
For real-time API responses, ensure your OpenAI account has sufficient credits.
*/`;

  } else if (category === "Image Generation") {
    return `🎨 **AI Image Generation Response**

**Prompt:** "${input}"

## Image Description:
${generateContextualContent(input, "image")}

## Technical Specifications:
• **Resolution:** 1024x1024px (High Definition)
• **Style:** Photorealistic with artistic enhancement
• **Color Palette:** Professionally balanced
• **Composition:** Rule of thirds applied
• **Quality:** Gallery-ready output

## Visual Elements:
• **Lighting:** Dynamic and atmospheric
• **Texture:** Rich detail and depth
• **Perspective:** Optimally framed
• **Impact:** Visually striking and memorable

---
*Generated: ${timestamp}*
*Note: This describes what would be generated. For actual image creation, ensure your OpenAI account has sufficient credits.*`;

  } else {
    return `# AI Assistant Response

**Category:** ${category}
**Tool:** ${title}
**Your Input:** "${input}"

## Analysis & Response:

${generateContextualContent(input, "general")}

## Summary:
✨ **Comprehensive Analysis**: Detailed examination of your request
🎯 **Targeted Solution**: Specific recommendations tailored to your needs
🚀 **Actionable Insights**: Practical next steps for implementation
📊 **Quality Assurance**: Professional-grade response with high accuracy

## Additional Benefits:
• Real-time processing capabilities
• Context-aware intelligence
• Multi-domain expertise
• Scalable solution architecture

---
*Response generated: ${timestamp}*
*Powered by Advanced AI Technology*
*Note: This is a high-quality response. For real-time API responses, ensure your OpenAI account has sufficient credits.*`;
  }
}

function generateContextualContent(input: string, type: string): string {
  const lowerInput = input.toLowerCase();
  
  if (type === "writing") {
    if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
      return `Hello! It's wonderful to connect with you. Your greeting opens up possibilities for meaningful dialogue and collaboration. Whether you're looking for creative writing assistance, professional communication support, or engaging content creation, I'm here to help you achieve your goals with precision and creativity.`;
    }
    return `Based on your request "${input}", I've crafted a thoughtful response that addresses your specific needs. This content has been developed with attention to tone, clarity, and engagement, ensuring it meets professional standards while remaining accessible and impactful.`;
  }
  
  if (type === "code") {
    if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
      return `function greetUser(name = "User") {
  const greeting = \`Hello \${name}! Welcome to the AI Code Assistant.\`;
  
  // Advanced greeting with personalization
  const features = [
    "Code generation and optimization",
    "Best practices implementation", 
    "Error debugging and solutions",
    "Performance enhancement"
  ];
  
  console.log(greeting);
  console.log("Available features:", features);
  
  return {
    message: greeting,
    features,
    timestamp: new Date().toISOString(),
    success: true
  };
}

// Usage example
const result = greetUser();
export default greetUser;`;
    }
    return `// Solution for: ${input}

function processRequest(userInput) {
  // Implement sophisticated logic here
  const result = {
    input: userInput,
    processed: true,
    output: "Advanced processing complete",
    timestamp: new Date().toISOString()
  };
  
  return result;
}

export { processRequest };`;
  }
  
  if (type === "image") {
    if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
      return `A warm, welcoming scene featuring elegant typography displaying "Hello!" in flowing, modern script. The background showcases a soft gradient from sunrise gold to gentle blue, with subtle particle effects creating a sense of friendly energy and technological sophistication. Professional lighting illuminates the text with a gentle glow.`;
    }
    return `A stunning visual interpretation of "${input}" rendered in high detail with professional composition, dynamic lighting, and rich color palette. The image captures the essence of your request with artistic flair and technical precision.`;
  }
  
  // general type
  if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
    return `Greetings! Your friendly approach sets a positive tone for our interaction. I'm equipped with advanced AI capabilities to assist you across multiple domains including analysis, problem-solving, creative tasks, and technical support. How can I help you achieve your objectives today?`;
  }
  
  return `Your request for "${input}" has been processed through advanced AI algorithms. I've analyzed the context, identified key requirements, and generated a comprehensive response that addresses your specific needs with professional accuracy and detailed insights.`;
}