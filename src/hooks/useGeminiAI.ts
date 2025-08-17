import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UseGeminiAIProps {
  toolCategory: string;
  toolTitle: string;
}

interface AIResponse {
  success: boolean;
  output?: string;
  error?: string;
}

export function useGeminiAI({ toolCategory, toolTitle }: UseGeminiAIProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const generateContent = async (input: string): Promise<string> => {
    if (!input.trim()) {
      throw new Error('Input cannot be empty');
    }

    setIsProcessing(true);

    try {
      // Use real Gemini AI via Supabase edge function
      const { data, error } = await supabase.functions.invoke('gemini-ai', {
        body: {
          input: input.trim(),
          toolCategory,
          toolTitle
        }
      });

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to connect to AI service');
      }

      const response: AIResponse = data;

      if (!response.success) {
        console.error('AI service returned error:', response.error);
        throw new Error(response.error || 'AI processing failed');
      }

      if (!response.output) {
        throw new Error('No output received from AI');
      }

      return response.output;

    } catch (error) {
      console.error('Gemini AI Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "AI Processing Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    generateContent,
    isProcessing
  };
}

// Mock response generator for when Supabase is not connected
function generateMockResponse(input: string, category: string, title: string): string {
  if (category === "Text & Writing") {
    return `Here's an AI-generated response to "${input}":\n\nThis is a sophisticated analysis using advanced language models. The content demonstrates the power of modern AI in understanding context, generating coherent responses, and maintaining consistency throughout the output.\n\nKey insights:\n• Advanced natural language processing\n• Context-aware generation\n• High-quality, human-like text output\n\n⚠️ Note: Connect to Supabase to use real Gemini AI instead of this mock response.`;
  } else if (category === "Code Assistant") {
    return `// AI-generated code for: ${input}\n\nfunction aiGeneratedSolution() {\n  // This code demonstrates AI-powered programming assistance\n  const result = processInput("${input}");\n  \n  return {\n    success: true,\n    data: result,\n    timestamp: new Date().toISOString()\n  };\n}\n\n// Additional optimizations and best practices applied\nexport default aiGeneratedSolution;\n\n/* ⚠️ Note: Connect to Supabase to use real Gemini AI */`;
  } else if (category === "Image Generation") {
    return `🎨 Image Generation Complete!\n\nPrompt: "${input}"\n\n✅ High-resolution image created\n📏 Dimensions: 1024x1024px\n🎯 Style: Photorealistic\n⚡ Processing time: 1.8 seconds\n\n[In a real implementation, the generated image would appear here]\n\nImage features:\n• Professional quality\n• Optimized compression\n• Ready for download\n\n⚠️ Note: Connect to Supabase to use real Gemini AI for actual image generation.`;
  } else {
    return `AI Analysis Result for "${input}":\n\n✨ Processing completed using ${title}\n\nResults:\n• Data processed successfully\n• Advanced algorithms applied\n• Insights generated\n• Quality score: 4.5/5.0\n\nThis demonstrates the power of AI in the ${category} category.\n\n⚠️ Note: Connect to Supabase to use real Gemini AI instead of this mock response.`;
  }
}