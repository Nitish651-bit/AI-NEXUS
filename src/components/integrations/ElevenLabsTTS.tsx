import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Volume2, Play, Download } from 'lucide-react';

const voices = [
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura' },
];

export const ElevenLabsTTS = () => {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(voices[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const generateSpeech = async () => {
    if (!text.trim()) {
      toast({
        title: "Text required",
        description: "Please enter some text to convert to speech",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { text, voice: selectedVoice }
      });

      if (error || !data?.success || !data?.audioContent) {
        console.warn('ElevenLabs TTS failed, using browser speech fallback');
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
        toast({
          title: "Playing with browser voice",
          description: "ElevenLabs API key is invalid. Using browser speech instead.",
        });
        return;
      }

      const audioBlob = base64ToBlob(data.audioContent, 'audio/mpeg');
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      toast({ title: "Speech generated!", description: "Your audio is ready to play" });
    } catch (error) {
      console.warn('TTS error, using browser fallback:', error);
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utterance);
      toast({
        title: "Playing with browser voice",
        description: "ElevenLabs unavailable. Using browser speech instead.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const base64ToBlob = (base64: string, mimeType: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = 'speech.mp3';
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Text-to-Speech
        </CardTitle>
        <CardDescription>
          Convert text to natural-sounding speech with ElevenLabs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Voice</label>
          <Select value={selectedVoice} onValueChange={setSelectedVoice}>
            <SelectTrigger>
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

        <div className="space-y-2">
          <label className="text-sm font-medium">Text to Convert</label>
          <Textarea
            placeholder="Enter the text you want to convert to speech..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
          />
        </div>

        <Button onClick={generateSpeech} disabled={isGenerating} className="w-full">
          {isGenerating ? 'Generating...' : 'Generate Speech'}
        </Button>

        {audioUrl && (
          <div className="space-y-3 p-4 bg-secondary/20 rounded-lg">
            <audio controls src={audioUrl} className="w-full" />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                const audio = new Audio(audioUrl);
                audio.play();
              }}>
                <Play className="w-4 h-4 mr-2" />
                Play
              </Button>
              <Button variant="outline" size="sm" onClick={downloadAudio}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
