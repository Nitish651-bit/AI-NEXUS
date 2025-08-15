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
      const { data, error } = await supabase.functions.invoke('gemini-ai', {
        body: {
          input: input.trim(),
          toolCategory,
          toolTitle
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to connect to AI service');
      }

      const response: AIResponse = data;

      if (!response.success) {
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