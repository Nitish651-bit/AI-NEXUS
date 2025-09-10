import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  RotateCcw,
  Eye,
  ExternalLink,
  BarChart3
} from "lucide-react";

interface ExecutionLog {
  id: string;
  workflowName: string;
  status: 'completed' | 'failed' | 'running' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration: string;
  triggeredBy: 'manual' | 'scheduled' | 'webhook';
  steps: Array<{
    name: string;
    tool: string;
    status: 'completed' | 'failed' | 'skipped';
    duration: string;
    input: string;
    output?: string;
    error?: string;
  }>;
  metrics: {
    inputTokens: number;
    outputTokens: number;
    apiCalls: number;
    cost: number;
  };
}

const executionHistory: ExecutionLog[] = [
  {
    id: "exec_001",
    workflowName: "Content Marketing Pipeline",
    status: "completed",
    startTime: "2024-01-15T10:30:00Z",
    endTime: "2024-01-15T10:33:45Z",
    duration: "3m 45s",
    triggeredBy: "manual",
    steps: [
      {
        name: "Generate Outline",
        tool: "ChatGPT",
        status: "completed",
        duration: "45s",
        input: "Create a blog post outline about AI automation",
        output: "1. Introduction to AI Automation\n2. Benefits and Use Cases..."
      },
      {
        name: "Write Content",
        tool: "Claude",
        status: "completed",
        duration: "2m 15s",
        input: "Write detailed blog post based on outline",
        output: "AI automation is transforming how businesses..."
      },
      {
        name: "Grammar Check",
        tool: "Grammarly",
        status: "completed",
        duration: "30s",
        input: "Check grammar and improve readability",
        output: "Improved 12 grammatical issues and enhanced readability score"
      },
      {
        name: "Social Media Posts",
        tool: "Jasper.ai",
        status: "completed",
        duration: "15s",
        input: "Create 5 social media posts from blog content",
        output: "Generated 5 engaging social media posts with hashtags"
      }
    ],
    metrics: {
      inputTokens: 2500,
      outputTokens: 4200,
      apiCalls: 4,
      cost: 0.12
    }
  },
  {
    id: "exec_002",
    workflowName: "Code Review Assistant",
    status: "failed",
    startTime: "2024-01-15T09:15:00Z",
    endTime: "2024-01-15T09:16:30Z",
    duration: "1m 30s",
    triggeredBy: "webhook",
    steps: [
      {
        name: "Analyze Code",
        tool: "GitHub Copilot",
        status: "completed",
        duration: "1m 15s",
        input: "Review code for potential issues",
        output: "Found 3 potential improvements and 1 security concern"
      },
      {
        name: "Security Scan",
        tool: "DeepCode",
        status: "failed",
        duration: "15s",
        input: "Detect security vulnerabilities",
        error: "API rate limit exceeded"
      }
    ],
    metrics: {
      inputTokens: 1800,
      outputTokens: 950,
      apiCalls: 2,
      cost: 0.08
    }
  },
  {
    id: "exec_003",
    workflowName: "Visual Content Creation",
    status: "completed",
    startTime: "2024-01-15T08:00:00Z",
    endTime: "2024-01-15T08:05:20Z",
    duration: "5m 20s",
    triggeredBy: "scheduled",
    steps: [
      {
        name: "Generate Image",
        tool: "DALL·E",
        status: "completed",
        duration: "3m 45s",
        input: "Create a futuristic AI workspace image",
        output: "Generated high-quality 1024x1024 image"
      },
      {
        name: "Enhance Quality",
        tool: "Adobe Firefly",
        status: "completed",
        duration: "1m 20s",
        input: "Improve image quality and composition",
        output: "Enhanced image resolution and composition"
      },
      {
        name: "Create Templates",
        tool: "Canva AI",
        status: "completed",
        duration: "15s",
        input: "Create social media templates",
        output: "Generated 3 social media template variations"
      }
    ],
    metrics: {
      inputTokens: 500,
      outputTokens: 200,
      apiCalls: 3,
      cost: 0.15
    }
  }
];

export const AutomationHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedExecution, setSelectedExecution] = useState<ExecutionLog | null>(null);

  const filteredHistory = executionHistory.filter(execution => {
    const matchesSearch = execution.workflowName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || execution.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "running":
        return <Play className="h-4 w-4 text-blue-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "running":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Running</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case "manual":
        return "👤";
      case "scheduled":
        return "⏰";
      case "webhook":
        return "🔗";
      default:
        return "❓";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Execution History</h2>
          <p className="text-muted-foreground">
            View and analyze past workflow executions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download size={16} />
            Export
          </Button>
          <Button variant="outline" className="gap-2">
            <BarChart3 size={16} />
            Analytics
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search executions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
          <CardDescription>
            Detailed logs of workflow executions and their results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredHistory.map((execution) => (
              <div 
                key={execution.id} 
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setSelectedExecution(execution)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(execution.status)}
                    <div>
                      <div className="font-medium">{execution.workflowName}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{getTriggerIcon(execution.triggeredBy)} {execution.triggeredBy}</span>
                        <span>•</span>
                        <span>{execution.duration}</span>
                        <span>•</span>
                        <span>${execution.metrics.cost.toFixed(3)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      {new Date(execution.startTime).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(execution.startTime).toLocaleTimeString()}
                    </div>
                  </div>
                  {getStatusBadge(execution.status)}
                  <Button variant="ghost" size="sm">
                    <Eye size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Execution Details Modal */}
      {selectedExecution && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(selectedExecution.status)}
                  {selectedExecution.workflowName}
                </CardTitle>
                <CardDescription>
                  Execution ID: {selectedExecution.id}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <RotateCcw size={14} />
                  Retry
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedExecution(null)}>
                  ✕
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="steps">
              <TabsList>
                <TabsTrigger value="steps">Steps</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="steps" className="space-y-4">
                {selectedExecution.steps.map((step, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <span className="font-medium">{step.name}</span>
                          <Badge variant="outline">{step.tool}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(step.status)}
                          <span className="text-sm text-muted-foreground">{step.duration}</span>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Input:</span>
                          <p className="text-muted-foreground mt-1">{step.input}</p>
                        </div>
                        {step.output && (
                          <div>
                            <span className="font-medium">Output:</span>
                            <p className="text-muted-foreground mt-1">{step.output}</p>
                          </div>
                        )}
                        {step.error && (
                          <div>
                            <span className="font-medium text-red-500">Error:</span>
                            <p className="text-red-500 mt-1">{step.error}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="metrics">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{selectedExecution.metrics.inputTokens.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Input Tokens</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{selectedExecution.metrics.outputTokens.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Output Tokens</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{selectedExecution.metrics.apiCalls}</div>
                      <div className="text-sm text-muted-foreground">API Calls</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">${selectedExecution.metrics.cost.toFixed(3)}</div>
                      <div className="text-sm text-muted-foreground">Total Cost</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="logs">
                <div className="space-y-2 font-mono text-sm bg-muted/50 p-4 rounded-lg">
                  <div className="text-muted-foreground">[{new Date(selectedExecution.startTime).toISOString()}] Workflow started</div>
                  {selectedExecution.steps.map((step, index) => (
                    <div key={index} className="text-muted-foreground">
                      [{new Date(selectedExecution.startTime).toISOString()}] Step {index + 1}: {step.name} - {step.status}
                    </div>
                  ))}
                  <div className="text-muted-foreground">[{new Date(selectedExecution.endTime || selectedExecution.startTime).toISOString()}] Workflow completed</div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};