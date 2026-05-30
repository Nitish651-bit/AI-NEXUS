import { useState, useRef, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { VideoFilter } from "@/data/videoFiltersData";

interface FFmpegProgress {
  progress: number;
  time: number;
}

export function useFFmpeg() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const load = useCallback(async () => {
    if (isLoaded || isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      ffmpeg.on("progress", ({ progress }: FFmpegProgress) => {
        setProgress(Math.round(progress * 100));
      });

      ffmpeg.on("log", ({ message }) => {
        console.log("[FFmpeg]", message);
      });

      // Use the UMD build — the ESM build needs a module Worker that fails to
      // spawn from a blob URL in most browsers, which causes ffmpeg.load() to
      // hang silently after the core JS/WASM are fetched.
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });

      setIsLoaded(true);
      console.log("FFmpeg loaded successfully");
    } catch (err) {
      console.error("Failed to load FFmpeg:", err);
      setError(err instanceof Error ? err.message : "Failed to load FFmpeg");
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isLoading]);

  const applyFilters = useCallback(
    async (
      inputFile: File,
      filters: VideoFilter[],
      trimStart?: number,
      trimEnd?: number
    ): Promise<Blob | null> => {
      if (!ffmpegRef.current || !isLoaded) {
        setError("FFmpeg not loaded");
        return null;
      }

      setIsProcessing(true);
      setProgress(0);
      setError(null);

      try {
        const ffmpeg = ffmpegRef.current;
        const inputName = "input.mp4";
        const outputName = "output.mp4";

        // Write input file
        await ffmpeg.writeFile(inputName, await fetchFile(inputFile));

        // Build filter chain from applied filters
        const filterCommands: string[] = [];
        
        filters.forEach((filter) => {
          // Scale intensity based on filter intensity
          const intensityScale = filter.intensity / 100;
          
          if (filter.ffmpegCommand.includes("colorbalance")) {
            // Parse and scale colorbalance values
            const scaled = filter.ffmpegCommand.replace(
              /(-?\d+\.?\d*)/g,
              (match) => (parseFloat(match) * intensityScale).toFixed(2)
            );
            filterCommands.push(scaled);
          } else if (filter.ffmpegCommand.includes("eq=")) {
            filterCommands.push(filter.ffmpegCommand);
          } else if (filter.ffmpegCommand.includes("gblur")) {
            const sigma = Math.max(1, Math.round(5 * intensityScale));
            filterCommands.push(`gblur=sigma=${sigma}`);
          } else if (filter.ffmpegCommand.includes("noise")) {
            const noise = Math.max(5, Math.round(30 * intensityScale));
            filterCommands.push(`noise=alls=${noise}:allf=t+u`);
          } else if (filter.ffmpegCommand === "format=gray") {
            filterCommands.push("format=gray");
          } else if (filter.ffmpegCommand.includes("vignette")) {
            filterCommands.push(`vignette=PI/${Math.max(2, Math.round(6 - 4 * intensityScale))}`);
          } else if (filter.ffmpegCommand.includes("curves")) {
            filterCommands.push(filter.ffmpegCommand);
          } else if (filter.ffmpegCommand.includes("hue")) {
            filterCommands.push(filter.ffmpegCommand);
          } else if (filter.ffmpegCommand.includes("setpts")) {
            // Speed effects handled separately
            filterCommands.push(filter.ffmpegCommand);
          } else {
            // Default: add command as-is
            filterCommands.push(filter.ffmpegCommand);
          }
        });

        // Build FFmpeg command
        const args: string[] = ["-i", inputName];

        // Add trim if specified
        if (trimStart !== undefined && trimStart > 0) {
          args.push("-ss", trimStart.toString());
        }
        if (trimEnd !== undefined) {
          args.push("-t", (trimEnd - (trimStart || 0)).toString());
        }

        // Add filter complex if filters exist
        if (filterCommands.length > 0) {
          const filterString = filterCommands.join(",");
          args.push("-vf", filterString);
        }

        // Output settings - skip audio for FFmpeg.wasm compatibility
        args.push(
          "-b:v", "2M",
          "-an",
          outputName
        );

        console.log("FFmpeg command:", args.join(" "));

        // Execute FFmpeg
        await ffmpeg.exec(args);

        // Read output file
        const data = await ffmpeg.readFile(outputName);
        const blob = new Blob([new Uint8Array(data as unknown as ArrayBuffer)], { type: "video/mp4" });

        // Cleanup
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);

        setProgress(100);
        return blob;
      } catch (err) {
        console.error("FFmpeg processing error:", err);
        setError(err instanceof Error ? err.message : "Processing failed");
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [isLoaded]
  );

  // Audio track interface for export
  interface AudioTrackExport {
    url: string;
    volume: number;
    fadeIn: number;
    fadeOut: number;
  }

  const exportVideo = useCallback(
    async (
      inputFile: File,
      filters: VideoFilter[],
      options: {
        trimStart?: number;
        trimEnd?: number;
        resolution?: string;
        format?: string;
        quality?: number;
        audioTracks?: AudioTrackExport[];
        includeOriginalAudio?: boolean;
        masterVolume?: number;
      } = {}
    ): Promise<Blob | null> => {
      if (!ffmpegRef.current || !isLoaded) {
        setError("FFmpeg not loaded");
        return null;
      }

      setIsProcessing(true);
      setProgress(0);
      setError(null);

      try {
        const ffmpeg = ffmpegRef.current;
        const inputName = "input.mp4";
        
        // Determine output format
        let outputName = "output.mp4";
        let mimeType = "video/mp4";
        
        if (options.format === "webm") {
          outputName = "output.webm";
          mimeType = "video/webm";
        } else if (options.format === "gif") {
          outputName = "output.gif";
          mimeType = "image/gif";
        }

        // Write input file
        await ffmpeg.writeFile(inputName, await fetchFile(inputFile));
        
        // Download and write audio tracks
        const audioInputs: string[] = [];
        if (options.audioTracks && options.audioTracks.length > 0) {
          for (let i = 0; i < options.audioTracks.length; i++) {
            const track = options.audioTracks[i];
            try {
              const audioName = `audio_${i}.mp3`;
              const audioData = await fetchFile(track.url);
              await ffmpeg.writeFile(audioName, audioData);
              audioInputs.push(audioName);
            } catch (err) {
              console.warn(`Failed to load audio track ${i}:`, err);
            }
          }
        }

        // Build input arguments
        const args: string[] = ["-i", inputName];
        
        // Add audio track inputs
        for (const audioName of audioInputs) {
          args.push("-i", audioName);
        }

        // Trim settings
        if (options.trimStart !== undefined && options.trimStart > 0) {
          args.push("-ss", options.trimStart.toString());
        }
        if (options.trimEnd !== undefined) {
          args.push("-t", (options.trimEnd - (options.trimStart || 0)).toString());
        }
        
        // Calculate video duration for audio mixing
        const videoDuration = options.trimEnd 
          ? (options.trimEnd - (options.trimStart || 0)) 
          : undefined;

        // Build video filter chain
        const vfFilters: string[] = [];

        // Resolution scaling - PRESERVE ASPECT RATIO using -1 for auto-calculation
        if (options.resolution) {
          const resMap: Record<string, string> = {
            "1080p": "scale=-2:1080",  // -2 ensures divisible by 2, auto width
            "720p": "scale=-2:720",
            "4k": "scale=-2:2160",
            "480p": "scale=-2:480",
          };
          if (resMap[options.resolution]) {
            vfFilters.push(resMap[options.resolution]);
          }
        }

        // Apply filters with proper intensity scaling
        filters.forEach((filter) => {
          const intensityScale = filter.intensity / 100;
          const cmd = filter.ffmpegCommand;
          
          if (cmd.includes("colorbalance")) {
            // Scale colorbalance values by intensity
            const scaled = cmd.replace(
              /=(-?\d+\.?\d*)/g,
              (_, num) => `=${(parseFloat(num) * intensityScale).toFixed(3)}`
            );
            vfFilters.push(scaled);
          } else if (cmd === "format=gray") {
            vfFilters.push("format=gray");
          } else if (cmd.includes("eq=")) {
            // Parse and scale eq parameters
            const contrastMatch = cmd.match(/contrast=(\d+\.?\d*)/);
            const brightnessMatch = cmd.match(/brightness=(-?\d+\.?\d*)/);
            const saturationMatch = cmd.match(/saturation=(\d+\.?\d*)/);
            
            const parts: string[] = [];
            if (contrastMatch) {
              const val = 1 + (parseFloat(contrastMatch[1]) - 1) * intensityScale;
              parts.push(`contrast=${val.toFixed(2)}`);
            }
            if (brightnessMatch) {
              const val = parseFloat(brightnessMatch[1]) * intensityScale;
              parts.push(`brightness=${val.toFixed(2)}`);
            }
            if (saturationMatch) {
              const val = 1 + (parseFloat(saturationMatch[1]) - 1) * intensityScale;
              parts.push(`saturation=${val.toFixed(2)}`);
            }
            if (parts.length > 0) {
              vfFilters.push(`eq=${parts.join(':')}`);
            } else {
              vfFilters.push(cmd);
            }
          } else if (cmd.includes("gblur") || cmd.includes("sigma=")) {
            const sigma = Math.max(0.5, 5 * intensityScale);
            vfFilters.push(`gblur=sigma=${sigma.toFixed(1)}`);
          } else if (cmd.includes("noise")) {
            const noise = Math.max(5, Math.round(25 * intensityScale));
            vfFilters.push(`noise=alls=${noise}:allf=t+u`);
          } else if (cmd.includes("vignette")) {
            const angle = Math.max(2, 6 - 4 * intensityScale);
            vfFilters.push(`vignette=PI/${angle.toFixed(1)}`);
          } else if (cmd.includes("curves")) {
            vfFilters.push(cmd);
          } else if (cmd.includes("hue")) {
            vfFilters.push(cmd);
          } else if (cmd.includes("posterize")) {
            const levels = Math.max(2, Math.round(8 - 4 * intensityScale));
            vfFilters.push(`posterize=${levels}`);
          } else if (cmd.includes("edgedetect")) {
            vfFilters.push("edgedetect=mode=colormix:high=0");
          } else if (cmd.includes("negate")) {
            vfFilters.push("negate");
          } else if (!cmd.includes("setpts") && !cmd.includes("reverse")) {
            // Skip speed/timing effects, add other filters as-is
            vfFilters.push(cmd);
          }
        });

        // CRITICAL: libx264 requires even dimensions — always append a
        // safety scale that rounds width/height up to the nearest even number.
        if (options.format !== "gif" && options.format !== "webm") {
          vfFilters.push("scale=trunc(iw/2)*2:trunc(ih/2)*2");
        }
        if (vfFilters.length > 0) {
          args.push("-vf", vfFilters.join(","));
        }


        // Build audio filter complex for mixing multiple audio tracks
        const hasAudioTracks = audioInputs.length > 0;
        const includeOriginalAudio = options.includeOriginalAudio !== false; // Default true
        const masterVolume = options.masterVolume ?? 1;
        
        if (hasAudioTracks && options.format !== "gif") {
          // Build complex audio filter for mixing
          const audioFilters: string[] = [];
          const mixInputs: string[] = [];
          
          // Original video audio (input 0)
          if (includeOriginalAudio) {
            audioFilters.push(`[0:a]volume=${masterVolume}[orig]`);
            mixInputs.push("[orig]");
          }
          
          // Additional audio tracks
          for (let i = 0; i < audioInputs.length; i++) {
            const track = options.audioTracks![i];
            const inputIdx = i + 1; // Audio inputs start at index 1
            const vol = track.volume * masterVolume;
            
            // Build volume filter with optional fades
            let filterChain = `[${inputIdx}:a]volume=${vol.toFixed(2)}`;
            
            if (track.fadeIn > 0) {
              filterChain += `,afade=t=in:st=0:d=${track.fadeIn}`;
            }
            if (track.fadeOut > 0 && videoDuration) {
              const fadeStart = Math.max(0, videoDuration - track.fadeOut);
              filterChain += `,afade=t=out:st=${fadeStart}:d=${track.fadeOut}`;
            }
            
            filterChain += `[a${i}]`;
            audioFilters.push(filterChain);
            mixInputs.push(`[a${i}]`);
          }
          
          // Mix all audio streams
          if (mixInputs.length > 0) {
            const mixFilter = `${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=first:dropout_transition=2[aout]`;
            audioFilters.push(mixFilter);
            
            args.push("-filter_complex", audioFilters.join(";"));
            args.push("-map", "0:v"); // Video from first input
            args.push("-map", "[aout]"); // Mixed audio
          }
        } else if (includeOriginalAudio && options.format !== "gif") {
          // No extra audio tracks, just copy original audio with volume
          if (masterVolume !== 1) {
            args.push("-af", `volume=${masterVolume}`);
          }
          // Don't add -an, let FFmpeg copy audio
        }

        // Format-specific encoding
        if (options.format === "gif") {
          // GIF output - no audio
          args.push("-an", "-f", "gif", "-loop", "0");
        } else if (options.format === "webm") {
          // WebM format
          args.push("-c:v", "libvpx", "-b:v", "2M");
          if (!hasAudioTracks && !includeOriginalAudio) {
            args.push("-an");
          } else {
            args.push("-c:a", "libvorbis", "-b:a", "128k");
          }
        } else {
          // MP4 — UNIVERSAL DEVICE COMPATIBILITY
          // H.264 Baseline + yuv420p + faststart plays on iPhone, Android,
          // Safari, Chrome, smart TVs, WhatsApp, Instagram, YouTube, etc.
          // CRF maps quality slider (higher slider = lower CRF = better quality).
          const crf = options.quality
            ? Math.max(18, Math.min(32, Math.round(32 - (options.quality / 100) * 14)))
            : 23;
          args.push(
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-profile:v", "baseline",
            "-level", "3.1",
            "-pix_fmt", "yuv420p",
            "-crf", crf.toString(),
            "-movflags", "+faststart",
            // Ensure dimensions are even (libx264 requirement)
            // -vf chain already appended above; this is a safety
          );
          if (!hasAudioTracks && !includeOriginalAudio) {
            args.push("-an");
          } else {
            args.push(
              "-c:a", "aac",
              "-b:a", "192k",
              "-ar", "44100",
              "-ac", "2",
            );
          }
        }

        args.push("-y", outputName);

        console.log("Export FFmpeg command:", args.join(" "));

        await ffmpeg.exec(args);

        const data = await ffmpeg.readFile(outputName);
        const blob = new Blob([new Uint8Array(data as unknown as ArrayBuffer)], { type: mimeType });

        // Cleanup
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
        for (const audioName of audioInputs) {
          try {
            await ffmpeg.deleteFile(audioName);
          } catch (e) {
            // Ignore cleanup errors
          }
        }

        setProgress(100);
        return blob;
      } catch (err) {
        console.error("FFmpeg export error:", err);
        setError(err instanceof Error ? err.message : "Export failed");
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [isLoaded]
  );

  const generatePreview = useCallback(
    async (inputFile: File, filter: VideoFilter): Promise<string | null> => {
      if (!ffmpegRef.current || !isLoaded) return null;

      try {
        const ffmpeg = ffmpegRef.current;
        const inputName = "preview_input.mp4";
        const outputName = "preview.jpg";

        await ffmpeg.writeFile(inputName, await fetchFile(inputFile));

        // Extract single frame with filter applied
        const vfFilter = filter.ffmpegCommand.includes("colorbalance") 
          ? filter.ffmpegCommand 
          : filter.ffmpegCommand.split(",")[0];

        await ffmpeg.exec([
          "-i", inputName,
          "-ss", "1",
          "-frames:v", "1",
          "-vf", vfFilter,
          "-q:v", "2",
          outputName
        ]);

        const data = await ffmpeg.readFile(outputName);
        const blob = new Blob([new Uint8Array(data as unknown as ArrayBuffer)], { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);

        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);

        return url;
      } catch (err) {
        console.error("Preview generation error:", err);
        return null;
      }
    },
    [isLoaded]
  );

  return {
    isLoaded,
    isLoading,
    isProcessing,
    progress,
    error,
    load,
    applyFilters,
    exportVideo,
    generatePreview,
  };
}
