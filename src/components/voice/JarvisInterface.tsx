import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { NexusWaveform } from "./JarvisWaveform";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { aiTools } from "@/data/aiToolsData";
import {
  Mic,
  MicOff,
  X,
  Power,
  MessageSquare,
  Zap,
  Globe,
  Volume2,
} from "lucide-react";

interface NexusInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTool?: (toolName: string) => void;
  onSearchTools?: (query: string) => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  idle: { label: "OFFLINE", color: "text-muted-foreground" },
  "wake-listening": { label: "STANDBY — Say 'Hey Nexus'", color: "text-cyan-400" },
  listening: { label: "LISTENING", color: "text-green-400" },
  processing: { label: "PROCESSING", color: "text-purple-400" },
  speaking: { label: "SPEAKING", color: "text-amber-400" },
};

export function NexusInterface({ isOpen, onClose, onOpenTool, onSearchTools }: NexusInterfaceProps) {
  const navigate = useNavigate();
  const [showTranscript, setShowTranscript] = useState(true);

  const handleNavigate = (path: string) => {
    if (path === "tools" || path === "automation") {
      onClose();
      // Will be handled by Dashboard
    } else {
      navigate(path);
      onClose();
    }
  };

  const handleOpenTool = (toolName: string) => {
    const tool = aiTools.find(t => t.title.toLowerCase().includes(toolName.toLowerCase()));
    if (tool) {
      onOpenTool?.(tool.title);
    } else {
      onSearchTools?.(toolName);
    }
  };

  const {
    status,
    messages,
    transcript,
    isActive,
    audioLevel,
    isSpeechSupported,
    activate,
    deactivate,
    pushToTalk,
    permissionState,
    activeDevice,
    lastError,
    isSecureOrigin,
    retryPermission,
  } = useVoiceAssistant({
    onNavigate: handleNavigate,
    onOpenTool: handleOpenTool,
    onSearchTools,
    wakeWord: "hey nexus",
  });
  const [showDebug, setShowDebug] = useState(false);

  if (!isOpen) return null;

  const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.idle;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-holo-blue/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/3 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative w-full flex items-center justify-between p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-holo-blue animate-pulse" />
          <span className="text-sm font-mono text-holo-blue tracking-wider">
            AI NEXUS VOICE v3.0
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`font-mono text-xs ${statusInfo.color} border-current`}>
            {statusInfo.label}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => setShowDebug(s => !s)} className="text-muted-foreground hover:text-white font-mono text-xs">
            {showDebug ? "HIDE" : "DEBUG"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-white">
            <X size={18} />
          </Button>
        </div>
      </header>

      {/* Permission / hardware error banner */}
      {(permissionState === "denied" || permissionState === "no-device" || permissionState === "insecure") && (
        <div className="relative w-full max-w-2xl mx-auto px-4 -mt-2">
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 backdrop-blur p-4 flex items-start gap-3 animate-fade-in">
            <div className="w-2 h-2 mt-2 rounded-full bg-red-500 animate-pulse" />
            <div className="flex-1 text-sm">
              <p className="text-red-300 font-mono font-semibold">
                {permissionState === "denied" && "Microphone permission denied"}
                {permissionState === "no-device" && "No microphone detected"}
                {permissionState === "insecure" && "HTTPS required"}
              </p>
              <p className="text-red-200/80 mt-1">
                {permissionState === "denied" && "Click the lock icon in the address bar, allow microphone, then retry."}
                {permissionState === "no-device" && "Plug in a mic or enable a built-in mic in your OS sound settings."}
                {permissionState === "insecure" && "Open this site over HTTPS or localhost to use voice control."}
              </p>
            </div>
            {permissionState !== "insecure" && (
              <Button size="sm" onClick={() => retryPermission()} className="bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40">
                Retry
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Debug panel */}
      {showDebug && (
        <div className="relative w-full max-w-2xl mx-auto px-4 mt-2">
          <div className="rounded-xl border border-cyan-500/30 bg-black/60 backdrop-blur p-4 font-mono text-[11px] text-cyan-200 grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-gray-500">Status</span><span>{status}</span>
            <span className="text-gray-500">Permission</span><span>{permissionState}</span>
            <span className="text-gray-500">Microphone</span><span className="truncate">{activeDevice || "—"}</span>
            <span className="text-gray-500">Speech API</span><span>{isSpeechSupported ? "supported" : "unsupported"}</span>
            <span className="text-gray-500">Secure origin</span><span>{isSecureOrigin ? "yes (HTTPS)" : "no"}</span>
            <span className="text-gray-500">Audio level</span><span>{Math.round(audioLevel * 100)}%</span>
            <span className="text-gray-500">Last transcript</span><span className="truncate">{transcript || "—"}</span>
            <span className="text-gray-500">Last error</span><span className="truncate text-red-300">{lastError || "none"}</span>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="relative flex-1 flex flex-col items-center justify-center w-full max-w-2xl px-4 gap-6">
        {/* Waveform */}
        <div className="relative">
          <NexusWaveform status={status} audioLevel={audioLevel} />
          
          {/* Center status icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              {status === "listening" && <Mic size={32} className="text-green-400 animate-pulse" />}
              {status === "wake-listening" && <Mic size={32} className="text-cyan-400 opacity-50" />}
              {status === "processing" && (
                <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              )}
              {status === "speaking" && <Volume2 size={32} className="text-amber-400 animate-pulse" />}
              {status === "idle" && <Power size={32} className="text-muted-foreground" />}
            </div>
          </div>
        </div>

        {/* Live transcript */}
        {transcript && status === "listening" && (
          <div className="text-center px-6 py-3 bg-white/5 rounded-2xl border border-white/10 max-w-md">
            <p className="text-sm text-cyan-300 font-mono animate-pulse">"{transcript}"</p>
          </div>
        )}

        {/* Conversation history */}
        {showTranscript && messages.length > 0 && (
          <ScrollArea className="w-full max-h-48 sm:max-h-64">
            <div className="space-y-3 px-2">
              {messages.slice(-6).map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-holo-blue/20 text-cyan-100 border border-holo-blue/30"
                        : "bg-white/5 text-gray-300 border border-white/10"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content.slice(0, 500)}{msg.content.length > 500 ? "..." : ""}</p>
                    <span className="text-[10px] text-gray-500 mt-1 block">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Footer controls */}
      <footer className="relative w-full p-4 sm:p-6">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-4">
          {!isActive ? (
            <Button
              onClick={activate}
              disabled={!isSpeechSupported}
              className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-6 rounded-full text-lg shadow-[0_0_30px_rgba(0,212,255,0.3)] hover:shadow-[0_0_50px_rgba(0,212,255,0.5)] transition-all"
            >
              <Zap size={20} />
              Activate AI NEXUS
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTranscript(!showTranscript)}
                className="rounded-full border-white/20 text-gray-400 hover:text-white"
              >
                <MessageSquare size={16} />
              </Button>

              <Button
                onClick={pushToTalk}
                disabled={status === "processing" || status === "speaking"}
                className={`gap-2 px-8 py-6 rounded-full text-lg transition-all ${
                  status === "listening"
                    ? "bg-green-600 hover:bg-green-500 shadow-[0_0_30px_rgba(34,197,94,0.4)]"
                    : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-[0_0_30px_rgba(0,212,255,0.3)]"
                } text-white`}
              >
                {status === "listening" ? <Mic size={20} className="animate-pulse" /> : <Mic size={20} />}
                {status === "listening" ? "Listening..." : "Push to Talk"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={deactivate}
                className="rounded-full border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <MicOff size={16} />
              </Button>
            </>
          )}
        </div>

        {/* Hints */}
        <div className="text-center mt-4 space-y-1">
          {!isSpeechSupported && (
            <p className="text-xs text-red-400">Your browser doesn't support speech recognition. Try Chrome or Edge.</p>
          )}
          {isActive && (
            <div className="flex flex-wrap justify-center gap-2">
              {["Hey Nexus, search for...", "Open AI Writer", "Go to Video Suite", "What's the weather?"].map((hint) => (
                <span key={hint} className="text-[10px] text-gray-600 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                  {hint}
                </span>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-gray-700 mt-3 font-mono">
          AI NEXUS • Developed by Nitish Tiwari • Powered by Google Gemini
        </p>
      </footer>
    </div>
  );
}
