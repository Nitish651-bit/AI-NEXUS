import { useRef, useState, useEffect } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Film, 
  Music, 
  Trash2, 
  Volume2, 
  VolumeX,
  Lock,
  Unlock,
  Eye,
  EyeOff,
} from "lucide-react";
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

interface VideoTimelineProps {
  clips: VideoClip[];
  audioTracks: AudioTrack[];
  selectedClip: VideoClip | null;
  onSelectClip: (clip: VideoClip) => void;
  currentTime: number;
  zoom: number;
}

export function VideoTimeline({
  clips,
  audioTracks,
  selectedClip,
  onSelectClip,
  currentTime,
  zoom,
}: VideoTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [lockedTracks, setLockedTracks] = useState<Set<string>>(new Set());
  const [hiddenTracks, setHiddenTracks] = useState<Set<string>>(new Set());

  const totalDuration = clips.reduce((acc, clip) => acc + (clip.endTime - clip.startTime), 0);
  const pixelsPerSecond = 50 * zoom;

  useEffect(() => {
    setPlayheadPosition(currentTime * pixelsPerSecond);
  }, [currentTime, pixelsPerSecond]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Generate a seeded random number for consistent waveform
  const seededRandom = (seed: number): number => {
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
  };

  // Generate waveform path for audio visualization
  const generateWaveformPath = (duration: number, centerY: number, position: 'upper' | 'lower', trackId: string): string => {
    const points: string[] = [];
    const numPoints = Math.max(50, Math.floor(duration * 8));
    const width = Math.max(100, duration * 10);
    const seed = trackId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    for (let i = 0; i <= numPoints; i++) {
      const x = (i / numPoints) * width;
      const randomVal = seededRandom(seed + i * 7);
      const amplitude = (randomVal * 0.7 + 0.3) * 10;
      const y = position === 'upper' ? centerY - amplitude : centerY + amplitude;
      points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    
    return points.join(' ');
  };

  // Generate filled waveform area
  const generateWaveformFill = (duration: number, centerY: number, trackId: string): string => {
    const numPoints = Math.max(50, Math.floor(duration * 8));
    const width = Math.max(100, duration * 10);
    const seed = trackId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const upperPoints: string[] = [];
    const lowerPoints: string[] = [];
    
    for (let i = 0; i <= numPoints; i++) {
      const x = (i / numPoints) * width;
      const randomVal = seededRandom(seed + i * 7);
      const amplitude = (randomVal * 0.7 + 0.3) * 10;
      upperPoints.push(`${x.toFixed(1)},${(centerY - amplitude).toFixed(1)}`);
      lowerPoints.unshift(`${x.toFixed(1)},${(centerY + amplitude).toFixed(1)}`);
    }
    
    return `M ${upperPoints.join(' L ')} L ${lowerPoints.join(' L ')} Z`;
  };

  const generateTimeMarkers = () => {
    const markers = [];
    const interval = zoom > 1.5 ? 1 : zoom > 0.75 ? 5 : 10;
    const maxTime = Math.max(totalDuration, 60);
    
    for (let i = 0; i <= maxTime; i += interval) {
      markers.push(i);
    }
    return markers;
  };

  const toggleLock = (trackId: string) => {
    setLockedTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
  };

  const toggleVisibility = (trackId: string) => {
    setHiddenTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
  };

  return (
    <div className="h-48 bg-card border-t border-border flex flex-col">
      {/* Timeline Header */}
      <div className="flex border-b border-border h-8 bg-muted/50">
        <div className="w-40 shrink-0 border-r border-border px-2 flex items-center">
          <span className="text-xs font-medium text-muted-foreground">Tracks</span>
        </div>
        <ScrollArea className="flex-1">
          <div 
            className="h-8 relative"
            style={{ width: `${Math.max(totalDuration, 60) * pixelsPerSecond}px` }}
          >
            {/* Time Markers */}
            {generateTimeMarkers().map((time) => (
              <div
                key={time}
                className="absolute top-0 h-full border-l border-border/50"
                style={{ left: `${time * pixelsPerSecond}px` }}
              >
                <span className="text-[10px] text-muted-foreground ml-1">
                  {formatTime(time)}
                </span>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Tracks Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Labels */}
        <div className="w-40 shrink-0 border-r border-border overflow-y-auto">
          {/* Video Track Label */}
          <div className="h-16 border-b border-border flex items-center px-2 gap-2">
            <Film className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium flex-1">Video</span>
            <button 
              onClick={() => toggleLock("video")}
              className="p-1 hover:bg-accent rounded"
            >
              {lockedTracks.has("video") ? (
                <Lock className="w-3 h-3 text-muted-foreground" />
              ) : (
                <Unlock className="w-3 h-3 text-muted-foreground" />
              )}
            </button>
            <button 
              onClick={() => toggleVisibility("video")}
              className="p-1 hover:bg-accent rounded"
            >
              {hiddenTracks.has("video") ? (
                <EyeOff className="w-3 h-3 text-muted-foreground" />
              ) : (
                <Eye className="w-3 h-3 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Audio Track Label */}
          <div className="h-12 border-b border-border flex items-center px-2 gap-2">
            <Music className="w-4 h-4 text-green-400" />
            <span className="text-xs font-medium flex-1">Audio</span>
            <button 
              onClick={() => toggleLock("audio")}
              className="p-1 hover:bg-accent rounded"
            >
              {lockedTracks.has("audio") ? (
                <Lock className="w-3 h-3 text-muted-foreground" />
              ) : (
                <Unlock className="w-3 h-3 text-muted-foreground" />
              )}
            </button>
            <button className="p-1 hover:bg-accent rounded">
              <Volume2 className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Track Content */}
        <ScrollArea className="flex-1">
          <div className="relative" style={{ width: `${Math.max(totalDuration, 60) * pixelsPerSecond}px`, minWidth: "100%" }}>
            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
              style={{ left: `${playheadPosition}px` }}
            >
              <div className="w-3 h-3 bg-red-500 rounded-full -ml-[5px] -mt-1" />
            </div>

            {/* Video Track */}
            <div 
              className={`h-16 border-b border-border relative ${hiddenTracks.has("video") ? "opacity-50" : ""}`}
            >
              {clips.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  Drop video clips here
                </div>
              ) : (
                <>
                  {clips.map((clip, index) => {
                    let offset = 0;
                    for (let i = 0; i < index; i++) {
                      offset += (clips[i].endTime - clips[i].startTime) * pixelsPerSecond;
                    }
                    const width = (clip.endTime - clip.startTime) * pixelsPerSecond;

                    return (
                      <div
                        key={clip.id}
                        onClick={() => !lockedTracks.has("video") && onSelectClip(clip)}
                        className={`absolute top-2 h-12 rounded cursor-pointer transition-all group ${
                          selectedClip?.id === clip.id
                            ? "ring-2 ring-primary"
                            : "hover:ring-2 hover:ring-primary/50"
                        }`}
                        style={{
                          left: `${offset}px`,
                          width: `${width}px`,
                          background: `linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--primary) / 0.1))`,
                        }}
                      >
                        {/* Thumbnail placeholder */}
                        <div className="h-full flex items-center px-2 gap-2 overflow-hidden">
                          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center shrink-0">
                            <Film className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-medium truncate">{clip.file.name}</p>
                            <p className="text-[9px] text-muted-foreground">
                              {formatTime(clip.endTime - clip.startTime)}
                            </p>
                          </div>
                          {clip.filters.length > 0 && (
                            <Badge variant="secondary" className="text-[8px] px-1 shrink-0">
                              {clip.filters.length} filters
                            </Badge>
                          )}
                        </div>

                        {/* Resize handles */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize bg-primary/50 opacity-0 group-hover:opacity-100 rounded-l" />
                        <div className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize bg-primary/50 opacity-0 group-hover:opacity-100 rounded-r" />
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Audio Track */}
            <div className="h-12 border-b border-border relative">
              {audioTracks.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  Add music or audio
                </div>
              ) : (
                <>
                  {audioTracks.map((track, index) => (
                    <div
                      key={track.id}
                      className="absolute top-2 h-8 rounded bg-green-500/20 border border-green-500/30 cursor-pointer hover:bg-green-500/30 transition-colors group"
                      style={{
                        left: `${index * 10}px`,
                        width: `${track.duration * pixelsPerSecond}px`,
                      }}
                    >
                      <div className="h-full flex items-center px-2 gap-2 overflow-hidden">
                        <Music className="w-3 h-3 text-green-500 shrink-0" />
                        <p className="text-[10px] font-medium truncate flex-1">{track.name}</p>
                        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded">
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                      
                      {/* Waveform Visualization */}
                      <div className="absolute inset-0 flex items-center px-1 overflow-hidden pointer-events-none">
                        <svg
                          className="w-full h-full"
                          viewBox={`0 0 ${Math.max(100, track.duration * 10)} 24`}
                          preserveAspectRatio="none"
                        >
                          {/* Upper waveform */}
                          <path
                            d={generateWaveformPath(track.duration, 12, 'upper', track.id)}
                            fill="none"
                            stroke="rgb(34 197 94 / 0.6)"
                            strokeWidth="1"
                          />
                          {/* Lower waveform (mirrored) */}
                          <path
                            d={generateWaveformPath(track.duration, 12, 'lower', track.id)}
                            fill="none"
                            stroke="rgb(34 197 94 / 0.6)"
                            strokeWidth="1"
                          />
                          {/* Filled area */}
                          <path
                            d={generateWaveformFill(track.duration, 12, track.id)}
                            fill="rgb(34 197 94 / 0.15)"
                          />
                        </svg>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
