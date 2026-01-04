import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Play, 
  Plus, 
  Trash2, 
  Clock, 
  Zap, 
  ArrowRight,
  Settings,
  Save,
  Loader2,
  CheckCircle,
  XCircle
} from "lucide-react";

interface WorkflowStep {
  id: string;
  toolName: string;
  toolCategory: string;
  prompt: string;
  order: number;
}

interface WorkflowResult {
  stepId: string;
  toolName: string;
  output: string;
  success: boolean;
  error?: string;
}

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: 'manual' | 'scheduled' | 'webhook';
  schedule?: string;
  webhookUrl?: string;
  steps: WorkflowStep[];
  isActive: boolean;
  lastRun?: {
    timestamp: string;
    results: WorkflowResult[];
    success: boolean;
  };
}

const aiToolOptions = [
  { name: "ChatGPT (OpenAI)", category: "Chat & Assistants", description: "General-purpose AI assistant" },
  { name: "Claude (Anthropic)", category: "Chat & Assistants", description: "Helpful, harmless, and honest AI" },
  { name: "GitHub Copilot", category: "Code & Developer Tools", description: "Code generation and assistance" },
  { name: "DALL·E (OpenAI)", category: "Design & Image Generation", description: "Image generation from text" },
  { name: "Jasper.ai", category: "Marketing & Content", description: "Marketing copy and content" },
  { name: "Grammarly", category: "Marketing & Content", description: "Grammar and writing improvement" },
  { name: "Notion AI", category: "Productivity & Docs", description: "Document organization and summarization" },
];

export const AutomationWorkflow = () => {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<AutomationWorkflow | null>(null);
  const [runningWorkflowId, setRunningWorkflowId] = useState<string | null>(null);
  const [workflowResults, setWorkflowResults] = useState<Record<string, WorkflowResult[]>>({});
  const { toast } = useToast();

  const [newWorkflow, setNewWorkflow] = useState<Partial<AutomationWorkflow>>({
    name: "",
    description: "",
    trigger: "manual",
    steps: [],
    isActive: false
  });

  const [zapierWebhook, setZapierWebhook] = useState("");

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: Date.now().toString(),
      toolName: "",
      toolCategory: "",
      prompt: "",
      order: (newWorkflow.steps?.length || 0) + 1
    };
    
    setNewWorkflow(prev => ({
      ...prev,
      steps: [...(prev.steps || []), newStep]
    }));
  };

  const updateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    setNewWorkflow(prev => ({
      ...prev,
      steps: prev.steps?.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      ) || []
    }));
  };

  const removeStep = (stepId: string) => {
    setNewWorkflow(prev => ({
      ...prev,
      steps: prev.steps?.filter(step => step.id !== stepId) || []
    }));
  };

  const saveWorkflow = () => {
    if (!newWorkflow.name || !newWorkflow.steps?.length) {
      toast({
        title: "Error",
        description: "Please provide a workflow name and at least one step.",
        variant: "destructive",
      });
      return;
    }

    const workflow: AutomationWorkflow = {
      ...newWorkflow as AutomationWorkflow,
      id: Date.now().toString(),
    };

    setWorkflows(prev => [...prev, workflow]);
    setNewWorkflow({
      name: "",
      description: "",
      trigger: "manual",
      steps: [],
      isActive: false
    });
    setIsCreating(false);

    toast({
      title: "Success",
      description: "Workflow created successfully!",
    });
  };

  const runWorkflow = useCallback(async (workflow: AutomationWorkflow) => {
    if (runningWorkflowId) {
      toast({
        title: "Workflow Running",
        description: "Please wait for the current workflow to complete.",
        variant: "destructive",
      });
      return;
    }

    setRunningWorkflowId(workflow.id);
    
    toast({
      title: "Running Workflow",
      description: `Starting execution of "${workflow.name}" with ${workflow.steps.length} step(s)...`,
    });

    try {
      const { data, error } = await supabase.functions.invoke('workflow-automation', {
        body: {
          workflowName: workflow.name,
          steps: workflow.steps.map(s => ({
            id: s.id,
            toolName: s.toolName,
            toolCategory: s.toolCategory,
            prompt: s.prompt,
            order: s.order
          }))
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to execute workflow');
      }

      if (!data.success) {
        throw new Error(data.error || 'Workflow execution failed');
      }

      // Store results
      setWorkflowResults(prev => ({
        ...prev,
        [workflow.id]: data.results
      }));

      // Update workflow with last run info
      setWorkflows(prev => prev.map(w => 
        w.id === workflow.id 
          ? { 
              ...w, 
              lastRun: { 
                timestamp: new Date().toISOString(), 
                results: data.results,
                success: data.success 
              } 
            }
          : w
      ));

      toast({
        title: "Workflow Complete",
        description: `"${workflow.name}" executed successfully! ${data.completedSteps}/${data.totalSteps} steps completed.`,
      });

    } catch (error) {
      console.error('Workflow execution error:', error);
      toast({
        title: "Workflow Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setRunningWorkflowId(null);
    }
  }, [runningWorkflowId, toast]);

  const triggerZapierWebhook = async () => {
    if (!zapierWebhook) {
      toast({
        title: "Error",
        description: "Please enter your Zapier webhook URL",
        variant: "destructive",
      });
      return;
    }

    try {
      await fetch(zapierWebhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          triggered_from: "AI Nexus Automation",
          message: "Workflow automation triggered"
        }),
      });

      toast({
        title: "Zapier Triggered",
        description: "Your Zapier workflow has been triggered successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to trigger Zapier webhook.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automation Workflows</h2>
          <p className="text-muted-foreground">Create automated sequences of AI tools</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus size={16} />
          Create Workflow
        </Button>
      </div>

      {/* Zapier Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap size={20} />
            Zapier Integration
          </CardTitle>
          <CardDescription>
            Connect your workflows with Zapier webhooks for external automation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter your Zapier webhook URL"
              value={zapierWebhook}
              onChange={(e) => setZapierWebhook(e.target.value)}
              className="flex-1"
            />
            <Button onClick={triggerZapierWebhook} variant="outline">
              Trigger Zap
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Workflows */}
      <div className="grid gap-4">
        {workflows.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Zap size={40} className="text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No workflows yet. Create your first AI automation workflow!</p>
            </CardContent>
          </Card>
        )}
        {workflows.map((workflow) => {
          const isRunning = runningWorkflowId === workflow.id;
          const results = workflowResults[workflow.id] || workflow.lastRun?.results || [];
          
          return (
            <Card key={workflow.id} className={isRunning ? 'border-primary/50 animate-pulse' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {workflow.name}
                      <Badge variant={workflow.isActive ? "default" : "secondary"}>
                        {workflow.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {workflow.lastRun && (
                        <Badge variant={workflow.lastRun.success ? "default" : "destructive"} className="text-xs">
                          {workflow.lastRun.success ? <CheckCircle size={12} className="mr-1" /> : <XCircle size={12} className="mr-1" />}
                          Last run: {new Date(workflow.lastRun.timestamp).toLocaleString()}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{workflow.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => runWorkflow(workflow)}
                      size="sm"
                      className="gap-2"
                      disabled={isRunning}
                    >
                      {isRunning ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play size={14} />
                          Run
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings size={14} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock size={14} />
                  Trigger: {workflow.trigger}
                  <span className="mx-2">•</span>
                  {workflow.steps.length} steps
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {workflow.steps.map((step, index) => {
                    const stepResult = results.find(r => r.stepId === step.id);
                    return (
                      <div key={step.id} className="flex items-center gap-1">
                        <Badge 
                          variant={stepResult?.success ? "default" : stepResult?.error ? "destructive" : "outline"} 
                          className="text-xs flex items-center gap-1"
                        >
                          {stepResult?.success && <CheckCircle size={10} />}
                          {stepResult?.error && <XCircle size={10} />}
                          {step.toolName}
                        </Badge>
                        {index < workflow.steps.length - 1 && (
                          <ArrowRight size={12} className="text-muted-foreground" />
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Show Results */}
                {results.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label className="text-sm font-medium">Results:</Label>
                    <ScrollArea className="h-[200px] rounded-md border p-3 bg-muted/30">
                      {results.map((result, index) => (
                        <div key={result.stepId} className="mb-4 last:mb-0">
                          <div className="flex items-center gap-2 mb-1">
                            {result.success ? (
                              <CheckCircle size={14} className="text-green-500" />
                            ) : (
                              <XCircle size={14} className="text-destructive" />
                            )}
                            <span className="font-medium text-sm">{result.toolName}</span>
                          </div>
                          {result.success ? (
                            <pre className="text-xs bg-background p-2 rounded whitespace-pre-wrap break-words max-h-[100px] overflow-y-auto">
                              {result.output}
                            </pre>
                          ) : (
                            <p className="text-xs text-destructive">{result.error}</p>
                          )}
                          {index < results.length - 1 && <hr className="my-2 border-border" />}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Workflow Modal */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Workflow</CardTitle>
            <CardDescription>
              Define a sequence of AI tools to automate your tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Workflow Name</Label>
                <Input
                  id="name"
                  value={newWorkflow.name || ""}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Content Creation Pipeline"
                />
              </div>
              <div>
                <Label htmlFor="trigger">Trigger Type</Label>
                <Select 
                  value={newWorkflow.trigger || "manual"}
                  onValueChange={(value) => setNewWorkflow(prev => ({ ...prev, trigger: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newWorkflow.description || ""}
                onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this workflow does..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Workflow Steps</Label>
                <Button onClick={addStep} size="sm" variant="outline" className="gap-2">
                  <Plus size={14} />
                  Add Step
                </Button>
              </div>

              <div className="space-y-3">
                {newWorkflow.steps?.map((step, index) => (
                  <Card key={step.id} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>AI Tool</Label>
                            <Select 
                              value={step.toolName}
                              onValueChange={(value) => {
                                const tool = aiToolOptions.find(t => t.name === value);
                                updateStep(step.id, { 
                                  toolName: value, 
                                  toolCategory: tool?.category || "" 
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select AI tool" />
                              </SelectTrigger>
                              <SelectContent>
                                {aiToolOptions.map((tool) => (
                                  <SelectItem key={tool.name} value={tool.name}>
                                    {tool.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Category</Label>
                            <Input 
                              value={step.toolCategory} 
                              disabled 
                              className="bg-muted"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Prompt/Input</Label>
                          <Textarea
                            value={step.prompt}
                            onChange={(e) => updateStep(step.id, { prompt: e.target.value })}
                            placeholder="Enter the prompt or input for this AI tool..."
                            rows={2}
                          />
                        </div>
                      </div>
                      <Button
                        onClick={() => removeStep(step.id)}
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={saveWorkflow} className="gap-2">
                <Save size={16} />
                Save Workflow
              </Button>
              <Button 
                onClick={() => setIsCreating(false)} 
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
