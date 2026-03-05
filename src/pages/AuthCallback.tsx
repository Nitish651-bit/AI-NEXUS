import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle } from "lucide-react";

/**
 * Handles Supabase auth redirects: email verification, OAuth callbacks, and password recovery.
 * Route: /auth/callback
 * 
 * Supabase appends tokens as URL hash fragments (#access_token=...&type=...).
 * This page detects the type and redirects appropriately.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verifying your account...");

  useEffect(() => {
    const hash = window.location.hash;

    // If type=recovery, redirect to reset password page with the hash intact
    if (hash.includes("type=recovery")) {
      navigate(`/reset-password${hash}`, { replace: true });
      return;
    }

    // For signup verification or OAuth callback, wait for session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setMessage("Account verified! Redirecting to dashboard...");
        setTimeout(() => navigate("/", { replace: true }), 1500);
      }
      if (event === "PASSWORD_RECOVERY") {
        navigate(`/reset-password${hash}`, { replace: true });
      }
    });

    // Fallback: check if session already exists
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !hash.includes("type=recovery")) {
        setMessage("Account verified! Redirecting...");
        setTimeout(() => navigate("/", { replace: true }), 1500);
      }
    });

    // Timeout fallback
    const timeout = setTimeout(() => {
      navigate("/", { replace: true });
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4">
        {message.includes("verified") ? (
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
        ) : (
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        )}
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export default AuthCallback;
