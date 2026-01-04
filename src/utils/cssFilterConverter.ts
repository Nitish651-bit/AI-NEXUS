import { VideoFilter } from "@/data/videoFiltersData";

interface CSSFilterResult {
  filter: string;
  mixBlendMode?: string;
  overlayColor?: string;
}

/**
 * Converts FFmpeg filter commands to equivalent CSS filters for real-time preview
 */
export function convertToCSSFilter(filter: VideoFilter): CSSFilterResult {
  const intensity = filter.intensity / 100;
  const command = filter.ffmpegCommand;
  
  // Parse colorbalance commands
  if (command.includes("colorbalance")) {
    const rsMatch = command.match(/rs=(-?\d+\.?\d*)/);
    const gsMatch = command.match(/gs=(-?\d+\.?\d*)/);
    const bsMatch = command.match(/bs=(-?\d+\.?\d*)/);
    
    const rs = rsMatch ? parseFloat(rsMatch[1]) * intensity : 0;
    const gs = gsMatch ? parseFloat(gsMatch[1]) * intensity : 0;
    const bs = bsMatch ? parseFloat(bsMatch[1]) * intensity : 0;
    
    // Convert colorbalance to CSS hue-rotate and saturate approximation
    const hueShift = (rs - bs) * 30; // Approximate hue shift
    const saturation = 1 + (Math.abs(rs) + Math.abs(gs) + Math.abs(bs)) * 0.3;
    const brightness = 1 + gs * 0.1;
    
    // Determine warm/cool tone
    const sepia = rs > 0 && bs < 0 ? rs * 0.3 : 0;
    
    return {
      filter: `
        hue-rotate(${hueShift}deg) 
        saturate(${saturation.toFixed(2)}) 
        brightness(${brightness.toFixed(2)})
        sepia(${sepia.toFixed(2)})
      `.replace(/\s+/g, ' ').trim()
    };
  }
  
  // Grayscale / B&W
  if (command.includes("format=gray")) {
    return { filter: `grayscale(${intensity})` };
  }
  
  // Contrast and brightness adjustments
  if (command.includes("eq=")) {
    const contrastMatch = command.match(/contrast=(\d+\.?\d*)/);
    const brightnessMatch = command.match(/brightness=(-?\d+\.?\d*)/);
    const saturationMatch = command.match(/saturation=(\d+\.?\d*)/);
    
    const contrast = contrastMatch ? parseFloat(contrastMatch[1]) : 1;
    const brightness = brightnessMatch ? 1 + parseFloat(brightnessMatch[1]) : 1;
    const saturation = saturationMatch ? parseFloat(saturationMatch[1]) : 1;
    
    const scaledContrast = 1 + (contrast - 1) * intensity;
    const scaledBrightness = 1 + (brightness - 1) * intensity;
    const scaledSaturation = 1 + (saturation - 1) * intensity;
    
    return {
      filter: `contrast(${scaledContrast.toFixed(2)}) brightness(${scaledBrightness.toFixed(2)}) saturate(${scaledSaturation.toFixed(2)})`
    };
  }
  
  // Blur effects
  if (command.includes("gblur") || command.includes("blur")) {
    const sigma = Math.max(0.5, 3 * intensity);
    return { filter: `blur(${sigma}px)` };
  }
  
  // Vignette approximation using drop-shadow
  if (command.includes("vignette")) {
    return { 
      filter: `brightness(${1 - intensity * 0.1})`,
      // Note: Real vignette would need CSS box-shadow or overlay
    };
  }
  
  // Noise/grain - approximate with contrast boost
  if (command.includes("noise")) {
    return { filter: `contrast(${1 + intensity * 0.15}) brightness(${1 - intensity * 0.05})` };
  }
  
  // Sepia toning
  if (command.includes("sepia") || command.includes("colorize")) {
    return { filter: `sepia(${intensity * 0.8})` };
  }
  
  // Negative/invert
  if (command.includes("negate")) {
    return { filter: `invert(${intensity})` };
  }
  
  // Posterize - approximate with contrast
  if (command.includes("posterize")) {
    return { filter: `contrast(${1 + intensity * 0.5}) saturate(${1 + intensity * 0.3})` };
  }
  
  // Edge detect - approximate with high contrast
  if (command.includes("edgedetect")) {
    return { filter: `contrast(${2 + intensity}) brightness(${1.2})` };
  }
  
  // Curves presets
  if (command.includes("curves")) {
    if (command.includes("darker")) {
      return { filter: `brightness(${1 - intensity * 0.3}) contrast(${1 + intensity * 0.2})` };
    }
    if (command.includes("lighter")) {
      return { filter: `brightness(${1 + intensity * 0.3})` };
    }
    if (command.includes("vintage")) {
      return { filter: `sepia(${intensity * 0.4}) contrast(${1 + intensity * 0.1}) saturate(${1 - intensity * 0.2})` };
    }
    if (command.includes("cross_process")) {
      return { filter: `hue-rotate(${intensity * 30}deg) saturate(${1 + intensity * 0.3}) contrast(${1 + intensity * 0.15})` };
    }
    if (command.includes("strong_contrast")) {
      return { filter: `contrast(${1 + intensity * 0.5})` };
    }
    // Default curves
    return { filter: `contrast(${1 + intensity * 0.2})` };
  }
  
  // Hue rotation
  if (command.includes("hue")) {
    const hueMatch = command.match(/h=(\d+)/);
    const hue = hueMatch ? parseFloat(hueMatch[1]) * intensity : 0;
    return { filter: `hue-rotate(${hue}deg)` };
  }
  
  // Default: use the mood to approximate a filter
  const moodFilters: Record<string, string> = {
    "Aesthetic": "saturate(1.2) contrast(1.05)",
    "Vintage": "sepia(0.3) contrast(1.1) saturate(0.9)",
    "Cyberpunk": "saturate(1.5) hue-rotate(280deg) contrast(1.2)",
    "Cinematic": "contrast(1.15) saturate(0.95)",
    "Romantic": "sepia(0.15) brightness(1.05) saturate(1.1)",
    "Dark & Moody": "brightness(0.85) contrast(1.2) saturate(0.9)",
    "Bright & Airy": "brightness(1.15) contrast(0.95) saturate(1.05)",
    "Retro": "sepia(0.25) hue-rotate(-10deg) saturate(1.1)",
    "Neon": "saturate(1.8) contrast(1.3) brightness(1.1)",
    "Golden Hour": "sepia(0.25) saturate(1.3) brightness(1.1)",
    "Film Noir": "grayscale(1) contrast(1.4)",
    "Dreamy": "blur(1px) brightness(1.1) saturate(0.9)",
    "High Contrast": "contrast(1.5)",
    "Soft Glow": "blur(0.5px) brightness(1.1)",
    "Grunge": "contrast(1.3) saturate(0.7) brightness(0.9)",
    "Minimalist": "contrast(1.05) saturate(0.95)",
    "Warm": "sepia(0.2) saturate(1.1)",
    "Cool": "hue-rotate(10deg) saturate(0.9)",
    "Sepia": "sepia(0.8)",
    "Black & White": "grayscale(1)",
  };
  
  const moodFilter = moodFilters[filter.mood];
  if (moodFilter) {
    // Scale by intensity
    return { filter: moodFilter };
  }
  
  // Fallback
  return { filter: "none" };
}

/**
 * Combines multiple filters into a single CSS filter string
 */
export function combineFilters(filters: VideoFilter[]): string {
  if (filters.length === 0) return "none";
  
  // Collect all individual filter values
  const filterValues: Record<string, number[]> = {
    brightness: [],
    contrast: [],
    saturate: [],
    "hue-rotate": [],
    sepia: [],
    grayscale: [],
    blur: [],
    invert: [],
  };
  
  filters.forEach(filter => {
    const result = convertToCSSFilter(filter);
    const filterStr = result.filter;
    
    // Parse each filter value
    const brightnessMatch = filterStr.match(/brightness\(([^)]+)\)/);
    const contrastMatch = filterStr.match(/contrast\(([^)]+)\)/);
    const saturateMatch = filterStr.match(/saturate\(([^)]+)\)/);
    const hueMatch = filterStr.match(/hue-rotate\(([^)]+)deg\)/);
    const sepiaMatch = filterStr.match(/sepia\(([^)]+)\)/);
    const grayscaleMatch = filterStr.match(/grayscale\(([^)]+)\)/);
    const blurMatch = filterStr.match(/blur\(([^)]+)px\)/);
    const invertMatch = filterStr.match(/invert\(([^)]+)\)/);
    
    if (brightnessMatch) filterValues.brightness.push(parseFloat(brightnessMatch[1]));
    if (contrastMatch) filterValues.contrast.push(parseFloat(contrastMatch[1]));
    if (saturateMatch) filterValues.saturate.push(parseFloat(saturateMatch[1]));
    if (hueMatch) filterValues["hue-rotate"].push(parseFloat(hueMatch[1]));
    if (sepiaMatch) filterValues.sepia.push(parseFloat(sepiaMatch[1]));
    if (grayscaleMatch) filterValues.grayscale.push(parseFloat(grayscaleMatch[1]));
    if (blurMatch) filterValues.blur.push(parseFloat(blurMatch[1]));
    if (invertMatch) filterValues.invert.push(parseFloat(invertMatch[1]));
  });
  
  // Combine values (multiply for multiplicative, add for additive)
  const parts: string[] = [];
  
  // Brightness: multiply all values
  if (filterValues.brightness.length > 0) {
    const combined = filterValues.brightness.reduce((a, b) => a * b, 1);
    parts.push(`brightness(${Math.min(2, Math.max(0.3, combined)).toFixed(2)})`);
  }
  
  // Contrast: multiply all values
  if (filterValues.contrast.length > 0) {
    const combined = filterValues.contrast.reduce((a, b) => a * b, 1);
    parts.push(`contrast(${Math.min(3, Math.max(0.5, combined)).toFixed(2)})`);
  }
  
  // Saturate: multiply all values
  if (filterValues.saturate.length > 0) {
    const combined = filterValues.saturate.reduce((a, b) => a * b, 1);
    parts.push(`saturate(${Math.min(3, Math.max(0, combined)).toFixed(2)})`);
  }
  
  // Hue-rotate: sum all values
  if (filterValues["hue-rotate"].length > 0) {
    const combined = filterValues["hue-rotate"].reduce((a, b) => a + b, 0);
    parts.push(`hue-rotate(${combined % 360}deg)`);
  }
  
  // Sepia: take max value (doesn't make sense to stack)
  if (filterValues.sepia.length > 0) {
    const combined = Math.max(...filterValues.sepia);
    parts.push(`sepia(${Math.min(1, combined).toFixed(2)})`);
  }
  
  // Grayscale: take max value
  if (filterValues.grayscale.length > 0) {
    const combined = Math.max(...filterValues.grayscale);
    parts.push(`grayscale(${Math.min(1, combined).toFixed(2)})`);
  }
  
  // Blur: sum values (stacked blurs add up)
  if (filterValues.blur.length > 0) {
    const combined = filterValues.blur.reduce((a, b) => a + b, 0);
    parts.push(`blur(${Math.min(10, combined).toFixed(1)}px)`);
  }
  
  // Invert: take max value
  if (filterValues.invert.length > 0) {
    const combined = Math.max(...filterValues.invert);
    parts.push(`invert(${Math.min(1, combined).toFixed(2)})`);
  }
  
  return parts.length > 0 ? parts.join(" ") : "none";
}
