import { useState, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UseTextToSpeechOptions {
  voice?: string;
  maxChars?: number;
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}) {
  const { voice = "nova", maxChars = 5000 } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    // If already speaking, stop
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    if (!text) return;

    setIsLoadingTTS(true);
    try {
      const ttsText = text.slice(0, maxChars).replace(/[#*`_~\[\]()>]/g, "");

      const { data, error } = await supabase.functions.invoke("openai-tts", {
        body: { text: ttsText, voice },
      });

      if (error) throw error;
      if (!data?.success || !data?.audioContent) {
        throw new Error(data?.error || "TTS failed");
      }

      const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
      const audio = new Audio(audioSrc);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        audioRef.current = null;
        toast({ title: "Audio playback failed", variant: "destructive" });
      };

      await audio.play();
      setIsSpeaking(true);
    } catch (error) {
      console.error("TTS error:", error);
      // Fallback to browser Speech Synthesis
      try {
        const utterance = new SpeechSynthesisUtterance(text.slice(0, 500));
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      } catch {
        toast({
          title: "Read Aloud Failed",
          description: error instanceof Error ? error.message : "Could not generate speech",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoadingTTS(false);
    }
  }, [isSpeaking, stopSpeaking, voice, maxChars, toast]);

  return { speak, stopSpeaking, isSpeaking, isLoadingTTS };
}
