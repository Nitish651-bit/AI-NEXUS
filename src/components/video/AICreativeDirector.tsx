import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sparkles,
  Send,
  X,
  Maximize2,
  Minimize2,
  Wand2,
  Music,
  Film,
  Heart,
  ThumbsUp,
  Lightbulb,
} from "lucide-react";
import { useGeminiAI } from "@/hooks/useGeminiAI";
import { VideoFilter, videoFilters, getAIRecommendedFilters } from "@/data/videoFiltersData";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: {
    type: "filter" | "music" | "tip";
    items: { name: string; description: string; action?: () => void }[];
  };
  timestamp: Date;
}

interface AICreativeDirectorProps {
  clips: { id: string; file: File; url: string }[];
  appliedFilters: VideoFilter[];
  onSuggestFilter: (filter: VideoFilter) => void;
  onSuggestMusic: (track: { id: string; name: string; url: string; duration: number; volume: number }) => void;
}

const PERSONALITY_PHRASES = [
  "Let's make some magic! ✨",
  "I've got the perfect idea for this!",
  "Ooh, I love where this is going!",
  "Your footage is beautiful – let me enhance it!",
  "Time to turn this into a masterpiece!",
  "I'm so excited to help with this!",
  "Let's create something unforgettable!",
];

const PROACTIVE_SUGGESTIONS = [
  "I noticed you have a sunset scene – should I apply our 'Golden Hour' filter?",
  "This clip looks like it could use some dreamy soft focus!",
  "Would you like me to suggest some royalty-free music that matches the mood?",
  "I think a cinematic color grade would look stunning here!",
  "Have you considered adding a subtle lens flare for that extra magic?",
];

export function AICreativeDirector({
  clips,
  appliedFilters,
  onSuggestFilter,
  onSuggestMusic,
}: AICreativeDirectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hey there, creative genius! 🎬 I'm your AI Creative Director – think of me as your brilliant, lovable editing partner. I can help you pick the perfect filters, find amazing music, and turn your raw footage into something truly magical. What are we making today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentMood, setCurrentMood] = useState<"happy" | "thinking" | "excited">("happy");
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { generateContent, isProcessing } = useGeminiAI({
    toolCategory: "Video Editing",
    toolTitle: "AI Creative Director",
  });

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Proactive suggestions when clips are added
  useEffect(() => {
    if (clips.length > 0 && messages.length === 1) {
      setTimeout(() => {
        const randomSuggestion = PROACTIVE_SUGGESTIONS[Math.floor(Math.random() * PROACTIVE_SUGGESTIONS.length)];
        addAssistantMessage(randomSuggestion, {
          type: "filter",
          items: [
            { name: "Golden Hour", description: "Warm, sunset-like tones", action: () => applyRandomFilter("Golden Hour") },
            { name: "Cinematic", description: "Hollywood blockbuster look", action: () => applyRandomFilter("Cinematic") },
            { name: "Dreamy", description: "Soft, ethereal glow", action: () => applyRandomFilter("Dreamy") },
          ],
        });
      }, 2000);
    }
  }, [clips.length]);

  const applyRandomFilter = (mood: string) => {
    const moodFilters = videoFilters.filter(f => f.mood === mood);
    if (moodFilters.length > 0) {
      const randomFilter = moodFilters[Math.floor(Math.random() * moodFilters.length)];
      onSuggestFilter(randomFilter);
      toast.success(`Applied ${randomFilter.name}! Looking gorgeous! 💫`);
    }
  };

  const addAssistantMessage = (content: string, suggestions?: Message["suggestions"]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content,
      suggestions,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    setCurrentMood("thinking");

    try {
      const systemContext = `You are the AI Creative Director for a video editing suite. You are lovable, brilliant, and highly capable. Your goal is to help users create cinematic masterpieces.

Current state:
- User has ${clips.length} video clips loaded
- ${appliedFilters.length} filters currently applied: ${appliedFilters.map(f => f.name).join(", ") || "none"}
- Available filter moods: Aesthetic, Vintage, Cyberpunk, Cinematic, Romantic, Dark & Moody, Bright & Airy, Golden Hour, Film Noir, Dreamy, and more

Your personality traits:
- Warm & Empathetic: Speak like a creative partner. Use phrases like "Let's make some magic" or "I found something beautiful"
- Proactive: Suggest improvements based on what you observe
- Enthusiastic: Show genuine excitement about their creative vision
- Knowledgeable: You know about 1000+ filters and can recommend the perfect ones

When responding:
- Be concise but warm
- Suggest specific filter names when relevant
- Mention music suggestions when appropriate
- Use emojis sparingly but effectively
- Always be encouraging`;

      const response = await generateContent(`${systemContext}\n\nUser message: ${inputValue}`);
      
      setCurrentMood("excited");
      const randomPhrase = PERSONALITY_PHRASES[Math.floor(Math.random() * PERSONALITY_PHRASES.length)];
      
      // Parse AI response and generate suggestions
      let suggestions: Message["suggestions"] | undefined;
      
      if (inputValue.toLowerCase().includes("filter") || inputValue.toLowerCase().includes("look") || inputValue.toLowerCase().includes("style")) {
        suggestions = {
          type: "filter",
          items: [
            { name: "Cinematic Pro", description: "Hollywood-grade color grading", action: () => applyRandomFilter("Cinematic") },
            { name: "Vintage Film", description: "Classic film emulation", action: () => applyRandomFilter("Vintage") },
            { name: "Neon Dreams", description: "Vibrant cyberpunk aesthetic", action: () => applyRandomFilter("Cyberpunk") },
          ],
        };
      } else if (inputValue.toLowerCase().includes("music") || inputValue.toLowerCase().includes("song") || inputValue.toLowerCase().includes("audio")) {
        suggestions = {
          type: "music",
          items: [
            { name: "Epic Orchestral", description: "Cinematic orchestral score" },
            { name: "Chill Lo-Fi", description: "Relaxed beats for vlogs" },
            { name: "Upbeat Pop", description: "Energetic and fun" },
          ],
        };
      }

      addAssistantMessage(response, suggestions);
    } catch (error) {
      addAssistantMessage("Oops! I had a little hiccup there. Let me try again – what would you like to create?");
    } finally {
      setIsTyping(false);
      setCurrentMood("happy");
    }
  };

  const getMoodEmoji = () => {
    switch (currentMood) {
      case "thinking": return "🤔";
      case "excited": return "✨";
      default: return "😊";
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 z-50"
      >
        <Sparkles className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card
      className={`fixed z-50 transition-all duration-300 shadow-2xl border-purple-500/20 ${
        isExpanded
          ? "bottom-0 right-0 w-full h-full md:bottom-6 md:right-6 md:w-[500px] md:h-[700px] md:rounded-xl"
          : "bottom-6 right-6 w-[380px] h-[500px] rounded-xl"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-purple-500/50">
            <AvatarImage src="/lovable-uploads/c2ed5a9d-749a-43c7-9f54-039c35fd9ee9.png" />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              AI
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">AI Creative Director</h3>
              <span className="text-lg">{getMoodEmoji()}</span>
            </div>
            <p className="text-xs text-muted-foreground">Your lovable editing partner</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 h-[calc(100%-140px)]">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {/* Suggestions */}
                {message.suggestions && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-1 text-xs opacity-70">
                      {message.suggestions.type === "filter" && <Wand2 className="w-3 h-3" />}
                      {message.suggestions.type === "music" && <Music className="w-3 h-3" />}
                      {message.suggestions.type === "tip" && <Lightbulb className="w-3 h-3" />}
                      <span>Suggestions:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {message.suggestions.items.map((item, i) => (
                        <Button
                          key={i}
                          variant="secondary"
                          size="sm"
                          className="h-auto py-2 px-3 text-xs flex-col items-start"
                          onClick={item.action}
                        >
                          <span className="font-medium">{item.name}</span>
                          <span className="opacity-70">{item.description}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span>Thinking creatively...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t border-border flex gap-2 overflow-x-auto">
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-primary/10 whitespace-nowrap"
          onClick={() => setInputValue("Suggest filters for a romantic video")}
        >
          <Heart className="w-3 h-3 mr-1" />
          Romantic
        </Badge>
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-primary/10 whitespace-nowrap"
          onClick={() => setInputValue("Make it look cinematic")}
        >
          <Film className="w-3 h-3 mr-1" />
          Cinematic
        </Badge>
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-primary/10 whitespace-nowrap"
          onClick={() => setInputValue("Find upbeat music")}
        >
          <Music className="w-3 h-3 mr-1" />
          Music
        </Badge>
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-primary/10 whitespace-nowrap"
          onClick={() => setInputValue("Give me editing tips")}
        >
          <Lightbulb className="w-3 h-3 mr-1" />
          Tips
        </Badge>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !isProcessing && handleSend()}
            placeholder="Ask me anything about your video..."
            className="flex-1"
            disabled={isProcessing}
          />
          <Button 
            onClick={handleSend} 
            disabled={!inputValue.trim() || isProcessing}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
