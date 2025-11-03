import { AutomationDashboard } from '@/components/automation/AutomationDashboard';
import { AutomationHistory } from '@/components/automation/AutomationHistory';
import { AutomationTemplates } from '@/components/automation/AutomationTemplates';
import { AutomationWorkflow } from '@/components/automation/AutomationWorkflow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const Automation = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Automation Hub</h1>
          <p className="text-muted-foreground text-lg">
            Automate your workflows with AI-powered tools
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-4">
            <AutomationDashboard />
          </TabsContent>
          
          <TabsContent value="workflow" className="space-y-4">
            <AutomationWorkflow />
          </TabsContent>
          
          <TabsContent value="templates" className="space-y-4">
            <AutomationTemplates />
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            <AutomationHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
