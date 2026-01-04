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

      ffmpeg.on("progress", ({ progress, time }: FFmpegProgress) => {
        setProgress(Math.round(progress * 100));
      });

      ffmpeg.on("log", ({ message }) => {
        console.log("[FFmpeg]", message);
      });

      // Load FFmpeg with CORS-enabled URLs
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
      
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

        // Output settings
        args.push(
          "-c:v", "libx264",
          "-preset", "fast",
          "-crf", "23",
          "-c:a", "aac",
          "-b:a", "128k",
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

        const args: string[] = ["-i", inputName];

        // Trim settings
        if (options.trimStart !== undefined && options.trimStart > 0) {
          args.push("-ss", options.trimStart.toString());
        }
        if (options.trimEnd !== undefined) {
          args.push("-t", (options.trimEnd - (options.trimStart || 0)).toString());
        }

        // Build video filter chain
        const vfFilters: string[] = [];

        // Resolution scaling
        if (options.resolution) {
          const resMap: Record<string, string> = {
            "1080p": "scale=1920:1080",
            "720p": "scale=1280:720",
            "4k": "scale=3840:2160",
            "480p": "scale=854:480",
          };
          if (resMap[options.resolution]) {
            vfFilters.push(resMap[options.resolution]);
          }
        }

        // Apply filters
        filters.forEach((filter) => {
          const intensityScale = filter.intensity / 100;
          
          if (filter.ffmpegCommand.includes("colorbalance")) {
            const scaled = filter.ffmpegCommand.replace(
              /(-?\d+\.?\d*)/g,
              (match) => (parseFloat(match) * intensityScale).toFixed(2)
            );
            vfFilters.push(scaled);
          } else if (filter.ffmpegCommand === "format=gray") {
            vfFilters.push("format=gray");
          } else if (filter.ffmpegCommand.includes("eq=")) {
            vfFilters.push(filter.ffmpegCommand);
          } else if (filter.ffmpegCommand.includes("gblur")) {
            vfFilters.push(`gblur=sigma=${Math.max(1, Math.round(5 * intensityScale))}`);
          } else if (filter.ffmpegCommand.includes("noise")) {
            vfFilters.push(`noise=alls=${Math.round(20 * intensityScale)}:allf=t+u`);
          } else if (filter.ffmpegCommand.includes("vignette")) {
            vfFilters.push(`vignette=PI/${Math.max(2, Math.round(6 - 4 * intensityScale))}`);
          } else if (filter.ffmpegCommand.includes("curves")) {
            vfFilters.push(filter.ffmpegCommand);
          } else if (!filter.ffmpegCommand.includes("setpts")) {
            vfFilters.push(filter.ffmpegCommand);
          }
        });

        if (vfFilters.length > 0) {
          args.push("-vf", vfFilters.join(","));
        }

        // Format-specific encoding - FFmpeg.wasm has limited codec support
        // We'll use stream copy when possible, otherwise basic re-encoding
        if (options.format === "gif") {
          // GIF output
          args.push("-f", "gif", "-loop", "0");
        } else if (options.format === "webm") {
          // WebM format
          if (vfFilters.length === 0 && !options.resolution) {
            // No processing needed - just copy
            args.push("-c", "copy");
          } else {
            // Need to re-encode - WebM doesn't require special codecs
            args.push("-an"); // Remove audio for simplicity
          }
        } else {
          // MP4 format - default
          if (vfFilters.length === 0 && !options.resolution) {
            // No processing needed - just copy streams (fastest)
            args.push("-c", "copy");
          } else {
            // Need to re-encode - FFmpeg.wasm should handle basic encoding
            // Don't specify codec - let FFmpeg choose default
            args.push("-q:v", "5"); // Quality scale
          }
        }

        args.push("-y", outputName); // -y to overwrite output

        console.log("Export FFmpeg command:", args.join(" "));

        await ffmpeg.exec(args);

        const data = await ffmpeg.readFile(outputName);
        const blob = new Blob([new Uint8Array(data as unknown as ArrayBuffer)], { type: mimeType });

        // Cleanup
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);

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
