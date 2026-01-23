import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const LovableAIImage = () => {
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage("");

    try {
      const { data, error } = await supabase.functions.invoke('lovable-ai-image', {
        body: { prompt }
      });

      if (error) {
        throw error;
      }

      if (!data?.success || !data?.imageUrl) {
        throw new Error(data?.error || "Failed to generate image");
      }

      setGeneratedImage(data.imageUrl);
      toast({
        title: "Success",
        description: "Image generated successfully!",
      });
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Image className="w-5 h-5 text-primary" />
          <CardTitle>AI Image Generation</CardTitle>
        </div>
        <CardDescription>
          Generate stunning images using Lovable AI - Powered by Gemini 2.5 Flash
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">Image Prompt</Label>
          <Input
            id="prompt"
            placeholder="A futuristic city with flying cars at sunset..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generateImage()}
          />
        </div>

        <Button 
          onClick={generateImage} 
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
              <Image className="mr-2 h-4 w-4" />
              Generate Image
            </>
          )}
        </Button>

        {generatedImage && (
          <div className="space-y-3">
            <Label>Generated Image</Label>
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden border bg-card">
                <img 
                  src={generatedImage} 
                  alt="Generated AI Image" 
                  className="w-full h-auto"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button 
                  variant="default" 
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = generatedImage;
                    a.download = `ai-nexus-image-${Date.now()}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Image
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="w-full"
                  onClick={generateImage}
                  disabled={isGenerating}
                >
                  Generate New
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
