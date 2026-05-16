import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Sparkles, Type, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  CAPTION_PRESET_STYLES,
  CaptionPreset,
  useEditorStore,
} from "@/stores/editorStore";

const PRESETS: { id: CaptionPreset; label: string }[] = [
  { id: "tiktok-bold", label: "TikTok Bold" },
  { id: "karaoke", label: "Karaoke" },
  { id: "cinematic", label: "Cinematic" },
  { id: "neon", label: "Neon" },
  { id: "subtle", label: "Subtle" },
  { id: "typewriter", label: "Typewriter" },
];

interface Props {
  videoDuration: number;
}

export function TikTokCaptions({ videoDuration }: Props) {
  const [preset, setPreset] = useState<CaptionPreset>("tiktok-bold");
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);
  const { captions, addCaptions, removeCaption, clearCaptions } = useEditorStore();

  const generate = async () => {
    if (!videoDuration) return toast.error("Add a video first");
    if (!script.trim()) return toast.error("Enter a topic or script");

    setLoading(true);
    try {
      const prompt = `Generate animated viral video captions for a ${videoDuration.toFixed(
        0
      )}s video. Topic/script: "${script.trim()}".
Split the script into ${Math.max(
        4,
        Math.min(20, Math.floor(videoDuration / 2.5))
      )} short caption chunks (2-6 words each, punchy TikTok style).
Return ONLY a JSON array of objects with: text (string), start (number seconds), end (number seconds), highlightWord (string, one key word to highlight, optional).
Distribute timings across the full ${videoDuration.toFixed(1)}s.`;

      const { data, error } = await supabase.functions.invoke("lovable-ai-chat", {
        body: { messages: [{ role: "user", content: prompt }] },
      });
      if (error) throw error;

      const text =
        data?.content || data?.message || data?.response || JSON.stringify(data);
      const match = String(text).match(/\[[\s\S]*\]/);
      if (!match) throw new Error("Invalid AI response");
      const parsed = JSON.parse(match[0]);

      const caps = parsed
        .filter((c: any) => c.text && typeof c.start === "number")
        .map((c: any) => ({
          id: `cap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          text: String(c.text),
          start: Math.max(0, Number(c.start)),
          end: Math.min(videoDuration, Number(c.end ?? c.start + 2)),
          preset,
          highlightWord: c.highlightWord,
        }));

      addCaptions(caps);
      toast.success(`Generated ${caps.length} captions`);
    } catch (e) {
      console.error(e);
      toast.error("Caption generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Type className="w-4 h-4 text-primary" />
        <h3 className="font-medium text-sm">AI Captions</h3>
      </div>

      <div>
        <label className="text-[10px] text-muted-foreground mb-1 block">Style</label>
        <div className="grid grid-cols-3 gap-1">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={`p-1.5 rounded-md border text-[10px] transition ${
                preset === p.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-border bg-black p-4 min-h-[60px] flex items-center justify-center">
        <span style={CAPTION_PRESET_STYLES[preset]}>Preview Caption</span>
      </div>

      <Textarea
        placeholder="Enter your script or topic (e.g. 'How to grow on TikTok in 2026')"
        value={script}
        onChange={(e) => setScript(e.target.value)}
        rows={3}
        className="text-xs resize-none"
      />

      <Button
        onClick={generate}
        disabled={loading}
        className="w-full gap-2 bg-gradient-to-r from-primary to-pink-500"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {loading ? "Generating..." : "Generate Captions"}
      </Button>

      {captions.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-[10px]">
              {captions.length} captions
            </Badge>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearCaptions}>
              Clear all
            </Button>
          </div>
          <ScrollArea className="h-[180px]">
            <div className="space-y-1 pr-2">
              {captions.map((c) => (
                <Card key={c.id} className="p-2 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{c.text}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {c.start.toFixed(1)}s — {c.end.toFixed(1)}s
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeCaption(c.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
}

/** Live caption overlay component for the preview monitor */
export function CaptionOverlay({ currentTime }: { currentTime: number }) {
  const { captions } = useEditorStore();
  const active = captions.find(
    (c) => currentTime >= c.start && currentTime <= c.end
  );
  if (!active) return null;
  return (
    <div className="absolute inset-x-0 bottom-[12%] flex justify-center pointer-events-none px-4 z-10">
      <span style={CAPTION_PRESET_STYLES[active.preset]} className="text-center">
        {active.text}
      </span>
    </div>
  );
}
