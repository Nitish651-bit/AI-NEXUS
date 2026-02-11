import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseTextToSpeechOptions {
  maxChars?: number;
}

function detectLanguage(text: string): string {
  const sample = text.slice(0, 200);
  if (/[\u4e00-\u9fff]/.test(sample)) return "zh-CN";
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(sample)) return "ja-JP";
  if (/[\uac00-\ud7af]/.test(sample)) return "ko-KR";
  if (/[\u0400-\u04ff]/.test(sample)) return "ru-RU";
  if (/[\u0600-\u06ff]/.test(sample)) return "ar-SA";
  if (/[\u0900-\u097f]/.test(sample)) return "hi-IN";
  if (/[\u0980-\u09ff]/.test(sample)) return "bn-IN";
  if (/[\u0b80-\u0bff]/.test(sample)) return "ta-IN";
  if (/[\u0c00-\u0c7f]/.test(sample)) return "te-IN";
  if (/[\u0e00-\u0e7f]/.test(sample)) return "th-TH";
  if (/[\u0590-\u05ff]/.test(sample)) return "he-IL";
  if (/[\u0370-\u03ff]/.test(sample)) return "el-GR";
  const lower = sample.toLowerCase();
  if (/\b(el|la|los|las|que|por|con|una|del|para)\b/.test(lower)) return "es-ES";
  if (/\b(le|la|les|des|une|est|dans|pour|que|pas)\b/.test(lower)) return "fr-FR";
  if (/\b(der|die|das|und|ein|ist|nicht|den|auf|mit)\b/.test(lower)) return "de-DE";
  if (/\b(il|la|di|che|non|per|una|con|sono|del)\b/.test(lower)) return "it-IT";
  if (/\b(o|a|os|as|que|de|um|uma|não|com)\b/.test(lower)) return "pt-BR";
  return "en-US";
}

function getBestVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;
  let voice = voices.find(v => v.lang === lang);
  if (voice) return voice;
  const prefix = lang.split("-")[0];
  voice = voices.find(v => v.lang.startsWith(prefix));
  if (voice) return voice;
  return voices.find(v => v.default) || voices[0];
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}) {
  const { maxChars = 5000 } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);
  const [detectedLang, setDetectedLang] = useState<string>("en-US");
  const { toast } = useToast();

  const stopSpeaking = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string, forceLang?: string) => {
    if (isSpeaking) { stopSpeaking(); return; }
    if (!text) return;

    setIsLoadingTTS(true);
    const cleanText = text.replace(/[#*`_~\[\]()>]/g, "").slice(0, maxChars);
    const lang = forceLang || detectLanguage(cleanText);
    setDetectedLang(lang);

    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = lang;
      utterance.rate = 1;
      utterance.pitch = 1;
      const selectedVoice = getBestVoice(lang);
      if (selectedVoice) utterance.voice = selectedVoice;

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => {
        setIsSpeaking(false);
        toast({ title: "Read Aloud Failed", description: "Could not generate speech.", variant: "destructive" });
      };

      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    } catch {
      toast({ title: "Read Aloud Failed", description: "Could not generate speech.", variant: "destructive" });
    } finally {
      setIsLoadingTTS(false);
    }
  }, [isSpeaking, stopSpeaking, maxChars, toast]);

  return { speak, stopSpeaking, isSpeaking, isLoadingTTS, detectedLang };
}
