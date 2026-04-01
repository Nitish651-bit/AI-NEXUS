import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Brain,
  Bot,
  Cpu,
  Film,
  Plug,
  Info,
  MessageSquare,
  Mic,
  Sun,
  Moon,
  LogOut,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import logo from "@/assets/ai-nexus-logo.png";

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onJarvisOpen: () => void;
  onLogout: () => void;
  userEmail: string;
}

const navItems = [
  { id: "tools", label: "AI Tools", icon: Brain, route: null },
  { id: "automation", label: "Automation", icon: Bot, route: null },
  { id: "orchestrator", label: "Orchestrator", icon: Cpu, route: null },
  { id: "video", label: "Video Suite", icon: Film, route: "/video-suite" },
  { id: "integrations", label: "Integrations", icon: Plug, route: "/integrations" },
  { id: "about", label: "About", icon: Info, route: "/about" },
  { id: "contact", label: "Contact", icon: MessageSquare, route: "/contact" },
];

export function AppSidebar({ activeTab, onTabChange, onJarvisOpen, onLogout, userEmail }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.route) {
      navigate(item.route);
    } else {
      onTabChange(item.id);
    }
  };

  const isActive = (item: typeof navItems[0]) => {
    if (item.route) return location.pathname === item.route;
    return activeTab === item.id;
  };

  return (
    <aside
      className={`${
        collapsed ? "w-[68px]" : "w-[220px]"
      } h-screen flex flex-col border-r border-border bg-card/80 backdrop-blur-xl transition-all duration-300 shrink-0 relative z-30`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-border/50 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-9 h-9 shrink-0">
          <img
            src={logo}
            alt="AI Nexus 910+"
            className="w-full h-full object-contain rounded-lg drop-shadow-[0_0_12px_rgba(0,212,255,0.4)]"
          />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-sm font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
              AI Nexus 910+
            </h1>
            <p className="text-[10px] text-muted-foreground">Pro AI Platform</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const active = isActive(item);
            const btn = (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  active
                    ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.3)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                } ${collapsed ? "justify-center px-2" : ""}`}
              >
                <item.icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${active ? "text-primary" : "group-hover:text-foreground"}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.id} delayDuration={0}>
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
                </Tooltip>
              );
            }
            return btn;
          })}

          {/* Voice Assistant */}
          <div className="pt-2 mt-2 border-t border-border/50">
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={onJarvisOpen}
                    className="w-full flex items-center justify-center px-2 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                  >
                    <Mic className="w-[18px] h-[18px] text-primary" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">AI Nexus Voice</TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={onJarvisOpen}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all border border-primary/20 bg-primary/5"
              >
                <Sparkles className="w-[18px] h-[18px] text-primary" />
                <span>AI Voice</span>
              </button>
            )}
          </div>
        </nav>
      </ScrollArea>

      {/* Bottom Actions */}
      <div className="border-t border-border/50 p-2 space-y-1">
        {/* Theme Toggle */}
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-center px-2 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>
        )}

        {/* User & Logout */}
        {!collapsed && (
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">{userEmail}</div>
        )}
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center px-2 py-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">Logout</TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all shadow-sm z-40"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
