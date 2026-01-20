import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Server, Wifi, WifiOff, Check, X, Loader2, RefreshCw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface ServiceStatus {
  name: string;
  status: "online" | "offline" | "unknown";
  latency?: number;
}

const STORAGE_KEY = "nexus-server-url";

export default function NexusSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [serverUrl, setServerUrl] = useState("");
  const [savedUrl, setSavedUrl] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Load saved URL on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setServerUrl(saved);
      setSavedUrl(saved);
    }
  }, []);

  const testConnection = async () => {
    if (!serverUrl.trim()) {
      toast({
        title: "Server URL Required",
        description: "Please enter a Nexus server URL to test.",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    setConnectionStatus("connecting");
    setServices([]);

    try {
      // Test via edge function with custom server header
      const { data, error } = await supabase.functions.invoke("nexus-backend-connector", {
        body: { type: "chat", message: "ping" },
        headers: { "x-nexus-server": serverUrl.trim() }
      });

      if (error) throw error;

      if (data?.source === "nexus-local") {
        setConnectionStatus("connected");
        
        // Try to get service status from server
        try {
          const healthResponse = await fetch(`${serverUrl.trim()}/health`, {
            method: "GET",
            signal: AbortSignal.timeout(5000)
          });
          
          if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            
            // Parse service statuses from health endpoint
            const serviceList: ServiceStatus[] = [
              { name: "LLM (Ollama)", status: healthData.llm ? "online" : "offline", latency: healthData.llmLatency },
              { name: "Image Gen (SD)", status: healthData.image ? "online" : "offline", latency: healthData.imageLatency },
              { name: "TTS (Coqui)", status: healthData.tts ? "online" : "offline", latency: healthData.ttsLatency },
              { name: "STT (Whisper)", status: healthData.stt ? "online" : "offline", latency: healthData.sttLatency },
              { name: "Vector DB", status: healthData.vectorDb ? "online" : "offline", latency: healthData.vectorDbLatency },
              { name: "Tool Engine", status: healthData.tools ? "online" : "offline", latency: healthData.toolsLatency },
            ];
            setServices(serviceList);
          }
        } catch {
          // If detailed health fails, just show connected
          setServices([
            { name: "Nexus Core", status: "online" }
          ]);
        }

        toast({
          title: "Connection Successful",
          description: "Connected to self-hosted Nexus server.",
        });
      } else {
        // Fallback was used
        setConnectionStatus("error");
        toast({
          title: "Local Server Unavailable",
          description: `Could not connect to ${serverUrl}. Cloud fallback (${data?.source}) was used.`,
          variant: "destructive"
        });
      }

      setLastChecked(new Date());
    } catch (error) {
      setConnectionStatus("error");
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to server",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const saveSettings = () => {
    if (!serverUrl.trim()) {
      toast({
        title: "Server URL Required",
        description: "Please enter a valid server URL.",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem(STORAGE_KEY, serverUrl.trim());
    setSavedUrl(serverUrl.trim());
    
    toast({
      title: "Settings Saved",
      description: "Nexus server URL has been saved.",
    });
  };

  const clearSettings = () => {
    localStorage.removeItem(STORAGE_KEY);
    setServerUrl("");
    setSavedUrl("");
    setConnectionStatus("disconnected");
    setServices([]);
    setLastChecked(null);
    
    toast({
      title: "Settings Cleared",
      description: "Nexus server configuration has been removed.",
    });
  };

  const getStatusIcon = (status: ConnectionStatus) => {
    switch (status) {
      case "connected":
        return <Wifi className="h-5 w-5 text-accent" />;
      case "connecting":
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case "error":
        return <WifiOff className="h-5 w-5 text-destructive" />;
      default:
        return <WifiOff className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: ConnectionStatus) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-accent/20 text-accent border-accent/30">Connected</Badge>;
      case "connecting":
        return <Badge className="bg-primary/20 text-primary border-primary/30">Testing...</Badge>;
      case "error":
        return <Badge variant="destructive">Connection Failed</Badge>;
      default:
        return <Badge variant="secondary">Not Connected</Badge>;
    }
  };

  const getServiceStatusIcon = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "online":
        return <Check className="h-4 w-4 text-accent" />;
      case "offline":
        return <X className="h-4 w-4 text-destructive" />;
      default:
        return <Loader2 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Server className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Nexus Server Settings</h1>
                <p className="text-sm text-muted-foreground">Configure your self-hosted AI backend</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          {/* Connection Status Card */}
          <Card className="border-border bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(connectionStatus)}
                  <div>
                    <CardTitle className="text-lg">Connection Status</CardTitle>
                    <CardDescription>
                      {lastChecked 
                        ? `Last checked: ${lastChecked.toLocaleTimeString()}`
                        : "Not tested yet"
                      }
                    </CardDescription>
                  </div>
                </div>
                {getStatusBadge(connectionStatus)}
              </div>
            </CardHeader>
            
            {services.length > 0 && (
              <CardContent>
                <div className="grid gap-2">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Services</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {services.map((service) => (
                      <div 
                        key={service.name}
                        className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border"
                      >
                        {getServiceStatusIcon(service.status)}
                        <span className="text-sm truncate">{service.name}</span>
                        {service.latency && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {service.latency}ms
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Server Configuration Card */}
          <Card className="border-border bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Server Configuration</CardTitle>
              <CardDescription>
                Enter the URL of your self-hosted AI Nexus server
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="server-url">Server URL</Label>
                <Input
                  id="server-url"
                  type="url"
                  placeholder="http://localhost:8000 or http://192.168.1.100:8000"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  The base URL of your Nexus backend server (FastAPI + Ollama + Stable Diffusion)
                </p>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={testConnection} 
                  disabled={isTesting || !serverUrl.trim()}
                  className="flex-1"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={saveSettings} 
                  variant="secondary"
                  disabled={!serverUrl.trim() || serverUrl === savedUrl}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>

                <Button 
                  onClick={clearSettings} 
                  variant="outline"
                  disabled={!savedUrl}
                  className="sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>

              {savedUrl && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Saved URL:</span>{" "}
                    <code className="text-xs bg-secondary px-1 py-0.5 rounded">{savedUrl}</code>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card className="border-border bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">Setup Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="space-y-2">
                <p className="font-medium text-foreground">1. Start your Nexus backend server:</p>
                <pre className="p-3 rounded-lg bg-secondary/50 overflow-x-auto text-xs">
                  <code>cd nexus-backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000</code>
                </pre>
              </div>
              
              <div className="space-y-2">
                <p className="font-medium text-foreground">2. Ensure required services are running:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Ollama with LLaMA/Mistral model</li>
                  <li>Stable Diffusion (Automatic1111 or ComfyUI)</li>
                  <li>Coqui/Piper TTS server</li>
                  <li>Whisper for STT</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <p className="font-medium text-foreground">3. For Android access:</p>
                <p>Use your server's local IP address (e.g., http://192.168.1.100:8000) instead of localhost.</p>
              </div>

              <Separator />

              <p className="text-xs">
                When your local server is unavailable, AI Nexus will automatically fall back to cloud APIs 
                (Lovable Gateway, Gemini, OpenAI) if configured.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
