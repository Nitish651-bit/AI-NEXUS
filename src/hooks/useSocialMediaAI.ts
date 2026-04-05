import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getSupabaseFunctionErrorMessage } from '@/lib/supabase-function-error';

interface ImageInput {
  url: string;
  mimeType?: string;
}

interface UseSocialMediaAIProps {
  platform?: string;
  tone?: string;
}

interface AIResponse {
  success: boolean;
  output?: string;
  error?: string;
}

export function useSocialMediaAI({ platform, tone }: UseSocialMediaAIProps = {}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const generateContent = async (
    topic: string, 
    images?: ImageInput[],
    enableWebSearch?: boolean
  ): Promise<string> => {
    if (!topic.trim() && (!images || images.length === 0)) {
      throw new Error('Topic or images must be provided');
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('social-media-automation', {
        body: {
          topic: topic.trim() || 'Analyze the attached images and create social media posts',
          platform: platform || 'Twitter',
          tone: tone || 'Professional',
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
      console.error('Social Media AI Error:', error);
      
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
