import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { supabase } from "@/integrations/supabase/client";
import { aiTools } from "@/data/aiToolsData";

export type VoiceStatus = "idle" | "listening" | "processing" | "speaking" | "wake-listening";

interface VoiceMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface UseVoiceAssistantOptions {
  onNavigate?: (path: string) => void;
  onOpenTool?: (toolName: string) => void;
  onSearchTools?: (query: string) => void;
  wakeWord?: string;
  alwaysListening?: boolean;
}

export function useVoiceAssistant(options: UseVoiceAssistantOptions = {}) {
  const {
    onNavigate,
    onOpenTool,
    onSearchTools,
    wakeWord = "hey nexus",
    alwaysListening = false,
  } = options;

  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [transcript, setTranscript] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const isSpeechSupported = typeof window !== "undefined" && 
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Audio level monitoring
  const startAudioMonitoring = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(avg / 255);
        animationFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  }, []);

  const stopAudioMonitoring = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    analyserRef.current = null;
    audioContextRef.current = null;
    streamRef.current = null;
    setAudioLevel(0);
  }, []);

  // Process voice commands
  const processCommand = useCallback((text: string): { type: "navigate" | "tool" | "search" | "chat"; value: string } => {
    const lower = text.toLowerCase().trim();

    // Navigation commands
    if (lower.includes("go to") || lower.includes("open") || lower.includes("navigate to")) {
      if (lower.includes("video") || lower.includes("video suite")) return { type: "navigate", value: "/video-suite" };
      if (lower.includes("integration")) return { type: "navigate", value: "/integrations" };
      if (lower.includes("automation")) return { type: "navigate", value: "automation" };
      if (lower.includes("home") || lower.includes("dashboard")) return { type: "navigate", value: "/" };
      if (lower.includes("tools")) return { type: "navigate", value: "tools" };
    }

    // Tool opening
    if (lower.startsWith("use ") || lower.startsWith("launch ") || lower.startsWith("start ")) {
      const toolName = lower.replace(/^(use |launch |start )/, "").trim();
      return { type: "tool", value: toolName };
    }

    // Search
    if (lower.startsWith("search ") || lower.startsWith("find ") || lower.startsWith("look for ")) {
      const query = lower.replace(/^(search |find |look for )/, "").trim();
      return { type: "search", value: query };
    }

    // Default: chat with AI
    return { type: "chat", value: text };
  }, []);

  // Speak response using multilingual TTS (100+ languages)
  const speakResponse = useCallback(async (text: string) => {
    setStatus("speaking");
    try {
      const cleanText = text.slice(0, 3000).replace(/[#*`_~\[\]()>]/g, "");
      
      // Use Browser Speech API for multilingual support
      const utterance = new SpeechSynthesisUtterance(cleanText);
      // Auto-detect language from user's browser or content
      const userLang = navigator.language || "en-US";
      utterance.lang = userLang;
      utterance.rate = 1;
      utterance.pitch = 1;

      // Select best voice for language
      const voices = speechSynthesis.getVoices();
      const bestVoice = voices.find(v => v.lang === userLang) 
        || voices.find(v => v.lang.startsWith(userLang.split("-")[0]))
        || voices.find(v => v.default) || voices[0];
      if (bestVoice) utterance.voice = bestVoice;

      utterance.onend = () => {
        setStatus(isActive ? "wake-listening" : "idle");
        if (isActive) startListening(true);
      };
      utterance.onerror = () => setStatus(isActive ? "wake-listening" : "idle");
      
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    } catch {
      setStatus(isActive ? "wake-listening" : "idle");
    }
  }, [isActive]);

  // Send to AI Orchestrator and get response
  const sendToAI = useCallback(async (userMessage: string) => {
    setStatus("processing");

    const userMsg: VoiceMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      // Use the Nexus Orchestrator for intelligent multi-step processing
      const toolNames = aiTools.map(t => t.title);
      const { data, error } = await supabase.functions.invoke("nexus-orchestrator", {
        body: {
          command: userMessage,
          availableTools: toolNames,
          context: { currentPage: window.location.pathname },
        },
      });

      if (error) throw error;
      
      const responseText = data?.result || "I'm sorry, I couldn't process that request.";
      
      // Handle navigation if orchestrator suggests it
      if (data?.orchestration?.navigation_target && onNavigate) {
        onNavigate(data.orchestration.navigation_target);
      }

      const assistantMsg: VoiceMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      await speakResponse(responseText);
    } catch (err) {
      console.error("AI Error:", err);
      // Fallback to direct chat
      try {
        const { data } = await supabase.functions.invoke("lovable-ai-chat", {
          body: {
            message: userMessage,
            toolCategory: "Voice Assistant",
            toolTitle: "AI NEXUS Voice Assistant",
            enableWebSearch: true,
          },
        });
        const fallbackText = data?.output || "I encountered an error. Please try again.";
        const assistantMsg: VoiceMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: fallbackText,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMsg]);
        await speakResponse(fallbackText);
      } catch {
        const errorMsg: VoiceMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I encountered an error. Please try again.",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
        setStatus(isActive ? "wake-listening" : "idle");
      }
    }
  }, [speakResponse, isActive, onNavigate]);

  // Handle recognized speech
  const handleSpeechResult = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Check for wake word in wake-listening mode
    if (status === "wake-listening") {
      if (text.toLowerCase().includes(wakeWord)) {
        const command = text.toLowerCase().replace(wakeWord, "").trim();
        if (command) {
          setTranscript(command);
          await handleCommand(command);
        } else {
          // Just the wake word — start active listening
          setStatus("listening");
          const ackMsg: VoiceMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Yes? I'm listening...",
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, ackMsg]);
          await speakResponse("Yes? I'm listening.");
        }
        return;
      }
      return; // Ignore non-wake-word speech
    }

    setTranscript(text);
    await handleCommand(text);
  }, [status, wakeWord, speakResponse]);

  const handleCommand = useCallback(async (text: string) => {
    const command = processCommand(text);

    switch (command.type) {
      case "navigate":
        onNavigate?.(command.value);
        const navMsg: VoiceMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Navigating to ${command.value === "/" ? "home" : command.value.replace("/", "")}...`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: text, timestamp: new Date() }, navMsg]);
        await speakResponse(`Navigating to ${command.value === "/" ? "home" : command.value.replace(/[/-]/g, " ")}`);
        break;

      case "tool":
        onOpenTool?.(command.value);
        const toolMsg: VoiceMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Opening ${command.value}...`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: text, timestamp: new Date() }, toolMsg]);
        await speakResponse(`Opening ${command.value}`);
        break;

      case "search":
        onSearchTools?.(command.value);
        const searchMsg: VoiceMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Searching for ${command.value}...`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: text, timestamp: new Date() }, searchMsg]);
        await speakResponse(`Searching for ${command.value}`);
        break;

      case "chat":
        await sendToAI(text);
        break;
    }
  }, [processCommand, onNavigate, onOpenTool, onSearchTools, sendToAI, speakResponse]);

  // Start speech recognition
  const startListening = useCallback((continuous = false) => {
    if (!isSpeechSupported) {
      toast({ title: "Speech not supported", description: "Your browser doesn't support speech recognition.", variant: "destructive" });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    // Support multilingual speech recognition
    const userLang = navigator.language || "en-US";
    recognition.lang = userLang;

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (interimTranscript) setTranscript(interimTranscript);
      if (finalTranscript) handleSpeechResult(finalTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech" && event.error !== "aborted") {
        toast({ title: "Voice Error", description: `Speech recognition error: ${event.error}`, variant: "destructive" });
      }
    };

    recognition.onend = () => {
      // Restart if still active
      if (isActive && recognitionRef.current) {
        try {
          recognition.start();
        } catch {
          // Already started
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      // Already started
    }
  }, [isSpeechSupported, handleSpeechResult, isActive, toast]);

  // Stop speech recognition
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    speechSynthesis.cancel();
  }, []);

  // Activate AI NEXUS
  const activate = useCallback(async () => {
    setIsActive(true);
    setStatus("wake-listening");
    await startAudioMonitoring();
    startListening(true);
    
    const welcomeMsg: VoiceMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "AI NEXUS online. Say \"Hey Nexus\" to give me a command, or speak freely after activation.",
      timestamp: new Date(),
    };
    setMessages([welcomeMsg]);
    await speakResponse("AI NEXUS online. Say Hey Nexus to give me a command.");
  }, [startAudioMonitoring, startListening, speakResponse]);

  // Deactivate AI NEXUS
  const deactivate = useCallback(() => {
    setIsActive(false);
    setStatus("idle");
    stopListening();
    stopAudioMonitoring();
    setTranscript("");
  }, [stopListening, stopAudioMonitoring]);

  // Manual push-to-talk
  const pushToTalk = useCallback(() => {
    if (status === "speaking") {
      if (audioRef.current) audioRef.current.pause();
      speechSynthesis.cancel();
    }
    setStatus("listening");
    startListening(false);
  }, [status, startListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      stopAudioMonitoring();
    };
  }, [stopListening, stopAudioMonitoring]);

  return {
    status,
    messages,
    transcript,
    isActive,
    audioLevel,
    isSpeechSupported,
    activate,
    deactivate,
    pushToTalk,
    setMessages,
  };
}
