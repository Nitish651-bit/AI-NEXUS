import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Upload,
  Download,
  Scissors,
  Music,
  Sparkles,
  Wand2,
  Film,
  Layers,
  Settings,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AICreativeDirector } from "./AICreativeDirector";
import { FilterLibrary } from "./FilterLibrary";
import { MusicSearch } from "./MusicSearch";
import { VideoTimeline } from "./VideoTimeline";
import { AIAutoEdit } from "./AIAutoEdit";
import { TikTokCaptions, CaptionOverlay } from "./TikTokCaptions";
import { SocialExportPresets } from "./SocialExportPresets";
import { toast } from "sonner";
import { VideoFilter } from "@/data/videoFiltersData";
import { useFFmpeg } from "@/hooks/useFFmpeg";
import { combineFilters } from "@/utils/cssFilterConverter";

interface VideoClip {
  id: string;
  file: File;
  url: string;
  duration: number;
  startTime: number;
  endTime: number;
  filters: VideoFilter[];
}

interface AudioTrack {
  id: string;
  name: string;
  url: string;
  duration: number;
  volume: number;
  fadeIn: number;
  fadeOut: number;
}

export function VideoEditor() {
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [selectedClip, setSelectedClip] = useState<VideoClip | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [activeTab, setActiveTab] = useState<"trim" | "filters" | "music" | "ai" | "export">("trim");
  const [appliedFilters, setAppliedFilters] = useState<VideoFilter[]>([]);
  const [showOriginal, setShowOriginal] = useState(false);
  const [previewMode, setPreviewMode] = useState<"filtered" | "original" | "split">("filtered");
  const [exportResolution, setExportResolution] = useState("1080p");
  const [exportFormat, setExportFormat] = useState("mp4");
  const [exportQuality, setExportQuality] = useState(80);
  const [isDragging, setIsDragging] = useState(false);
  const [exportCodec, setExportCodec] = useState("h264");
  const [compatibilityProfile, setCompatibilityProfile] = useState("universal");
  const [activeAiPanel, setActiveAiPanel] = useState<"autoedit" | "captions">("autoedit");
  const [textOverlays, setTextOverlays] = useState<Array<{id: string; text: string; position: string; fontSize: number}>>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  const { 
    isLoaded: ffmpegLoaded, 
    isLoading: ffmpegLoading, 
    isProcessing, 
    progress, 
    error: ffmpegError, 
    load: loadFFmpeg, 
    exportVideo 
  } = useFFmpeg();

  // Load FFmpeg on mount
  useEffect(() => {
    loadFFmpeg();
  }, [loadFFmpeg]);

  const addVideoFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("video/")) {
        toast.error(`${file.name} is not a video file`);
        return;
      }

      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = url;
      video.onloadedmetadata = () => {
        const newClip: VideoClip = {
          id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          url,
          duration: video.duration,
          startTime: 0,
          endTime: video.duration,
          filters: [],
        };
        setClips((prev) => [...prev, newClip]);
        setSelectedClip((prev) => prev || newClip);
        toast.success(`Added ${file.name} to timeline`);
      };
    });
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    addVideoFiles(files);
  }, [addVideoFiles]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone entirely
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      addVideoFiles(files);
    }
  }, [addVideoFiles]);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    if (!videoRef.current || !selectedClip) return;
    const time = (value[0] / 100) * selectedClip.duration;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (value: number[]) => {
    const vol = value[0] / 100;
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const handleFilterApply = (filter: VideoFilter) => {
    if (!selectedClip) {
      toast.error("Please select a video clip first");
      return;
    }
    setAppliedFilters((prev) => [...prev, filter]);
    toast.success(`Applied ${filter.name} filter`);
  };

  const handleMusicSelect = (track: AudioTrack) => {
    setAudioTracks((prev) => [...prev, track]);
    toast.success(`Added "${track.name}" to audio tracks`);
  };

  const handleExport = async () => {
    if (clips.length === 0) {
      toast.error("No video clips to export");
      return;
    }
    
    if (!ffmpegLoaded) {
      toast.error("FFmpeg is still loading. Please wait...");
      return;
    }

    const clip = selectedClip || clips[0];
    
    // Prepare audio tracks for export
    const audioTracksForExport = audioTracks
      .filter(track => track.volume > 0) // Skip muted tracks
      .map(track => ({
        url: track.url,
        volume: track.volume,
        fadeIn: track.fadeIn,
        fadeOut: track.fadeOut,
      }));
    
    const hasAudio = audioTracksForExport.length > 0;
    toast.info(`Processing your video${hasAudio ? ` with ${audioTracksForExport.length} audio track(s)` : ""}... This may take a moment.`);
    
    const blob = await exportVideo(clip.file, appliedFilters, {
      trimStart: clip.startTime,
      trimEnd: clip.endTime,
      resolution: exportResolution,
      format: exportFormat,
      quality: exportQuality,
      audioTracks: audioTracksForExport,
      includeOriginalAudio: !isMuted,
      masterVolume: volume,
    });

    if (blob) {
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `edited_video.${exportFormat === "webm" ? "webm" : exportFormat === "gif" ? "gif" : "mp4"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Video exported successfully${hasAudio ? " with audio" : ""}! 🎬`);
    } else if (ffmpegError) {
      toast.error(`Export failed: ${ffmpegError}`);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const totalDuration = clips.reduce((acc, clip) => acc + (clip.endTime - clip.startTime), 0);
  
  // Compute CSS filter string for real-time preview
  const cssFilterString = useMemo(() => combineFilters(appliedFilters), [appliedFilters]);

  return (
    <div 
      ref={dropZoneRef}
      className="h-screen bg-background text-foreground overflow-y-auto overflow-x-hidden relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-sm border-2 border-dashed border-primary flex items-center justify-center pointer-events-none">
          <div className="bg-card/90 backdrop-blur-md rounded-xl p-8 text-center shadow-2xl">
            <Upload className="w-16 h-16 mx-auto text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">Drop videos here</h3>
            <p className="text-muted-foreground">Release to add to timeline</p>
          </div>
        </div>
      )}
      {/* Top Toolbar */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" title="Back to AI Nexus">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Film className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                AI Video Suite
              </h1>
            </div>
            <Badge variant="outline" className="text-xs">
              {clips.length} clips • {formatTime(totalDuration)}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" title="Undo">
              <Undo className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Redo">
              <Redo className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-2" />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <Button
              onClick={handleExport}
              disabled={clips.length === 0 || isProcessing || !ffmpegLoaded}
              className="gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {progress}%
                </>
              ) : ffmpegLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      <div className="flex min-h-[calc(100vh-60px)]">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Video Preview */}
          <div className="flex-1 flex items-center justify-center bg-black/50 relative min-h-[400px]">
            {selectedClip ? (
              <div className="relative max-w-full max-h-full">
                {/* Split view mode */}
                {previewMode === "split" && appliedFilters.length > 0 ? (
                  <div className="relative overflow-hidden rounded-lg shadow-2xl">
                    {/* Original video (left half) */}
                    <video
                      src={selectedClip.url}
                      className="max-w-full max-h-[60vh]"
                      style={{ clipPath: "inset(0 50% 0 0)" }}
                      muted
                    />
                    {/* Filtered video (right half, positioned on top) */}
                    <video
                      ref={videoRef}
                      src={selectedClip.url}
                      className="absolute inset-0 max-w-full max-h-[60vh]"
                      style={{
                        filter: cssFilterString,
                        clipPath: "inset(0 0 0 50%)",
                      }}
                      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                      onEnded={() => setIsPlaying(false)}
                    />
                    {/* Split line */}
                    <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/80 z-10" />
                    {/* Labels */}
                    <div className="absolute top-4 left-4 z-10">
                      <Badge variant="outline" className="bg-black/60 text-white border-white/30 text-xs">
                        Original
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4 z-10">
                      <Badge variant="outline" className="bg-black/60 text-white border-white/30 text-xs">
                        Filtered
                      </Badge>
                    </div>
                  </div>
                ) : (
                  /* Regular single video view */
                  <video
                    ref={videoRef}
                    src={selectedClip.url}
                    className="max-w-full max-h-[60vh] rounded-lg shadow-2xl transition-[filter] duration-300"
                    style={{
                      filter: previewMode === "original" ? "none" : cssFilterString,
                    }}
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    onEnded={() => setIsPlaying(false)}
                  />
                )}
                
                {/* Preview Mode Toggle Buttons */}
                {appliedFilters.length > 0 && (
                  <div className="absolute top-4 right-4 flex gap-1 bg-black/60 rounded-lg p-1">
                    <Button
                      variant={previewMode === "filtered" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => setPreviewMode("filtered")}
                    >
                      <Eye className="w-3 h-3" />
                      Filtered
                    </Button>
                    <Button
                      variant={previewMode === "split" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => setPreviewMode("split")}
                    >
                      <Layers className="w-3 h-3" />
                      Split
                    </Button>
                    <Button
                      variant={previewMode === "original" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => setPreviewMode("original")}
                    >
                      <EyeOff className="w-3 h-3" />
                      Original
                    </Button>
                  </div>
                )}
                
                {/* Applied Filters Badge with remove option */}
                {appliedFilters.length > 0 && previewMode !== "split" && (
                  <div className="absolute top-4 left-4 flex gap-2 flex-wrap max-w-[50%]">
                    {appliedFilters.map((filter, i) => (
                      <Badge 
                        key={i} 
                        variant="secondary" 
                        className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors group"
                        onClick={() => {
                          setAppliedFilters(prev => prev.filter((_, idx) => idx !== i));
                          toast.info(`Removed ${filter.name} filter`);
                        }}
                        title="Click to remove"
                      >
                        {filter.name} ({filter.intensity}%)
                        <span className="ml-1 opacity-0 group-hover:opacity-100">×</span>
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Live preview indicator */}
                {appliedFilters.length > 0 && previewMode === "filtered" && (
                  <div className="absolute bottom-4 right-4">
                    <Badge variant="outline" className="bg-black/50 text-white border-white/30 text-xs gap-1">
                      <Sparkles className="w-3 h-3" />
                      Live Preview
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
                  <Upload className="w-10 h-10 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">No video selected</h3>
                  <p className="text-muted-foreground text-sm">
                    Import a video to get started
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import Video
                </Button>
              </div>
            )}
          </div>

          {/* Playback Controls */}
          <div className="bg-card border-t border-border px-4 py-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => videoRef.current && (videoRef.current.currentTime = 0)}>
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handlePlayPause}>
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                <Button variant="ghost" size="icon">
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-12">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[selectedClip ? (currentTime / selectedClip.duration) * 100 : 0]}
                  onValueChange={handleSeek}
                  max={100}
                  step={0.1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-12">
                  {formatTime(selectedClip?.duration || 0)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  className="w-20"
                />
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <VideoTimeline
            clips={clips}
            audioTracks={audioTracks}
            selectedClip={selectedClip}
            onSelectClip={setSelectedClip}
            currentTime={currentTime}
            zoom={zoom}
          />
        </div>

        {/* Right Sidebar - Editing Tools */}
        <div className="w-80 flex-shrink-0 border-l border-border bg-card/50 flex flex-col">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-5 m-2">
              <TabsTrigger value="trim" className="text-[10px] gap-1 px-1">
                <Scissors className="w-3 h-3" />
                Trim
              </TabsTrigger>
              <TabsTrigger value="filters" className="text-[10px] gap-1 px-1">
                <Sparkles className="w-3 h-3" />
                FX
              </TabsTrigger>
              <TabsTrigger value="music" className="text-[10px] gap-1 px-1">
                <Music className="w-3 h-3" />
                Music
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-[10px] gap-1 px-1">
                <Wand2 className="w-3 h-3" />
                AI
              </TabsTrigger>
              <TabsTrigger value="export" className="text-[10px] gap-1 px-1">
                <Settings className="w-3 h-3" />
                Export
              </TabsTrigger>
            </TabsList>

            <div className="flex-1">
              <TabsContent value="trim" className="p-4 m-0">
                <div className="space-y-4">
                  <h3 className="font-medium">Trim & Cut</h3>
                  {selectedClip ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Start Time</label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={selectedClip.startTime.toFixed(2)}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              if (!isNaN(value) && value >= 0) {
                                setSelectedClip({ ...selectedClip, startTime: value });
                              }
                            }}
                            className="flex-1"
                          />
                          <span className="text-xs text-muted-foreground">sec</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">End Time</label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={selectedClip.endTime.toFixed(2)}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              if (!isNaN(value) && value <= selectedClip.duration) {
                                setSelectedClip({ ...selectedClip, endTime: value });
                              }
                            }}
                            className="flex-1"
                          />
                          <span className="text-xs text-muted-foreground">sec</span>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full gap-2">
                        <Scissors className="w-4 h-4" />
                        Split at Playhead
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Select a clip to trim
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="filters" className="p-4 m-0">
                <FilterLibrary onApplyFilter={handleFilterApply} />
              </TabsContent>

              <TabsContent value="music" className="p-4 m-0 space-y-6">
                {/* Audio Mixer */}
                {audioTracks.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Audio Mixer
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => {
                          setAudioTracks([]);
                          toast.info("Cleared all audio tracks");
                        }}
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {audioTracks.map((track, i) => (
                        <div 
                          key={track.id} 
                          className="p-3 rounded-lg border border-border bg-muted/30 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <Music className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="text-xs font-medium truncate">{track.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive shrink-0"
                              onClick={() => {
                                setAudioTracks(prev => prev.filter((_, idx) => idx !== i));
                                toast.info(`Removed "${track.name}"`);
                              }}
                            >
                              ×
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Volume2 className="w-3 h-3 text-muted-foreground shrink-0" />
                            <Slider
                              value={[track.volume * 100]}
                              onValueChange={(v) => {
                                setAudioTracks(prev => prev.map((t, idx) => 
                                  idx === i ? { ...t, volume: v[0] / 100 } : t
                                ));
                              }}
                              max={100}
                              step={1}
                              className="flex-1"
                            />
                            <span className="text-xs text-muted-foreground w-8 text-right">
                              {Math.round(track.volume * 100)}%
                            </span>
                          </div>
                          {/* Fade Controls */}
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground">Fade In</span>
                                <span className="text-[10px] text-muted-foreground">{track.fadeIn}s</span>
                              </div>
                              <Slider
                                value={[track.fadeIn]}
                                onValueChange={(v) => {
                                  setAudioTracks(prev => prev.map((t, idx) => 
                                    idx === i ? { ...t, fadeIn: v[0] } : t
                                  ));
                                }}
                                max={10}
                                step={0.5}
                                className="flex-1"
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground">Fade Out</span>
                                <span className="text-[10px] text-muted-foreground">{track.fadeOut}s</span>
                              </div>
                              <Slider
                                value={[track.fadeOut]}
                                onValueChange={(v) => {
                                  setAudioTracks(prev => prev.map((t, idx) => 
                                    idx === i ? { ...t, fadeOut: v[0] } : t
                                  ));
                                }}
                                max={10}
                                step={0.5}
                                className="flex-1"
                              />
                            </div>
                          </div>
                          
                          {/* Mute toggle */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant={track.volume === 0 ? "secondary" : "ghost"}
                              size="sm"
                              className="h-6 text-xs px-2"
                              onClick={() => {
                                setAudioTracks(prev => prev.map((t, idx) => 
                                  idx === i ? { ...t, volume: t.volume === 0 ? 0.8 : 0 } : t
                                ));
                              }}
                            >
                              {track.volume === 0 ? "Unmute" : "Mute"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs px-2"
                              onClick={() => {
                                setAudioTracks(prev => prev.map((t, idx) => 
                                  idx === i ? { ...t, volume: 0.8, fadeIn: 0, fadeOut: 0 } : t
                                ));
                              }}
                            >
                              Reset
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Master Volume */}
                    <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-primary" />
                        <span className="text-xs font-medium">Master Volume</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[isMuted ? 0 : volume * 100]}
                          onValueChange={(v) => {
                            const vol = v[0] / 100;
                            setVolume(vol);
                            setIsMuted(vol === 0);
                            if (videoRef.current) {
                              videoRef.current.volume = vol;
                            }
                          }}
                          max={100}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {isMuted ? 0 : Math.round(volume * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {audioTracks.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-xs border border-dashed border-border rounded-lg">
                    <Music className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p>No audio tracks added yet</p>
                    <p className="text-[10px]">Add music from the library below</p>
                  </div>
                )}
                
                <MusicSearch onSelectTrack={handleMusicSelect} />
              </TabsContent>

              <TabsContent value="ai" className="p-4 m-0 space-y-4">
                <div className="flex gap-1 p-1 rounded-md bg-muted/50">
                  <button
                    onClick={() => setActiveAiPanel("autoedit")}
                    className={`flex-1 px-2 py-1 rounded text-[11px] font-medium transition ${
                      activeAiPanel === "autoedit"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    }`}
                  >
                    Auto-Edit
                  </button>
                  <button
                    onClick={() => setActiveAiPanel("captions")}
                    className={`flex-1 px-2 py-1 rounded text-[11px] font-medium transition ${
                      activeAiPanel === "captions"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    }`}
                  >
                    Captions
                  </button>
                </div>
                {activeAiPanel === "autoedit" ? (
                  <AIAutoEdit
                    videoDuration={selectedClip?.duration ?? 0}
                    videoName={selectedClip?.file.name}
                    hasMusic={audioTracks.length > 0}
                    onApplyCut={(cut) => {
                      if (selectedClip) {
                        setSelectedClip({
                          ...selectedClip,
                          startTime: cut.start,
                          endTime: cut.end,
                        });
                        toast.success(`Applied cut: ${cut.start.toFixed(1)}s → ${cut.end.toFixed(1)}s`);
                      }
                    }}
                  />
                ) : (
                  <TikTokCaptions videoDuration={selectedClip?.duration ?? 0} />
                )}
              </TabsContent>

              <TabsContent value="export" className="p-4 m-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Export Settings</h3>
                    {ffmpegLoading && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Loading FFmpeg...
                      </Badge>
                    )}
                    {ffmpegLoaded && !ffmpegLoading && (
                      <Badge variant="default" className="text-xs gap-1 bg-green-600">
                        <CheckCircle className="w-3 h-3" />
                        Ready
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Resolution</label>
                      <select 
                        value={exportResolution}
                        onChange={(e) => setExportResolution(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                      >
                        <option value="4k">4K Ultra HD (3840×2160)</option>
                        <option value="1440p">2K QHD (2560×1440)</option>
                        <option value="1080p">1080p Full HD (1920×1080)</option>
                        <option value="720p">720p HD (1280×720)</option>
                        <option value="480p">480p SD (854×480)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Format & Codec</label>
                      <select 
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                      >
                        <option value="mp4">MP4 (H.264 — Universal)</option>
                        <option value="mp4-h265">MP4 (H.265/HEVC — Smaller Files)</option>
                        <option value="webm">WebM (VP9 — Web Optimized)</option>
                        <option value="gif">GIF (Animated)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Compatibility Profile</label>
                      <select
                        value={compatibilityProfile}
                        onChange={(e) => setCompatibilityProfile(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                      >
                        <option value="universal">Universal (All Devices)</option>
                        <option value="youtube">YouTube</option>
                        <option value="instagram">Instagram / Reels</option>
                        <option value="tiktok">TikTok</option>
                        <option value="desktop">Desktop (High Quality)</option>
                        <option value="mobile">Mobile Optimized</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Quality: {exportQuality}%</label>
                      <Slider 
                        value={[exportQuality]} 
                        onValueChange={(v) => setExportQuality(v[0])}
                        max={100} 
                        step={1} 
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Smaller File</span>
                        <span>Best Quality</span>
                      </div>
                    </div>

                    {/* Text Overlays */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-muted-foreground">Text Overlays</label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => setTextOverlays(prev => [...prev, {
                            id: `txt-${Date.now()}`,
                            text: "Your Text",
                            position: "center",
                            fontSize: 48
                          }])}
                        >
                          + Add Text
                        </Button>
                      </div>
                      {textOverlays.map((overlay, i) => (
                        <div key={overlay.id} className="p-2 rounded-md bg-muted/50 space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={overlay.text}
                              onChange={(e) => setTextOverlays(prev => prev.map((o, idx) => idx === i ? { ...o, text: e.target.value } : o))}
                              placeholder="Enter text..."
                              className="flex-1 h-7 text-xs"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => setTextOverlays(prev => prev.filter((_, idx) => idx !== i))}
                            >
                              ×
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={overlay.position}
                              onChange={(e) => setTextOverlays(prev => prev.map((o, idx) => idx === i ? { ...o, position: e.target.value } : o))}
                              className="px-2 py-1 rounded border border-input bg-background text-xs"
                            >
                              <option value="top">Top</option>
                              <option value="center">Center</option>
                              <option value="bottom">Bottom</option>
                            </select>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-muted-foreground">Size:</span>
                              <Slider
                                value={[overlay.fontSize]}
                                onValueChange={(v) => setTextOverlays(prev => prev.map((o, idx) => idx === i ? { ...o, fontSize: v[0] } : o))}
                                min={12}
                                max={96}
                                step={2}
                                className="flex-1"
                              />
                              <span className="text-[10px] w-6">{overlay.fontSize}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Progress bar during processing */}
                    {isProcessing && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Processing...</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}
                    
                    {/* Applied filters with intensity sliders */}
                    {appliedFilters.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-muted-foreground">
                            Applied Filters ({appliedFilters.length})
                          </label>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-xs"
                            onClick={() => {
                              setAppliedFilters([]);
                              toast.info("Cleared all filters");
                            }}
                          >
                            Clear All
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {appliedFilters.map((filter, i) => (
                            <div key={i} className="space-y-1.5 p-2 rounded-md bg-muted/50">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium">{filter.name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => {
                                    setAppliedFilters(prev => prev.filter((_, idx) => idx !== i));
                                    toast.info(`Removed ${filter.name} filter`);
                                  }}
                                >
                                  ×
                                </Button>
                              </div>
                              <div className="flex items-center gap-2">
                                <Slider
                                  value={[filter.intensity]}
                                  onValueChange={(v) => {
                                    setAppliedFilters(prev => prev.map((f, idx) => 
                                      idx === i ? { ...f, intensity: v[0] } : f
                                    ));
                                  }}
                                  max={100}
                                  step={1}
                                  className="flex-1"
                                />
                                <span className="text-xs text-muted-foreground w-8">{filter.intensity}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleExport} 
                      disabled={clips.length === 0 || isProcessing || !ffmpegLoaded}
                      className="w-full gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing... {progress}%
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Export Video
                        </>
                      )}
                    </Button>
                    
                    {ffmpegError && (
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        {ffmpegError}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* AI Creative Director - Floating Assistant */}
      <AICreativeDirector
        clips={clips}
        appliedFilters={appliedFilters}
        onSuggestFilter={handleFilterApply}
        onSuggestMusic={handleMusicSelect}
      />
    </div>
  );
}
