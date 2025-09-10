import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  Plus, 
  Trash2, 
  Clock, 
  Zap, 
  ArrowRight,
  Settings,
  Save
} from "lucide-react";

interface WorkflowStep {
  id: string;
  toolName: string;
  toolCategory: string;
  prompt: string;
  order: number;
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
}

const aiToolOptions = [
  { name: "ChatGPT (OpenAI)", category: "Chat & Assistants" },
  { name: "Claude (Anthropic)", category: "Chat & Assistants" },
  { name: "GitHub Copilot", category: "Code & Developer Tools" },
  { name: "DALL·E (OpenAI)", category: "Design & Image Generation" },
  { name: "Jasper.ai", category: "Marketing & Content" },
  { name: "Grammarly", category: "Marketing & Content" },
  { name: "Notion AI", category: "Productivity & Docs" },
];

export const AutomationWorkflow = () => {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<AutomationWorkflow | null>(null);
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

  const runWorkflow = async (workflow: AutomationWorkflow) => {
    toast({
      title: "Running Workflow",
      description: `Starting execution of "${workflow.name}"...`,
    });

    // Simulate workflow execution
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: `Step ${i + 1} Complete`,
        description: `Executed ${step.toolName} with prompt: ${step.prompt.substring(0, 50)}...`,
      });
    }

    toast({
      title: "Workflow Complete",
      description: `"${workflow.name}" executed successfully!`,
    });
  };

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
        {workflows.map((workflow) => (
          <Card key={workflow.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {workflow.name}
                    <Badge variant={workflow.isActive ? "default" : "secondary"}>
                      {workflow.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{workflow.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => runWorkflow(workflow)}
                    size="sm"
                    className="gap-2"
                  >
                    <Play size={14} />
                    Run
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings size={14} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock size={14} />
                Trigger: {workflow.trigger}
                <span className="mx-2">•</span>
                {workflow.steps.length} steps
              </div>
              <div className="flex items-center gap-2 mt-2">
                {workflow.steps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      {step.toolName}
                    </Badge>
                    {index < workflow.steps.length - 1 && (
                      <ArrowRight size={12} className="text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
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
