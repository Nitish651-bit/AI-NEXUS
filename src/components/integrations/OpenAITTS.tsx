import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Volume2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const voices = [
  { id: "alloy", name: "Alloy" },
  { id: "echo", name: "Echo" },
  { id: "fable", name: "Fable" },
  { id: "onyx", name: "Onyx" },
  { id: "nova", name: "Nova" },
  { id: "shimmer", name: "Shimmer" },
];

export const OpenAITTS = () => {
  const [text, setText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("alloy");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const useBrowserTTS = (textToSpeak: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'en-US';
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
      toast({
        title: "Playing",
        description: "Using browser's built-in text-to-speech",
      });
    } else {
      toast({
        title: "Error",
        description: "Your browser doesn't support text-to-speech",
        variant: "destructive",
      });
    }
  };

  const generateSpeech = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setAudioUrl("");

    try {
      const { data, error } = await supabase.functions.invoke('openai-tts', {
        body: { 
          text,
          voice: selectedVoice
        }
      });

      if (error) {
        throw error;
      }

      // Handle browser TTS fallback
      if (data?.useBrowserTTS) {
        useBrowserTTS(text);
        toast({
          title: "Using Browser TTS",
          description: data?.message || "Cloud TTS unavailable, using browser fallback",
        });
        return;
      }

      if (!data?.success || !data?.audioContent) {
        throw new Error(data?.error || "Failed to generate speech");
      }

      const audio = `data:audio/mp3;base64,${data.audioContent}`;
      setAudioUrl(audio);
      
      toast({
        title: "Success",
        description: "Speech generated successfully!",
      });
    } catch (error) {
      console.error("Error generating speech:", error);
      // Fallback to browser TTS on any error
      useBrowserTTS(text);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-primary" />
          <CardTitle>Text-to-Speech</CardTitle>
        </div>
        <CardDescription>
          Convert text to natural-sounding speech using OpenAI TTS
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="text">Text to Convert</Label>
          <Textarea
            id="text"
            placeholder="Enter the text you want to convert to speech..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="voice">Voice</Label>
          <Select value={selectedVoice} onValueChange={setSelectedVoice}>
            <SelectTrigger id="voice">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {voices.map((voice) => (
                <SelectItem key={voice.id} value={voice.id}>
                  {voice.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={generateSpeech} 
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Volume2 className="mr-2 h-4 w-4" />
              Generate Speech
            </>
          )}
        </Button>

        {audioUrl && (
          <div className="space-y-2">
            <Label>Generated Audio</Label>
            <audio controls className="w-full" src={audioUrl}>
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
