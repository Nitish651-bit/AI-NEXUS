import { AIToolRouter } from '@/components/integrations/AIToolRouter';
import { ElevenLabsTTS } from '@/components/integrations/ElevenLabsTTS';
import { ReplicateImageGen } from '@/components/integrations/ReplicateImageGen';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Integrations = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold">AI Integrations</h1>
          <p className="text-muted-foreground text-lg">
            Powerful AI tools integrated and ready to use
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <AIToolRouter />
          <ElevenLabsTTS />
        </div>

        <div className="grid gap-6">
          <ReplicateImageGen />
        </div>
      </div>
    </div>
  );
};
