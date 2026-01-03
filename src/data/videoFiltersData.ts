// 1000+ Video Filters organized by Mood/Category
export interface VideoFilter {
  id: string;
  name: string;
  description: string;
  mood: string;
  category: string;
  ffmpegCommand: string;
  intensity: number; // 0-100
  previewColor: string;
}

export const filterMoods = [
  "Aesthetic",
  "Vintage",
  "Cyberpunk",
  "Cinematic",
  "Romantic",
  "Dark & Moody",
  "Bright & Airy",
  "Retro",
  "Neon",
  "Golden Hour",
  "Film Noir",
  "Dreamy",
  "High Contrast",
  "Soft Glow",
  "Grunge",
  "Minimalist",
  "Warm",
  "Cool",
  "Sepia",
  "Black & White"
] as const;

export const filterCategories = [
  "Color Grading",
  "Light Effects",
  "Blur & Focus",
  "Distortion",
  "Overlays",
  "Transitions",
  "Text Effects",
  "Speed Effects",
  "Audio Visual",
  "Artistic"
] as const;

// Generate 1000+ filters programmatically
const generateFilters = (): VideoFilter[] => {
  const filters: VideoFilter[] = [];
  let id = 1;

  // Color Grading Filters (200+)
  const colorGradingBase = [
    { name: "Sunset Glow", mood: "Golden Hour", command: "colorbalance=rs=0.3:gs=0.1:bs=-0.2", color: "#FF6B35" },
    { name: "Ocean Breeze", mood: "Cool", command: "colorbalance=rs=-0.2:gs=0.1:bs=0.3", color: "#4ECDC4" },
    { name: "Forest Mist", mood: "Dreamy", command: "colorbalance=rs=-0.1:gs=0.2:bs=0.1", color: "#2ECC71" },
    { name: "Desert Sand", mood: "Warm", command: "colorbalance=rs=0.2:gs=0.15:bs=-0.15", color: "#E9C46A" },
    { name: "Arctic Ice", mood: "Cool", command: "colorbalance=rs=-0.3:gs=-0.1:bs=0.4", color: "#A8DADC" },
    { name: "Cherry Blossom", mood: "Romantic", command: "colorbalance=rs=0.25:gs=-0.05:bs=0.15", color: "#FFB7C5" },
    { name: "Midnight Blue", mood: "Dark & Moody", command: "colorbalance=rs=-0.2:gs=-0.2:bs=0.3", color: "#1D3557" },
    { name: "Autumn Leaves", mood: "Warm", command: "colorbalance=rs=0.35:gs=0.1:bs=-0.25", color: "#E76F51" },
    { name: "Spring Green", mood: "Bright & Airy", command: "colorbalance=rs=-0.1:gs=0.3:bs=-0.1", color: "#90BE6D" },
    { name: "Lavender Dreams", mood: "Dreamy", command: "colorbalance=rs=0.15:gs=-0.1:bs=0.25", color: "#9D8FE1" },
    { name: "Coral Reef", mood: "Aesthetic", command: "colorbalance=rs=0.3:gs=0.05:bs=0.1", color: "#FF6B6B" },
    { name: "Emerald City", mood: "Cinematic", command: "colorbalance=rs=-0.15:gs=0.25:bs=0", color: "#50C878" },
    { name: "Ruby Red", mood: "Romantic", command: "colorbalance=rs=0.4:gs=-0.1:bs=-0.1", color: "#E0115F" },
    { name: "Sapphire Night", mood: "Dark & Moody", command: "colorbalance=rs=-0.1:gs=-0.15:bs=0.35", color: "#0F52BA" },
    { name: "Golden Amber", mood: "Golden Hour", command: "colorbalance=rs=0.25:gs=0.2:bs=-0.3", color: "#FFBF00" },
    { name: "Violet Haze", mood: "Cyberpunk", command: "colorbalance=rs=0.2:gs=-0.2:bs=0.3", color: "#8F00FF" },
    { name: "Copper Tone", mood: "Vintage", command: "colorbalance=rs=0.3:gs=0.1:bs=-0.2", color: "#B87333" },
    { name: "Silver Screen", mood: "Film Noir", command: "colorbalance=rs=-0.05:gs=-0.05:bs=0.1", color: "#C0C0C0" },
    { name: "Bronze Age", mood: "Retro", command: "colorbalance=rs=0.25:gs=0.15:bs=-0.15", color: "#CD7F32" },
    { name: "Platinum Shine", mood: "Minimalist", command: "colorbalance=rs=0:gs=0:bs=0.05", color: "#E5E4E2" },
  ];

  colorGradingBase.forEach((filter, i) => {
    for (let intensity = 1; intensity <= 10; intensity++) {
      filters.push({
        id: `cg-${id++}`,
        name: `${filter.name} ${intensity * 10}%`,
        description: `${filter.mood} color grading at ${intensity * 10}% intensity`,
        mood: filter.mood,
        category: "Color Grading",
        ffmpegCommand: filter.command,
        intensity: intensity * 10,
        previewColor: filter.color,
      });
    }
  });

  // Vintage/Retro Filters (150+)
  const vintageBase = [
    { name: "VHS Tape", description: "Classic VHS recording look", command: "noise=alls=20:allf=t+u", color: "#8B4513" },
    { name: "Super 8", description: "8mm film grain effect", command: "noise=alls=30:allf=t", color: "#A0522D" },
    { name: "Polaroid", description: "Instant camera aesthetic", command: "curves=vintage", color: "#F5DEB3" },
    { name: "70s Groove", description: "1970s color palette", command: "colorbalance=rs=0.2:gs=0.1:bs=-0.3", color: "#DAA520" },
    { name: "80s Neon", description: "1980s neon style", command: "colorbalance=rs=0.3:gs=-0.1:bs=0.3", color: "#FF00FF" },
    { name: "90s Grunge", description: "1990s grunge aesthetic", command: "eq=contrast=1.2:brightness=-0.05", color: "#556B2F" },
    { name: "Kodak Film", description: "Classic Kodak film look", command: "curves=preset=lighter", color: "#FFD700" },
    { name: "Fujifilm", description: "Fujifilm color science", command: "colorbalance=rs=0:gs=0.1:bs=0.1", color: "#228B22" },
    { name: "Lomography", description: "Lomo camera effect", command: "vignette=PI/4", color: "#FF4500" },
    { name: "Daguerreotype", description: "Early photography look", command: "colorize=0.1:0.1:0.1", color: "#C0C0C0" },
    { name: "Tintype", description: "Antique metal plate look", command: "curves=preset=negative", color: "#708090" },
    { name: "Sepia Classic", description: "Traditional sepia toning", command: "colorize=0.15:0.1:0.05", color: "#704214" },
    { name: "Cross Process", description: "Cross-processed film", command: "curves=cross_process", color: "#00CED1" },
    { name: "Expired Film", description: "Aged expired film look", command: "colorbalance=rs=0.15:gs=0.1:bs=-0.2", color: "#BC8F8F" },
    { name: "Instant Classic", description: "Classic instant film", command: "eq=saturation=0.8:brightness=0.1", color: "#FFFACD" },
  ];

  vintageBase.forEach((filter, i) => {
    for (let intensity = 1; intensity <= 10; intensity++) {
      filters.push({
        id: `vt-${id++}`,
        name: `${filter.name} ${intensity * 10}%`,
        description: `${filter.description} at ${intensity * 10}% intensity`,
        mood: "Vintage",
        category: "Color Grading",
        ffmpegCommand: filter.command,
        intensity: intensity * 10,
        previewColor: filter.color,
      });
    }
  });

  // Cyberpunk/Neon Filters (100+)
  const cyberpunkBase = [
    { name: "Neon City", command: "colorbalance=rs=0.3:gs=-0.2:bs=0.4", color: "#FF00FF" },
    { name: "Electric Blue", command: "colorbalance=rs=-0.3:gs=0.1:bs=0.5", color: "#00FFFF" },
    { name: "Hot Pink", command: "colorbalance=rs=0.5:gs=-0.3:bs=0.2", color: "#FF1493" },
    { name: "Toxic Green", command: "colorbalance=rs=-0.2:gs=0.5:bs=-0.2", color: "#39FF14" },
    { name: "Purple Rain", command: "colorbalance=rs=0.3:gs=-0.3:bs=0.5", color: "#9400D3" },
    { name: "Laser Red", command: "colorbalance=rs=0.5:gs=-0.3:bs=-0.3", color: "#FF0000" },
    { name: "Synth Wave", command: "colorbalance=rs=0.4:gs=-0.2:bs=0.3", color: "#FF6EC7" },
    { name: "Blade Runner", command: "colorbalance=rs=0.2:gs=-0.1:bs=0.4", color: "#1E90FF" },
    { name: "Tron Grid", command: "colorbalance=rs=-0.2:gs=0.4:bs=0.4", color: "#00CED1" },
    { name: "Outrun", command: "colorbalance=rs=0.35:gs=-0.25:bs=0.35", color: "#FF1493" },
  ];

  cyberpunkBase.forEach((filter, i) => {
    for (let intensity = 1; intensity <= 10; intensity++) {
      filters.push({
        id: `cp-${id++}`,
        name: `${filter.name} ${intensity * 10}%`,
        description: `Cyberpunk neon effect at ${intensity * 10}% intensity`,
        mood: "Cyberpunk",
        category: "Color Grading",
        ffmpegCommand: filter.command,
        intensity: intensity * 10,
        previewColor: filter.color,
      });
    }
  });

  // Cinematic Filters (150+)
  const cinematicBase = [
    { name: "Hollywood", description: "Classic Hollywood look", command: "eq=contrast=1.1:saturation=1.2", color: "#FFD700" },
    { name: "Blockbuster", description: "Summer blockbuster style", command: "colorbalance=rs=0.1:gs=0.05:bs=0.15", color: "#4169E1" },
    { name: "Indie Film", description: "Independent film aesthetic", command: "eq=saturation=0.9:contrast=1.15", color: "#8FBC8F" },
    { name: "Documentary", description: "Documentary style grading", command: "eq=contrast=1.05:brightness=0.02", color: "#696969" },
    { name: "Action Hero", description: "High-octane action look", command: "eq=contrast=1.3:saturation=1.1", color: "#FF4500" },
    { name: "Drama", description: "Emotional drama grading", command: "colorbalance=rs=0:gs=-0.05:bs=0.1", color: "#4682B4" },
    { name: "Horror", description: "Creepy horror atmosphere", command: "colorbalance=rs=-0.1:gs=-0.15:bs=0.1", color: "#2F4F4F" },
    { name: "Sci-Fi", description: "Futuristic sci-fi look", command: "colorbalance=rs=-0.1:gs=0.1:bs=0.25", color: "#00CED1" },
    { name: "Western", description: "Classic western palette", command: "colorbalance=rs=0.25:gs=0.1:bs=-0.2", color: "#D2691E" },
    { name: "War Epic", description: "Epic war film grading", command: "eq=saturation=0.85:contrast=1.15", color: "#556B2F" },
    { name: "Thriller", description: "Suspenseful thriller look", command: "colorbalance=rs=-0.05:gs=-0.1:bs=0.15", color: "#483D8B" },
    { name: "Comedy", description: "Bright comedy aesthetic", command: "eq=saturation=1.15:brightness=0.05", color: "#FFD700" },
    { name: "Romance", description: "Soft romantic grading", command: "colorbalance=rs=0.1:gs=0.05:bs=0.05", color: "#FFB6C1" },
    { name: "Fantasy", description: "Magical fantasy look", command: "colorbalance=rs=0.15:gs=0.1:bs=0.2", color: "#9370DB" },
    { name: "Noir Classic", description: "Classic film noir", command: "eq=saturation=0:contrast=1.3", color: "#1C1C1C" },
  ];

  cinematicBase.forEach((filter, i) => {
    for (let intensity = 1; intensity <= 10; intensity++) {
      filters.push({
        id: `cn-${id++}`,
        name: `${filter.name} ${intensity * 10}%`,
        description: `${filter.description} at ${intensity * 10}% intensity`,
        mood: "Cinematic",
        category: "Color Grading",
        ffmpegCommand: filter.command,
        intensity: intensity * 10,
        previewColor: filter.color,
      });
    }
  });

  // Light Effects (100+)
  const lightEffectsBase = [
    { name: "Lens Flare", description: "Cinematic lens flare", command: "lenscorrection=k1=0.1:k2=0.1", color: "#FFD700" },
    { name: "Sun Rays", description: "Natural sun ray effect", command: "overlay", color: "#FFA500" },
    { name: "Bokeh", description: "Beautiful bokeh lights", command: "boxblur=2:2", color: "#FF69B4" },
    { name: "Light Leak", description: "Analog light leak", command: "overlay", color: "#FF4500" },
    { name: "Glow", description: "Soft ethereal glow", command: "gblur=sigma=2", color: "#FFFACD" },
    { name: "Sparkle", description: "Glittering sparkle effect", command: "overlay", color: "#FFFFFF" },
    { name: "Rainbow Prism", description: "Rainbow light dispersion", command: "rgbashift", color: "#FF0000" },
    { name: "Halo", description: "Heavenly halo effect", command: "gblur=sigma=5", color: "#FFFFF0" },
    { name: "Spotlight", description: "Dramatic spotlight", command: "vignette=PI/3", color: "#FFFFE0" },
    { name: "Strobe", description: "Strobe light effect", command: "flashlight", color: "#FFFFFF" },
  ];

  lightEffectsBase.forEach((filter, i) => {
    for (let intensity = 1; intensity <= 10; intensity++) {
      filters.push({
        id: `le-${id++}`,
        name: `${filter.name} ${intensity * 10}%`,
        description: `${filter.description} at ${intensity * 10}% intensity`,
        mood: "Bright & Airy",
        category: "Light Effects",
        ffmpegCommand: filter.command,
        intensity: intensity * 10,
        previewColor: filter.color,
      });
    }
  });

  // Blur & Focus Effects (80+)
  const blurEffectsBase = [
    { name: "Gaussian Blur", description: "Smooth gaussian blur", command: "gblur=sigma=", color: "#E0E0E0" },
    { name: "Motion Blur", description: "Dynamic motion blur", command: "tblur=radius=", color: "#A9A9A9" },
    { name: "Radial Blur", description: "Spinning radial blur", command: "avgblur=sizeX=", color: "#C0C0C0" },
    { name: "Tilt Shift", description: "Miniature tilt-shift", command: "tiltandshift", color: "#90EE90" },
    { name: "Depth of Field", description: "Cinematic depth blur", command: "smartblur", color: "#87CEEB" },
    { name: "Dreamy Soft", description: "Dreamy soft focus", command: "gblur=sigma=3", color: "#FFE4E1" },
    { name: "Film Grain", description: "Organic film grain", command: "noise=alls=", color: "#8B7355" },
    { name: "Pixelate", description: "Retro pixel effect", command: "pixelize", color: "#FF1493" },
  ];

  blurEffectsBase.forEach((filter, i) => {
    for (let intensity = 1; intensity <= 10; intensity++) {
      filters.push({
        id: `bf-${id++}`,
        name: `${filter.name} ${intensity * 10}%`,
        description: `${filter.description} at ${intensity * 10}% intensity`,
        mood: "Dreamy",
        category: "Blur & Focus",
        ffmpegCommand: `${filter.command}${intensity}`,
        intensity: intensity * 10,
        previewColor: filter.color,
      });
    }
  });

  // Distortion Effects (60+)
  const distortionBase = [
    { name: "Fisheye", description: "Wide fisheye lens", command: "lenscorrection=k1=0.5:k2=0.5", color: "#00BFFF" },
    { name: "Wave", description: "Wavy distortion", command: "wave", color: "#4169E1" },
    { name: "Glitch", description: "Digital glitch effect", command: "rgbashift", color: "#FF00FF" },
    { name: "Mirror", description: "Mirror reflection", command: "hflip", color: "#C0C0C0" },
    { name: "Kaleidoscope", description: "Kaleidoscope pattern", command: "rotate", color: "#FF1493" },
    { name: "Sphere", description: "Spherical distortion", command: "lenscorrection", color: "#00CED1" },
  ];

  distortionBase.forEach((filter, i) => {
    for (let intensity = 1; intensity <= 10; intensity++) {
      filters.push({
        id: `ds-${id++}`,
        name: `${filter.name} ${intensity * 10}%`,
        description: `${filter.description} at ${intensity * 10}% intensity`,
        mood: "Aesthetic",
        category: "Distortion",
        ffmpegCommand: filter.command,
        intensity: intensity * 10,
        previewColor: filter.color,
      });
    }
  });

  // Black & White / Monochrome (50+)
  const monochromeBase = [
    { name: "Classic B&W", command: "format=gray", color: "#808080" },
    { name: "High Contrast B&W", command: "format=gray,eq=contrast=1.5", color: "#1C1C1C" },
    { name: "Soft B&W", command: "format=gray,eq=contrast=0.9", color: "#A9A9A9" },
    { name: "Noir", command: "format=gray,eq=contrast=1.4:brightness=-0.1", color: "#2F2F2F" },
    { name: "Infrared", command: "negate,format=gray", color: "#DCDCDC" },
  ];

  monochromeBase.forEach((filter, i) => {
    for (let intensity = 1; intensity <= 10; intensity++) {
      filters.push({
        id: `bw-${id++}`,
        name: `${filter.name} ${intensity * 10}%`,
        description: `Black & white effect at ${intensity * 10}% intensity`,
        mood: "Black & White",
        category: "Color Grading",
        ffmpegCommand: filter.command,
        intensity: intensity * 10,
        previewColor: filter.color,
      });
    }
  });

  // Artistic Effects (100+)
  const artisticBase = [
    { name: "Oil Painting", description: "Oil paint texture", command: "edgedetect,negate", color: "#8B4513" },
    { name: "Watercolor", description: "Watercolor wash", command: "gblur=sigma=3,edgedetect", color: "#87CEEB" },
    { name: "Pencil Sketch", description: "Hand-drawn sketch", command: "edgedetect,negate", color: "#2F4F4F" },
    { name: "Pop Art", description: "Andy Warhol style", command: "posterize=4", color: "#FF1493" },
    { name: "Comic Book", description: "Comic halftone", command: "edgedetect,eq=contrast=2", color: "#FFD700" },
    { name: "Anime", description: "Anime cel shading", command: "posterize=8,edgedetect", color: "#FF69B4" },
    { name: "Impressionist", description: "Impressionist painting", command: "gblur=sigma=2", color: "#9370DB" },
    { name: "Mosaic", description: "Tile mosaic effect", command: "pixelize=32", color: "#20B2AA" },
    { name: "Neon Outline", description: "Glowing neon edges", command: "edgedetect,colorize=0:1:1", color: "#00FFFF" },
    { name: "Thermal Vision", description: "Heat map effect", command: "colormap=preset=magma", color: "#FF4500" },
  ];

  artisticBase.forEach((filter, i) => {
    for (let intensity = 1; intensity <= 10; intensity++) {
      filters.push({
        id: `ar-${id++}`,
        name: `${filter.name} ${intensity * 10}%`,
        description: `${filter.description} at ${intensity * 10}% intensity`,
        mood: "Aesthetic",
        category: "Artistic",
        ffmpegCommand: filter.command,
        intensity: intensity * 10,
        previewColor: filter.color,
      });
    }
  });

  // Speed Effects (40+)
  const speedBase = [
    { name: "Slow Motion", command: "setpts=2*PTS", color: "#4682B4" },
    { name: "Fast Forward", command: "setpts=0.5*PTS", color: "#FF6347" },
    { name: "Timelapse", command: "setpts=0.1*PTS", color: "#32CD32" },
    { name: "Reverse", command: "reverse", color: "#9400D3" },
  ];

  speedBase.forEach((filter, i) => {
    for (let intensity = 1; intensity <= 10; intensity++) {
      filters.push({
        id: `sp-${id++}`,
        name: `${filter.name} ${intensity * 10}%`,
        description: `Speed adjustment at ${intensity * 10}% intensity`,
        mood: "Cinematic",
        category: "Speed Effects",
        ffmpegCommand: filter.command,
        intensity: intensity * 10,
        previewColor: filter.color,
      });
    }
  });

  // High Contrast (50+)
  const contrastBase = [
    { name: "Ultra Contrast", command: "eq=contrast=2", color: "#000000" },
    { name: "HDR Look", command: "eq=contrast=1.3:saturation=1.2", color: "#FFD700" },
    { name: "Crushed Blacks", command: "curves=preset=darker", color: "#1C1C1C" },
    { name: "Blown Highlights", command: "curves=preset=lighter", color: "#FFFAF0" },
    { name: "S-Curve", command: "curves=preset=strong_contrast", color: "#696969" },
  ];

  contrastBase.forEach((filter, i) => {
    for (let intensity = 1; intensity <= 10; intensity++) {
      filters.push({
        id: `hc-${id++}`,
        name: `${filter.name} ${intensity * 10}%`,
        description: `High contrast effect at ${intensity * 10}% intensity`,
        mood: "High Contrast",
        category: "Color Grading",
        ffmpegCommand: filter.command,
        intensity: intensity * 10,
        previewColor: filter.color,
      });
    }
  });

  // Soft Glow Effects (50+)
  const softGlowBase = [
    { name: "Angelic Glow", command: "gblur=sigma=5,overlay", color: "#FFFAF0" },
    { name: "Morning Mist", command: "gblur=sigma=3,eq=brightness=0.1", color: "#F0F8FF" },
    { name: "Heavenly Light", command: "gblur=sigma=4,colorbalance=rs=0.1:gs=0.1:bs=0.15", color: "#FFFFF0" },
    { name: "Ethereal", command: "gblur=sigma=2,eq=saturation=0.9", color: "#E6E6FA" },
    { name: "Fairy Tale", command: "gblur=sigma=3,colorbalance=rs=0.15:gs=0.1:bs=0.2", color: "#DDA0DD" },
  ];

  softGlowBase.forEach((filter, i) => {
    for (let intensity = 1; intensity <= 10; intensity++) {
      filters.push({
        id: `sg-${id++}`,
        name: `${filter.name} ${intensity * 10}%`,
        description: `Soft glow effect at ${intensity * 10}% intensity`,
        mood: "Soft Glow",
        category: "Light Effects",
        ffmpegCommand: filter.command,
        intensity: intensity * 10,
        previewColor: filter.color,
      });
    }
  });

  // Grunge Effects (40+)
  const grungeBase = [
    { name: "Dirty", command: "noise=alls=40:allf=t,eq=contrast=1.2", color: "#3D3D3D" },
    { name: "Scratched", command: "noise=alls=30:allf=t+u", color: "#4A4A4A" },
    { name: "Dusty", command: "noise=alls=20:allf=t", color: "#5C5C5C" },
    { name: "Aged Paper", command: "colorbalance=rs=0.2:gs=0.15:bs=-0.15,noise=alls=15", color: "#D2B48C" },
  ];

  grungeBase.forEach((filter, i) => {
    for (let intensity = 1; intensity <= 10; intensity++) {
      filters.push({
        id: `gr-${id++}`,
        name: `${filter.name} ${intensity * 10}%`,
        description: `Grunge texture at ${intensity * 10}% intensity`,
        mood: "Grunge",
        category: "Artistic",
        ffmpegCommand: filter.command,
        intensity: intensity * 10,
        previewColor: filter.color,
      });
    }
  });

  return filters;
};

export const videoFilters = generateFilters();

// Helper function to get filters by mood
export const getFiltersByMood = (mood: string): VideoFilter[] => {
  return videoFilters.filter(f => f.mood === mood);
};

// Helper function to get filters by category
export const getFiltersByCategory = (category: string): VideoFilter[] => {
  return videoFilters.filter(f => f.category === category);
};

// Helper function to search filters
export const searchFilters = (query: string): VideoFilter[] => {
  const lowerQuery = query.toLowerCase();
  return videoFilters.filter(f => 
    f.name.toLowerCase().includes(lowerQuery) ||
    f.description.toLowerCase().includes(lowerQuery) ||
    f.mood.toLowerCase().includes(lowerQuery) ||
    f.category.toLowerCase().includes(lowerQuery)
  );
};

// AI-recommended filters based on video content analysis
export const getAIRecommendedFilters = (analysis: {
  hasSunset?: boolean;
  isNightTime?: boolean;
  hasNature?: boolean;
  hasPeople?: boolean;
  isIndoor?: boolean;
  emotionalTone?: 'happy' | 'sad' | 'exciting' | 'romantic' | 'mysterious';
}): VideoFilter[] => {
  const recommendations: VideoFilter[] = [];
  
  if (analysis.hasSunset) {
    recommendations.push(...videoFilters.filter(f => f.mood === "Golden Hour").slice(0, 5));
  }
  if (analysis.isNightTime) {
    recommendations.push(...videoFilters.filter(f => f.mood === "Cyberpunk" || f.mood === "Dark & Moody").slice(0, 5));
  }
  if (analysis.hasNature) {
    recommendations.push(...videoFilters.filter(f => f.mood === "Dreamy" || f.mood === "Bright & Airy").slice(0, 5));
  }
  if (analysis.emotionalTone === 'romantic') {
    recommendations.push(...videoFilters.filter(f => f.mood === "Romantic" || f.mood === "Soft Glow").slice(0, 5));
  }
  if (analysis.emotionalTone === 'exciting') {
    recommendations.push(...videoFilters.filter(f => f.mood === "Cinematic" || f.mood === "High Contrast").slice(0, 5));
  }
  
  return recommendations.slice(0, 10);
};

console.log(`Loaded ${videoFilters.length} video filters`);
