import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ExternalLink } from "lucide-react";

interface AITool {
  id: string;
  name: string;
  category: string;
  description: string;
  rating: number;
  isPremium: boolean;
  isPopular: boolean;
}

const mockTools: AITool[] = [
  {
    id: "1",
    name: "ChatGPT (OpenAI)",
    category: "Chat & Assistants",
    description: "Conversational LLM for chat, coding, writing, multi-modal prompts.",
    rating: 4.9,
    isPremium: true,
    isPopular: true,
  },
  {
    id: "2",
    name: "Gemini AI",
    category: "Chat & Assistants",
    description: "Advanced AI assistant for complex reasoning and creative tasks.",
    rating: 4.8,
    isPremium: true,
    isPopular: true,
  },
  {
    id: "3",
    name: "Claude (Anthropic)",
    category: "Chat & Assistants",
    description: "Safe and helpful AI assistant for thoughtful conversations.",
    rating: 4.7,
    isPremium: true,
    isPopular: false,
  },
  {
    id: "4",
    name: "DALL-E 3",
    category: "Design & Image Generation",
    description: "Generate high-quality images from text descriptions.",
    rating: 4.6,
    isPremium: true,
    isPopular: true,
  },
  {
    id: "5",
    name: "Midjourney",
    category: "Design & Image Generation",
    description: "Create stunning AI-generated artwork and images.",
    rating: 4.8,
    isPremium: true,
    isPopular: true,
  },
  {
    id: "6",
    name: "ElevenLabs",
    category: "Audio & Voice & Music",
    description: "Natural-sounding text-to-speech and voice cloning.",
    rating: 4.7,
    isPremium: true,
    isPopular: false,
  },
];

interface ToolsGridProps {
  searchQuery: string;
  selectedCategory: string;
}

export function ToolsGrid({ searchQuery, selectedCategory }: ToolsGridProps) {
  const filteredTools = mockTools.filter((tool) => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">All AI Tools</h2>
        <p className="text-sm text-muted-foreground">{filteredTools.length} tools found</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTools.map((tool) => (
          <Card key={tool.id} className="hover:shadow-holo transition-all duration-300 hover:border-primary/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{tool.name}</CardTitle>
                  <CardDescription className="text-xs mt-1">{tool.category}</CardDescription>
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-medium">{tool.rating}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                {tool.isPremium && (
                  <Badge variant="secondary" className="text-xs">Premium</Badge>
                )}
                {tool.isPopular && (
                  <Badge className="bg-primary text-primary-foreground text-xs">Popular</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{tool.description}</p>
              <Button className="w-full" variant="outline">
                Try Now
                <ExternalLink className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No tools found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
