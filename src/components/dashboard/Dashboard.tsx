import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, LogOut } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { ToolsGrid } from "@/components/tools/ToolsGrid";

interface DashboardProps {
  userEmail: string;
  onLogout: () => void;
}

const categories = [
  "All",
  "Chat & Assistants",
  "Code & Developer Tools",
  "Search & Research",
  "Prompting & Agents",
  "Vector DB & Embeddings",
  "Data Science & MLOps",
  "Analytics & BI",
  "Marketing & Content",
  "Ads & Sales",
  "Design & Image Generation",
  "Video & Avatars",
  "Audio & Voice & Music",
  "Speech & Transcription",
  "Forensics & Detection",
  "3D & AR & Animation",
  "Productivity & Docs",
  "Education & Tutoring",
  "Healthcare & Bio",
  "Security & Fraud",
  "Enterprise & No-Code",
  "Specialized & Vertical",
  "Creative & Misc",
];

export const Dashboard = ({ userEmail, onLogout }: DashboardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar onLogout={onLogout} />
        
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger />
              
              <div className="flex-1" />
              
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <p className="text-muted-foreground">Welcome,</p>
                  <p className="font-medium">{userEmail}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-6 space-y-6">
              {/* Search and Filter */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search AI tools..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Button variant="outline" className="w-full justify-start">
                  <Filter className="w-4 h-4 mr-2 text-primary" />
                  Filter
                </Button>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? "default" : "secondary"}
                    className="cursor-pointer hover:bg-primary/80 transition-colors px-4 py-2"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>

              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-card border-primary/20 hover:border-primary/50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-5xl font-bold text-primary">150</p>
                      <p className="text-sm text-muted-foreground mt-2">AI Tools</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card border-primary/20 hover:border-primary/50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-5xl font-bold text-primary">23</p>
                      <p className="text-sm text-muted-foreground mt-2">Categories</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card border-primary/20 hover:border-primary/50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-5xl font-bold text-primary">24/7</p>
                      <p className="text-sm text-muted-foreground mt-2">Available</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tools Grid */}
              <ToolsGrid searchQuery={searchQuery} selectedCategory={selectedCategory} />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
