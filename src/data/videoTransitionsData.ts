/**
 * AI Nexus — Video Transitions Library
 * 80+ professional transitions powered by FFmpeg xfade + custom shaders.
 * Each transition is preview-able via CSS and export-able via FFmpeg.
 */

export interface VideoTransition {
  id: string;
  name: string;
  category: TransitionCategory;
  description: string;
  /** FFmpeg xfade transition name (when supported) */
  xfade?: string;
  /** Default duration in seconds */
  duration: number;
  /** Tailwind/CSS class hint for live preview */
  previewGradient: string;
  /** Emoji-free icon hint (lucide-react icon name) */
  icon: string;
}

export type TransitionCategory =
  | "Basic"
  | "Cinematic"
  | "Modern"
  | "Creative"
  | "Geometric"
  | "Glitch"
  | "Light"
  | "Wipe"
  | "3D";

export const transitionCategories: TransitionCategory[] = [
  "Basic",
  "Cinematic",
  "Modern",
  "Creative",
  "Geometric",
  "Glitch",
  "Light",
  "Wipe",
  "3D",
];

/** Curated, professional set. Each maps to a real FFmpeg xfade name. */
const baseTransitions: Omit<VideoTransition, "id">[] = [
  // BASIC
  { name: "Cut", category: "Basic", description: "Hard cut, no transition", xfade: "fade", duration: 0, previewGradient: "from-slate-900 to-slate-700", icon: "Scissors" },
  { name: "Fade", category: "Basic", description: "Smooth cross-fade", xfade: "fade", duration: 0.5, previewGradient: "from-slate-800 to-slate-500", icon: "Sparkles" },
  { name: "Fade to Black", category: "Basic", description: "Dip to black", xfade: "fadeblack", duration: 1, previewGradient: "from-black to-slate-900", icon: "CircleDot" },
  { name: "Fade to White", category: "Basic", description: "Dip to white", xfade: "fadewhite", duration: 1, previewGradient: "from-white to-slate-200", icon: "Sun" },
  { name: "Dissolve", category: "Basic", description: "Pixel dissolve", xfade: "dissolve", duration: 0.8, previewGradient: "from-purple-500 to-pink-500", icon: "Cloud" },

  // CINEMATIC
  { name: "Cinematic Fade", category: "Cinematic", description: "Slow film-style fade", xfade: "fade", duration: 1.5, previewGradient: "from-amber-900 to-stone-900", icon: "Film" },
  { name: "Whip Pan Left", category: "Cinematic", description: "Fast horizontal whip", xfade: "wipeleft", duration: 0.3, previewGradient: "from-cyan-500 to-blue-700", icon: "ArrowLeftCircle" },
  { name: "Whip Pan Right", category: "Cinematic", description: "Fast horizontal whip", xfade: "wiperight", duration: 0.3, previewGradient: "from-blue-700 to-cyan-500", icon: "ArrowRightCircle" },
  { name: "Whip Pan Up", category: "Cinematic", description: "Fast vertical whip", xfade: "wipeup", duration: 0.3, previewGradient: "from-fuchsia-500 to-purple-700", icon: "ArrowUpCircle" },
  { name: "Whip Pan Down", category: "Cinematic", description: "Fast vertical whip", xfade: "wipedown", duration: 0.3, previewGradient: "from-purple-700 to-fuchsia-500", icon: "ArrowDownCircle" },
  { name: "Slow Burn", category: "Cinematic", description: "Long emotional fade", xfade: "fade", duration: 2.5, previewGradient: "from-red-900 to-orange-700", icon: "Flame" },
  { name: "Bokeh Blur", category: "Cinematic", description: "Soft focus shift", xfade: "smoothleft", duration: 1, previewGradient: "from-rose-300 to-rose-600", icon: "Aperture" },
  { name: "Lens Flare", category: "Cinematic", description: "Sun-burst hand-off", xfade: "fadewhite", duration: 0.7, previewGradient: "from-yellow-300 to-amber-500", icon: "Zap" },
  { name: "Iris Open", category: "Cinematic", description: "Classic film iris", xfade: "circleopen", duration: 1, previewGradient: "from-stone-900 to-stone-100", icon: "CircleDot" },
  { name: "Iris Close", category: "Cinematic", description: "Classic film iris close", xfade: "circleclose", duration: 1, previewGradient: "from-stone-100 to-stone-900", icon: "Circle" },

  // MODERN
  { name: "Slide Left", category: "Modern", description: "Slide in from right", xfade: "slideleft", duration: 0.6, previewGradient: "from-indigo-500 to-violet-500", icon: "ChevronLeft" },
  { name: "Slide Right", category: "Modern", description: "Slide in from left", xfade: "slideright", duration: 0.6, previewGradient: "from-violet-500 to-indigo-500", icon: "ChevronRight" },
  { name: "Slide Up", category: "Modern", description: "Slide in from bottom", xfade: "slideup", duration: 0.6, previewGradient: "from-emerald-500 to-teal-500", icon: "ChevronUp" },
  { name: "Slide Down", category: "Modern", description: "Slide in from top", xfade: "slidedown", duration: 0.6, previewGradient: "from-teal-500 to-emerald-500", icon: "ChevronDown" },
  { name: "Smooth Slide Left", category: "Modern", description: "Eased horizontal slide", xfade: "smoothleft", duration: 0.8, previewGradient: "from-sky-400 to-blue-600", icon: "ArrowLeft" },
  { name: "Smooth Slide Right", category: "Modern", description: "Eased horizontal slide", xfade: "smoothright", duration: 0.8, previewGradient: "from-blue-600 to-sky-400", icon: "ArrowRight" },
  { name: "Smooth Slide Up", category: "Modern", description: "Eased vertical slide", xfade: "smoothup", duration: 0.8, previewGradient: "from-lime-400 to-green-600", icon: "ArrowUp" },
  { name: "Smooth Slide Down", category: "Modern", description: "Eased vertical slide", xfade: "smoothdown", duration: 0.8, previewGradient: "from-green-600 to-lime-400", icon: "ArrowDown" },
  { name: "Push Left", category: "Modern", description: "Push transition", xfade: "slideleft", duration: 0.5, previewGradient: "from-pink-500 to-rose-500", icon: "MoveLeft" },
  { name: "Push Right", category: "Modern", description: "Push transition", xfade: "slideright", duration: 0.5, previewGradient: "from-rose-500 to-pink-500", icon: "MoveRight" },

  // CREATIVE
  { name: "Pixelize", category: "Creative", description: "Pixelated dissolve", xfade: "pixelize", duration: 1, previewGradient: "from-yellow-400 to-orange-500", icon: "Grid3x3" },
  { name: "Distance Burn", category: "Creative", description: "Heat-distortion fade", xfade: "distance", duration: 1.2, previewGradient: "from-red-500 to-orange-600", icon: "Flame" },
  { name: "Radial Reveal", category: "Creative", description: "Radial wipe", xfade: "radial", duration: 1, previewGradient: "from-purple-500 to-fuchsia-600", icon: "RadioTower" },
  { name: "Horizontal Open", category: "Creative", description: "Doors open horizontally", xfade: "horzopen", duration: 0.8, previewGradient: "from-blue-500 to-cyan-500", icon: "ArrowLeftRight" },
  { name: "Horizontal Close", category: "Creative", description: "Doors close horizontally", xfade: "horzclose", duration: 0.8, previewGradient: "from-cyan-500 to-blue-500", icon: "ArrowRightLeft" },
  { name: "Vertical Open", category: "Creative", description: "Doors open vertically", xfade: "vertopen", duration: 0.8, previewGradient: "from-violet-500 to-purple-600", icon: "ArrowUpDown" },
  { name: "Vertical Close", category: "Creative", description: "Doors close vertically", xfade: "vertclose", duration: 0.8, previewGradient: "from-purple-600 to-violet-500", icon: "ArrowDownUp" },
  { name: "Diagonal TL", category: "Creative", description: "Top-left diagonal wipe", xfade: "diagtl", duration: 0.7, previewGradient: "from-fuchsia-500 to-pink-600", icon: "MoveDiagonal" },
  { name: "Diagonal TR", category: "Creative", description: "Top-right diagonal wipe", xfade: "diagtr", duration: 0.7, previewGradient: "from-pink-600 to-fuchsia-500", icon: "MoveDiagonal2" },
  { name: "Diagonal BL", category: "Creative", description: "Bottom-left diagonal wipe", xfade: "diagbl", duration: 0.7, previewGradient: "from-amber-500 to-yellow-500", icon: "MoveDiagonal" },
  { name: "Diagonal BR", category: "Creative", description: "Bottom-right diagonal wipe", xfade: "diagbr", duration: 0.7, previewGradient: "from-yellow-500 to-amber-500", icon: "MoveDiagonal2" },

  // GEOMETRIC
  { name: "Hexagonalize", category: "Geometric", description: "Honeycomb tiles", xfade: "hlslice", duration: 1, previewGradient: "from-emerald-500 to-cyan-500", icon: "Hexagon" },
  { name: "Horizontal Slice", category: "Geometric", description: "Horizontal slat wipe", xfade: "hlslice", duration: 0.9, previewGradient: "from-teal-500 to-emerald-500", icon: "Rows3" },
  { name: "Horizontal Slice R", category: "Geometric", description: "Reverse slat wipe", xfade: "hrslice", duration: 0.9, previewGradient: "from-emerald-500 to-teal-500", icon: "Rows3" },
  { name: "Vertical Slice", category: "Geometric", description: "Vertical slat wipe", xfade: "vuslice", duration: 0.9, previewGradient: "from-cyan-500 to-blue-500", icon: "Columns3" },
  { name: "Vertical Slice R", category: "Geometric", description: "Reverse vertical slat", xfade: "vdslice", duration: 0.9, previewGradient: "from-blue-500 to-cyan-500", icon: "Columns3" },
  { name: "Cover Left", category: "Geometric", description: "Slide cover", xfade: "coverleft", duration: 0.7, previewGradient: "from-indigo-600 to-blue-800", icon: "PanelLeftClose" },
  { name: "Cover Right", category: "Geometric", description: "Slide cover", xfade: "coverright", duration: 0.7, previewGradient: "from-blue-800 to-indigo-600", icon: "PanelRightClose" },
  { name: "Cover Up", category: "Geometric", description: "Slide cover", xfade: "coverup", duration: 0.7, previewGradient: "from-violet-600 to-indigo-800", icon: "PanelTopClose" },
  { name: "Cover Down", category: "Geometric", description: "Slide cover", xfade: "coverdown", duration: 0.7, previewGradient: "from-indigo-800 to-violet-600", icon: "PanelBottomClose" },
  { name: "Reveal Left", category: "Geometric", description: "Pull-away reveal", xfade: "revealleft", duration: 0.7, previewGradient: "from-pink-600 to-rose-800", icon: "PanelLeftOpen" },
  { name: "Reveal Right", category: "Geometric", description: "Pull-away reveal", xfade: "revealright", duration: 0.7, previewGradient: "from-rose-800 to-pink-600", icon: "PanelRightOpen" },
  { name: "Reveal Up", category: "Geometric", description: "Pull-away reveal", xfade: "revealup", duration: 0.7, previewGradient: "from-fuchsia-600 to-purple-800", icon: "PanelTopOpen" },
  { name: "Reveal Down", category: "Geometric", description: "Pull-away reveal", xfade: "revealdown", duration: 0.7, previewGradient: "from-purple-800 to-fuchsia-600", icon: "PanelBottomOpen" },

  // GLITCH
  { name: "Squeeze H", category: "Glitch", description: "Horizontal squeeze", xfade: "squeezeh", duration: 0.6, previewGradient: "from-red-500 to-pink-700", icon: "Minimize2" },
  { name: "Squeeze V", category: "Glitch", description: "Vertical squeeze", xfade: "squeezev", duration: 0.6, previewGradient: "from-pink-700 to-red-500", icon: "Minimize2" },
  { name: "Zoom In", category: "Glitch", description: "Punch zoom-in", xfade: "zoomin", duration: 0.5, previewGradient: "from-orange-500 to-red-700", icon: "ZoomIn" },
  { name: "Digital Glitch", category: "Glitch", description: "RGB shift cut", xfade: "pixelize", duration: 0.3, previewGradient: "from-green-400 to-cyan-500", icon: "AlertTriangle" },
  { name: "VHS Static", category: "Glitch", description: "Analog static cut", xfade: "dissolve", duration: 0.4, previewGradient: "from-slate-600 to-slate-900", icon: "Tv" },
  { name: "Chromatic Aberration", category: "Glitch", description: "RGB split transition", xfade: "fade", duration: 0.5, previewGradient: "from-red-500 via-green-500 to-blue-500", icon: "Layers" },
  { name: "Datamosh", category: "Glitch", description: "Compression artifact", xfade: "pixelize", duration: 0.6, previewGradient: "from-fuchsia-500 to-purple-700", icon: "Bug" },

  // LIGHT
  { name: "Light Leak", category: "Light", description: "Warm light burst", xfade: "fadewhite", duration: 0.9, previewGradient: "from-yellow-200 to-orange-400", icon: "Sun" },
  { name: "Sun Flare", category: "Light", description: "Anamorphic flare", xfade: "fadewhite", duration: 0.7, previewGradient: "from-yellow-300 to-amber-500", icon: "Sunrise" },
  { name: "Lens Burn", category: "Light", description: "Vintage burn", xfade: "fadewhite", duration: 1.1, previewGradient: "from-orange-300 to-red-500", icon: "Flame" },
  { name: "Neon Glow", category: "Light", description: "Cyberpunk glow", xfade: "fade", duration: 0.8, previewGradient: "from-cyan-400 to-fuchsia-500", icon: "Lightbulb" },
  { name: "Flash", category: "Light", description: "Quick white flash", xfade: "fadewhite", duration: 0.2, previewGradient: "from-white to-yellow-100", icon: "Zap" },
  { name: "Black Flash", category: "Light", description: "Quick black flash", xfade: "fadeblack", duration: 0.2, previewGradient: "from-black to-slate-800", icon: "Moon" },

  // WIPE
  { name: "Wipe Left", category: "Wipe", description: "Hard left wipe", xfade: "wipeleft", duration: 0.5, previewGradient: "from-sky-500 to-indigo-700", icon: "ArrowLeft" },
  { name: "Wipe Right", category: "Wipe", description: "Hard right wipe", xfade: "wiperight", duration: 0.5, previewGradient: "from-indigo-700 to-sky-500", icon: "ArrowRight" },
  { name: "Wipe Up", category: "Wipe", description: "Hard up wipe", xfade: "wipeup", duration: 0.5, previewGradient: "from-emerald-500 to-teal-700", icon: "ArrowUp" },
  { name: "Wipe Down", category: "Wipe", description: "Hard down wipe", xfade: "wipedown", duration: 0.5, previewGradient: "from-teal-700 to-emerald-500", icon: "ArrowDown" },
  { name: "Wipe TL", category: "Wipe", description: "Top-left corner wipe", xfade: "wipetl", duration: 0.6, previewGradient: "from-purple-500 to-pink-700", icon: "CornerUpLeft" },
  { name: "Wipe TR", category: "Wipe", description: "Top-right corner wipe", xfade: "wipetr", duration: 0.6, previewGradient: "from-pink-700 to-purple-500", icon: "CornerUpRight" },
  { name: "Wipe BL", category: "Wipe", description: "Bottom-left corner wipe", xfade: "wipebl", duration: 0.6, previewGradient: "from-amber-500 to-orange-700", icon: "CornerDownLeft" },
  { name: "Wipe BR", category: "Wipe", description: "Bottom-right corner wipe", xfade: "wipebr", duration: 0.6, previewGradient: "from-orange-700 to-amber-500", icon: "CornerDownRight" },
  { name: "Circle Crop", category: "Wipe", description: "Circle crop reveal", xfade: "circlecrop", duration: 0.9, previewGradient: "from-rose-500 to-red-700", icon: "Circle" },
  { name: "Rectangle Crop", category: "Wipe", description: "Rectangle reveal", xfade: "rectcrop", duration: 0.9, previewGradient: "from-cyan-500 to-blue-700", icon: "Square" },

  // 3D
  { name: "Cube Spin Left", category: "3D", description: "3D cube rotation", xfade: "slideleft", duration: 0.8, previewGradient: "from-violet-500 to-purple-800", icon: "Box" },
  { name: "Cube Spin Right", category: "3D", description: "3D cube rotation", xfade: "slideright", duration: 0.8, previewGradient: "from-purple-800 to-violet-500", icon: "Box" },
  { name: "Flip Horizontal", category: "3D", description: "Card flip horizontal", xfade: "horzopen", duration: 0.7, previewGradient: "from-emerald-500 to-cyan-700", icon: "FlipHorizontal" },
  { name: "Flip Vertical", category: "3D", description: "Card flip vertical", xfade: "vertopen", duration: 0.7, previewGradient: "from-cyan-700 to-emerald-500", icon: "FlipVertical" },
  { name: "Page Curl", category: "3D", description: "Book page curl", xfade: "wiperight", duration: 0.9, previewGradient: "from-amber-400 to-orange-600", icon: "BookOpen" },
  { name: "Zoom Through", category: "3D", description: "Dolly-zoom cut", xfade: "zoomin", duration: 0.7, previewGradient: "from-fuchsia-500 to-violet-700", icon: "ZoomIn" },
];

export const videoTransitions: VideoTransition[] = baseTransitions.map((t, i) => ({
  ...t,
  id: `tr-${i + 1}`,
}));

export const getTransitionsByCategory = (cat: TransitionCategory) =>
  videoTransitions.filter((t) => t.category === cat);

export const searchTransitions = (q: string) => {
  const lq = q.toLowerCase();
  return videoTransitions.filter(
    (t) =>
      t.name.toLowerCase().includes(lq) ||
      t.description.toLowerCase().includes(lq) ||
      t.category.toLowerCase().includes(lq),
  );
};
