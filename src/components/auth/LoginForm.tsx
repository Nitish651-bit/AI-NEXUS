import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, Zap, Loader2, ArrowLeft } from "lucide-react";
import logo from "@/assets/ai-nexus-logo.png";

type FormMode = 'signIn' | 'signUp' | 'forgotPassword';

interface LoginFormProps {
  onSignIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  onSignUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  onResetPassword: (email: string) => Promise<{ error: Error | null }>;
  isLoading?: boolean;
}

export function LoginForm({ onSignIn, onSignUp, onResetPassword, isLoading = false }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<FormMode>('signIn');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'forgotPassword') {
        const { error } = await onResetPassword(email);
        if (error) {
          setError(error.message);
        } else {
          setSuccessMessage('Password reset email sent! Check your inbox and click the link to reset your password.');
        }
      } else if (mode === 'signUp') {
        const { error } = await onSignUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            setError('This email is already registered. Please sign in instead.');
          } else {
            setError(error.message);
          }
        } else {
          setSuccessMessage('Account created! Please check your email to confirm your account.');
        }
      } else {
        const { error } = await onSignIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login')) {
            setError('Invalid email or password. Please try again.');
          } else if (error.message.includes('Email not confirmed')) {
            setError('Please confirm your email before signing in.');
          } else {
            setError(error.message);
          }
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (newMode: FormMode) => {
    setMode(newMode);
    setError(null);
    setSuccessMessage(null);
  };

  const loading = isLoading || isSubmitting;

  const getTitle = () => {
    switch (mode) {
      case 'signUp': return 'Create Account';
      case 'forgotPassword': return 'Reset Password';
      default: return 'Welcome Back';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'signUp': return 'Join thousands of AI enthusiasts';
      case 'forgotPassword': return 'Enter your email to receive a reset link';
      default: return 'Sign in to your account';
    }
  };

  const getButtonText = () => {
    if (loading) {
      switch (mode) {
        case 'signUp': return 'Creating account...';
        case 'forgotPassword': return 'Sending reset link...';
        default: return 'Signing in...';
      }
    }
    switch (mode) {
      case 'signUp': return 'Create Account';
      case 'forgotPassword': return 'Send Reset Link';
      default: return 'Sign In';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-sm sm:max-w-md space-y-6 sm:space-y-8">
        {/* Logo Section */}
        <div className="text-center space-y-4 sm:space-y-6 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-32 sm:h-32 animate-float">
            <img 
              src={logo} 
              alt="AI Nexus - Ultimate AI Platform" 
              className="w-full h-full object-contain rounded-full drop-shadow-[0_0_40px_rgba(0,212,255,0.5)]" 
            />
          </div>
          <div className="space-y-2 sm:space-y-3">
            <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent leading-tight tracking-tight">
              AI Nexus
            </h1>
            <p className="text-base sm:text-xl font-semibold text-holo-blue">
              Your Ultimate AI Tools Platform
            </p>
            <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              Access 910+ Cutting-Edge AI Tools: ChatGPT, Claude, Midjourney & More
            </p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="glass-card p-6 sm:p-10 shadow-holo border border-holo-blue/30 backdrop-blur-xl animate-scale-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-8">
              {mode === 'forgotPassword' && (
                <button
                  type="button"
                  onClick={() => switchMode('signIn')}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 mx-auto"
                >
                  <ArrowLeft size={14} />
                  Back to sign in
                </button>
              )}
              <h2 className="text-3xl font-bold text-foreground bg-gradient-primary bg-clip-text text-transparent">
                {getTitle()}
              </h2>
              <p className="text-muted-foreground mt-2 text-base">
                {getSubtitle()}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}
            
            {successMessage && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                {successMessage}
              </div>
            )}

            <div className="space-y-4">
              {mode === 'signUp' && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="bg-background/50 border-holo-blue/30 focus:border-holo-blue"
                  />
                </div>
              )}

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

              {mode !== 'forgotPassword' && (
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
                      minLength={6}
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
                  {mode === 'signUp' && (
                    <p className="text-xs text-muted-foreground">Password must be at least 6 characters</p>
                  )}
                </div>
              )}
            </div>

            {mode === 'signIn' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => switchMode('forgotPassword')}
                  className="text-sm text-holo-blue hover:text-holo-blue-light transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              variant="holo"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {getButtonText()}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap size={16} />
                  {getButtonText()}
                </div>
              )}
            </Button>

            {mode !== 'forgotPassword' && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => switchMode(mode === 'signIn' ? 'signUp' : 'signIn')}
                  className="text-holo-blue hover:text-holo-blue-light transition-colors"
                >
                  {mode === 'signIn' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            )}
          </form>
        </Card>

        {/* Feature Preview */}
        <div className="text-center space-y-3 animate-fade-in">
          <div className="glass-card p-4 border border-holo-blue/20 rounded-lg">
            <p className="text-sm font-medium text-holo-blue-light mb-2">
              🚀 910+ AI Tools • 🔒 Enterprise-Grade Security • ⚡ Lightning Fast Performance
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
