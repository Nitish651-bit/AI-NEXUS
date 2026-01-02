import { useState } from "react";
import { AIToolModal } from "./AIToolModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIToolCard } from "./AIToolCard";
import { AIHelpAgent } from "@/components/help/AIHelpAgent";
import { AutomationDashboard } from "@/components/automation/AutomationDashboard";
import { useNavigate } from "react-router-dom";
import { 
  Search,
  Filter,
  Brain, 
  LogOut,
  Bot,
  Plug
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

  const handleToolClick = (tool: typeof aiTools[0]) => {
    setSelectedTool(tool);
    setIsModalOpen(true);
  };

  const filteredTools = aiTools.filter(tool => {
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-card border-b border-holo-blue/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12">
                  <img 
                    src={logo} 
                    alt="AI Nexus - Ultimate AI Platform" 
                    className="w-full h-full object-contain rounded-full drop-shadow-[0_0_20px_rgba(0,212,255,0.4)]" 
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    AI Nexus
                  </h1>
                  <p className="text-sm text-muted-foreground">{aiTools.length}+ AI Tools & Automation</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <Button
                  variant={activeTab === "tools" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("tools")}
                  className="gap-2"
                >
                  <Brain size={16} />
                  AI Tools
                </Button>
                <Button
                  variant={activeTab === "automation" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("automation")}
                  className="gap-2"
                >
                  <Bot size={16} />
                  Automation
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/integrations')}
                  className="gap-2"
                >
                  <Plug size={16} />
                  Integrations
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">Welcome, {userEmail}</span>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut size={16} />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
    </div>
  );
}