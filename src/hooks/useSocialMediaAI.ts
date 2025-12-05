import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

  const generateContent = async (topic: string): Promise<string> => {
    if (!topic.trim()) {
      throw new Error('Topic cannot be empty');
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('social-media-automation', {
        body: {
          topic: topic.trim(),
          platform: platform || 'Twitter',
          tone: tone || 'Professional'
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
