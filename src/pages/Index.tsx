import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate authentication
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setUserEmail(email);
    setIsLoggedIn(true);
    setIsLoading(false);
    
    toast({
      title: "Welcome to AI Nexus!",
      description: "You now have access to 700+ AI tools.",
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail("");
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
