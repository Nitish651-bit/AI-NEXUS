import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle2, XCircle, AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
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

const KNOWN_ORIGINS = [
  "https://aiiinexus.lovable.app",
  "https://id-preview--7343125c-bfca-4d09-94f3-c82809ae3545.lovable.app",
  "http://localhost:8080",
];

type CheckStatus = "pass" | "fail" | "warn" | "pending";
interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  fix?: string;
}

export default function AuthDebug() {
  const [params] = useSearchParams();
  const [session, setSession] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [checks, setChecks] = useState<Check[]>([]);
  const [runningChecks, setRunningChecks] = useState(false);

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const errorCode = params.get("error") || hashParams.get("error");
  const errorDesc = params.get("error_description") || hashParams.get("error_description");

  const origin = window.location.origin;
  const callbackUrl = `${SUPABASE_URL}/auth/v1/callback`;
  const appCallback = `${origin}/auth/callback`;

  const runChecks = async () => {
    setRunningChecks(true);
    const results: Check[] = [];

    // 1. Secure context (HTTPS or localhost)
    const isLocal = origin.startsWith("http://localhost");
    results.push({
      id: "secure",
      label: "Secure context (HTTPS or localhost)",
      status: window.isSecureContext ? "pass" : "fail",
      detail: `Origin: ${origin}`,
      fix: window.isSecureContext ? undefined : "OAuth requires HTTPS. Publish or use localhost.",
    });

    // 2. Origin is one of the known origins we recommend registering with Google
    const originKnown = KNOWN_ORIGINS.includes(origin);
    results.push({
      id: "origin-known",
      label: "Current origin is a recognized app origin",
      status: originKnown ? "pass" : "warn",
      detail: originKnown
        ? `${origin} matches one of the recommended origins.`
        : `${origin} is not in the recommended list — you must also add it to Google Authorized JavaScript origins.`,
      fix: originKnown
        ? undefined
        : `Add "${origin}" to Google Cloud Console → Credentials → Authorized JavaScript origins.`,
    });

    // 3. Supabase env vars present
    const envOk = !!SUPABASE_URL && !!SUPABASE_PROJECT_ID;
    results.push({
      id: "env",
      label: "Supabase env vars loaded",
      status: envOk ? "pass" : "fail",
      detail: envOk ? `Project: ${SUPABASE_PROJECT_ID}` : "VITE_SUPABASE_URL / VITE_SUPABASE_PROJECT_ID missing",
      fix: envOk ? undefined : "Reconnect Supabase to regenerate .env.",
    });

    // 4. Supabase callback URL well-formed
    const callbackOk = /^https:\/\/[a-z0-9]+\.supabase\.co\/auth\/v1\/callback$/.test(callbackUrl);
    results.push({
      id: "callback-shape",
      label: "Supabase OAuth callback URL is well-formed",
      status: callbackOk ? "pass" : "fail",
      detail: callbackUrl,
      fix: callbackOk ? undefined : "Callback URL does not match expected pattern.",
    });

    // 5. Supabase settings endpoint reachable + Google provider enabled
    try {
      const anonKey = (supabase as any).supabaseKey || (supabase as any).auth?.storageKey || "";
      const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const googleEnabled = !!json?.external?.google;
      results.push({
        id: "provider",
        label: "Google provider enabled in Supabase",
        status: googleEnabled ? "pass" : "fail",
        detail: googleEnabled ? "external.google = true" : "external.google = false",
        fix: googleEnabled
          ? undefined
          : "Supabase Dashboard → Authentication → Providers → Google → Enable + save Client ID & Secret.",
      });
      // 6. Site URL check from settings
      const siteUrl = json?.site_url || json?.SITE_URL;
      if (siteUrl) {
        const siteMatches = KNOWN_ORIGINS.includes(siteUrl);
        results.push({
          id: "site-url",
          label: "Supabase Site URL is production origin",
          status: siteMatches ? "pass" : "warn",
          detail: `Site URL: ${siteUrl}`,
          fix: siteMatches
            ? undefined
            : `Set Supabase → URL Configuration → Site URL to https://aiiinexus.lovable.app.`,
        });
      }
    } catch (e: any) {
      results.push({
        id: "provider",
        label: "Google provider enabled in Supabase",
        status: "warn",
        detail: `Could not read auth settings: ${e?.message ?? e}`,
        fix: "Check that the Supabase project is up and the anon key is valid.",
      });
    }

    // 7. Verify Supabase authorize endpoint redirects to Google (proves redirect_uri accepted at Supabase side)
    try {
      const authorizeUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(
        appCallback,
      )}`;
      // We use no-cors + manual: browsers hide redirect target, but if the response is opaqueredirect that means a redirect happened.
      const res = await fetch(authorizeUrl, { method: "GET", redirect: "manual", mode: "no-cors" });
      // In no-cors mode redirect: manual → response.type === 'opaqueredirect'
      const redirected = res.type === "opaqueredirect" || (res.status >= 300 && res.status < 400);
      results.push({
        id: "authorize",
        label: "Supabase /authorize redirects to Google",
        status: redirected ? "pass" : "warn",
        detail: `type=${res.type} status=${res.status}`,
        fix: redirected
          ? undefined
          : "Supabase did not issue a redirect — Google provider may be disabled or misconfigured.",
      });
    } catch (e: any) {
      results.push({
        id: "authorize",
        label: "Supabase /authorize redirects to Google",
        status: "warn",
        detail: `Fetch blocked or failed: ${e?.message ?? e}`,
      });
    }

    // 8. appCallback in known list (Supabase Redirect URLs whitelist)
    const appCbKnown = KNOWN_ORIGINS.some((o) => appCallback === `${o}/auth/callback`);
    results.push({
      id: "app-cb",
      label: "App callback (redirectTo) is in the recommended set",
      status: appCbKnown ? "pass" : "warn",
      detail: appCallback,
      fix: appCbKnown
        ? undefined
        : `Add "${appCallback}" to Supabase → URL Configuration → Redirect URLs.`,
    });

    // 9. Localhost dev warning
    if (isLocal) {
      results.push({
        id: "localhost",
        label: "Running on localhost",
        status: "warn",
        detail: "Google requires http://localhost:8080 registered in Authorized JavaScript origins for dev.",
      });
    }

    setChecks(results);
    setRunningChecks(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    runChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const clearAndRetry = async () => {
    setTesting(true);
    try {
      // 1. Sign out from Supabase (revokes refresh token + clears its storage)
      await supabase.auth.signOut({ scope: "global" }).catch(() => {});

      // 2. Nuke any lingering Supabase auth entries from localStorage / sessionStorage
      const purge = (store: Storage) => {
        const keys: string[] = [];
        for (let i = 0; i < store.length; i++) {
          const k = store.key(i);
          if (k && (k.startsWith("sb-") || k.includes("supabase.auth"))) keys.push(k);
        }
        keys.forEach((k) => store.removeItem(k));
      };
      purge(window.localStorage);
      purge(window.sessionStorage);

      // 3. Best-effort clear of non-HttpOnly cookies on this origin
      document.cookie.split(";").forEach((c) => {
        const name = c.split("=")[0].trim();
        if (!name) return;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      });

      setSession(null);
      toast.success("Session cleared. Redirecting to Google...");

      // 4. Fresh OAuth call — Supabase generates a new state + PKCE verifier
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: appCallback, queryParams: { prompt: "select_account" } },
      });
      if (error) {
        toast.error(error.message);
        setTesting(false);
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to clear session");
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

        <div className="grid gap-2 sm:grid-cols-2">
          <Button onClick={testGoogle} disabled={testing} size="lg" variant="outline">
            {testing ? "Redirecting..." : "Test Google Sign-in"}
          </Button>
          <Button onClick={clearAndRetry} disabled={testing} size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            {testing ? "Clearing..." : "Clear session & retry Google"}
          </Button>
        </div>
      </div>
    </div>
  );
}
