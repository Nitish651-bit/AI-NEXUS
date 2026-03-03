import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AutomationWorkflow } from "./AutomationWorkflow";
import { AutomationTemplates } from "./AutomationTemplates";
import { AutomationHistory } from "./AutomationHistory";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bot, 
  Clock, 
  Zap, 
  BarChart3, 
  Calendar,
  PlayCircle,
  TrendingUp,
  RefreshCw,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  Link as LinkIcon,
  Send
} from "lucide-react";

interface QuickStartTemplate {
  name: string;
  icon: string;
  description: string;
  steps: Array<{
    tool: string;
    category: string;
    action: string;
    prompt: string;
  }>;
}

interface ActivityItem {
  id: number;
  workflow: string;
  status: string;
  duration: string;
  timestamp: string;
  steps: number;
  results?: Array<{ stepId: string; toolName: string; output: string; success: boolean; error?: string }>;
}

const quickStartTemplates: QuickStartTemplate[] = [
  {
    name: "Content Generation Workflow",
    icon: "📝",
    description: "Generate blog posts and social content using real AI",
    steps: [
      { tool: "ChatGPT (OpenAI)", category: "Chat & Assistants", action: "Generate blog outline", prompt: "Create a detailed blog post outline about AI automation trends in 2026. Include 5 main sections with bullet points." },
      { tool: "Claude (Anthropic)", category: "Chat & Assistants", action: "Write full content", prompt: "Based on the previous outline, write a compelling 500-word blog post. Make it engaging and informative." },
      { tool: "Jasper.ai", category: "Marketing & Content", action: "Create social posts", prompt: "From the blog content above, create 3 social media posts: one for Twitter (280 chars), one for LinkedIn (professional tone), and one for Instagram (with hashtags)." }
    ]
  },
  {
    name: "Code Review & Documentation",
    icon: "💻",
    description: "Analyze code and generate documentation with AI",
    steps: [
      { tool: "GitHub Copilot", category: "Code & Developer Tools", action: "Analyze code patterns", prompt: "Analyze common React component patterns and suggest best practices for state management, error handling, and performance optimization in 2026." },
      { tool: "Claude (Anthropic)", category: "Chat & Assistants", action: "Generate documentation", prompt: "Based on the code analysis above, create comprehensive developer documentation including setup instructions, API reference, and troubleshooting guide." }
    ]
  },
  {
    name: "Business Intelligence Report",
    icon: "📊",
    description: "Generate business analysis and strategic insights",
    steps: [
      { tool: "Claude (Anthropic)", category: "Chat & Assistants", action: "Market analysis", prompt: "Provide a comprehensive market analysis of the AI tools industry in 2026. Include market size, growth trends, key players, and emerging opportunities." },
      { tool: "ChatGPT (OpenAI)", category: "Chat & Assistants", action: "Strategic recommendations", prompt: "Based on the market analysis above, provide 5 actionable strategic recommendations for an AI platform company. Include risks and expected outcomes." },
      { tool: "Notion AI", category: "Productivity & Docs", action: "Format report", prompt: "Format the analysis and recommendations above into a professional executive summary with clear sections, key takeaways, and an action items table." }
    ]
  },
  {
    name: "Email Campaign Generator",
    icon: "📧",
    description: "Create a full email marketing sequence with AI",
    steps: [
      { tool: "ChatGPT (OpenAI)", category: "Chat & Assistants", action: "Email strategy", prompt: "Design a 3-email welcome sequence for a SaaS product launch. Include subject lines, send timing, and audience segments." },
      { tool: "Jasper.ai", category: "Marketing & Content", action: "Write email copy", prompt: "Write the full copy for each of the 3 emails from the strategy above. Use persuasive copywriting techniques, include CTAs, and optimize for conversions." },
      { tool: "Grammarly", category: "Marketing & Content", action: "Polish and optimize", prompt: "Review and improve the email copy above. Fix grammar, improve readability, strengthen CTAs, and ensure a consistent brand voice throughout." }
    ]
  },
  {
    name: "SEO Content Pipeline",
    icon: "🔍",
    description: "Research keywords and create SEO-optimized content",
    steps: [
      { tool: "ChatGPT (OpenAI)", category: "Chat & Assistants", action: "Keyword research", prompt: "Research and list the top 20 high-value keywords for 'AI tools platform' niche. Include search volume estimates, difficulty, and content type recommendations." },
      { tool: "Claude (Anthropic)", category: "Chat & Assistants", action: "Write SEO article", prompt: "Write a 600-word SEO-optimized article targeting the top keywords from above. Include proper H2/H3 structure, internal linking suggestions, and a meta description." },
      { tool: "Jasper.ai", category: "Marketing & Content", action: "Create meta content", prompt: "From the article above, generate: 1) An SEO-optimized title tag (under 60 chars), 2) Meta description (under 160 chars), 3) 5 FAQ schema entries, 4) Social sharing snippets." }
    ]
  }
];

export const AutomationDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [runningWorkflows, setRunningWorkflows] = useState<string[]>([]);
  const [expandedResult, setExpandedResult] = useState<number | null>(null);
  const [zapierWebhookUrl, setZapierWebhookUrl] = useState("");
  const [isTriggeringZap, setIsTriggeringZap] = useState(false);

  const runQuickStartWorkflow = useCallback(async (template: QuickStartTemplate) => {
    if (runningWorkflows.includes(template.name)) return;

    setRunningWorkflows(prev => [...prev, template.name]);
    
    const newActivity: ActivityItem = {
      id: Date.now(),
      workflow: template.name,
      status: "running",
      duration: "0s",
      timestamp: "Just now",
      steps: template.steps.length
    };
    
    setRecentActivity(prev => [newActivity, ...prev.slice(0, 9)]);
    toast.info(`Starting "${template.name}" with ${template.steps.length} real AI steps...`);

    const startTime = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke('workflow-automation', {
        body: {
          workflowName: template.name,
          steps: template.steps.map((s, i) => ({
            id: `quick-${Date.now()}-${i}`,
            toolName: s.tool,
            toolCategory: s.category,
            prompt: s.prompt,
            order: i + 1
          }))
        }
      });

      const duration = Math.round((Date.now() - startTime) / 1000);

      if (error) throw new Error(error.message);
      if (!data?.success && !data?.results?.some((r: any) => r.success)) {
        throw new Error(data?.error || 'Workflow execution failed');
      }

      setRecentActivity(prev =>
        prev.map(a =>
          a.id === newActivity.id
            ? { ...a, status: data.success ? "completed" : "partial", duration: `${duration}s`, results: data.results }
            : a
        )
      );

      const completed = data.results?.filter((r: any) => r.success).length || 0;
      toast.success(`"${template.name}" completed! ${completed}/${template.steps.length} steps succeeded.`);
    } catch (err) {
      const duration = Math.round((Date.now() - startTime) / 1000);
      setRecentActivity(prev =>
        prev.map(a =>
          a.id === newActivity.id
            ? { ...a, status: "failed", duration: `${duration}s` }
            : a
        )
      );
      toast.error(`"${template.name}" failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setRunningWorkflows(prev => prev.filter(w => w !== template.name));
    }
  }, [runningWorkflows]);

  const triggerZapierWebhook = useCallback(async (data?: Record<string, unknown>) => {
    if (!zapierWebhookUrl) {
      toast.error("Please enter your Zapier webhook URL");
      return;
    }
    setIsTriggeringZap(true);
    try {
      await fetch(zapierWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          triggered_from: window.location.origin,
          source: "AI Nexus Automation Hub",
          ...(data || {})
        }),
      });
      toast.success("Zapier webhook triggered! Check your Zap history to confirm.");
    } catch {
      toast.error("Failed to trigger Zapier webhook. Check the URL and try again.");
    } finally {
      setIsTriggeringZap(false);
    }
  }, [zapierWebhookUrl]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
      case "running":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse">Running</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "partial":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Partial</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const completedCount = recentActivity.filter(a => a.status === "completed").length;
  const totalStepsRun = recentActivity.reduce((acc, a) => acc + a.steps, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automation Hub</h1>
          <p className="text-muted-foreground">
            Real AI-powered workflow automation -- runs actual AI models
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setActiveTab("workflows")}
          >
            <Calendar size={16} />
            Custom Workflow
          </Button>
          <Button 
            className="gap-2"
            onClick={() => {
              const available = quickStartTemplates.filter(t => !runningWorkflows.includes(t.name));
              if (available.length > 0) {
                runQuickStartWorkflow(available[Math.floor(Math.random() * available.length)]);
              }
            }}
            disabled={runningWorkflows.length >= 2}
          >
            {runningWorkflows.length > 0 ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Zap size={16} />
            )}
            Quick Automate
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Zapier Webhook Integration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <LinkIcon size={18} />
                Zapier / Webhook Integration
              </CardTitle>
              <CardDescription>
                Connect your workflows to 5000+ apps via Zapier webhooks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  value={zapierWebhookUrl}
                  onChange={(e) => setZapierWebhookUrl(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={() => triggerZapierWebhook()}
                  disabled={!zapierWebhookUrl || isTriggeringZap}
                  variant="outline"
                  className="gap-2"
                >
                  {isTriggeringZap ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Trigger
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Paste your Zapier webhook URL to trigger external automations (Gmail, Slack, Sheets, etc.)
              </p>
            </CardContent>
          </Card>

          {/* Live Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Running Now</CardTitle>
                <Bot className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{runningWorkflows.length}</div>
                <p className="text-xs text-muted-foreground">Active workflows</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <PlayCircle className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedCount}</div>
                <p className="text-xs text-muted-foreground">This session</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Steps Run</CardTitle>
                <Clock className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStepsRun}</div>
                <p className="text-xs text-muted-foreground">Total steps executed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {recentActivity.length > 0 
                    ? `${Math.round((completedCount / recentActivity.length) * 100)}%`
                    : '--'}
                </div>
                <p className="text-xs text-muted-foreground">This session</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity with Real Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 size={20} />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Live workflow executions with real AI outputs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No activity yet. Click "Quick Automate" or run a template to start!
                  </div>
                ) : (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="rounded-lg border">
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => setExpandedResult(expandedResult === activity.id ? null : activity.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="font-medium">{activity.workflow}</span>
                            <span className="text-sm text-muted-foreground">
                              {activity.steps} steps · {activity.duration} · {activity.timestamp}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(activity.status)}
                          {activity.status === "completed" && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                const template = quickStartTemplates.find(t => t.name === activity.workflow);
                                if (template) runQuickStartWorkflow(template);
                              }}
                              disabled={runningWorkflows.includes(activity.workflow)}
                              className="gap-1"
                            >
                              <Play size={12} />
                              Re-run
                            </Button>
                          )}
                          {activity.status === "failed" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                const template = quickStartTemplates.find(t => t.name === activity.workflow);
                                if (template) runQuickStartWorkflow(template);
                              }}
                              className="gap-1"
                            >
                              <RefreshCw size={12} />
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Expandable Results */}
                      {expandedResult === activity.id && activity.results && (
                        <div className="border-t px-4 pb-4 pt-3 space-y-3">
                          <p className="text-sm font-medium text-muted-foreground">AI Outputs:</p>
                          <ScrollArea className="max-h-[400px]">
                            {activity.results.map((result, idx) => (
                              <div key={result.stepId} className="mb-3 last:mb-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {result.success ? (
                                    <CheckCircle size={14} className="text-green-500 shrink-0" />
                                  ) : (
                                    <XCircle size={14} className="text-destructive shrink-0" />
                                  )}
                                  <span className="font-medium text-sm">Step {idx + 1}: {result.toolName}</span>
                                </div>
                                {result.success ? (
                                  <pre className="text-xs bg-muted/50 p-3 rounded-md whitespace-pre-wrap break-words max-h-[200px] overflow-y-auto ml-6">
                                    {result.output}
                                  </pre>
                                ) : (
                                  <p className="text-xs text-destructive ml-6">{result.error}</p>
                                )}
                              </div>
                            ))}
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Start Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap size={20} />
                Quick Start -- Real AI Workflows
              </CardTitle>
              <CardDescription>
                One-click workflows that execute real AI models (GPT, Claude, Gemini)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {quickStartTemplates.map((template) => {
                  const isRunning = runningWorkflows.includes(template.name);
                  return (
                    <button 
                      key={template.name}
                      className="p-4 rounded-lg border text-left hover:bg-muted/30 transition-all disabled:opacity-50 group"
                      onClick={() => runQuickStartWorkflow(template)}
                      disabled={isRunning}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{template.icon}</span>
                        <span className="font-medium text-sm">{template.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{template.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{template.steps.length} AI steps</span>
                        {isRunning ? (
                          <Loader2 size={14} className="animate-spin text-primary" />
                        ) : (
                          <Play size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows">
          <AutomationWorkflow />
        </TabsContent>

        <TabsContent value="templates">
          <AutomationTemplates />
        </TabsContent>

        <TabsContent value="history">
          <AutomationHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};
