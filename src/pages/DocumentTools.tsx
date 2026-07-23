import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SEO } from "@/components/seo/SEO";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText, Combine, Scissors, Minimize2, Image as ImageIcon,
  FileImage, MessageSquare, Loader2, Download, Upload
} from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

async function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return await file.arrayBuffer();
}

async function extractPdfText(file: File): Promise<string> {
  const buf = await readAsArrayBuffer(file);
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let out = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    out += content.items.map((it: any) => it.str).join(" ") + "\n\n";
  }
  return out.trim();
}

async function pdfToImages(file: File, scale = 1.5): Promise<Blob[]> {
  const buf = await readAsArrayBuffer(file);
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const blobs: Blob[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const blob: Blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b!), "image/jpeg", 0.85)
    );
    blobs.push(blob);
  }
  return blobs;
}

function ToolCard({
  icon: Icon, title, description, children,
}: { icon: any; title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary"><Icon className="w-5 h-5" /></div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function FileInput({ accept, multiple, onFiles, label }: {
  accept: string; multiple?: boolean; onFiles: (files: File[]) => void; label: string;
}) {
  return (
    <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors text-sm">
      <Upload className="w-4 h-4" />
      <span>{label}</span>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
    </label>
  );
}

export default function DocumentTools() {
  // Merge
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [merging, setMerging] = useState(false);

  const handleMerge = async () => {
    if (mergeFiles.length < 2) return toast.error("Select at least 2 PDFs");
    setMerging(true);
    try {
      const out = await PDFDocument.create();
      for (const f of mergeFiles) {
        const src = await PDFDocument.load(await readAsArrayBuffer(f), { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      const bytes = await out.save();
      saveAs(new Blob([bytes as BlobPart], { type: "application/pdf" }), "merged.pdf");
      toast.success("Merged PDF ready");
    } catch (e: any) {
      toast.error(e.message || "Merge failed");
    } finally { setMerging(false); }
  };

  // Split
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitRange, setSplitRange] = useState("");
  const [splitting, setSplitting] = useState(false);

  const parseRanges = (input: string, total: number): number[][] => {
    if (!input.trim()) return Array.from({ length: total }, (_, i) => [i]);
    return input.split(",").map((seg) => {
      const [a, b] = seg.trim().split("-").map((n) => parseInt(n, 10));
      const start = Math.max(1, a) - 1;
      const end = Math.min(total, b || a) - 1;
      const arr: number[] = [];
      for (let i = start; i <= end; i++) arr.push(i);
      return arr;
    }).filter((r) => r.length);
  };

  const handleSplit = async () => {
    if (!splitFile) return toast.error("Select a PDF");
    setSplitting(true);
    try {
      const src = await PDFDocument.load(await readAsArrayBuffer(splitFile), { ignoreEncryption: true });
      const ranges = parseRanges(splitRange, src.getPageCount());
      const zip = new JSZip();
      for (let idx = 0; idx < ranges.length; idx++) {
        const out = await PDFDocument.create();
        const pages = await out.copyPages(src, ranges[idx]);
        pages.forEach((p) => out.addPage(p));
        const bytes = await out.save();
        zip.file(`part-${idx + 1}.pdf`, bytes);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, "split.zip");
      toast.success(`Split into ${ranges.length} file(s)`);
    } catch (e: any) {
      toast.error(e.message || "Split failed");
    } finally { setSplitting(false); }
  };

  // Compress PDF (re-encode with object streams + downsample raster pages via render)
  const [compFile, setCompFile] = useState<File | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [compQuality, setCompQuality] = useState(0.6);

  const handleCompressPdf = async () => {
    if (!compFile) return toast.error("Select a PDF");
    setCompressing(true);
    try {
      // Render every page to JPEG then repack as a smaller PDF
      const buf = await readAsArrayBuffer(compFile);
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      const out = await PDFDocument.create();
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        const jpegBlob: Blob = await new Promise((res) =>
          canvas.toBlob((b) => res(b!), "image/jpeg", compQuality)
        );
        const jpg = await out.embedJpg(await jpegBlob.arrayBuffer());
        const p = out.addPage([viewport.width, viewport.height]);
        p.drawImage(jpg, { x: 0, y: 0, width: viewport.width, height: viewport.height });
      }
      const bytes = await out.save({ useObjectStreams: true });
      const originalKb = Math.round(compFile.size / 1024);
      const newKb = Math.round(bytes.length / 1024);
      saveAs(new Blob([bytes as BlobPart], { type: "application/pdf" }), "compressed.pdf");
      toast.success(`Compressed: ${originalKb}KB → ${newKb}KB`);
    } catch (e: any) {
      toast.error(e.message || "Compress failed");
    } finally { setCompressing(false); }
  };

  // Images -> PDF
  const [imgFiles, setImgFiles] = useState<File[]>([]);
  const [img2pdfLoading, setImg2pdfLoading] = useState(false);

  const handleImagesToPdf = async () => {
    if (!imgFiles.length) return toast.error("Select images");
    setImg2pdfLoading(true);
    try {
      const out = await PDFDocument.create();
      for (const f of imgFiles) {
        const bytes = new Uint8Array(await readAsArrayBuffer(f));
        const img = f.type.includes("png") ? await out.embedPng(bytes) : await out.embedJpg(bytes);
        const page = out.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
      const bytes = await out.save();
      saveAs(new Blob([bytes as BlobPart], { type: "application/pdf" }), "images.pdf");
      toast.success("PDF ready");
    } catch (e: any) {
      toast.error(e.message || "Conversion failed");
    } finally { setImg2pdfLoading(false); }
  };

  // PDF -> Images
  const [p2iFile, setP2iFile] = useState<File | null>(null);
  const [p2iLoading, setP2iLoading] = useState(false);
  const handlePdfToImages = async () => {
    if (!p2iFile) return toast.error("Select a PDF");
    setP2iLoading(true);
    try {
      const blobs = await pdfToImages(p2iFile);
      const zip = new JSZip();
      blobs.forEach((b, i) => zip.file(`page-${i + 1}.jpg`, b));
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "pages.zip");
      toast.success(`Extracted ${blobs.length} page(s)`);
    } catch (e: any) {
      toast.error(e.message || "Conversion failed");
    } finally { setP2iLoading(false); }
  };

  // Compress image
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgQuality, setImgQuality] = useState(0.7);
  const [imgMaxW, setImgMaxW] = useState(1920);
  const [imgLoading, setImgLoading] = useState(false);
  const handleCompressImage = async () => {
    if (!imgFile) return toast.error("Select an image");
    setImgLoading(true);
    try {
      const bmp = await createImageBitmap(imgFile);
      const scale = Math.min(1, imgMaxW / bmp.width);
      const w = Math.round(bmp.width * scale);
      const h = Math.round(bmp.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
      const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", imgQuality));
      const orig = Math.round(imgFile.size / 1024);
      const now = Math.round(blob.size / 1024);
      saveAs(blob, imgFile.name.replace(/\.[^.]+$/, "") + "-compressed.jpg");
      toast.success(`Compressed: ${orig}KB → ${now}KB`);
    } catch (e: any) {
      toast.error(e.message || "Compression failed");
    } finally { setImgLoading(false); }
  };

  // Chat with PDF
  const [chatFile, setChatFile] = useState<File | null>(null);
  const [chatText, setChatText] = useState("");
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatAnswer, setChatAnswer] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const handleExtract = useCallback(async (file: File) => {
    setChatFile(file);
    setChatText("");
    setChatAnswer("");
    try {
      toast.info("Extracting text...");
      const text = await extractPdfText(file);
      setChatText(text);
      toast.success(`Extracted ${text.length.toLocaleString()} characters`);
    } catch (e: any) {
      toast.error(e.message || "Extraction failed");
    }
  }, []);

  const handleAsk = async () => {
    if (!chatText) return toast.error("Upload a PDF first");
    if (!chatQuestion.trim()) return toast.error("Enter a question");
    setChatLoading(true);
    setChatAnswer("");
    try {
      const context = chatText.slice(0, 20000);
      const { data, error } = await supabase.functions.invoke("lovable-ai-chat", {
        body: {
          messages: [
            { role: "system", content: "You answer questions strictly based on the provided document. If the answer is not in the document, say so." },
            { role: "user", content: `Document:\n"""${context}"""\n\nQuestion: ${chatQuestion}` },
          ],
        },
      });
      if (error) throw error;
      const answer = data?.message || data?.content || data?.choices?.[0]?.message?.content || JSON.stringify(data);
      setChatAnswer(answer);
    } catch (e: any) {
      toast.error(e.message || "AI request failed");
    } finally { setChatLoading(false); }
  };

  return (
    <>
      <SEO
        title="Document Tools — PDF, PPT, Image Converter & Compressor | AI Nexus"
        description="Free PDF and image tools: merge, split, compress PDFs, convert images to PDF, extract pages, compress images, and chat with your PDF using AI. Works in your browser."
        path="/document-tools"
      />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" /> Document Tools
            </h1>
            <p className="text-muted-foreground mt-1">
              PDF and image utilities that run in your browser. Merge, split, compress, convert, and chat with your documents.
            </p>
          </div>

          <Tabs defaultValue="pdf" className="w-full">
            <TabsList>
              <TabsTrigger value="pdf">PDF Tools</TabsTrigger>
              <TabsTrigger value="convert">Convert</TabsTrigger>
              <TabsTrigger value="compress">Compress</TabsTrigger>
              <TabsTrigger value="chat">Chat with PDF</TabsTrigger>
            </TabsList>

            <TabsContent value="pdf" className="mt-6 grid gap-4 md:grid-cols-2">
              <ToolCard icon={Combine} title="Merge PDFs" description="Combine multiple PDFs into one file">
                <FileInput accept="application/pdf" multiple label={mergeFiles.length ? `${mergeFiles.length} file(s) selected` : "Select PDFs"} onFiles={setMergeFiles} />
                <Button onClick={handleMerge} disabled={merging || mergeFiles.length < 2} className="w-full">
                  {merging ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Merge & Download
                </Button>
              </ToolCard>

              <ToolCard icon={Scissors} title="Split PDF" description="Extract pages or ranges (e.g. 1-3, 5, 7-9)">
                <FileInput accept="application/pdf" label={splitFile?.name || "Select PDF"} onFiles={(f) => setSplitFile(f[0])} />
                <div>
                  <Label className="text-xs">Ranges (leave empty to split every page)</Label>
                  <Input placeholder="1-3, 5, 8-10" value={splitRange} onChange={(e) => setSplitRange(e.target.value)} />
                </div>
                <Button onClick={handleSplit} disabled={splitting || !splitFile} className="w-full">
                  {splitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Split & Download ZIP
                </Button>
              </ToolCard>
            </TabsContent>

            <TabsContent value="convert" className="mt-6 grid gap-4 md:grid-cols-2">
              <ToolCard icon={FileImage} title="Images → PDF" description="Combine JPG/PNG images into a single PDF">
                <FileInput accept="image/jpeg,image/png" multiple label={imgFiles.length ? `${imgFiles.length} image(s) selected` : "Select images"} onFiles={setImgFiles} />
                <Button onClick={handleImagesToPdf} disabled={img2pdfLoading || !imgFiles.length} className="w-full">
                  {img2pdfLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Convert to PDF
                </Button>
              </ToolCard>

              <ToolCard icon={ImageIcon} title="PDF → Images" description="Extract every page as a high-quality JPG">
                <FileInput accept="application/pdf" label={p2iFile?.name || "Select PDF"} onFiles={(f) => setP2iFile(f[0])} />
                <Button onClick={handlePdfToImages} disabled={p2iLoading || !p2iFile} className="w-full">
                  {p2iLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Extract Pages (ZIP)
                </Button>
              </ToolCard>
            </TabsContent>

            <TabsContent value="compress" className="mt-6 grid gap-4 md:grid-cols-2">
              <ToolCard icon={Minimize2} title="Compress PDF" description="Reduce PDF file size by re-encoding pages">
                <FileInput accept="application/pdf" label={compFile?.name || "Select PDF"} onFiles={(f) => setCompFile(f[0])} />
                <div>
                  <Label className="text-xs">Quality: {Math.round(compQuality * 100)}%</Label>
                  <Input type="range" min={0.2} max={0.95} step={0.05} value={compQuality} onChange={(e) => setCompQuality(parseFloat(e.target.value))} />
                </div>
                <Button onClick={handleCompressPdf} disabled={compressing || !compFile} className="w-full">
                  {compressing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Compress & Download
                </Button>
              </ToolCard>

              <ToolCard icon={Minimize2} title="Compress Image" description="Resize and re-encode a JPG/PNG to shrink it">
                <FileInput accept="image/*" label={imgFile?.name || "Select image"} onFiles={(f) => setImgFile(f[0])} />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Quality: {Math.round(imgQuality * 100)}%</Label>
                    <Input type="range" min={0.2} max={0.95} step={0.05} value={imgQuality} onChange={(e) => setImgQuality(parseFloat(e.target.value))} />
                  </div>
                  <div>
                    <Label className="text-xs">Max width (px)</Label>
                    <Input type="number" value={imgMaxW} onChange={(e) => setImgMaxW(parseInt(e.target.value) || 1920)} />
                  </div>
                </div>
                <Button onClick={handleCompressImage} disabled={imgLoading || !imgFile} className="w-full">
                  {imgLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Compress & Download
                </Button>
              </ToolCard>
            </TabsContent>

            <TabsContent value="chat" className="mt-6">
              <ToolCard icon={MessageSquare} title="Chat with your PDF" description="Ask questions about any PDF or PPT-exported PDF. AI answers using only your document.">
                <FileInput accept="application/pdf" label={chatFile?.name || "Upload PDF (works with PPT exported as PDF)"} onFiles={(f) => handleExtract(f[0])} />
                {chatText && (
                  <p className="text-xs text-muted-foreground">Loaded {chatText.length.toLocaleString()} characters</p>
                )}
                <div>
                  <Label className="text-xs">Your question</Label>
                  <Textarea rows={3} placeholder="e.g. Summarize this document in 5 bullets" value={chatQuestion} onChange={(e) => setChatQuestion(e.target.value)} />
                </div>
                <Button onClick={handleAsk} disabled={chatLoading || !chatText} className="w-full">
                  {chatLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                  Ask AI
                </Button>
                {chatAnswer && (
                  <div className="mt-3 p-3 rounded-lg bg-muted text-sm whitespace-pre-wrap">{chatAnswer}</div>
                )}
              </ToolCard>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
