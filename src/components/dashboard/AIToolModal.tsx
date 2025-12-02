import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useGeminiAI } from "@/hooks/useGeminiAI";
import { useSocialMediaAI } from "@/hooks/useSocialMediaAI";
import { useEmailGeneratorAI } from "@/hooks/useEmailGeneratorAI";
import { extractTextFromFile } from "@/utils/fileTextExtractor";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Sparkles, 
  Send, 
  Copy, 
  Download, 
  Star,
  Zap,
  X,
  Plus,
  Camera,
  FileImage,
  Folder,
  Trash2
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
  const [outputType, setOutputType] = useState<"text" | "image" | "code">("text");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { generateContent, isProcessing } = useGeminiAI({
    toolCategory: tool.category,
    toolTitle: tool.title
  });
  const { generateContent: generateSocialContent, isProcessing: isSocialProcessing } = useSocialMediaAI();
  const { generateEmail, isProcessing: isEmailProcessing } = useEmailGeneratorAI();

  const handleFileUpload = (files: File[]) => {
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/') || file.type.startsWith('video/') || 
                     file.type === 'application/pdf' || file.type.startsWith('text/');
      if (!isValid) {
        toast({
          title: "Invalid file type",
          description: "Please upload images, videos, PDFs, or text files only.",
          variant: "destructive"
        });
      }
      return isValid;
    });
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
    
    if (validFiles.length > 0) {
      toast({
        title: "Files uploaded!",
        description: `${validFiles.length} file(s) added successfully.`
      });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openCameraDialog = () => {
    cameraInputRef.current?.click();
  };

  const handleGenerate = async () => {
    if (!input.trim() && uploadedFiles.length === 0) return;
    
    try {
      let prompt = input.trim();

      if (uploadedFiles.length > 0) {
        const fileSummaries: string[] = [];

        for (const file of uploadedFiles) {
          try {
            const content = await extractTextFromFile(file);

            if (content) {
              fileSummaries.push(
                `File: ${file.name}\nType: ${file.type || "unknown"}\n\n${content}`
              );
            } else {
              fileSummaries.push(
                `File: ${file.name}\nType: ${file.type || "unknown"}\n(Note: This file type cannot be read directly. Use only the filename as context.)`
              );
            }
          } catch (error) {
            console.error("Failed to read file", file.name, error);
            fileSummaries.push(
              `File: ${file.name}\n(Note: There was an error reading this file. Treat only the filename as context.)`
            );
          }
        }

        if (fileSummaries.length > 0) {
          prompt += `\n\nYou also have access to the following attached file contents. Use them when answering:\n\n${fileSummaries.join(
            "\n\n---\n\n"
          )}`;
        }
      }
      
      let response: string;
      
      // Route to specific AI handlers based on tool category or title
      if (tool.category === "Marketing & Content" && tool.title.toLowerCase().includes("social")) {
        response = await generateSocialContent(prompt);
      } else if (tool.category === "Marketing & Content" && tool.title.toLowerCase().includes("email")) {
        response = await generateEmail(prompt);
      } else {
        response = await generateContent(prompt);
      }
      
      // Check if response contains structured data
      if (typeof response === 'string') {
        try {
          const parsed = JSON.parse(response);
          if (parsed.outputType === 'image' && parsed.output) {
            setOutput(parsed.output);
            setOutputType('image');
          } else {
            setOutput(response);
            setOutputType(tool.category === 'Code Assistant' ? 'code' : 'text');
          }
        } catch {
          // If not JSON, treat as regular text
          setOutput(response);
          setOutputType(tool.category === 'Code Assistant' ? 'code' : 'text');
        }
      } else {
        setOutput(response);
        setOutputType(tool.category === 'Code Assistant' ? 'code' : 'text');
      }
      
      toast({
        title: "AI processing completed!",
        description: "Your content has been generated successfully.",
      });
    } catch (error) {
      // Error handling is done in the hook
      console.error('Failed to generate content:', error);
    }
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
              <div className="relative">
                {tool.category === "Text & Writing" ? (
                  <Textarea
                    placeholder="Enter your text prompt or question..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="bg-background/50 border-holo-blue/30 focus:border-holo-blue min-h-[100px] pr-12"
                  />
                ) : (
                  <Input
                    placeholder={`Enter your ${tool.category.toLowerCase()} request...`}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="bg-background/50 border-holo-blue/30 focus:border-holo-blue pr-12"
                  />
                )}
                
                {/* Upload Button */}
                <div className="absolute right-2 top-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-holo-blue hover:bg-holo-blue/20"
                      >
                        <Plus size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={openCameraDialog} className="gap-2">
                        <Camera size={14} />
                        Take Photo
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={openFileDialog} className="gap-2">
                        <FileImage size={14} />
                        From Gallery
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={openFileDialog} className="gap-2">
                        <Folder size={14} />
                        From Files
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* File inputs */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.txt,.doc,.docx"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              {/* Uploaded files display */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Attached Files:</h4>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-card border border-holo-blue/30 rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          {file.type.startsWith('image/') ? (
                            <FileImage size={16} className="text-holo-blue" />
                          ) : (
                            <Folder size={16} className="text-holo-blue" />
                          )}
                          <span className="text-sm text-foreground truncate max-w-40">
                            {file.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({Math.round(file.size / 1024)}KB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-6 w-6 p-0 text-destructive hover:bg-destructive/20"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <Button
                onClick={handleGenerate}
                disabled={(!input.trim() && uploadedFiles.length === 0) || isProcessing || isSocialProcessing || isEmailProcessing}
                variant="holo"
                className="w-full"
              >
                {(isProcessing || isSocialProcessing || isEmailProcessing) ? (
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
                
                <div className="bg-card border border-holo-blue/30 rounded-lg shadow-lg">
                  <div className="p-4 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-holo-blue/50 scrollbar-track-transparent hover:scrollbar-thumb-holo-blue"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'hsl(var(--holo-blue) / 0.5) transparent'
                    }}
                  >
                    {outputType === 'image' ? (
                      <div className="flex justify-center">
                        <img 
                          src={`data:image/png;base64,${output}`}
                          alt="Generated image"
                          className="max-w-full max-h-64 object-contain rounded-lg shadow-md"
                        />
                      </div>
                    ) : outputType === 'code' ? (
                      <pre className="text-card-foreground whitespace-pre-wrap font-mono text-sm leading-relaxed bg-muted/50 p-4 rounded-lg overflow-x-auto">
                        <code>{output}</code>
                      </pre>
                    ) : (
                      <div className="text-card-foreground whitespace-pre-wrap text-sm leading-relaxed">
                        {output}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}