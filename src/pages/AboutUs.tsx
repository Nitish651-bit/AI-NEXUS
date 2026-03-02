import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Eye, Rocket, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/ai-nexus-logo.png";

const AboutUs = () => {
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
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-4">About AI NEXUS</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your Unified AI Operations Platform
          </p>
          <div className="w-24 h-1 bg-primary mx-auto mt-6 rounded-full" />
        </section>

        {/* Overview */}
        <section className="glass-card border border-border rounded-2xl p-6 sm:p-10 mb-10">
          <p className="text-secondary-foreground leading-relaxed text-base sm:text-lg">
            AI NEXUS is a scalable, web-based unified platform that integrates over 910 artificial intelligence tools into a single intelligent ecosystem. Designed for professionals, developers, creators, researchers, and enterprises, AI NEXUS eliminates the inefficiency of juggling fragmented AI services by centralizing them under one powerful interface.
          </p>
        </section>

        {/* Mission & Vision */}
        <div className="grid sm:grid-cols-2 gap-6 mb-10">
          <div className="glass-card border border-border rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Mission</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              To democratize access to artificial intelligence by providing a single, cohesive platform where users can discover, compare, and deploy the most advanced AI tools available -- without switching between dozens of subscriptions, interfaces, or workflows.
            </p>
          </div>
          <div className="glass-card border border-border rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Vision</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              To become the world's most comprehensive AI operations hub, enabling individuals and organizations to harness the full potential of artificial intelligence from one unified command center.
            </p>
          </div>
        </div>

        {/* Objectives */}
        <section className="glass-card border border-border rounded-2xl p-6 sm:p-10 mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Objectives</h2>
          </div>
          <ul className="space-y-4">
            {[
              "Aggregate and curate 910+ AI tools spanning every major domain, from conversational AI and coding assistants to cybersecurity, data science, and business automation.",
              "Provide intelligent tool routing that recommends the optimal AI solution for any given task.",
              "Deliver a seamless, enterprise-grade user experience with real-time integrations, usage analytics, and workflow automation.",
              "Continuously expand the platform catalog to keep pace with the rapidly evolving AI landscape.",
            ].map((item, i) => (
              <li key={i} className="flex gap-3 text-muted-foreground">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Benefits */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">Platform Benefits</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { title: "Centralized Access", desc: "Stop context-switching between platforms. Access conversational AI, image generators, video tools, coding assistants, and hundreds more from a single dashboard." },
              { title: "Intelligent Recommendations", desc: "The built-in AI Tool Router analyzes your task description and recommends the best-fit tools, factoring in cost, complexity, and capability." },
              { title: "Cross-Domain Coverage", desc: "AI NEXUS spans nine major categories and dozens of specialized verticals including legal AI, medical AI, real estate intelligence, financial modeling, and manufacturing optimization." },
              { title: "Enterprise-Ready Architecture", desc: "Built on modern cloud infrastructure with role-based access, usage tracking, secure authentication, and scalable edge functions." },
            ].map((benefit, i) => (
              <div key={i} className="glass-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-primary mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center glass-card border border-primary/20 rounded-2xl p-8 sm:p-12">
          <p className="text-secondary-foreground text-lg leading-relaxed max-w-3xl mx-auto mb-6">
            AI NEXUS is not just a directory. It is an operational layer for AI -- a launchpad where every tool, every model, and every capability is one click away.
          </p>
          <Button variant="holo" size="lg" onClick={() => navigate("/")}>
            Explore AI Tools
          </Button>
        </section>
      </main>
    </div>
  );
};

export default AboutUs;
