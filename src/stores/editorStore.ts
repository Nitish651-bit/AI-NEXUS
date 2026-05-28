/**
 * AI Nexus — Multi-track Video Editor Store
 * Foundation for true CapCut-style multi-layer editing.
 * Currently consumed by AI panels; legacy single-track state in VideoEditor
 * will progressively migrate here.
 */
import { create } from "zustand";
import type { VideoTransition } from "@/data/videoTransitionsData";

export type TrackKind = "video" | "audio" | "text" | "effect";

export interface Caption {
  id: string;
  text: string;
  start: number;
  end: number;
  preset: CaptionPreset;
  highlightWord?: string;
}

export type CaptionPreset =
  | "tiktok-bold"
  | "karaoke"
  | "cinematic"
  | "neon"
  | "subtle"
  | "typewriter";

export interface SocialPreset {
  id: string;
  name: string;
  aspectRatio: string; // e.g. "9:16"
  width: number;
  height: number;
  fps: number;
  maxDuration?: number;
}

export const SOCIAL_PRESETS: SocialPreset[] = [
  { id: "tiktok", name: "TikTok", aspectRatio: "9:16", width: 1080, height: 1920, fps: 30, maxDuration: 180 },
  { id: "reels", name: "Instagram Reels", aspectRatio: "9:16", width: 1080, height: 1920, fps: 30, maxDuration: 90 },
  { id: "shorts", name: "YouTube Shorts", aspectRatio: "9:16", width: 1080, height: 1920, fps: 30, maxDuration: 60 },
  { id: "youtube", name: "YouTube", aspectRatio: "16:9", width: 1920, height: 1080, fps: 30 },
  { id: "instagram-post", name: "Instagram Post", aspectRatio: "1:1", width: 1080, height: 1080, fps: 30 },
  { id: "twitter", name: "X / Twitter", aspectRatio: "16:9", width: 1280, height: 720, fps: 30, maxDuration: 140 },
];

export interface CutSuggestion {
  start: number;
  end: number;
  reason: string;
  transition?: string;
}

interface EditorState {
  captions: Caption[];
  activePreset: SocialPreset;
  cutSuggestions: CutSuggestion[];
  selectedTransition: VideoTransition | null;
  addCaption: (c: Caption) => void;
  addCaptions: (cs: Caption[]) => void;
  removeCaption: (id: string) => void;
  clearCaptions: () => void;
  setActivePreset: (p: SocialPreset) => void;
  setCutSuggestions: (cs: CutSuggestion[]) => void;
  setSelectedTransition: (t: VideoTransition | null) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  captions: [],
  activePreset: SOCIAL_PRESETS[0],
  cutSuggestions: [],
  selectedTransition: null,
  addCaption: (c) => set((s) => ({ captions: [...s.captions, c] })),
  addCaptions: (cs) => set((s) => ({ captions: [...s.captions, ...cs] })),
  removeCaption: (id) => set((s) => ({ captions: s.captions.filter((c) => c.id !== id) })),
  clearCaptions: () => set({ captions: [] }),
  setActivePreset: (p) => set({ activePreset: p }),
  setCutSuggestions: (cs) => set({ cutSuggestions: cs }),
  setSelectedTransition: (t) => set({ selectedTransition: t }),
}));

export const CAPTION_PRESET_STYLES: Record<CaptionPreset, React.CSSProperties> = {
  "tiktok-bold": {
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: 900,
    fontSize: "clamp(18px, 5vw, 42px)",
    color: "#ffffff",
    textShadow: "3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
    textTransform: "uppercase",
    letterSpacing: "0.02em",
  },
  karaoke: {
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: 800,
    fontSize: "clamp(18px, 4.5vw, 38px)",
    color: "#FFD700",
    textShadow: "0 0 10px rgba(255,215,0,0.6), 2px 2px 0 #000",
  },
  cinematic: {
    fontFamily: "Georgia, serif",
    fontWeight: 600,
    fontSize: "clamp(16px, 3.5vw, 30px)",
    color: "#ffffff",
    letterSpacing: "0.08em",
    textShadow: "0 2px 6px rgba(0,0,0,0.9)",
  },
  neon: {
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: 800,
    fontSize: "clamp(18px, 4.5vw, 36px)",
    color: "#00f0ff",
    textShadow:
      "0 0 6px #00f0ff, 0 0 14px #00f0ff, 0 0 22px #0066ff, 2px 2px 0 #000",
  },
  subtle: {
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: 500,
    fontSize: "clamp(14px, 3vw, 22px)",
    color: "#ffffff",
    background: "rgba(0,0,0,0.55)",
    padding: "4px 12px",
    borderRadius: "6px",
  },
  typewriter: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontWeight: 700,
    fontSize: "clamp(16px, 3.5vw, 28px)",
    color: "#00ff88",
    background: "rgba(0,0,0,0.7)",
    padding: "4px 10px",
    borderLeft: "3px solid #00ff88",
  },
};
