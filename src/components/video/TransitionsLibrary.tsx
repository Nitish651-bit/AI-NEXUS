import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Sparkles, Check, X } from "lucide-react";
import {
  videoTransitions,
  transitionCategories,
  searchTransitions,
  VideoTransition,
  TransitionCategory,
} from "@/data/videoTransitionsData";
import { useEditorStore } from "@/stores/editorStore";
import { toast } from "sonner";

export function TransitionsLibrary() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TransitionCategory | "All">("All");
  const { selectedTransition, setSelectedTransition } = useEditorStore();

  const list = useMemo(() => {
    let items = query ? searchTransitions(query) : videoTransitions;
    if (category !== "All") items = items.filter((t) => t.category === category);
    return items;
  }, [query, category]);

  const apply = (t: VideoTransition) => {
    setSelectedTransition(t);
    toast.success(`Transition: ${t.name} (${t.duration}s)`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Transitions</h3>
        <Badge variant="secondary" className="text-[10px]">
          {videoTransitions.length} effects
        </Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search transitions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8 h-8 text-xs"
        />
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-1 pb-1.5">
          <Badge
            variant={category === "All" ? "default" : "outline"}
            className="cursor-pointer shrink-0 text-[10px]"
            onClick={() => setCategory("All")}
          >
            All
          </Badge>
          {transitionCategories.map((c) => (
            <Badge
              key={c}
              variant={category === c ? "default" : "outline"}
              className="cursor-pointer shrink-0 text-[10px]"
              onClick={() => setCategory(c)}
            >
              {c}
            </Badge>
          ))}
        </div>
      </ScrollArea>

      {selectedTransition && (
        <div className="p-2 rounded-md border border-primary bg-primary/10 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate">{selectedTransition.name}</div>
            <div className="text-[10px] text-muted-foreground">
              {selectedTransition.category} • {selectedTransition.duration}s
            </div>
          </div>
          <button
            onClick={() => setSelectedTransition(null)}
            className="text-muted-foreground hover:text-destructive p-1"
            aria-label="Clear transition"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <ScrollArea className="h-[280px]">
        <div className="grid grid-cols-2 gap-1.5 pr-2">
          {list.map((t) => {
            const active = selectedTransition?.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => apply(t)}
                className={`group relative rounded-lg overflow-hidden border text-left transition-all hover:scale-[1.02] ${
                  active
                    ? "ring-2 ring-primary border-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div
                  className={`h-10 w-full bg-gradient-to-r ${t.previewGradient} relative overflow-hidden`}
                >
                  <div className="absolute inset-y-0 left-1/2 w-px bg-white/40" />
                </div>
                <div className="p-1.5 bg-card">
                  <p className="text-[10px] font-semibold truncate">{t.name}</p>
                  <p className="text-[9px] text-muted-foreground truncate">
                    {t.duration}s
                  </p>
                </div>
                {active && (
                  <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      <p className="text-[9px] text-muted-foreground pt-1 border-t border-border">
        Transition is applied between clips on export. Add multiple clips to chain transitions.
      </p>
    </div>
  );
}
