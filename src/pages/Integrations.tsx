import { AIToolRouter } from '@/components/integrations/AIToolRouter';
import { LovableAIImage } from '@/components/integrations/LovableAIImage';
import { OpenAITTS } from '@/components/integrations/OpenAITTS';
import { EmailGenerator } from '@/components/integrations/EmailGenerator';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from "@/assets/ai-nexus-logo.png";

export const Integrations = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12">
              <img 
                src={logo} 
                alt="AI Nexus" 
                className="w-full h-full object-contain rounded-full drop-shadow-[0_0_20px_rgba(0,212,255,0.4)]" 
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AI Nexus
            </h1>
          </div>
          <Button variant="ghost" onClick={() => navigate('/')} className="w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">AI Integrations</h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Powerful AI tools integrated and ready to use
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          <AIToolRouter />
          <EmailGenerator />
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          <OpenAITTS />
          <LovableAIImage />
        </div>
      </div>
    </div>
  );
};
