import { useState } from "react";
import { AIToolModal } from "./AIToolModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIToolCard } from "./AIToolCard";
import { 
  Search, 
  Filter, 
  Brain, 
  Image, 
  FileText, 
  MessageSquare, 
  Code, 
  Music, 
  Video, 
  Palette,
  BarChart3,
  Globe,
  Zap,
  LogOut
} from "lucide-react";
// Logo will be updated with uploaded image

const categories = [
  "All", "Text & Writing", "Image Generation", "Code Assistant", 
  "Data Analysis", "Voice & Audio", "Video", "Design", "Marketing", "Research"
];

const aiTools = [
  {
    id: 1,
    title: "GPT-4 Assistant",
    description: "Advanced conversational AI for complex reasoning, creative writing, and problem-solving tasks.",
    category: "Text & Writing",
    rating: 4.9,
    icon: <Brain size={20} />,
    isPremium: true,
    isPopular: true
  },
  {
    id: 2,
    title: "DALL-E 3",
    description: "Generate stunning, high-quality images from text descriptions with unprecedented creativity.",
    category: "Image Generation",
    rating: 4.8,
    icon: <Image size={20} />,
    isPremium: true,
    isPopular: true
  },
  {
    id: 3,
    title: "Code Copilot",
    description: "AI-powered coding assistant that helps write, debug, and optimize code in 50+ languages.",
    category: "Code Assistant",
    rating: 4.7,
    icon: <Code size={20} />,
    isPremium: false,
    isPopular: true
  },
  {
    id: 4,
    title: "Document Analyzer",
    description: "Extract insights, summarize, and analyze documents with advanced natural language processing.",
    category: "Data Analysis",
    rating: 4.6,
    icon: <FileText size={20} />,
    isPremium: false,
    isPopular: false
  },
  {
    id: 5,
    title: "Voice Synthesizer",
    description: "Create realistic human-like voices and convert text to speech in multiple languages.",
    category: "Voice & Audio",
    rating: 4.5,
    icon: <Music size={20} />,
    isPremium: true,
    isPopular: false
  },
  {
    id: 6,
    title: "Video Generator",
    description: "Transform text and images into professional video content with AI-powered editing.",
    category: "Video",
    rating: 4.4,
    icon: <Video size={20} />,
    isPremium: true,
    isPopular: false
  },
  {
    id: 7,
    title: "Design Studio",
    description: "Create logos, banners, and marketing materials with intelligent design suggestions.",
    category: "Design",
    rating: 4.6,
    icon: <Palette size={20} />,
    isPremium: false,
    isPopular: false
  },
  {
    id: 8,
    title: "Market Insights",
    description: "Analyze market trends, competitor data, and generate marketing strategies with AI.",
    category: "Marketing",
    rating: 4.7,
    icon: <BarChart3 size={20} />,
    isPremium: true,
    isPopular: false
  }
];

interface DashboardProps {
  userEmail: string;
  onLogout: () => void;
}

export function Dashboard({ userEmail, onLogout }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTool, setSelectedTool] = useState<typeof aiTools[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
                <div className="w-10 h-10 rounded-lg">
                  <img src="/lovable-uploads/c2ed5a9d-749a-43c7-9f54-039c35fd9ee9.png" alt="AI Nexus Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">AI Nexus</h1>
                  <p className="text-sm text-muted-foreground">700+ AI Tools</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
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
            <h3 className="text-3xl font-bold text-holo-blue">700+</h3>
            <p className="text-muted-foreground">AI Tools</p>
          </div>
          <div className="glass-card p-6 text-center border border-holo-blue/20">
            <h3 className="text-3xl font-bold text-holo-blue">50+</h3>
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

        {/* AI Tool Modal */}
        {selectedTool && (
          <AIToolModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            tool={selectedTool}
          />
        )}
      </div>
    </div>
  );
}