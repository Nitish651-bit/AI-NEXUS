import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, Zap } from "lucide-react";
import logo from "@/assets/ai-nexus-logo.png";

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  isLoading?: boolean;
}

export function LoginForm({ onLogin, isLoading = false }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo Section */}
        <div className="text-center space-y-6 animate-fade-in">
          <div className="inline-flex items-center justify-center w-32 h-32 animate-float">
            <img 
              src={logo} 
              alt="AI Nexus - Ultimate AI Platform" 
              className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(0,212,255,0.5)]" 
            />
          </div>
          <div className="space-y-3">
            <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent leading-tight tracking-tight">
              AI Nexus
            </h1>
            <p className="text-xl font-semibold text-holo-blue">
              Your Ultimate AI Tools Platform
            </p>
            <p className="text-muted-foreground text-base max-w-lg mx-auto leading-relaxed">
              Access 150+ Cutting-Edge AI Tools: ChatGPT, Claude, Midjourney & More
            </p>
            <p className="text-muted-foreground/80 text-sm">
              The Best AI Platform for Chat, Coding, Design & Automation
            </p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="glass-card p-10 shadow-holo border border-holo-blue/30 backdrop-blur-xl animate-scale-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground bg-gradient-primary bg-clip-text text-transparent">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h2>
              <p className="text-muted-foreground mt-2 text-base">
                {isSignUp ? "Join thousands of AI enthusiasts" : "Sign in to your account"}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="bg-background/50 border-holo-blue/30 focus:border-holo-blue"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="bg-background/50 border-holo-blue/30 focus:border-holo-blue pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="holo"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing {isSignUp ? "up" : "in"}...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap size={16} />
                  {isSignUp ? "Create Account" : "Sign In"}
                </div>
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-holo-blue hover:text-holo-blue-light transition-colors"
              >
                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        </Card>

        {/* Feature Preview */}
        <div className="text-center space-y-3 animate-fade-in">
          <div className="glass-card p-4 border border-holo-blue/20 rounded-lg">
            <p className="text-sm font-medium text-holo-blue-light mb-2">
              🚀 150+ AI Tools • 🔒 Enterprise-Grade Security • ⚡ Lightning Fast Performance
            </p>
            <div className="text-xs text-muted-foreground space-y-1.5">
              <p className="flex items-center justify-center gap-2">
                <span className="inline-block w-1 h-1 rounded-full bg-electric-blue"></span>
                Featured AI Tools: ChatGPT, Claude, Gemini, Midjourney, GitHub Copilot
              </p>
              <p className="flex items-center justify-center gap-2">
                <span className="inline-block w-1 h-1 rounded-full bg-cyber-purple"></span>
                Categories: AI Chat, Code Generation, Image Creation, Video Editing & More
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}