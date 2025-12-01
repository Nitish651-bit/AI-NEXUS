import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useEmailGeneratorAI } from "@/hooks/useEmailGeneratorAI";
import { Mail, Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const EmailGenerator = () => {
  const [context, setContext] = useState("");
  const [tone, setTone] = useState("Professional");
  const [purpose, setPurpose] = useState("Response");
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const { generateEmail, isProcessing } = useEmailGeneratorAI({ tone, purpose });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image (JPEG, PNG, GIF, WEBP) or PDF file",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!context.trim()) {
      toast({
        title: "Context required",
        description: "Please provide context for the email",
        variant: "destructive",
      });
      return;
    }

    try {
      let imageData = null;

      // If file is uploaded, convert to base64
      if (uploadedFile) {
        const reader = new FileReader();
        imageData = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(uploadedFile);
        });
      }

      // Call the hook's generateEmail with the imageData
      const result = await generateEmail(context, imageData);
      setGeneratedEmail(result);
      
      toast({
        title: "Email Generated!",
        description: uploadedFile ? "AI analyzed your file and generated the email" : "Email response generated successfully",
      });
    } catch (error) {
      console.error("Generation error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail size={20} />
            AI Email Generator
          </CardTitle>
          <CardDescription>
            Generate professional email responses with AI. Upload images or files for context-aware emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <ImageIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>New Feature:</strong> Upload screenshots, images, or PDFs! The AI will analyze them and create relevant email responses.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tone">Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Friendly">Friendly</SelectItem>
                  <SelectItem value="Formal">Formal</SelectItem>
                  <SelectItem value="Casual">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="purpose">Purpose</Label>
              <Select value={purpose} onValueChange={setPurpose}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Response">Response</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                  <SelectItem value="Request">Request</SelectItem>
                  <SelectItem value="Thank You">Thank You</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="context">Email Context</Label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g., 'Reply to client asking about project timeline' or 'Solve the math problem in the attached screenshot'"
              rows={4}
              className="resize-none"
            />
          </div>

          <div>
            <Label>Attach File (Optional)</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload size={16} />
                Upload Image/PDF
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              {uploadedFile && (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                  {uploadedFile.type.startsWith('image/') ? (
                    <ImageIcon size={16} />
                  ) : (
                    <FileText size={16} />
                  )}
                  <span className="text-sm truncate max-w-[200px]">
                    {uploadedFile.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="h-6 w-6 p-0"
                  >
                    <X size={14} />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {filePreview && (
            <div className="border rounded-md p-2">
              <img 
                src={filePreview} 
                alt="Preview" 
                className="max-h-[200px] mx-auto object-contain"
              />
            </div>
          )}

          <Button 
            onClick={handleGenerate} 
            disabled={isProcessing || !context.trim()}
            className="w-full gap-2"
          >
            <Mail size={16} />
            {isProcessing ? "Generating..." : "Generate Email"}
          </Button>

          {generatedEmail && (
            <div className="mt-6">
              <Label>Generated Email</Label>
              <div className="mt-2 p-4 bg-muted rounded-md">
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {generatedEmail}
                </pre>
              </div>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => {
                  navigator.clipboard.writeText(generatedEmail);
                  toast({
                    title: "Copied!",
                    description: "Email copied to clipboard",
                  });
                }}
              >
                Copy to Clipboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};