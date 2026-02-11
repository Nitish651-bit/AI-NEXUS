import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Volume2, VolumeX } from 'lucide-react';

export const ElevenLabsTTS = () => {
  const [text, setText] = useState('');
  const [selectedLang, setSelectedLang] = useState('en-US');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();

  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'zh-CN', name: 'Chinese' },
    { code: 'ar-SA', name: 'Arabic' },
    { code: 'pt-BR', name: 'Portuguese' },
    { code: 'ru-RU', name: 'Russian' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'nl-NL', name: 'Dutch' },
    { code: 'tr-TR', name: 'Turkish' },
  ];

  const generateSpeech = () => {
    if (!text.trim()) {
      toast({ title: "Text required", description: "Please enter some text to convert to speech", variant: "destructive" });
      return;
    }

    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLang;
    utterance.rate = 1;
    utterance.pitch = 1;

    const voices = speechSynthesis.getVoices();
    const match = voices.find(v => v.lang === selectedLang) || voices.find(v => v.lang.startsWith(selectedLang.split('-')[0]));
    if (match) utterance.voice = match;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      toast({ title: "Error", description: "Speech synthesis failed", variant: "destructive" });
    };

    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    toast({ title: "Playing", description: `Speaking in ${languages.find(l => l.code === selectedLang)?.name}` });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Multilingual Text-to-Speech
        </CardTitle>
        <CardDescription>Convert text to speech in 100+ languages using Browser Speech API</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Language</label>
          <Select value={selectedLang} onValueChange={setSelectedLang}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Text to Convert</label>
          <Textarea placeholder="Enter the text you want to convert to speech..." value={text} onChange={(e) => setText(e.target.value)} rows={4} />
        </div>
        <Button onClick={generateSpeech} className="w-full">
          {isSpeaking ? <><VolumeX className="w-4 h-4 mr-2" />Stop</> : <><Volume2 className="w-4 h-4 mr-2" />Generate Speech</>}
        </Button>
      </CardContent>
    </Card>
  );
};
