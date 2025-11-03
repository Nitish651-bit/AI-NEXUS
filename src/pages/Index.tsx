import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isLoggedIn, userEmail, login, logout } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate authentication
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    login(email);
    setIsLoading(false);
    
    toast({
      title: "Welcome to AI Nexus!",
      description: "You now have access to 700+ AI tools.",
    });
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "See you next time!",
    });
  };

  if (isLoggedIn) {
    return <Dashboard userEmail={userEmail} onLogout={handleLogout} />;
  }

  return <LoginForm onLogin={handleLogin} isLoading={isLoading} />;
};

export default Index;
