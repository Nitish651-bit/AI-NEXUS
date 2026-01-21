import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Star, 
  Crown, 
  Zap, 
  Play, 
  Copy, 
  Download, 
  Server, 
  Cloud,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { useNexusConnector } from "@/hooks/useNexusConnector";
import { useGeminiAI } from "@/hooks/useGeminiAI";
import { useToast } from "@/hooks/use-toast";
import type { AITool } from "@/data/aiToolsData";

interface ToolExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tool: AITool;
}

type ExecutionSource = "nexus" | "cloud" | null;

export function ToolExecutionModal({ isOpen, onClose, tool }: ToolExecutionModalProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [executionSource, setExecutionSource] = useState<ExecutionSource>(null);
  const { toast } = useToast();
  
  const { executeTool, isProcessing: isNexusProcessing } = useNexusConnector({
    onSourceChange: (source) => {
      setExecutionSource(source.includes('nexus') ? 'nexus' : 'cloud');
    }
  });
  
  const { generateContent, isProcessing: isGeminiLoading } = useGeminiAI({
    toolCategory: tool.category,
    toolTitle: tool.title
  });
  
  const isProcessing = isNexusProcessing || isGeminiLoading;

  const handleExecute = async () => {
    if (!input.trim()) {
      toast({
        title: "Input Required",
        description: "Please provide input for the tool",
        variant: "destructive"
      });
      return;
    }

    setOutput("");
    setExecutionSource(null);

    try {
      // Try Nexus connector first for tool execution
      const nexusResult = await executeTool(tool.id.toString(), { input, toolTitle: tool.title });
      
      if (nexusResult.success && nexusResult.output) {
        setOutput(typeof nexusResult.output === 'string' ? nexusResult.output : JSON.stringify(nexusResult.output, null, 2));
        setExecutionSource(nexusResult.source.includes('nexus') ? 'nexus' : 'cloud');
      } else {
        // Fallback to Gemini AI
        const prompt = `You are the "${tool.title}" AI tool. ${tool.description}

User Input: ${input}

Provide a helpful, detailed response based on the tool's purpose.`;
        
        const result = await generateContent(prompt);
        if (result) {
          setOutput(result);
          setExecutionSource("cloud");
        }
      }
    } catch (error) {
      console.error("Tool execution error:", error);
      toast({
        title: "Execution Failed",
        description: "Failed to execute the tool. Please try again.",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    toast({
      title: "Copied!",
      description: "Output copied to clipboard"
    });
  };

  const downloadOutput = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tool.title.replace(/\s+/g, '-').toLowerCase()}-output.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              {tool.icon}
            </div>
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2 text-xl">
                {tool.title}
                {tool.isPremium && <Crown size={18} className="text-amber-500" />}
                {tool.isPopular && <Zap size={18} className="text-primary" />}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="secondary">{tool.category}</Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star size={14} className="fill-amber-500 text-amber-500" />
                  {tool.rating}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 mt-4 overflow-hidden">
          {/* Input Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Input</label>
            <Textarea
              placeholder={`Enter your input for ${tool.title}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Execute Button */}
          <Button 
            onClick={handleExecute} 
            disabled={isProcessing || !input.trim()}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play size={16} className="mr-2" />
                Execute Tool
              </>
            )}
          </Button>

          {/* Output Section */}
          {output && (
            <div className="flex-1 flex flex-col min-h-0 border-2 border-primary/30 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-border">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-accent" />
                  <span className="text-sm font-medium">Output</span>
                  {executionSource && (
                    <Badge variant="outline" className="text-xs gap-1">
                      {executionSource === "nexus" ? (
                        <>
                          <Server size={10} />
                          Local Server
                        </>
                      ) : (
                        <>
                          <Cloud size={10} />
                          Cloud
                        </>
                      )}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={copyToClipboard}>
                    <Copy size={14} />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={downloadOutput}>
                    <Download size={14} />
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-1 max-h-[200px]">
                <pre className="p-4 text-sm whitespace-pre-wrap font-mono text-foreground">
                  {output}
                </pre>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
