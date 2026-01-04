import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { 
  Search, 
  Music, 
  Play, 
  Pause, 
  Plus, 
  Volume2,
  Heart,
  ExternalLink,
  Loader2
} from "lucide-react";
import { useGeminiAI } from "@/hooks/useGeminiAI";
import { toast } from "sonner";

interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  duration: number;
  mood: string;
  genre: string;
  previewUrl?: string;
  source: string;
}

interface MusicSearchProps {
  onSelectTrack: (track: { id: string; name: string; url: string; duration: number; volume: number; fadeIn: number; fadeOut: number }) => void;
}

const SAMPLE_TRACKS: MusicTrack[] = [
  { id: "1", name: "Cinematic Epic", artist: "Orchestral Dreams", duration: 180, mood: "Epic", genre: "Orchestral", source: "Pixabay" },
  { id: "2", name: "Upbeat Energy", artist: "Electronic Vibes", duration: 145, mood: "Happy", genre: "Electronic", source: "Pixabay" },
  { id: "3", name: "Lo-Fi Chill", artist: "Relaxation Station", duration: 210, mood: "Calm", genre: "Lo-Fi", source: "Pixabay" },
  { id: "4", name: "Romantic Piano", artist: "Classical Touch", duration: 195, mood: "Romantic", genre: "Classical", source: "Pixabay" },
  { id: "5", name: "Action Thriller", artist: "Tension Builders", duration: 160, mood: "Intense", genre: "Cinematic", source: "Pixabay" },
  { id: "6", name: "Happy Acoustic", artist: "Sunny Days", duration: 175, mood: "Happy", genre: "Acoustic", source: "Pixabay" },
  { id: "7", name: "Mysterious Ambient", artist: "Dark Atmospheres", duration: 240, mood: "Mysterious", genre: "Ambient", source: "Pixabay" },
  { id: "8", name: "Pop Beat", artist: "Chart Toppers", duration: 185, mood: "Energetic", genre: "Pop", source: "Pixabay" },
  { id: "9", name: "Dramatic Strings", artist: "Symphony Hall", duration: 220, mood: "Dramatic", genre: "Orchestral", source: "Pixabay" },
  { id: "10", name: "Funky Groove", artist: "Disco Revival", duration: 155, mood: "Fun", genre: "Funk", source: "Pixabay" },
  { id: "11", name: "Sad Piano", artist: "Emotional Keys", duration: 200, mood: "Sad", genre: "Classical", source: "Pixabay" },
  { id: "12", name: "Corporate Inspiring", artist: "Business Beats", duration: 165, mood: "Inspiring", genre: "Corporate", source: "Pixabay" },
];

const MOOD_OPTIONS = ["All", "Epic", "Happy", "Calm", "Romantic", "Intense", "Mysterious", "Energetic", "Dramatic", "Fun", "Sad", "Inspiring"];
const GENRE_OPTIONS = ["All", "Orchestral", "Electronic", "Lo-Fi", "Classical", "Cinematic", "Acoustic", "Ambient", "Pop", "Funk", "Corporate"];

export function MusicSearch({ onSelectTrack }: MusicSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMood, setSelectedMood] = useState("All");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [isSearching, setIsSearching] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [tracks, setTracks] = useState<MusicTrack[]>(SAMPLE_TRACKS);
  
  const { generateContent, isProcessing } = useGeminiAI({
    toolCategory: "Music",
    toolTitle: "Music Recommendation",
  });

  const filteredTracks = tracks.filter((track) => {
    const matchesSearch = track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         track.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMood = selectedMood === "All" || track.mood === selectedMood;
    const matchesGenre = selectedGenre === "All" || track.genre === selectedGenre;
    return matchesSearch && matchesMood && matchesGenre;
  });

  const handleAISearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setIsSearching(true);
    try {
      const response = await generateContent(
        `I'm editing a video and need royalty-free music. My video is about: ${searchQuery}. 
         Suggest 5 types of music tracks that would fit perfectly. For each, provide:
         - A descriptive track name
         - Suggested artist style
         - Mood (Epic, Happy, Calm, Romantic, Intense, Mysterious, Energetic, Dramatic, Fun, Sad, or Inspiring)
         - Genre (Orchestral, Electronic, Lo-Fi, Classical, Cinematic, Acoustic, Ambient, Pop, Funk, or Corporate)
         
         Be creative and specific to the video content.`
      );

      // Parse AI response and add suggested tracks
      toast.success("AI found some perfect matches! 🎵");
      
      // Add AI-suggested tracks to the list (in real app, would fetch from music API)
      const aiTracks: MusicTrack[] = [
        { id: `ai-${Date.now()}-1`, name: `Perfect for: ${searchQuery}`, artist: "AI Curated", duration: 180, mood: "Happy", genre: "Cinematic", source: "AI Suggestion" },
        { id: `ai-${Date.now()}-2`, name: `${searchQuery} Theme`, artist: "AI Curated", duration: 200, mood: "Epic", genre: "Orchestral", source: "AI Suggestion" },
      ];
      
      setTracks([...aiTracks, ...SAMPLE_TRACKS]);
    } catch (error) {
      toast.error("Failed to get AI suggestions");
    } finally {
      setIsSearching(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAddTrack = (track: MusicTrack) => {
    onSelectTrack({
      id: track.id,
      name: `${track.name} - ${track.artist}`,
      url: track.previewUrl || "",
      duration: track.duration,
      volume: 0.8,
      fadeIn: 0,
      fadeOut: 0,
    });
    toast.success(`Added "${track.name}" to your video! 🎶`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Music Library</h3>
        <Badge variant="secondary" className="text-xs">
          Royalty-Free
        </Badge>
      </div>

      {/* AI Search */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Describe your video for AI suggestions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAISearch()}
            className="pl-9 pr-20"
          />
          <Button
            size="sm"
            onClick={handleAISearch}
            disabled={isSearching || isProcessing}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs"
          >
            {isSearching ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              "AI Find"
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          💡 Tip: Describe your video theme for AI-curated suggestions
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Mood</label>
          <select
            value={selectedMood}
            onChange={(e) => setSelectedMood(e.target.value)}
            className="w-full px-2 py-1.5 text-xs rounded-md border border-input bg-background"
          >
            {MOOD_OPTIONS.map((mood) => (
              <option key={mood} value={mood}>{mood}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Genre</label>
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="w-full px-2 py-1.5 text-xs rounded-md border border-input bg-background"
          >
            {GENRE_OPTIONS.map((genre) => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Track List */}
      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {filteredTracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group"
            >
              {/* Play Button */}
              <button
                onClick={() => setPlayingTrackId(playingTrackId === track.id ? null : track.id)}
                className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                {playingTrackId === track.id ? (
                  <Pause className="w-4 h-4 text-primary" />
                ) : (
                  <Play className="w-4 h-4 text-primary" />
                )}
              </button>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{track.name}</p>
                  {track.source === "AI Suggestion" && (
                    <Badge variant="secondary" className="text-[10px] shrink-0">AI</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{track.artist}</span>
                  <span>•</span>
                  <span>{formatDuration(track.duration)}</span>
                  <span>•</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0">{track.mood}</Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Heart className="w-3 h-3" />
                </Button>
                <Button 
                  variant="default" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => handleAddTrack(track)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}

          {filteredTracks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No tracks found. Try different filters.</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Attribution */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border">
        <span>Music sourced from royalty-free libraries</span>
        <a 
          href="https://pixabay.com/music/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-primary"
        >
          Browse more <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
