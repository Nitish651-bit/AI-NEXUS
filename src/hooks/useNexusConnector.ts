import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type RequestType = 'chat' | 'image' | 'tts' | 'stt' | 'tool' | 'workflow';

interface NexusResponse<T = unknown> {
  success: boolean;
  source: 'nexus-local' | 'cloud-lovable' | 'cloud-gemini' | 'cloud-openai' | 'none';
  output?: T;
  error?: string;
  fallbackHint?: string;
}

interface ChatRequest {
  type: 'chat';
  message: string;
  context?: string;
  images?: { url: string; mimeType?: string }[];
  enableWebSearch?: boolean;
}

interface ImageRequest {
  type: 'image';
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
}

interface TTSRequest {
  type: 'tts';
  text: string;
  voice?: string;
  speed?: number;
}

interface STTRequest {
  type: 'stt';
  audio: string; // base64
  language?: string;
}

interface ToolRequest {
  type: 'tool';
  toolName: string;
  parameters?: Record<string, unknown>;
}

interface WorkflowStep {
  id: string;
  toolName: string;
  parameters?: Record<string, unknown>;
}

interface WorkflowRequest {
  type: 'workflow';
  workflowName: string;
  steps: WorkflowStep[];
}

type NexusRequest = ChatRequest | ImageRequest | TTSRequest | STTRequest | ToolRequest | WorkflowRequest;

interface UseNexusConnectorOptions {
  customServerUrl?: string;
  onSourceChange?: (source: NexusResponse['source']) => void;
}

export function useNexusConnector(options: UseNexusConnectorOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSource, setLastSource] = useState<NexusResponse['source'] | null>(null);
  const { toast } = useToast();

  const sendRequest = useCallback(async <T = unknown>(
    request: NexusRequest
  ): Promise<NexusResponse<T>> => {
    setIsProcessing(true);

    try {
      const headers: Record<string, string> = {};
      if (options.customServerUrl) {
        headers['x-nexus-server'] = options.customServerUrl;
      }

      const { data, error } = await supabase.functions.invoke('nexus-backend-connector', {
        body: request,
        headers
      });

      if (error) {
        console.error('Nexus connector error:', error);
        throw new Error(error.message || 'Failed to connect to AI service');
      }

      const response = data as NexusResponse<T>;
      
      // Track source
      setLastSource(response.source);
      options.onSourceChange?.(response.source);

      // Show toast for fallback scenarios
      if (response.source === 'cloud-lovable' || response.source === 'cloud-gemini' || response.source === 'cloud-openai') {
        toast({
          title: "Using Cloud Fallback",
          description: `Local Nexus server unavailable. Using ${response.source.replace('cloud-', '')} API.`,
          duration: 3000
        });
      }

      if (!response.success) {
        // Handle browser fallback hint for TTS
        if (response.fallbackHint === 'browser-speech-synthesis') {
          toast({
            title: "Using Browser TTS",
            description: "Cloud TTS unavailable. Using browser speech synthesis as fallback.",
            duration: 3000
          });
        }
        throw new Error(response.error || 'Request failed');
      }

      return response;

    } catch (error) {
      console.error('Nexus request error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: "AI Request Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [options, toast]);

  // Convenience methods
  const chat = useCallback((message: string, options?: Omit<ChatRequest, 'type' | 'message'>) => {
    return sendRequest<string>({ type: 'chat', message, ...options });
  }, [sendRequest]);

  const generateImage = useCallback((prompt: string, options?: Omit<ImageRequest, 'type' | 'prompt'>) => {
    return sendRequest<{ imageUrl: string }>({ type: 'image', prompt, ...options });
  }, [sendRequest]);

  const textToSpeech = useCallback((text: string, options?: Omit<TTSRequest, 'type' | 'text'>) => {
    return sendRequest<{ audioData: string; format: string }>({ type: 'tts', text, ...options });
  }, [sendRequest]);

  const speechToText = useCallback((audio: string, language?: string) => {
    return sendRequest<string>({ type: 'stt', audio, language });
  }, [sendRequest]);

  const executeTool = useCallback((toolName: string, parameters?: Record<string, unknown>) => {
    return sendRequest({ type: 'tool', toolName, parameters });
  }, [sendRequest]);

  const runWorkflow = useCallback((workflowName: string, steps: WorkflowStep[]) => {
    return sendRequest({ type: 'workflow', workflowName, steps });
  }, [sendRequest]);

  return {
    sendRequest,
    chat,
    generateImage,
    textToSpeech,
    speechToText,
    executeTool,
    runWorkflow,
    isProcessing,
    lastSource
  };
}
