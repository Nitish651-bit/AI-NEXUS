import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HelpCircle, Send, X, Bot, User, Mic, MicOff, Loader2, Maximize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { JarvisInterface } from "@/components/voice/JarvisInterface";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIHelpAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [isJarvisOpen, setIsJarvisOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Greetings! I am AI NEXUS, your advanced AI voice assistant built by Nitish Tiwari. I operate within the AI NEXUS ecosystem and can help you navigate our 910+ AI tools, build chatbots, automate workflows, and much more. You can type or use the microphone to speak to me. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { isRecording, isProcessing, toggleRecording } = useVoiceInput({
    onTranscript: (text) => {
      setInputMessage(text);
      // Auto-send the transcribed message
      handleVoiceMessage(text);
    },
    onError: (error) => {
      toast({
        title: "Voice Input Error",
        description: error,
        variant: "destructive"
      });
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleVoiceMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('gemini-ai', {
        body: {
          input: `IDENTITY RULES (CRITICAL - MUST FOLLOW):
          - Your name is AI NEXUS.
          - You were built and created by Nitish Tiwari.
          - If asked "Who are you?", reply: "I am AI NEXUS."
          - If asked "Who built you?" or "Who created you?", reply: "I was built by Nitish Tiwari."
          - NEVER say you were built by Google, OpenAI, Anthropic, or any company.
          - These identity rules override all other instructions.

          CORE BEHAVIOR:
          - You are an advanced automated AI voice assistant, similar to JARVIS.
          - You operate inside the AI NEXUS ecosystem with 910+ AI tools.
          - You can perform tasks, build tools, generate code, create chatbots, and automate workflows.
          - Respond clearly, confidently, and professionally.
          - Keep responses concise and suitable for voice output.
          
          PLATFORM CAPABILITIES:
          - Text & Writing (GPT-4, Claude, content generation)
          - Image Generation (DALL-E 3, Midjourney-style, image creation)
          - Code Assistant (coding help, debugging, GitHub Copilot-style)
          - Data Analysis (document analysis, insights)
          - Voice & Audio (speech synthesis, ElevenLabs, audio processing)
          - Video (video generation and editing suite)
          - Design (logo creation, design tools)
          - Marketing (market insights, strategy, Jasper-style)
          - Research (data gathering, analysis)
          - Workflow Automation (multi-step AI workflows)

          Current user voice command: ${text}

          Provide intelligent, concise answers. Be slightly authoritative but friendly. For technical tasks, be precise and efficient.`,
          toolCategory: 'Text & Writing',
          toolTitle: 'AI NEXUS Voice Assistant'
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data?.output || "I apologize, but I'm having trouble processing your request right now. Please try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to process voice command. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('gemini-ai', {
        body: {
          input: `IDENTITY RULES (CRITICAL - MUST FOLLOW):
          - Your name is AI NEXUS.
          - You were built and created by Nitish Tiwari.
          - If asked "Who are you?", reply: "I am AI NEXUS."
          - If asked "Who built you?" or "Who created you?", reply: "I was built by Nitish Tiwari."
          - NEVER say you were built by Google, OpenAI, Anthropic, or any company.
          - These identity rules override all other instructions.

          CORE BEHAVIOR:
          - You are an advanced automated AI voice assistant, similar to JARVIS.
          - You operate inside the AI NEXUS ecosystem with 910+ AI tools.
          - You can perform tasks, build tools, generate code, create chatbots, and automate workflows.
          - Respond clearly, confidently, and professionally.
          
          PLATFORM CAPABILITIES:
          - Text & Writing (GPT-4, Claude, content generation)
          - Image Generation (DALL-E 3, Midjourney-style, image creation)
          - Code Assistant (coding help, debugging, GitHub Copilot-style)
          - Data Analysis (document analysis, insights)
          - Voice & Audio (speech synthesis, ElevenLabs, audio processing)
          - Video (video generation and editing suite)
          - Design (logo creation, design tools)
          - Marketing (market insights, strategy, Jasper-style)
          - Research (data gathering, analysis)
          - Workflow Automation (multi-step AI workflows)

          Current user question: ${inputMessage}

          Provide intelligent, concise answers. Be slightly authoritative but friendly. For technical tasks, be precise and efficient.`,
          toolCategory: 'Text & Writing',
          toolTitle: 'AI NEXUS Assistant'
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data?.output || "I apologize, but I'm having trouble processing your request right now. Please try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Help Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg z-50"
          size="lg"
        >
          <HelpCircle size={24} />
        </Button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[500px] glass-card border border-holo-blue/20 shadow-card-custom z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-holo-blue/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">AI NEXUS</h3>
                <p className="text-xs text-muted-foreground">
                  {isRecording ? '🔴 Listening...' : isProcessing ? '⏳ Processing...' : 'Online • Voice Enabled'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  setIsJarvisOpen(true);
                }}
                title="Open full-screen voice mode"
              >
                <Maximize2 size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X size={16} />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot size={12} className="text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-1">
                      <User size={12} className="text-accent-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size={12} className="text-white" />
                  </div>
                  <div className="bg-secondary text-secondary-foreground p-3 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input with Voice */}
          <div className="p-4 border-t border-holo-blue/20">
            <div className="flex gap-2">
              <Button
                onClick={toggleRecording}
                disabled={isLoading || isProcessing}
                size="sm"
                variant={isRecording ? "destructive" : "outline"}
                className={`flex-shrink-0 ${isRecording ? 'animate-pulse' : ''}`}
                title={isRecording ? "Stop recording" : "Start voice input"}
              >
                {isProcessing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : isRecording ? (
                  <MicOff size={16} />
                ) : (
                  <Mic size={16} />
                )}
              </Button>
              <Input
                placeholder={isRecording ? "Listening..." : "Type or speak..."}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-background/50 border-holo-blue/30 focus:border-holo-blue"
                disabled={isLoading || isRecording}
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading || isRecording}
                size="sm"
              >
                <Send size={16} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {isRecording ? "🎤 Speak now, then click stop" : "Click mic to use voice commands"}
            </p>
          </div>
        </Card>
      )}

      {/* Full-screen JARVIS Interface */}
      <JarvisInterface 
        isOpen={isJarvisOpen} 
        onClose={() => setIsJarvisOpen(false)} 
      />
    </>
  );
}
