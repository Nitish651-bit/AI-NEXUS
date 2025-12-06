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

interface ImageInput {
  url: string;
  mimeType?: string;
}

export function useGeminiAI({ toolCategory, toolTitle }: UseGeminiAIProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const generateContent = async (
    input: string, 
    images?: ImageInput[],
    enableWebSearch?: boolean
  ): Promise<string> => {
    if (!input.trim() && (!images || images.length === 0)) {
      throw new Error('Input cannot be empty');
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('lovable-ai-chat', {
        body: {
          message: input.trim() || undefined,
          toolCategory,
          toolTitle,
          images: images && images.length > 0 ? images : undefined,
          enableWebSearch
        }
      });

      if (import.meta.env.DEV) {
        console.log('Supabase response:', { data, error });
      }

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
