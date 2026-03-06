import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Volume2, VolumeX, Download } from "lucide-react";
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

  const handleDownload = async () => {
    if (!text.trim()) {
      toast({ title: "Error", description: "Please enter some text to download", variant: "destructive" });
      return;
    }

    toast({ title: "Generating Audio", description: "Recording speech for download..." });

    try {
      const audioContext = new AudioContext();
      const dest = audioContext.createMediaStreamDestination();
      const mediaRecorder = new MediaRecorder(dest.stream, { mimeType: 'audio/webm' });
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const downloadPromise = new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `tts-audio-${Date.now()}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          audioContext.close();
          toast({ title: "Downloaded!", description: "Audio file saved successfully" });
          resolve();
        };
      });

      mediaRecorder.start();

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = getBrowserVoice();
      if (voice) utterance.voice = voice;

      utterance.onend = () => {
        setTimeout(() => mediaRecorder.stop(), 500);
      };
      utterance.onerror = () => {
        mediaRecorder.stop();
        toast({ title: "Error", description: "Failed to generate audio", variant: "destructive" });
      };

      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);

      await downloadPromise;
    } catch {
      toast({ 
        title: "Browser Limitation", 
        description: "Direct audio download not supported in this browser.",
        variant: "destructive" 
      });
    }
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
        <div className="flex gap-2">
          <Button onClick={generateSpeech} className="flex-1">
            {isSpeaking ? <><VolumeX className="mr-2 h-4 w-4" />Stop</> : <><Volume2 className="mr-2 h-4 w-4" />Generate Speech</>}
          </Button>
          <Button onClick={handleDownload} variant="outline" className="gap-2" disabled={!text.trim()}>
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
