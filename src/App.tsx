import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Integrations } from "./pages/Integrations";
import ResetPassword from "./pages/ResetPassword";
import VideoSuite from "./pages/VideoSuite";
import NexusSettings from "./pages/NexusSettings";
import ToolRegistry from "./pages/ToolRegistry";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/video-suite" element={<VideoSuite />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/nexus-settings" element={<NexusSettings />} />
          <Route path="/tool-registry" element={<ToolRegistry />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
