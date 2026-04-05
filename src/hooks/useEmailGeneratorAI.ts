import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getSupabaseFunctionErrorMessage } from '@/lib/supabase-function-error';

interface ImageInput {
  url: string;
  mimeType?: string;
}

interface UseEmailGeneratorAIProps {
  tone?: string;
  purpose?: string;
}

interface AIResponse {
  success: boolean;
  output?: string;
  error?: string;
}

export function useEmailGeneratorAI({ tone, purpose }: UseEmailGeneratorAIProps = {}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const generateEmail = async (
    context: string,
    images?: ImageInput[],
    enableWebSearch?: boolean
  ): Promise<string> => {
    if (!context.trim() && (!images || images.length === 0)) {
      throw new Error('Context or images must be provided');
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('email-generator', {
        body: {
          context: context.trim() || 'Generate an email based on the attached images',
          tone: tone || 'Professional',
          purpose: purpose || 'Response',
          images,
          enableWebSearch
        }
      });

      if (import.meta.env.DEV) {
        console.log('Supabase response:', { data, error });
      }

      if (error) {
        console.error('Supabase function error:', error);
        const errorMessage = await getSupabaseFunctionErrorMessage(error, 'Failed to connect to AI service');
        throw new Error(errorMessage);
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
      console.error('Email Generator AI Error:', error);
      
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
    generateEmail,
    isProcessing
  };
}
