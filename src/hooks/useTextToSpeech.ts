import { useState, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UseTextToSpeechOptions {
  voice?: string;
  maxChars?: number;
  preferElevenLabs?: boolean;
}

// Language detection based on Unicode character ranges and common patterns
function detectLanguage(text: string): string {
  const sample = text.slice(0, 200);

  // CJK characters
  if (/[\u4e00-\u9fff]/.test(sample)) return "zh-CN";
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(sample)) return "ja-JP";
  if (/[\uac00-\ud7af]/.test(sample)) return "ko-KR";

  // Cyrillic
  if (/[\u0400-\u04ff]/.test(sample)) return "ru-RU";

  // Arabic
  if (/[\u0600-\u06ff]/.test(sample)) return "ar-SA";

  // Devanagari (Hindi)
  if (/[\u0900-\u097f]/.test(sample)) return "hi-IN";

  // Bengali
  if (/[\u0980-\u09ff]/.test(sample)) return "bn-IN";

  // Tamil
  if (/[\u0b80-\u0bff]/.test(sample)) return "ta-IN";

  // Telugu
  if (/[\u0c00-\u0c7f]/.test(sample)) return "te-IN";

  // Thai
  if (/[\u0e00-\u0e7f]/.test(sample)) return "th-TH";

  // Hebrew
  if (/[\u0590-\u05ff]/.test(sample)) return "he-IL";

  // Greek
  if (/[\u0370-\u03ff]/.test(sample)) return "el-GR";

  // Georgian
  if (/[\u10a0-\u10ff]/.test(sample)) return "ka-GE";

  // Armenian
  if (/[\u0530-\u058f]/.test(sample)) return "hy-AM";

  // Gujarati
  if (/[\u0a80-\u0aff]/.test(sample)) return "gu-IN";

  // Kannada
  if (/[\u0c80-\u0cff]/.test(sample)) return "kn-IN";

  // Malayalam
  if (/[\u0d00-\u0d7f]/.test(sample)) return "ml-IN";

  // Punjabi (Gurmukhi)
  if (/[\u0a00-\u0a7f]/.test(sample)) return "pa-IN";

  // Myanmar
  if (/[\u1000-\u109f]/.test(sample)) return "my-MM";

  // Khmer
  if (/[\u1780-\u17ff]/.test(sample)) return "km-KH";

  // Lao
  if (/[\u0e80-\u0eff]/.test(sample)) return "lo-LA";

  // Sinhala
  if (/[\u0d80-\u0dff]/.test(sample)) return "si-LK";

  // Ethiopic (Amharic)
  if (/[\u1200-\u137f]/.test(sample)) return "am-ET";

  // Latin-based language detection using common words
  const lower = sample.toLowerCase();
  if (/\b(el|la|los|las|que|por|con|una|del|para)\b/.test(lower)) return "es-ES";
  if (/\b(le|la|les|des|une|est|dans|pour|que|pas)\b/.test(lower)) return "fr-FR";
  if (/\b(der|die|das|und|ein|ist|nicht|den|auf|mit)\b/.test(lower)) return "de-DE";
  if (/\b(il|la|di|che|non|per|una|con|sono|del)\b/.test(lower)) return "it-IT";
  if (/\b(o|a|os|as|que|de|um|uma|não|com)\b/.test(lower)) return "pt-BR";
  if (/\b(en|het|van|een|de|dat|is|niet|zijn|op)\b/.test(lower)) return "nl-NL";
  if (/\b(och|att|som|den|det|för|med|har|kan|inte)\b/.test(lower)) return "sv-SE";
  if (/\b(og|at|som|den|det|for|med|har|kan|ikke)\b/.test(lower)) return "da-DK";
  if (/\b(og|som|den|det|for|med|har|kan|ikke|til)\b/.test(lower)) return "nb-NO";
  if (/\b(ja|on|ei|se|että|oli|hän|kun|niin|ovat)\b/.test(lower)) return "fi-FI";
  if (/\b(i|jest|nie|na|to|się|co|tak|jak|ale)\b/.test(lower)) return "pl-PL";
  if (/\b(ve|bir|bu|da|de|için|ile|olan|var|çok)\b/.test(lower)) return "tr-TR";
  if (/\b(và|của|là|có|không|người|trong|cho|được|với)\b/.test(lower)) return "vi-VN";
  if (/\b(dan|yang|di|ini|itu|dengan|untuk|dari|ke|pada)\b/.test(lower)) return "id-ID";
  if (/\b(at|ang|ng|sa|na|ay|mga|ito|si|ko)\b/.test(lower)) return "fil-PH";

  return "en-US";
}

function getBestVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Exact match
  let voice = voices.find(v => v.lang === lang);
  if (voice) return voice;

  // Prefix match (e.g. "en" matches "en-US")
  const prefix = lang.split("-")[0];
  voice = voices.find(v => v.lang.startsWith(prefix));
  if (voice) return voice;

  // Default
  return voices.find(v => v.default) || voices[0];
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}) {
  const { voice = "nova", maxChars = 5000, preferElevenLabs = false } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);
  const [detectedLang, setDetectedLang] = useState<string>("en-US");
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

  // Browser Speech API - supports 100+ languages
  const speakWithBrowser = useCallback((text: string, lang: string) => {
    return new Promise<void>((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 3000));
      utterance.lang = lang;
      utterance.rate = 1;
      utterance.pitch = 1;

      const selectedVoice = getBestVoice(lang);
      if (selectedVoice) utterance.voice = selectedVoice;

      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = (e) => {
        setIsSpeaking(false);
        reject(e);
      };

      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    });
  }, []);

  // ElevenLabs TTS - premium quality (English & ~29 languages)
  const speakWithElevenLabs = useCallback(async (text: string): Promise<boolean> => {
    try {
      const ttsText = text.slice(0, maxChars).replace(/[#*`_~\[\]()>]/g, "");
      const { data, error } = await supabase.functions.invoke("openai-tts", {
        body: { text: ttsText, voice },
      });

      if (error || !data?.success || !data?.audioContent) return false;

      const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
      const audio = new Audio(audioSrc);
      audioRef.current = audio;

      return new Promise<boolean>((resolve) => {
        audio.onended = () => {
          setIsSpeaking(false);
          audioRef.current = null;
          resolve(true);
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          audioRef.current = null;
          resolve(false);
        };
        audio.play().then(() => setIsSpeaking(true)).catch(() => resolve(false));
      });
    } catch {
      return false;
    }
  }, [voice, maxChars]);

  const speak = useCallback(async (text: string, forceLang?: string) => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    if (!text) return;

    setIsLoadingTTS(true);
    const cleanText = text.replace(/[#*`_~\[\]()>]/g, "");
    const lang = forceLang || detectLanguage(cleanText);
    setDetectedLang(lang);

    try {
      // For English with ElevenLabs preference, try premium first
      const isEnglish = lang.startsWith("en");
      if (preferElevenLabs && isEnglish) {
        const success = await speakWithElevenLabs(cleanText);
        if (success) return;
      }

      // Use Browser Speech API for all languages (100+ supported)
      await speakWithBrowser(cleanText, lang);
    } catch (err) {
      console.error("TTS error:", err);
      // Final fallback - try ElevenLabs if browser failed
      if (!preferElevenLabs) {
        const success = await speakWithElevenLabs(cleanText);
        if (success) return;
      }
      toast({
        title: "Read Aloud Failed",
        description: "Could not generate speech. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTTS(false);
    }
  }, [isSpeaking, stopSpeaking, speakWithBrowser, speakWithElevenLabs, preferElevenLabs, toast]);

  return { speak, stopSpeaking, isSpeaking, isLoadingTTS, detectedLang };
}
