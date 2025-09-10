import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Search,
  Download,
  Star,
  Users,
  Clock,
  Zap,
  FileText,
  Image,
  MessageSquare,
  BarChart3,
  Globe,
  Code
} from "lucide-react";

interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  steps: number;
  estimatedTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  rating: number;
  downloads: number;
  tags: string[];
  workflow: Array<{
    tool: string;
    action: string;
    prompt: string;
  }>;
}

const templates: AutomationTemplate[] = [
  {
    id: "1",
    name: "Content Marketing Pipeline",
    description: "Generate blog posts, social media content, and SEO optimization in one automated flow",
    category: "Marketing",
    icon: <FileText size={20} />,
    steps: 5,
    estimatedTime: "3-5 minutes",
    difficulty: "Intermediate",
    rating: 4.8,
    downloads: 1247,
    tags: ["content", "marketing", "seo", "social-media"],
    workflow: [
      { tool: "ChatGPT", action: "Generate", prompt: "Create a blog post outline about {topic}" },
      { tool: "Claude", action: "Write", prompt: "Write a detailed blog post based on: {outline}" },
      { tool: "Grammarly", action: "Review", prompt: "Check grammar and improve readability" },
      { tool: "Jasper.ai", action: "Generate", prompt: "Create 5 social media posts from blog content" },
      { tool: "SurferSEO", action: "Optimize", prompt: "Optimize content for SEO keywords: {keywords}" }
    ]
  },
  {
    id: "2",
    name: "Code Review & Documentation",
    description: "Automated code analysis, bug detection, and documentation generation for development teams",
    category: "Development",
    icon: <Code size={20} />,
    steps: 4,
    estimatedTime: "2-3 minutes",
    difficulty: "Advanced",
    rating: 4.9,
    downloads: 892,
    tags: ["code", "documentation", "review", "bugs"],
    workflow: [
      { tool: "GitHub Copilot", action: "Analyze", prompt: "Review code for potential issues and improvements" },
      { tool: "DeepCode", action: "Scan", prompt: "Detect security vulnerabilities and code smells" },
      { tool: "CodiumAI", action: "Generate", prompt: "Create unit tests for the analyzed code" },
      { tool: "OpenAI Codex", action: "Document", prompt: "Generate comprehensive documentation" }
    ]
  },
  {
    id: "3",
    name: "Visual Content Creation",
    description: "Create stunning visuals, edit images, and generate marketing materials automatically",
    category: "Design",
    icon: <Image size={20} />,
    steps: 4,
    estimatedTime: "4-6 minutes",
    difficulty: "Beginner",
    rating: 4.7,
    downloads: 2103,
    tags: ["design", "images", "marketing", "visual"],
    workflow: [
      { tool: "DALL·E", action: "Generate", prompt: "Create a product image based on: {description}" },
      { tool: "Adobe Firefly", action: "Enhance", prompt: "Improve image quality and composition" },
      { tool: "Canva AI", action: "Design", prompt: "Create social media templates using the image" },
      { tool: "Remove.bg", action: "Process", prompt: "Remove background for transparent version" }
    ]
  },
  {
    id: "4",
    name: "Customer Service Automation",
    description: "Handle customer inquiries, generate responses, and escalate complex issues automatically",
    category: "Support",
    icon: <MessageSquare size={20} />,
    steps: 3,
    estimatedTime: "1-2 minutes",
    difficulty: "Beginner",
    rating: 4.6,
    downloads: 1567,
    tags: ["support", "customer-service", "automation", "chat"],
    workflow: [
      { tool: "Claude", action: "Analyze", prompt: "Analyze customer inquiry and categorize urgency" },
      { tool: "ChatGPT", action: "Generate", prompt: "Create personalized response to customer query" },
      { tool: "Notion AI", action: "Log", prompt: "Document interaction and update customer profile" }
    ]
  },
  {
    id: "5",
    name: "Research & Analysis Pipeline",
    description: "Comprehensive research automation with data collection, analysis, and report generation",
    category: "Research",
    icon: <BarChart3 size={20} />,
    steps: 6,
    estimatedTime: "5-8 minutes",
    difficulty: "Advanced",
    rating: 4.8,
    downloads: 743,
    tags: ["research", "analysis", "reports", "data"],
    workflow: [
      { tool: "Perplexity", action: "Research", prompt: "Gather comprehensive information about {topic}" },
      { tool: "Elicit", action: "Analyze", prompt: "Find and summarize relevant academic papers" },
      { tool: "Consensus", action: "Synthesize", prompt: "Extract key findings and consensus points" },
      { tool: "Claude", action: "Analyze", prompt: "Identify trends and patterns in the data" },
      { tool: "ChatGPT", action: "Generate", prompt: "Create executive summary and recommendations" },
      { tool: "Notion AI", action: "Format", prompt: "Format into professional report structure" }
    ]
  },
  {
    id: "6",
    name: "Social Media Manager",
    description: "Plan, create, and schedule social media content across multiple platforms",
    category: "Social Media",
    icon: <Globe size={20} />,
    steps: 4,
    estimatedTime: "3-4 minutes",
    difficulty: "Intermediate",
    rating: 4.5,
    downloads: 1834,
    tags: ["social-media", "content", "scheduling", "engagement"],
    workflow: [
      { tool: "Jasper.ai", action: "Plan", prompt: "Create content calendar for {platform} for next week" },
      { tool: "DALL·E", action: "Generate", prompt: "Create engaging visuals for each post" },
      { tool: "ChatGPT", action: "Write", prompt: "Write compelling captions with hashtags" },
      { tool: "Buffer AI", action: "Schedule", prompt: "Schedule posts at optimal times" }
    ]
  }
];

const categories = ["All", "Marketing", "Development", "Design", "Support", "Research", "Social Media"];

export const AutomationTemplates = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { toast } = useToast();

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "Intermediate": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "Advanced": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const useTemplate = (template: AutomationTemplate) => {
    toast({
      title: "Template Applied",
      description: `"${template.name}" has been added to your workflows!`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automation Templates</h2>
          <p className="text-muted-foreground">
            Pre-built workflows to jumpstart your automation
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              size="sm"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {template.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {template.category}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star size={14} fill="currentColor" />
                  <span className="text-sm font-medium">{template.rating}</span>
                </div>
              </div>
              <CardDescription className="mt-2">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Stats */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Zap size={12} />
                    {template.steps} steps
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {template.estimatedTime}
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <Download size={12} />
                  {template.downloads.toLocaleString()}
                </span>
              </div>

              {/* Difficulty Badge */}
              <div className="flex items-center justify-between">
                <Badge className={getDifficultyColor(template.difficulty)}>
                  {template.difficulty}
                </Badge>
              </div>

              {/* Workflow Preview */}
              <div className="space-y-2">
                <span className="text-sm font-medium">Workflow:</span>
                <div className="space-y-1">
                  {template.workflow.slice(0, 3).map((step, index) => (
                    <div key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-medium">
                        {index + 1}
                      </span>
                      <span className="font-medium">{step.tool}</span>
                      <span>→</span>
                      <span>{step.action}</span>
                    </div>
                  ))}
                  {template.workflow.length > 3 && (
                    <div className="text-xs text-muted-foreground pl-6">
                      +{template.workflow.length - 3} more steps...
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {template.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {template.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{template.tags.length - 3}
                  </Badge>
                )}
              </div>

              {/* Action Button */}
              <Button 
                onClick={() => useTemplate(template)}
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
              >
                Use Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search size={32} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
};