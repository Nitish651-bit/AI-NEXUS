import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const AIToolRouter = () => {
  const [userRequest, setUserRequest] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendation, setRecommendation] = useState<any>(null);
  const { toast } = useToast();

  const availableTools = [
    'ChatGPT', 'DALL-E', 'Midjourney', 'Claude', 'Gemini',
    'Stable Diffusion', 'ElevenLabs', 'Whisper', 'GPT-4 Vision',
    'Code Interpreter', 'DALL-E 3', 'GPT-5'
  ];

  const analyzeRequest = async () => {
    if (!userRequest.trim()) {
      toast({
        title: "Input required",
        description: "Please describe what you want to do",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-tool-router', {
        body: {
          userRequest,
          availableTools,
        }
      });

      if (error) throw error;

      if (data.success) {
        setRecommendation(data.recommendation);
        toast({
          title: "Analysis complete!",
          description: `Found ${data.recommendation.recommendedTools.length} recommended tools`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Router error:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI Tool Router
        </CardTitle>
        <CardDescription>
          Let AI recommend the best tools for your task
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Describe what you want to do (e.g., 'generate a logo for my startup')"
            value={userRequest}
            onChange={(e) => setUserRequest(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && analyzeRequest()}
          />
          <Button onClick={analyzeRequest} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>Analyzing...</>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Analyze
              </>
            )}
          </Button>
        </div>

        {recommendation && (
          <div className="space-y-4 mt-6 p-4 bg-secondary/20 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <h3 className="font-semibold text-lg">Recommended Tools</h3>
                <div className="flex flex-wrap gap-2">
                  {recommendation.recommendedTools.map((tool: string) => (
                    <Badge key={tool} variant="secondary" className="text-sm">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Badge className={getCostColor(recommendation.estimatedCost)}>
                  {recommendation.estimatedCost} cost
                </Badge>
                <Badge variant="outline">
                  {recommendation.complexity}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Why these tools?
              </h4>
              <p className="text-sm text-muted-foreground">
                {recommendation.reasoning}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
