import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle2, XCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;

const ERROR_EXPLANATIONS: Record<string, { title: string; cause: string; fix: string }> = {
  access_denied: {
    title: "Access denied by Google",
    cause: "OAuth consent screen is in Testing mode and your email is not in the Test users list, OR you cancelled the consent screen.",
    fix: "Google Cloud Console → OAuth consent screen → Test users → Add your email. Or publish the app.",
  },
  "403": {
    title: "Google returned 403 Forbidden",
    cause: "The redirect URI on the OAuth Client does not match Supabase's callback URL, or the app is restricted.",
    fix: "Add https://<PROJECT>.supabase.co/auth/v1/callback to Authorized redirect URIs in Google Cloud Console → Credentials.",
  },
  redirect_uri_mismatch: {
    title: "redirect_uri_mismatch",
    cause: "The redirect URI sent to Google does not exactly match one registered in Google Cloud Console.",
    fix: "Copy the Supabase callback URL below and paste it into Authorized redirect URIs.",
  },
  invalid_request: {
    title: "Invalid OAuth request",
    cause: "Client ID / Secret is missing or wrong in Supabase, or scopes are misconfigured.",
    fix: "Re-enter Google Client ID & Secret in Supabase → Authentication → Providers → Google.",
  },
  server_error: {
    title: "Supabase server error",
    cause: "Supabase couldn't complete the OAuth exchange (bad secret, provider disabled).",
    fix: "Confirm Google provider is enabled in Supabase and credentials are saved.",
  },
};

export default function AuthDebug() {
  const [params] = useSearchParams();
  const [session, setSession] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const errorCode = params.get("error") || hashParams.get("error");
  const errorDesc = params.get("error_description") || hashParams.get("error_description");

  const origin = window.location.origin;
  const callbackUrl = `${SUPABASE_URL}/auth/v1/callback`;
  const appCallback = `${origin}/auth/callback`;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  const copy = (val: string) => {
    navigator.clipboard.writeText(val);
    toast.success("Copied");
  };

  const testGoogle = async () => {
    setTesting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: appCallback },
    });
    if (error) {
      toast.error(error.message);
      setTesting(false);
    }
  };

  const explanation = errorCode ? ERROR_EXPLANATIONS[errorCode] || ERROR_EXPLANATIONS[errorDesc?.includes("403") ? "403" : ""] : null;

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col gap-1 rounded-lg border border-border/50 bg-muted/30 p-3">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <code className="flex-1 break-all text-sm">{value}</code>
        <Button size="icon" variant="ghost" onClick={() => copy(value)}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Google Sign-in Diagnostics</h1>
          <p className="text-muted-foreground">Exact error cause and current callback configuration.</p>
        </div>

        {errorCode && (
          <Card className="border-destructive/50 bg-destructive/5 p-5">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-5 w-5 text-destructive" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">{errorCode}</Badge>
                  {explanation && <span className="font-semibold">{explanation.title}</span>}
                </div>
                {errorDesc && <p className="text-sm text-muted-foreground">{decodeURIComponent(errorDesc)}</p>}
                {explanation && (
                  <div className="mt-2 space-y-1 text-sm">
                    <p><strong>Cause:</strong> {explanation.cause}</p>
                    <p className="flex items-start gap-1"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" /><span><strong>Fix:</strong> {explanation.fix}</span></p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {!errorCode && (
          <Card className="border-green-500/30 bg-green-500/5 p-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              No OAuth error in the URL. Click "Test Google Sign-in" below to trigger the flow.
            </div>
          </Card>
        )}

        <Card className="space-y-3 p-5">
          <h2 className="text-lg font-semibold">Current Configuration</h2>
          <Row label="App Origin" value={origin} />
          <Row label="Supabase URL" value={SUPABASE_URL} />
          <Row label="Supabase Project Ref" value={SUPABASE_PROJECT_ID} />
          <Row label="Supabase OAuth Callback (add to Google Cloud Console)" value={callbackUrl} />
          <Row label="App Callback (redirectTo)" value={appCallback} />
          <Row label="Session" value={session ? `Signed in as ${session.user.email}` : "Not signed in"} />
        </Card>

        <Card className="space-y-3 p-5">
          <h2 className="text-lg font-semibold">Required Setup Checklist</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            <li>
              <strong>Google Cloud Console → Credentials → OAuth Client:</strong> Add the Supabase callback URL above to <em>Authorized redirect URIs</em>.
            </li>
            <li>
              <strong>Google Cloud Console → OAuth consent screen:</strong> If in <em>Testing</em>, add your email under <em>Test users</em>.
            </li>
            <li>
              <strong>Supabase → Authentication → Providers → Google:</strong> Enable and paste Client ID + Secret.
            </li>
            <li>
              <strong>Supabase → Authentication → URL Configuration:</strong> Set Site URL to <code>{origin}</code> and add <code>{appCallback}</code> to Redirect URLs.
            </li>
          </ol>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" asChild>
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer">
                Google Credentials <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/auth/providers`} target="_blank" rel="noreferrer">
                Supabase Providers <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/auth/url-configuration`} target="_blank" rel="noreferrer">
                Supabase URL Config <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          </div>
        </Card>

        <Button onClick={testGoogle} disabled={testing} size="lg" className="w-full">
          {testing ? "Redirecting to Google..." : "Test Google Sign-in"}
        </Button>
      </div>
    </div>
  );
}
