import { useState, useCallback } from "react";
import { AIToolModal } from "./AIToolModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIToolCard } from "./AIToolCard";
import { AIHelpAgent } from "@/components/help/AIHelpAgent";
import { AutomationDashboard } from "@/components/automation/AutomationDashboard";
import { JarvisInterface } from "@/components/voice/JarvisInterface";
import { useNavigate } from "react-router-dom";
import { 
  Search,
  Filter,
  Brain, 
  LogOut,
  Bot,
  Plug,
  Film,
  Mic
} from "lucide-react";
import logo from "@/assets/ai-nexus-logo.png";
import { aiTools, categories } from "@/data/aiToolsData";

interface DashboardProps {
  userEmail: string;
  onLogout: () => void;
}

export function Dashboard({ userEmail, onLogout }: DashboardProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTool, setSelectedTool] = useState<typeof aiTools[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"tools" | "automation">("tools");
  const [isJarvisOpen, setIsJarvisOpen] = useState(false);

  const handleToolClick = (tool: typeof aiTools[0]) => {
    setSelectedTool(tool);
    setIsModalOpen(true);
  };

  const handleVoiceOpenTool = useCallback((toolName: string) => {
    const tool = aiTools.find(t => 
      t.title.toLowerCase().includes(toolName.toLowerCase())
    );
    if (tool) {
      setIsJarvisOpen(false);
      setTimeout(() => {
        setSelectedTool(tool);
        setIsModalOpen(true);
      }, 300);
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="glass-card border-b border-holo-blue/20 sticky top-0 z-10">
        <div className="max-w-[1920px] mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-12 sm:h-12 shrink-0">
                  <img 
                    src={logo} 
                    alt="AI Nexus - Ultimate AI Platform" 
                    className="w-full h-full object-contain rounded-full drop-shadow-[0_0_20px_rgba(0,212,255,0.4)]" 
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
                    AI Nexus
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden xs:block">{aiTools.length}+ AI Tools & Automation</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-4 shrink-0">
              <div className="flex gap-1 sm:gap-2 flex-wrap justify-end">
                <Button
                  variant={activeTab === "tools" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("tools")}
                  className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Brain size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">AI Tools</span>
                </Button>
                <Button
                  variant={activeTab === "automation" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("automation")}
                  className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Bot size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Automation</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/video-suite')}
                  className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:border-purple-500"
                >
                  <Film size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden md:inline">Video Suite</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/integrations')}
                  className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Plug size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden md:inline">Integrations</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsJarvisOpen(true)}
                  className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] transition-all"
                >
                  <Mic size={14} className="sm:w-4 sm:h-4 text-cyan-400" />
                  <span className="hidden md:inline">JARVIS</span>
                </Button>
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground hidden lg:block truncate max-w-[150px]">Welcome, {userEmail}</span>
              <Button variant="ghost" size="sm" onClick={onLogout} className="px-2 sm:px-3">
                <LogOut size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline ml-1">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1920px] mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {activeTab === "tools" && (
        <>
        {/* Search and Filters */}
        <div className="space-y-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Search AI tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 border-holo-blue/30 focus:border-holo-blue"
              />
            </div>
            <Button variant="outline" size="lg">
              <Filter size={16} />
              Filter
            </Button>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? "bg-holo-blue text-background shadow-glow"
                    : "bg-secondary text-secondary-foreground hover:bg-holo-blue/20"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="glass-card p-6 text-center border border-holo-blue/20">
            <h3 className="text-3xl font-bold text-holo-blue">{aiTools.length}</h3>
            <p className="text-muted-foreground">AI Tools</p>
          </div>
          <div className="glass-card p-6 text-center border border-holo-blue/20">
            <h3 className="text-3xl font-bold text-holo-blue">{categories.length - 1}</h3>
            <p className="text-muted-foreground">Categories</p>
          </div>
          <div className="glass-card p-6 text-center border border-holo-blue/20">
            <h3 className="text-3xl font-bold text-holo-blue">24/7</h3>
            <p className="text-muted-foreground">Available</p>
          </div>
        </div>

        {/* AI Tools Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">
              {selectedCategory === "All" ? "All AI Tools" : selectedCategory}
            </h2>
            <span className="text-muted-foreground">
              {filteredTools.length} tools found
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-6">
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
        </>
        )}

        {activeTab === "automation" && (
          <AutomationDashboard />
        )}

        {/* AI Tool Modal */}
        {selectedTool && (
          <AIToolModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            tool={selectedTool}
          />
        )}

        {/* AI Help Agent */}
        <AIHelpAgent />
      </div>

      {/* JARVIS Voice Assistant */}
      <JarvisInterface
        isOpen={isJarvisOpen}
        onClose={() => setIsJarvisOpen(false)}
        onOpenTool={handleVoiceOpenTool}
        onSearchTools={handleVoiceSearch}
      />
    </div>
  );
}