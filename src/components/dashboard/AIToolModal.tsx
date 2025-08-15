import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Sparkles, 
  Send, 
  Copy, 
  Download, 
  Star,
  Zap,
  X
} from "lucide-react";

interface AIToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  tool: {
    title: string;
    description: string;
    category: string;
    rating: number;
    icon: React.ReactNode;
    isPremium?: boolean;
  };
}

export function AIToolModal({ isOpen, onClose, tool }: AIToolModalProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!input.trim()) return;
    
    setIsProcessing(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock output based on tool type
    let mockOutput = "";
    
    if (tool.category === "Text & Writing") {
      mockOutput = `Here's an AI-generated response to "${input}":\n\nThis is a sophisticated analysis using advanced language models. The content demonstrates the power of modern AI in understanding context, generating coherent responses, and maintaining consistency throughout the output.\n\nKey insights:\n• Advanced natural language processing\n• Context-aware generation\n• High-quality, human-like text output`;
    } else if (tool.category === "Code Assistant") {
      mockOutput = `// AI-generated code for: ${input}\n\nfunction aiGeneratedSolution() {\n  // This code demonstrates AI-powered programming assistance\n  const result = processInput("${input}");\n  \n  return {\n    success: true,\n    data: result,\n    timestamp: new Date().toISOString()\n  };\n}\n\n// Additional optimizations and best practices applied\nexport default aiGeneratedSolution;`;
    } else if (tool.category === "Image Generation") {
      mockOutput = `🎨 Image Generation Complete!\n\nPrompt: "${input}"\n\n✅ High-resolution image created\n📏 Dimensions: 1024x1024px\n🎯 Style: Photorealistic\n⚡ Processing time: 1.8 seconds\n\n[In a real implementation, the generated image would appear here]\n\nImage features:\n• Professional quality\n• Optimized compression\n• Ready for download`;
    } else {
      mockOutput = `AI Analysis Result for "${input}":\n\n✨ Processing completed using ${tool.title}\n\nResults:\n• Data processed successfully\n• Advanced algorithms applied\n• Insights generated\n• Quality score: ${tool.rating}/5.0\n\nThis demonstrates the power of AI in the ${tool.category} category.`;
    }
    
    setOutput(mockOutput);
    setIsProcessing(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast({
        title: "Copied to clipboard!",
        description: "The AI output has been copied successfully.",
      });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = output;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      
      toast({
        title: "Copied to clipboard!",
        description: "The AI output has been copied successfully.",
      });
    }
  };

  const downloadOutput = () => {
    try {
      const element = document.createElement("a");
      const file = new Blob([output], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      
      // Generate filename based on tool and timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, "-");
      const toolName = tool.title.toLowerCase().replace(/\s+/g, "-");
      element.download = `${toolName}-output-${timestamp}.txt`;
      
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      toast({
        title: "Download started!",
        description: "Your AI output is being downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error downloading the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] glass-card border border-holo-blue/20">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-holo-blue/20 text-holo-blue">
                {tool.icon}
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-foreground">
                  {tool.title}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {tool.category}
                  </Badge>
                  {tool.isPremium && (
                    <Badge variant="outline" className="text-xs border-cyber-purple text-cyber-purple">
                      Premium
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star size={12} className="fill-current" />
                    <span className="text-xs">{tool.rating}</span>
                  </div>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-muted-foreground">{tool.description}</p>
          
          <Separator className="bg-holo-blue/20" />

          {/* Input Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-holo-blue" size={20} />
              <h3 className="font-semibold text-foreground">Input</h3>
            </div>
            
            <div className="space-y-3">
              {tool.category === "Text & Writing" ? (
                <Textarea
                  placeholder="Enter your text prompt or question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="bg-background/50 border-holo-blue/30 focus:border-holo-blue min-h-[100px]"
                />
              ) : (
                <Input
                  placeholder={`Enter your ${tool.category.toLowerCase()} request...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="bg-background/50 border-holo-blue/30 focus:border-holo-blue"
                />
              )}
              
              <Button
                onClick={handleGenerate}
                disabled={!input.trim() || isProcessing}
                variant="holo"
                className="w-full"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap size={16} />
                    Generate with AI
                  </div>
                )}
              </Button>
            </div>
          </div>

          {/* Output Section */}
          {output && (
            <>
              <Separator className="bg-holo-blue/20" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-holo-blue" size={20} />
                    <h3 className="font-semibold text-foreground">AI Output</h3>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      <Copy size={14} />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadOutput}>
                      <Download size={14} />
                      Download
                    </Button>
                  </div>
                </div>
                
                <div className="bg-card border border-holo-blue/30 rounded-lg p-4 shadow-lg max-h-96 overflow-y-auto">
                  <pre className="text-card-foreground whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {output}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}