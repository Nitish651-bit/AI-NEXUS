import { Home, Sparkles, Boxes, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import logo from "@/assets/ai-nexus-logo.png";

interface AppSidebarProps {
  onLogout?: () => void;
}

const mainItems = [
  { title: "AI Tools", url: "/", icon: Sparkles },
  { title: "Automation", url: "/automation", icon: Boxes },
  { title: "Integrations", url: "/integrations", icon: Home },
];

export function AppSidebar({ onLogout }: AppSidebarProps) {
  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10">
            <img 
              src={logo} 
              alt="AI Nexus" 
              className="w-full h-full object-contain rounded-full drop-shadow-[0_0_20px_rgba(0,212,255,0.4)]" 
            />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AI Nexus
            </h2>
            <p className="text-xs text-muted-foreground">
              150+ AI Tools & Automation
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end
                      className={({ isActive }) => 
                        isActive 
                          ? "bg-primary/10 text-primary font-medium border-l-2 border-primary" 
                          : "hover:bg-muted/50"
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {onLogout && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={onLogout}>
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
