import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "lucide-react";
import { AICreativeDirector } from "./AICreativeDirector";
import { FilterLibrary } from "./FilterLibrary";
import { MusicSearch } from "./MusicSearch";
import { VideoTimeline } from "./VideoTimeline";
import { toast } from "sonner";
import { VideoFilter } from "@/data/videoFiltersData";

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
  const [activeTab, setActiveTab] = useState<"trim" | "filters" | "music" | "export">("trim");
  const [appliedFilters, setAppliedFilters] = useState<VideoFilter[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

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
        if (!selectedClip) {
          setSelectedClip(newClip);
        }
        toast.success(`Added ${file.name} to timeline`);
      };
    });
  }, [selectedClip]);

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
    setIsProcessing(true);
    toast.info("Preparing your video... This may take a moment.");
    
    // Simulate processing - in real implementation, this would use FFmpeg.wasm
    setTimeout(() => {
      setIsProcessing(false);
      toast.success("Video exported successfully! 🎬");
    }, 3000);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const totalDuration = clips.reduce((acc, clip) => acc + (clip.endTime - clip.startTime), 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Toolbar */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
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
              disabled={clips.length === 0 || isProcessing}
              className="gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
            >
              <Download className="w-4 h-4" />
              {isProcessing ? "Processing..." : "Export"}
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

      <div className="flex h-[calc(100vh-60px)]">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Video Preview */}
          <div className="flex-1 flex items-center justify-center bg-black/50 relative min-h-[400px]">
            {selectedClip ? (
              <div className="relative max-w-full max-h-full">
                <video
                  ref={videoRef}
                  src={selectedClip.url}
                  className="max-w-full max-h-[60vh] rounded-lg shadow-2xl"
                  style={{
                    filter: appliedFilters.length > 0 
                      ? "contrast(1.1) saturate(1.1)" 
                      : "none",
                  }}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onEnded={() => setIsPlaying(false)}
                />
                
                {/* Applied Filters Badge */}
                {appliedFilters.length > 0 && (
                  <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                    {appliedFilters.slice(0, 3).map((filter, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {filter.name}
                      </Badge>
                    ))}
                    {appliedFilters.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{appliedFilters.length - 3} more
                      </Badge>
                    )}
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
        <div className="w-80 border-l border-border bg-card/50 flex flex-col">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-4 m-2">
              <TabsTrigger value="trim" className="text-xs gap-1">
                <Scissors className="w-3 h-3" />
                Trim
              </TabsTrigger>
              <TabsTrigger value="filters" className="text-xs gap-1">
                <Sparkles className="w-3 h-3" />
                Filters
              </TabsTrigger>
              <TabsTrigger value="music" className="text-xs gap-1">
                <Music className="w-3 h-3" />
                Music
              </TabsTrigger>
              <TabsTrigger value="export" className="text-xs gap-1">
                <Settings className="w-3 h-3" />
                Export
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
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

              <TabsContent value="music" className="p-4 m-0">
                <MusicSearch onSelectTrack={handleMusicSelect} />
              </TabsContent>

              <TabsContent value="export" className="p-4 m-0">
                <div className="space-y-4">
                  <h3 className="font-medium">Export Settings</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Resolution</label>
                      <select className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm">
                        <option>1080p (1920x1080)</option>
                        <option>720p (1280x720)</option>
                        <option>4K (3840x2160)</option>
                        <option>480p (854x480)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Format</label>
                      <select className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm">
                        <option>MP4 (H.264)</option>
                        <option>WebM (VP9)</option>
                        <option>MOV (ProRes)</option>
                        <option>GIF</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Quality</label>
                      <Slider defaultValue={[80]} max={100} step={1} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Low</span>
                        <span>High</span>
                      </div>
                    </div>
                    <Button 
                      onClick={handleExport} 
                      disabled={clips.length === 0 || isProcessing}
                      className="w-full gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {isProcessing ? "Processing..." : "Export Video"}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
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
