import { AIToolRouter } from '@/components/integrations/AIToolRouter';
import { ElevenLabsTTS } from '@/components/integrations/ElevenLabsTTS';
import { ReplicateImageGen } from '@/components/integrations/ReplicateImageGen';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from "@/assets/ai-nexus-logo.png";

export const Integrations = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12">
              <img 
                src={logo} 
                alt="AI Nexus" 
                className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(0,212,255,0.4)]" 
              />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AI Nexus
            </h1>
          </div>
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
