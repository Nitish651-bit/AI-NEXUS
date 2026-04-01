import { useState, useCallback } from "react";
import { AIToolModal } from "./AIToolModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIToolCard } from "./AIToolCard";
import { AIHelpAgent } from "@/components/help/AIHelpAgent";
import { AutomationDashboard } from "@/components/automation/AutomationDashboard";
import { NexusInterface } from "@/components/voice/JarvisInterface";
import { OrchestrationPipeline } from "@/components/orchestrator/OrchestrationPipeline";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Search, Filter, Cpu } from "lucide-react";
import { aiTools, categories } from "@/data/aiToolsData";

interface DashboardProps {
  userEmail: string;
  onLogout: () => void;
}

export function Dashboard({ userEmail, onLogout }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTool, setSelectedTool] = useState<typeof aiTools[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("tools");
  const [isJarvisOpen, setIsJarvisOpen] = useState(false);

  const handleToolClick = (tool: typeof aiTools[0]) => {
    setSelectedTool(tool);
    setIsModalOpen(true);
  };

  const handleVoiceOpenTool = useCallback((toolName: string) => {
    const tool = aiTools.find(t => t.title.toLowerCase().includes(toolName.toLowerCase()));
    if (tool) {
      setIsJarvisOpen(false);
      setTimeout(() => { setSelectedTool(tool); setIsModalOpen(true); }, 300);
    }
  }, []);

  const handleVoiceSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setSelectedCategory("All");
    setIsJarvisOpen(false);
  }, []);

  const filteredTools = aiTools.filter(tool => {
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <AppSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onJarvisOpen={() => setIsJarvisOpen(true)}
        onLogout={onLogout}
        userEmail={userEmail}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-4 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search 910+ AI tools, automation, commands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-muted/30 border-border/50 focus:border-primary/50 focus:bg-muted/50 rounded-xl transition-all"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Badge variant="outline" className="text-xs border-primary/30 text-primary gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {aiTools.length}+ Tools
              </Badge>
            </div>
          </div>
        </header>

        <div className="p-6">
          {activeTab === "tools" && (
            <div className="space-y-6 animate-fade-in">
              {/* Category Pills */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                      selectedCategory === category
                        ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-5 text-center">
                  <h3 className="text-3xl font-bold text-primary">{aiTools.length}</h3>
                  <p className="text-xs text-muted-foreground mt-1">AI Tools</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 p-5 text-center">
                  <h3 className="text-3xl font-bold text-accent">{categories.length - 1}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Categories</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-muted to-muted/50 border border-border p-5 text-center">
                  <h3 className="text-3xl font-bold text-foreground">24/7</h3>
                  <p className="text-xs text-muted-foreground mt-1">Available</p>
                </div>
              </div>

              {/* Tools Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {selectedCategory === "All" ? "All AI Tools" : selectedCategory}
                </h2>
                <span className="text-xs text-muted-foreground">{filteredTools.length} tools</span>
              </div>

              {/* AI Tools Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredTools.map((tool) => (
                  <AIToolCard
                    key={tool.id}
                    title={tool.title}
                    description={tool.description}
                    category={tool.category}
                    rating={tool.rating}
                    icon={tool.icon}
                    isPremium={tool.isPremium}
                    isPopular={tool.isPopular}
                    onClick={() => handleToolClick(tool)}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === "automation" && (
            <div className="animate-fade-in">
              <AutomationDashboard />
            </div>
          )}

          {activeTab === "orchestrator" && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  AI NEXUS Orchestrator v3.0
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Central Intelligence Engine — Intent → Tools → Plan → Execute → Result
                </p>
              </div>
              <OrchestrationPipeline />
            </div>
          )}

          {/* AI Tool Modal */}
          {selectedTool && (
            <AIToolModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} tool={selectedTool} />
          )}

          {/* AI Help Agent */}
          <AIHelpAgent />
        </div>
      </main>

      {/* AI NEXUS Voice Assistant */}
      <NexusInterface
        isOpen={isJarvisOpen}
        onClose={() => setIsJarvisOpen(false)}
        onOpenTool={handleVoiceOpenTool}
        onSearchTools={handleVoiceSearch}
      />
    </div>
  );
}
