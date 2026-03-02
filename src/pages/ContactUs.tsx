import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Handshake, Clock, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/ai-nexus-logo.png";

const ContactUs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-card border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="AI Nexus" className="w-10 h-10 rounded-full drop-shadow-[0_0_15px_rgba(0,212,255,0.4)]" />
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">AI NEXUS</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            Back
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 animate-fade-in">
        {/* Hero */}
        <section className="text-center mb-16">
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-4">Contact Us</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get in Touch with AI NEXUS
          </p>
          <div className="w-24 h-1 bg-primary mx-auto mt-6 rounded-full" />
        </section>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* General Support */}
          <div className="glass-card border border-border rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">General Support</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              For questions about platform features, account management, tool access, or troubleshooting, reach out to our support team directly.
            </p>
            <a
              href="mailto:ainexus262@gmail.com"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              ainexus262@gmail.com
            </a>
            <p className="text-muted-foreground text-sm mt-3">
              Please include a clear subject line and a brief description of your inquiry so we can route your message to the appropriate team.
            </p>
          </div>

          {/* Collaboration */}
          <div className="glass-card border border-border rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Handshake className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Collaboration and Partnerships</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-3">
              AI NEXUS is built on the principle of ecosystem growth. We actively seek partnerships with:
            </p>
            <ul className="space-y-2 text-muted-foreground text-sm mb-4">
              <li className="flex gap-2"><span className="text-primary">--</span> AI tool developers who want their products featured</li>
              <li className="flex gap-2"><span className="text-primary">--</span> Enterprise teams looking for custom integrations</li>
              <li className="flex gap-2"><span className="text-primary">--</span> Researchers and educators exploring AI adoption</li>
              <li className="flex gap-2"><span className="text-primary">--</span> Content creators covering the AI industry</li>
            </ul>
            <p className="text-muted-foreground text-sm">
              Email <a href="mailto:ainexus262@gmail.com?subject=Partnership%20Inquiry" className="text-primary hover:underline">ainexus262@gmail.com</a> with subject "Partnership Inquiry".
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Response Time */}
          <div className="glass-card border border-border rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Response Time</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              We aim to respond to all inquiries within 24 to 48 business hours. For urgent technical issues, please indicate "Urgent" in your subject line.
            </p>
          </div>

          {/* Follow Updates */}
          <div className="glass-card border border-border rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Follow Our Updates</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Stay informed about new tool additions, platform updates, and AI industry insights by visiting the AI NEXUS dashboard regularly. Major announcements are communicated directly through the platform interface.
            </p>
          </div>
        </div>

        {/* Footer CTA */}
        <section className="text-center glass-card border border-primary/20 rounded-2xl p-8">
          <h3 className="text-lg font-semibold text-foreground mb-2">AI NEXUS</h3>
          <p className="text-muted-foreground mb-4">Your Unified AI Operations Platform</p>
          <a href="mailto:ainexus262@gmail.com" className="text-primary hover:underline font-medium">
            ainexus262@gmail.com
          </a>
        </section>
      </main>
    </div>
  );
};

export default ContactUs;
