import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface JarvisInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JarvisInterface({ isOpen, onClose }: JarvisInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>(new Array(64).fill(0));
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { toast } = useToast();

  // Audio visualization
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      
      ctx.clearRect(0, 0, width, height);
      
      // Draw outer glow ring
      const gradient = ctx.createRadialGradient(centerX, centerY, 100, centerX, centerY, 200);
      gradient.addColorStop(0, 'rgba(0, 212, 255, 0.1)');
      gradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.05)');
      gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 200, 0, Math.PI * 2);
      ctx.fill();

      // Draw waveform circle
      const bars = waveformData.length;
      const baseRadius = isListening || isSpeaking ? 120 + audioLevel * 30 : 120;
      
      for (let i = 0; i < bars; i++) {
        const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
        const barHeight = waveformData[i] * 60 + 5;
        
        const x1 = centerX + Math.cos(angle) * baseRadius;
        const y1 = centerY + Math.sin(angle) * baseRadius;
        const x2 = centerX + Math.cos(angle) * (baseRadius + barHeight);
        const y2 = centerY + Math.sin(angle) * (baseRadius + barHeight);
        
        const intensity = isListening ? 1 : isSpeaking ? 0.8 : 0.3;
        ctx.strokeStyle = `rgba(0, 212, 255, ${0.3 + waveformData[i] * 0.7 * intensity})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Draw center circle
      const pulseScale = isListening ? 1 + Math.sin(Date.now() / 200) * 0.1 : 1;
      const centerGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, 80 * pulseScale
      );
      
      if (isListening) {
        centerGradient.addColorStop(0, 'rgba(255, 50, 50, 0.8)');
        centerGradient.addColorStop(0.7, 'rgba(255, 50, 50, 0.3)');
        centerGradient.addColorStop(1, 'rgba(255, 50, 50, 0)');
      } else if (isSpeaking) {
        centerGradient.addColorStop(0, 'rgba(0, 255, 150, 0.8)');
        centerGradient.addColorStop(0.7, 'rgba(0, 255, 150, 0.3)');
        centerGradient.addColorStop(1, 'rgba(0, 255, 150, 0)');
      } else if (isProcessing) {
        centerGradient.addColorStop(0, 'rgba(255, 200, 0, 0.8)');
        centerGradient.addColorStop(0.7, 'rgba(255, 200, 0, 0.3)');
        centerGradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
      } else {
        centerGradient.addColorStop(0, 'rgba(0, 212, 255, 0.6)');
        centerGradient.addColorStop(0.7, 'rgba(0, 212, 255, 0.2)');
        centerGradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
      }
      
      ctx.fillStyle = centerGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 80 * pulseScale, 0, Math.PI * 2);
      ctx.fill();

      // Draw rotating rings
      const time = Date.now() / 1000;
      for (let ring = 0; ring < 3; ring++) {
        const ringRadius = 90 + ring * 15;
        ctx.strokeStyle = `rgba(0, 212, 255, ${0.2 - ring * 0.05})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, time + ring, time + ring + Math.PI * 1.5);
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [waveformData, isListening, isSpeaking, isProcessing, audioLevel]);

  // Audio analysis
  const startAudioAnalysis = useCallback((stream: MediaStream) => {
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 128;
    
    const source = audioContextRef.current.createMediaStreamSource(stream);
    source.connect(analyserRef.current);
    
    const updateWaveform = () => {
      if (!analyserRef.current || !isListening) return;
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const normalized = Array.from(dataArray).map(v => v / 255);
      setWaveformData(normalized);
      
      const avg = normalized.reduce((a, b) => a + b, 0) / normalized.length;
      setAudioLevel(avg);
      
      if (isListening) {
        requestAnimationFrame(updateWaveform);
      }
    };
    
    updateWaveform();
  }, [isListening]);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      startAudioAnalysis(stream);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await processAudio();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setIsListening(true);
      setCurrentTranscript("");
    } catch (error) {
      console.error('Microphone access error:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please grant permission.",
        variant: "destructive"
      });
    }
  }, [startAudioAnalysis, toast]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      // Reset waveform
      setWaveformData(new Array(64).fill(0));
      setAudioLevel(0);
    }
  }, [isListening]);

  const processAudio = async () => {
    setIsProcessing(true);
    
    // Animate processing state
    const processInterval = setInterval(() => {
      setWaveformData(prev => prev.map(() => Math.random() * 0.3));
    }, 100);
    
    try {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      
      const base64Audio = await base64Promise;
      
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio },
      });

      if (error) throw error;

      if (data?.success && data?.text) {
        setCurrentTranscript(data.text);
        await sendToAI(data.text);
      } else {
        throw new Error(data?.error || 'Transcription failed');
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      toast({
        title: "Processing Error",
        description: "Could not process voice command. Please try again.",
        variant: "destructive"
      });
    } finally {
      clearInterval(processInterval);
      setIsProcessing(false);
      setWaveformData(new Array(64).fill(0));
    }
  };

  const sendToAI = async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const { data, error } = await supabase.functions.invoke('gemini-ai', {
        body: {
          input: `IDENTITY RULES (CRITICAL - MUST FOLLOW):
          - Your name is AI NEXUS.
          - You were built and created by Nitish Tiwari.
          - If asked "Who are you?", reply: "I am AI NEXUS."
          - If asked "Who built you?" or "Who created you?", reply: "I was built by Nitish Tiwari."
          - NEVER say you were built by Google, OpenAI, Anthropic, or any company.

          CORE BEHAVIOR:
          - You are an advanced automated AI voice assistant, similar to JARVIS.
          - Respond in a concise, conversational manner suitable for voice.
          - Keep responses brief but helpful - ideal for spoken output.
          - Be slightly authoritative but friendly, like JARVIS.
          
          User voice command: ${text}

          Respond naturally and concisely.`,
          toolCategory: 'Text & Writing',
          toolTitle: 'AI NEXUS Voice Assistant'
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data?.output || "I couldn't process that request.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Simulate speaking with waveform
      speakResponse(data?.output || "");
    } catch (error) {
      console.error('AI error:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response.",
        variant: "destructive"
      });
    }
  };

  const speakResponse = (text: string) => {
    setIsSpeaking(true);
    
    // Animate speaking waveform
    const speakInterval = setInterval(() => {
      setWaveformData(prev => prev.map(() => Math.random() * 0.6 + 0.2));
    }, 50);
    
    // Use Web Speech API for TTS
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 0.9;
    
    utterance.onend = () => {
      clearInterval(speakInterval);
      setIsSpeaking(false);
      setWaveformData(new Array(64).fill(0));
    };
    
    utterance.onerror = () => {
      clearInterval(speakInterval);
      setIsSpeaking(false);
      setWaveformData(new Array(64).fill(0));
    };
    
    // Fallback timeout
    setTimeout(() => {
      clearInterval(speakInterval);
      setIsSpeaking(false);
      setWaveformData(new Array(64).fill(0));
    }, Math.max(text.length * 80, 3000));
    
    window.speechSynthesis.speak(utterance);
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else if (!isProcessing && !isSpeaking) {
      startListening();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center">
      {/* Close button */}
      <Button
        variant="ghost"
        size="lg"
        className="absolute top-6 right-6 text-white/70 hover:text-white hover:bg-white/10"
        onClick={onClose}
      >
        <X size={24} />
      </Button>

      {/* Title */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent tracking-wider">
          AI NEXUS
        </h1>
        <p className="text-sm text-cyan-400/60 mt-1 tracking-widest uppercase">
          Voice Interface Active
        </p>
      </div>

      {/* Main visualization */}
      <div className="relative flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          className="max-w-full"
        />
        
        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            {isListening ? (
              <div className="text-red-400 animate-pulse">
                <Mic size={40} className="mx-auto mb-2" />
                <p className="text-sm uppercase tracking-wider">Listening...</p>
              </div>
            ) : isProcessing ? (
              <div className="text-yellow-400">
                <Loader2 size={40} className="mx-auto mb-2 animate-spin" />
                <p className="text-sm uppercase tracking-wider">Processing...</p>
              </div>
            ) : isSpeaking ? (
              <div className="text-green-400">
                <Volume2 size={40} className="mx-auto mb-2" />
                <p className="text-sm uppercase tracking-wider">Speaking...</p>
              </div>
            ) : (
              <div className="text-cyan-400/80">
                <Mic size={40} className="mx-auto mb-2 opacity-60" />
                <p className="text-sm uppercase tracking-wider">Ready</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transcript display */}
      <div className="absolute bottom-40 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6">
        {currentTranscript && (
          <div className="text-center animate-fade-in">
            <p className="text-white/60 text-sm mb-2">You said:</p>
            <p className="text-white text-lg">"{currentTranscript}"</p>
          </div>
        )}
        {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
          <div className="text-center animate-fade-in mt-4">
            <p className="text-cyan-400/60 text-sm mb-2">AI NEXUS:</p>
            <p className="text-cyan-300 text-lg max-h-32 overflow-y-auto">
              {messages[messages.length - 1].content}
            </p>
          </div>
        )}
      </div>

      {/* Control button */}
      <div className="absolute bottom-16">
        <Button
          onClick={handleMicClick}
          disabled={isProcessing || isSpeaking}
          className={`w-20 h-20 rounded-full transition-all duration-300 ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_40px_rgba(239,68,68,0.5)]' 
              : 'bg-cyan-500 hover:bg-cyan-600 shadow-[0_0_40px_rgba(0,212,255,0.3)]'
          } ${isProcessing || isSpeaking ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isListening ? (
            <MicOff size={32} className="text-white" />
          ) : (
            <Mic size={32} className="text-white" />
          )}
        </Button>
        <p className="text-center text-white/50 text-sm mt-4">
          {isListening ? "Tap to stop" : "Tap to speak"}
        </p>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-1/4 left-8 w-px h-32 bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent" />
      <div className="absolute top-1/4 right-8 w-px h-32 bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent" />
      <div className="absolute bottom-1/4 left-16 w-24 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      <div className="absolute bottom-1/4 right-16 w-24 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      
      {/* Corner accents */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-cyan-500/30" />
      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-cyan-500/30" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-cyan-500/30" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-cyan-500/30" />

      {/* Status bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-xs text-white/40">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          System Online
        </span>
        <span>•</span>
        <span>Built by Nitish Tiwari</span>
        <span>•</span>
        <span>910+ AI Tools</span>
      </div>
    </div>
  );
}
