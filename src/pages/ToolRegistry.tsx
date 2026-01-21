import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  ArrowLeft, 
  Grid3X3, 
  List,
  Star,
  Zap,
  Crown,
  Play,
  Server,
  Cloud
} from "lucide-react";
import { aiTools, categories } from "@/data/aiToolsData";
import { ToolExecutionModal } from "@/components/registry/ToolExecutionModal";
import { useNexusConnector } from "@/hooks/useNexusConnector";

export default function ToolRegistry() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedTool, setSelectedTool] = useState<typeof aiTools[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { lastSource } = useNexusConnector();

  const filteredTools = useMemo(() => {
    return aiTools.filter(tool => {
      const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || tool.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = { All: aiTools.length };
    aiTools.forEach(tool => {
      stats[tool.category] = (stats[tool.category] || 0) + 1;
    });
    return stats;
  }, []);

  const handleToolClick = (tool: typeof aiTools[0]) => {
    setSelectedTool(tool);
    setIsModalOpen(true);
  };

  const isLocalServer = lastSource === 'nexus-local';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-card border-b border-holo-blue/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Tool Registry
                </h1>
                <p className="text-sm text-muted-foreground">
                  {aiTools.length}+ AI Tools Available
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border">
                {isLocalServer ? (
                  <>
                    <Server size={14} className="text-accent" />
                    <span className="text-xs text-accent">Local Server</span>
                  </>
                ) : (
                  <>
                    <Cloud size={14} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Cloud Fallback</span>
                  </>
                )}
              </div>

              {/* View Toggle */}
              <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 size={16} />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("list")}
                >
                  <List size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Categories */}
          <aside className="w-64 shrink-0 hidden lg:block">
            <div className="sticky top-24">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Categories
              </h3>
              <ScrollArea className="h-[calc(100vh-180px)]">
                <div className="space-y-1 pr-4">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                        selectedCategory === category
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <span className="truncate">{category}</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {categoryStats[category] || 0}
                      </Badge>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  placeholder="Search tools by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50 border-border focus:border-primary h-12"
                />
              </div>
            </div>

            {/* Mobile Category Tabs */}
            <div className="lg:hidden mb-6">
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-2">
                  {categories.slice(0, 8).map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                        selectedCategory === category
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-primary/20"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Results Info */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{filteredTools.length}</span> tools
                {selectedCategory !== "All" && (
                  <span> in <span className="text-primary">{selectedCategory}</span></span>
                )}
              </p>
              
              <Tabs defaultValue="all" className="w-auto">
                <TabsList className="h-8">
                  <TabsTrigger value="all" className="text-xs h-6">All</TabsTrigger>
                  <TabsTrigger value="popular" className="text-xs h-6">Popular</TabsTrigger>
                  <TabsTrigger value="premium" className="text-xs h-6">Premium</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Tools Grid/List */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTools.map((tool) => (
                  <ToolCard 
                    key={tool.id} 
                    tool={tool} 
                    onClick={() => handleToolClick(tool)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTools.map((tool) => (
                  <ToolListItem 
                    key={tool.id} 
                    tool={tool} 
                    onClick={() => handleToolClick(tool)}
                  />
                ))}
              </div>
            )}

            {filteredTools.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No tools found matching your criteria</p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Execution Modal */}
      {selectedTool && (
        <ToolExecutionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          tool={selectedTool}
        />
      )}
    </div>
  );
}

// Tool Card Component
function ToolCard({ tool, onClick }: { tool: typeof aiTools[0]; onClick: () => void }) {
  return (
    <Card 
      className="p-4 cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
          {tool.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-foreground truncate">{tool.title}</h3>
            {tool.isPremium && (
              <Crown size={14} className="text-amber-500 shrink-0" />
            )}
            {tool.isPopular && (
              <Zap size={14} className="text-primary shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {tool.description}
          </p>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {tool.category}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star size={12} className="fill-amber-500 text-amber-500" />
              {tool.rating}
            </div>
          </div>
        </div>
      </div>
      
      <Button 
        size="sm" 
        className="w-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Play size={14} className="mr-1" />
        Execute
      </Button>
    </Card>
  );
}

// Tool List Item Component
function ToolListItem({ tool, onClick }: { tool: typeof aiTools[0]; onClick: () => void }) {
  return (
    <Card 
      className="p-3 cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
          {tool.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground">{tool.title}</h3>
            {tool.isPremium && <Crown size={12} className="text-amber-500" />}
            {tool.isPopular && <Zap size={12} className="text-primary" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
        </div>
        
        <Badge variant="secondary" className="hidden sm:flex text-xs">
          {tool.category}
        </Badge>
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star size={12} className="fill-amber-500 text-amber-500" />
          {tool.rating}
        </div>
        
        <Button 
          size="sm" 
          variant="ghost"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Play size={14} />
        </Button>
      </div>
    </Card>
  );
}
