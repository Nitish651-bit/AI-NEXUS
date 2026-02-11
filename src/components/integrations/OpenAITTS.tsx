import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Volume2, Loader2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const voices = [
  { id: "default", name: "Default" },
  { id: "male", name: "Male" },
  { id: "female", name: "Female" },
];

export const OpenAITTS = () => {
  const [text, setText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("default");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const getBrowserVoice = () => {
    const allVoices = speechSynthesis.getVoices();
    if (!allVoices.length) return null;
    if (selectedVoice === "male") return allVoices.find(v => v.name.toLowerCase().includes("male")) || allVoices[0];
    if (selectedVoice === "female") return allVoices.find(v => v.name.toLowerCase().includes("female")) || allVoices.find(v => v.default) || allVoices[0];
    return allVoices.find(v => v.default) || allVoices[0];
  };

  const generateSpeech = () => {
    if (!text.trim()) {
      toast({ title: "Error", description: "Please enter some text", variant: "destructive" });
      return;
    }

    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    const voice = getBrowserVoice();
    if (voice) utterance.voice = voice;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      toast({ title: "Error", description: "Speech synthesis failed", variant: "destructive" });
    };

    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
    utteranceRef.current = utterance;
    setIsSpeaking(true);
    toast({ title: "Playing", description: "Speaking with Browser Speech API" });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-primary" />
          <CardTitle>Text-to-Speech</CardTitle>
        </div>
        <CardDescription>Convert text to natural-sounding speech using Browser Speech API</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="text">Text to Convert</Label>
          <Textarea id="text" placeholder="Enter the text you want to convert to speech..." value={text} onChange={(e) => setText(e.target.value)} rows={4} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="voice">Voice</Label>
          <Select value={selectedVoice} onValueChange={setSelectedVoice}>
            <SelectTrigger id="voice"><SelectValue /></SelectTrigger>
            <SelectContent>
              {voices.map((voice) => (
                <SelectItem key={voice.id} value={voice.id}>{voice.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={generateSpeech} className="w-full">
          {isSpeaking ? <><VolumeX className="mr-2 h-4 w-4" />Stop</> : <><Volume2 className="mr-2 h-4 w-4" />Generate Speech</>}
        </Button>
      </CardContent>
    </Card>
  );
};
