import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
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
}

/**
 * Production-ready voice assistant hook using Web Speech API.
 * Uses refs to avoid stale closures in recognition callbacks.
 * Supports Chrome, Edge, and Android browsers.
 */
export function useVoiceAssistant(options: UseVoiceAssistantOptions = {}) {
  const { onNavigate, onOpenTool, onSearchTools, wakeWord = "hey nexus" } = options;

  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [transcript, setTranscript] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Refs to avoid stale closures inside recognition callbacks
  const statusRef = useRef<VoiceStatus>("idle");
  const isActiveRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const shouldRestartRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  const { toast } = useToast();

  // Check browser support
  const isSpeechSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // ── Microphone permission + audio level monitoring ──
  const requestMicPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio level analyser
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(avg / 255);
        animationFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
      return true;
    } catch (err) {
      console.error("Microphone access denied:", err);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access in your browser settings to use voice control.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const stopAudioMonitoring = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    audioContextRef.current = null;
    streamRef.current = null;
    setAudioLevel(0);
  }, []);

  // ── Command parser ──
  const processCommand = useCallback((text: string): { type: "navigate" | "tool" | "search" | "chat"; value: string } => {
    const lower = text.toLowerCase().trim();

    // Navigation
    if (lower.includes("go to") || lower.includes("open") || lower.includes("navigate to")) {
      if (lower.includes("video") || lower.includes("video suite")) return { type: "navigate", value: "/video-suite" };
      if (lower.includes("integration")) return { type: "navigate", value: "/integrations" };
      if (lower.includes("automation")) return { type: "navigate", value: "automation" };
      if (lower.includes("home") || lower.includes("dashboard")) return { type: "navigate", value: "/" };
      if (lower.includes("tools")) return { type: "navigate", value: "tools" };
      if (lower.includes("about")) return { type: "navigate", value: "/about" };
      if (lower.includes("contact")) return { type: "navigate", value: "/contact" };
    }

    // Start assistant
    if (lower.includes("start assistant") || lower.includes("start ai")) {
      return { type: "navigate", value: "/" };
    }

    // Tool opening
    if (lower.startsWith("use ") || lower.startsWith("launch ") || lower.startsWith("start ")) {
      const toolName = lower.replace(/^(use |launch |start )/, "").trim();
      return { type: "tool", value: toolName };
    }

    // Search
    if (lower.startsWith("search ") || lower.startsWith("find ") || lower.startsWith("look for ") || lower.includes("search ai tools")) {
      const query = lower.replace(/^(search |find |look for )/, "").replace("search ai tools", "").trim() || "AI tools";
      return { type: "search", value: query };
    }

    return { type: "chat", value: text };
  }, []);

  // ── Text-to-Speech response ──
  const speakResponse = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      setStatus("speaking");
      try {
        const cleanText = text.slice(0, 3000).replace(/[#*`_~\[\]()>]/g, "");
        const utterance = new SpeechSynthesisUtterance(cleanText);
        const userLang = navigator.language || "en-US";
        utterance.lang = userLang;
        utterance.rate = 1;
        utterance.pitch = 1;

        // Select best voice
        const voices = speechSynthesis.getVoices();
        const bestVoice = voices.find(v => v.lang === userLang)
          || voices.find(v => v.lang.startsWith(userLang.split("-")[0]))
          || voices.find(v => v.default) || voices[0];
        if (bestVoice) utterance.voice = bestVoice;

        utterance.onend = () => {
          if (isActiveRef.current) {
            setStatus("wake-listening");
            restartRecognition();
          } else {
            setStatus("idle");
          }
          resolve();
        };
        utterance.onerror = () => {
          setStatus(isActiveRef.current ? "wake-listening" : "idle");
          resolve();
        };

        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
      } catch {
        setStatus(isActiveRef.current ? "wake-listening" : "idle");
        resolve();
      }
    });
  }, []);

  // ── AI query handler ──
  const sendToAI = useCallback(async (userMessage: string) => {
    setStatus("processing");

    const userMsg: VoiceMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    let responseText = "I encountered an error. Please try again.";

    try {
      // Try orchestrator first
      const toolNames = aiTools.map(t => t.title);
      const { data, error } = await supabase.functions.invoke("nexus-orchestrator", {
        body: {
          command: userMessage,
          availableTools: toolNames,
          context: { currentPage: window.location.pathname },
        },
      });

      if (error) throw error;
      responseText = data?.result || responseText;

      if (data?.orchestration?.navigation_target && onNavigate) {
        onNavigate(data.orchestration.navigation_target);
      }
    } catch {
      // Fallback to direct chat
      try {
        const { data } = await supabase.functions.invoke("gemini-ai", {
          body: {
            input: `You are the AI NEXUS voice assistant created by Nitish Tiwari. Answer concisely: ${userMessage}`,
            toolCategory: "Voice Assistant",
            toolTitle: "AI NEXUS Voice",
          },
        });
        responseText = data?.output || responseText;
      } catch {
        // Use fallback message
      }
    }

    const assistantMsg: VoiceMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: responseText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, assistantMsg]);
    await speakResponse(responseText);
  }, [onNavigate, speakResponse]);

  // ── Command handler ──
  const handleCommand = useCallback(async (text: string) => {
    const command = processCommand(text);
    const userMsg: VoiceMessage = { id: crypto.randomUUID(), role: "user", content: text, timestamp: new Date() };

    switch (command.type) {
      case "navigate": {
        onNavigate?.(command.value);
        const label = command.value === "/" ? "home" : command.value.replace(/[/-]/g, " ").trim();
        const navMsg: VoiceMessage = { id: crypto.randomUUID(), role: "assistant", content: `Navigating to ${label}...`, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg, navMsg]);
        await speakResponse(`Navigating to ${label}`);
        break;
      }
      case "tool": {
        onOpenTool?.(command.value);
        const toolMsg: VoiceMessage = { id: crypto.randomUUID(), role: "assistant", content: `Opening ${command.value}...`, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg, toolMsg]);
        await speakResponse(`Opening ${command.value}`);
        break;
      }
      case "search": {
        onSearchTools?.(command.value);
        const searchMsg: VoiceMessage = { id: crypto.randomUUID(), role: "assistant", content: `Searching for ${command.value}...`, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg, searchMsg]);
        await speakResponse(`Searching for ${command.value}`);
        break;
      }
      case "chat":
        await sendToAI(text);
        break;
    }
  }, [processCommand, onNavigate, onOpenTool, onSearchTools, sendToAI, speakResponse]);

  // ── Speech result handler (uses refs to avoid stale closures) ──
  const handleSpeechResultRef = useRef<(text: string) => void>(() => {});

  // Update the ref whenever dependencies change
  useEffect(() => {
    handleSpeechResultRef.current = async (text: string) => {
      if (!text.trim()) return;

      const currentStatus = statusRef.current;

      // In wake-listening mode, only respond to wake word
      if (currentStatus === "wake-listening") {
        if (text.toLowerCase().includes(wakeWord)) {
          const command = text.toLowerCase().replace(wakeWord, "").trim();
          if (command) {
            setTranscript(command);
            stopRecognition();
            await handleCommand(command);
          } else {
            // Just wake word — acknowledge and start active listening
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
        }
        return;
      }

      // Active listening — process command
      setTranscript(text);
      stopRecognition();
      await handleCommand(text);
    };
  }, [wakeWord, handleCommand, speakResponse]);

  // ── Speech Recognition management ──
  const stopRecognition = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
  }, []);

  const restartRecognition = useCallback(() => {
    stopRecognition();
    // Small delay before restart to prevent rapid restart loops
    setTimeout(() => {
      if (isActiveRef.current) {
        startRecognitionRef.current();
      }
    }, 300);
  }, [stopRecognition]);

  const startRecognition = useCallback(() => {
    if (!isSpeechSupported) {
      toast({ title: "Speech not supported", description: "Try Chrome or Edge browser.", variant: "destructive" });
      return;
    }

    // Clean up any existing instance
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";
    recognition.maxAlternatives = 1;

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

      // Use ref-based handler to get latest state
      if (finalTranscript) {
        handleSpeechResultRef.current(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      // Only show toast for non-recoverable errors
      if (event.error === "not-allowed") {
        toast({ title: "Microphone blocked", description: "Allow microphone access in browser settings.", variant: "destructive" });
        setStatus("idle");
        setIsActive(false);
      }
      // "no-speech" and "aborted" are normal — don't alert
    };

    recognition.onend = () => {
      // Auto-restart if still active and not processing/speaking
      if (isActiveRef.current && statusRef.current !== "processing" && statusRef.current !== "speaking") {
        setTimeout(() => {
          if (isActiveRef.current && recognitionRef.current === recognition) {
            try { recognition.start(); } catch {}
          }
        }, 200);
      }
    };

    recognitionRef.current = recognition;
    shouldRestartRef.current = true;

    try {
      recognition.start();
    } catch (err) {
      console.error("Failed to start recognition:", err);
    }
  }, [isSpeechSupported, toast]);

  // ── Public API ──

  /** Activate NEXUS — requests mic, starts wake-word listening */
  const activate = useCallback(async () => {
    const hasPermission = await requestMicPermission();
    if (!hasPermission) return;

    setIsActive(true);
    setStatus("wake-listening");
    startRecognition();

    const welcomeMsg: VoiceMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: 'AI NEXUS online. Say "Hey Nexus" to give me a command, or press Push to Talk.',
      timestamp: new Date(),
    };
    setMessages([welcomeMsg]);
    await speakResponse("AI NEXUS online. Say Hey Nexus to give me a command.");
  }, [requestMicPermission, startRecognition, speakResponse]);

  /** Deactivate — stop everything */
  const deactivate = useCallback(() => {
    setIsActive(false);
    setStatus("idle");
    stopRecognition();
    stopAudioMonitoring();
    speechSynthesis.cancel();
    setTranscript("");
  }, [stopRecognition, stopAudioMonitoring]);

  /** Push to talk — force active listening mode */
  const pushToTalk = useCallback(() => {
    if (statusRef.current === "speaking") {
      speechSynthesis.cancel();
    }
    if (statusRef.current === "processing") return;

    setStatus("listening");
    startRecognition();
  }, [startRecognition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecognition();
      stopAudioMonitoring();
      speechSynthesis.cancel();
    };
  }, [stopRecognition, stopAudioMonitoring]);

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
