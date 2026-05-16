import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Youtube, Instagram, Twitter, Square, Tv } from "lucide-react";
import { SOCIAL_PRESETS, SocialPreset, useEditorStore } from "@/stores/editorStore";

const ICONS: Record<string, typeof Smartphone> = {
  tiktok: Smartphone,
  reels: Instagram,
  shorts: Youtube,
  youtube: Tv,
  "instagram-post": Square,
  twitter: Twitter,
};

interface Props {
  onPresetSelected?: (preset: SocialPreset) => void;
}

export function SocialExportPresets({ onPresetSelected }: Props) {
  const { activePreset, setActivePreset } = useEditorStore();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Social Presets</h3>
        <Badge variant="outline" className="text-[10px]">
          {activePreset.aspectRatio} • {activePreset.fps}fps
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {SOCIAL_PRESETS.map((p) => {
          const Icon = ICONS[p.id] ?? Smartphone;
          const active = activePreset.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                setActivePreset(p);
                onPresetSelected?.(p);
              }}
              className={`p-3 rounded-lg border text-left transition-all ${
                active
                  ? "border-primary bg-primary/10 shadow-glow"
                  : "border-border bg-card/50 hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold">{p.name}</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                {p.width}×{p.height}
              </div>
              {p.maxDuration && (
                <div className="text-[10px] text-muted-foreground">
                  max {p.maxDuration}s
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
