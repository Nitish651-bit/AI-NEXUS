import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Image, Sparkles } from 'lucide-react';

export const ReplicateImageGen = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please describe the image you want to generate",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('replicate-image', {
        body: { prompt }
      });

      if (error) throw error;

      if (data.success && data.output && data.output[0]) {
        setImageUrl(data.output[0]);
        toast({
          title: "Image generated!",
          description: "Your image is ready",
        });
      } else {
        throw new Error(data.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('Image generation error:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="w-5 h-5" />
          AI Image Generator
        </CardTitle>
        <CardDescription>
          Generate stunning images with Replicate's Flux model
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Describe the image you want to create..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && generateImage()}
          />
          <Button onClick={generateImage} disabled={isGenerating}>
            {isGenerating ? (
              'Generating...'
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>

        {imageUrl && (
          <div className="space-y-2">
            <img 
              src={imageUrl} 
              alt="Generated" 
              className="w-full rounded-lg border"
            />
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                const a = document.createElement('a');
                a.href = imageUrl;
                a.download = 'generated-image.webp';
                a.click();
              }}
            >
              Download Image
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
