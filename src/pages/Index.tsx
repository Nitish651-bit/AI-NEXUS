import { LoginForm } from "@/components/auth/LoginForm";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { SEO } from "@/components/seo/SEO";

const Index = () => {
  const { user, isLoading, isAuthenticated, signIn, signUp, signInWithGoogle, signOut, resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSignIn = async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    if (!error) {
      toast({
        title: "Welcome to AI Nexus!",
        description: "You now have access to 910+ AI tools.",
      });
    }
    return { error };
  };

  const handleSignUp = async (email: string, password: string, fullName?: string) => {
    const { error } = await signUp(email, password, fullName);
    if (!error) {
      toast({
        title: "Account created!",
        description: "Please check your email to confirm your account.",
      });
    }
    return { error };
  };

  const handleResetPassword = async (email: string) => {
    const { error } = await resetPassword(email);
    if (!error) {
      toast({
        title: "Reset email sent!",
        description: "Check your inbox for the password reset link.",
      });
    }
    return { error };
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logged out",
      description: "See you next time!",
    });
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading AI Nexus...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Dashboard userEmail={user.email || ""} onLogout={handleLogout} />;
  }

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: "Google Sign-In Failed",
        description: error.message,
        variant: "destructive",
      });
    }
    return { error };
  };

  return (
    <>
      <SEO
        title="AI Nexus — 910+ AI Tools in One Platform | ChatGPT, Claude, Gemini, Midjourney"
        description="The world's most complete AI ecosystem. Access 910+ AI tools for chat, code, image, video, voice, automation & SEO — all in one futuristic platform. Free to start."
        path="/"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "AI Nexus",
            alternateName: "AI Nexus 910+",
            url: "https://aiiinexus.lovable.app",
            inLanguage: ["en", "es", "fr", "de", "pt", "hi", "zh", "ja", "ar", "ru"],
            potentialAction: {
              "@type": "SearchAction",
              target: "https://aiiinexus.lovable.app/?q={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "AI Nexus",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web, iOS, Android",
            url: "https://aiiinexus.lovable.app",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", ratingCount: "2480" },
          },
        ]}
      />
      <LoginForm
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onResetPassword={handleResetPassword}
        onGoogleSignIn={handleGoogleSignIn}
        isLoading={isLoading}
      />
    </>
  );
};

export default Index;
