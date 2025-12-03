import { LoginForm } from "@/components/auth/LoginForm";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, isLoading, isAuthenticated, signIn, signUp, signOut, resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSignIn = async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    if (!error) {
      toast({
        title: "Welcome to AI Nexus!",
        description: "You now have access to 700+ AI tools.",
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

  return (
    <LoginForm 
      onSignIn={handleSignIn} 
      onSignUp={handleSignUp} 
      onResetPassword={handleResetPassword}
      isLoading={isLoading} 
    />
  );
};

export default Index;
