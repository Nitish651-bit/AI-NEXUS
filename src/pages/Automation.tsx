import { AutomationDashboard } from "@/components/automation/AutomationDashboard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SEO } from "@/components/seo/SEO";
import logo from "@/assets/ai-nexus-logo.png";

const Automation = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="AI Automation — Real AI-Powered Workflows | AI Nexus"
        description="Build and run real AI-powered automation workflows. Templates, history, and a visual workflow builder powered by AI Nexus."
        path="/automation"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "AI Nexus Automation",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: "https://aiiinexus.lovable.app/automation",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <header className="glass-card border-b border-holo-blue/20 sticky top-0 z-10">
        <div className="max-w-[1920px] mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <ArrowLeft size={16} />
              </Button>
              <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0">
                <img src={logo} alt="AI Nexus" className="w-full h-full object-contain rounded-full drop-shadow-[0_0_20px_rgba(0,212,255,0.4)]" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  AI Nexus Automation
                </h1>
                <p className="text-xs text-muted-foreground">Real AI-powered workflows</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1920px] mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <AutomationDashboard />
      </div>
    </div>
  );
};

export default Automation;
