import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Wand2, Loader2, Scissors, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEditorStore, CutSuggestion } from "@/stores/editorStore";

interface Props {
  videoDuration: number;
  videoName?: string;
  hasMusic: boolean;
  onApplyCut?: (cut: CutSuggestion) => void;
}

const MODES = [
  { id: "beat", label: "Beat Sync", desc: "Cut on music beats" },
  { id: "viral", label: "Viral Reel", desc: "Short, punchy edits" },
  { id: "cinematic", label: "Cinematic", desc: "Long, dramatic shots" },
  { id: "montage", label: "Montage", desc: "Energetic compilation" },
];

export function AIAutoEdit({ videoDuration, videoName, hasMusic, onApplyCut }: Props) {
  const [mode, setMode] = useState("viral");
  const [loading, setLoading] = useState(false);
  const { cutSuggestions, setCutSuggestions } = useEditorStore();

  const generate = async () => {
    if (!videoDuration || videoDuration < 1) {
      toast.error("Add a video clip first");
      return;
    }
    setLoading(true);
    try {
      const prompt = `You are an expert video editor. The user has a ${videoDuration.toFixed(
        1
      )}s clip${videoName ? ` named "${videoName}"` : ""}.${
        hasMusic ? " Music is added." : ""
      } Generate ${
        mode === "viral" ? "6-10 fast" : mode === "cinematic" ? "3-5 long" : "5-8"
      } cut suggestions in "${mode}" style. Return ONLY a JSON array of objects with: start (number seconds), end (number seconds), reason (short string), transition (one of: "cut", "fade", "zoom", "whip", "glitch"). No prose, just JSON.`;

      const { data, error } = await supabase.functions.invoke("lovable-ai-chat", {
        body: { messages: [{ role: "user", content: prompt }] },
      });
      if (error) throw error;

      // Extract JSON from response
      const text =
        data?.content || data?.message || data?.response || JSON.stringify(data);
      const match = String(text).match(/\[[\s\S]*\]/);
      if (!match) throw new Error("AI did not return valid cuts");
      const parsed = JSON.parse(match[0]) as CutSuggestion[];
      const valid = parsed
        .filter((c) => typeof c.start === "number" && typeof c.end === "number")
        .map((c) => ({
          ...c,
          start: Math.max(0, Math.min(c.start, videoDuration)),
          end: Math.max(0, Math.min(c.end, videoDuration)),
        }));

      setCutSuggestions(valid);
      toast.success(`Generated ${valid.length} AI cut suggestions`);
    } catch (e) {
      console.error(e);
      toast.error("AI auto-edit failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-primary" />
        <h3 className="font-medium text-sm">AI Auto-Edit</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`p-2 rounded-md border text-left transition ${
              mode === m.id
                ? "border-primary bg-primary/10"
                : "border-border bg-card/50 hover:border-primary/40"
            }`}
          >
            <div className="text-xs font-semibold">{m.label}</div>
            <div className="text-[10px] text-muted-foreground">{m.desc}</div>
          </button>
        ))}
      </div>

      <Button
        onClick={generate}
        disabled={loading || !videoDuration}
        className="w-full gap-2 bg-gradient-to-r from-primary to-purple-500"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {loading ? "AI thinking..." : "Generate Cuts"}
      </Button>

      {cutSuggestions.length > 0 && (
        <ScrollArea className="h-[220px]">
          <div className="space-y-1.5 pr-2">
            {cutSuggestions.map((c, i) => (
              <Card
                key={i}
                className="p-2 hover:border-primary/50 transition cursor-pointer group"
                onClick={() => onApplyCut?.(c)}
              >
                <div className="flex items-center gap-2">
                  <Scissors className="w-3 h-3 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium">
                      {c.start.toFixed(1)}s → {c.end.toFixed(1)}s
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {c.reason}
                    </div>
                  </div>
                  {c.transition && (
                    <Badge variant="outline" className="text-[9px] gap-1">
                      <Zap className="w-2 h-2" />
                      {c.transition}
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
