import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutomationWorkflow } from "./AutomationWorkflow";
import { AutomationTemplates } from "./AutomationTemplates";
import { AutomationHistory } from "./AutomationHistory";
import { 
  Bot, 
  Clock, 
  Zap, 
  BarChart3, 
  Calendar,
  PlayCircle,
  PauseCircle,
  TrendingUp
} from "lucide-react";

const automationStats = [
  {
    title: "Active Workflows",
    value: "12",
    change: "+3 this week",
    icon: <Bot className="h-4 w-4" />,
    trend: "up"
  },
  {
    title: "Total Executions",
    value: "1,247",
    change: "+15% this month",
    icon: <PlayCircle className="h-4 w-4" />,
    trend: "up"
  },
  {
    title: "Time Saved",
    value: "42.5h",
    change: "This month",
    icon: <Clock className="h-4 w-4" />,
    trend: "neutral"
  },
  {
    title: "Success Rate",
    value: "98.2%",
    change: "+0.3% this week",
    icon: <TrendingUp className="h-4 w-4" />,
    trend: "up"
  }
];

const recentActivity = [
  {
    id: 1,
    workflow: "Content Creation Pipeline",
    status: "completed",
    duration: "2m 34s",
    timestamp: "5 minutes ago",
    steps: 4
  },
  {
    id: 2,
    workflow: "Social Media Automation",
    status: "running",
    duration: "1m 12s",
    timestamp: "12 minutes ago",
    steps: 3
  },
  {
    id: 3,
    workflow: "Code Review Assistant",
    status: "completed",
    duration: "45s",
    timestamp: "1 hour ago",
    steps: 2
  },
  {
    id: 4,
    workflow: "Email Response Generator",
    status: "failed",
    duration: "15s",
    timestamp: "2 hours ago",
    steps: 1
  }
];

export const AutomationDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
      case "running":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Running</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return "↗️";
    if (trend === "down") return "↘️";
    return "—";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automation Hub</h1>
          <p className="text-muted-foreground">
            Streamline your AI workflows with intelligent automation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar size={16} />
            Schedule
          </Button>
          <Button className="gap-2">
            <Zap size={16} />
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
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {automationStats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  {stat.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>{getTrendIcon(stat.trend)}</span>
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 size={20} />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest workflow executions and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{activity.workflow}</span>
                        <span className="text-sm text-muted-foreground">
                          {activity.steps} steps • {activity.duration}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {activity.timestamp}
                      </span>
                      {getStatusBadge(activity.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap size={20} />
                  Quick Start
                </CardTitle>
                <CardDescription>
                  Get started with pre-built automation templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    📝 Content Generation Workflow
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    🎨 Design Asset Pipeline
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    💼 Business Process Automation
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar size={20} />
                  Scheduled Workflows
                </CardTitle>
                <CardDescription>
                  Upcoming automated executions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Daily Report Generation</span>
                    <Badge variant="outline">9:00 AM</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Weekly Content Analysis</span>
                    <Badge variant="outline">Monday 2:00 PM</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Social Media Posting</span>
                    <Badge variant="outline">Every 4 hours</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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