import { useState, useRef, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Music, 
  Play, 
  Pause, 
  Plus, 
  Heart,
  ChevronDown,
  X
} from "lucide-react";
import { toast } from "sonner";

interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  duration: number;
  previewUrl: string;
  category: string;
  tags: string[];
}

interface MusicSearchProps {
  onSelectTrack: (track: { id: string; name: string; url: string; duration: number; volume: number; fadeIn: number; fadeOut: number }) => void;
}

// Curated royalty-free music tracks from SoundHelix (free sample audio)
const SAMPLE_TRACKS: MusicTrack[] = [
  { id: "1", name: "Upbeat Corporate", artist: "SoundHelix", duration: 142, previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", category: "pop", tags: ["corporate", "upbeat", "happy"] },
  { id: "2", name: "Chill Electronic", artist: "SoundHelix", duration: 198, previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", category: "electronic", tags: ["chill", "electronic", "ambient"] },
  { id: "3", name: "Acoustic Morning", artist: "SoundHelix", duration: 211, previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", category: "acoustic", tags: ["acoustic", "calm", "morning"] },
  { id: "4", name: "Epic Cinematic", artist: "SoundHelix", duration: 185, previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", category: "cinematic", tags: ["epic", "cinematic", "dramatic"] },
  { id: "5", name: "Jazz Lounge", artist: "SoundHelix", duration: 224, previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", category: "jazz", tags: ["jazz", "lounge", "relaxing"] },
  { id: "6", name: "Rock Energy", artist: "SoundHelix", duration: 176, previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", category: "rock", tags: ["rock", "energy", "guitar"] },
  { id: "7", name: "Hip Hop Beat", artist: "SoundHelix", duration: 163, previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3", category: "hiphop", tags: ["hiphop", "beat", "urban"] },
  { id: "8", name: "Classical Piano", artist: "SoundHelix", duration: 245, previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", category: "classical", tags: ["classical", "piano", "elegant"] },
  { id: "9", name: "Ambient Dreams", artist: "SoundHelix", duration: 289, previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3", category: "ambient", tags: ["ambient", "dreams", "space"] },
  { id: "10", name: "Folk Journey", artist: "SoundHelix", duration: 194, previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", category: "folk", tags: ["folk", "journey", "nature"] },
  { id: "11", name: "Dance Floor", artist: "SoundHelix", duration: 167, previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3", category: "dance", tags: ["dance", "edm", "party"] },
  { id: "12", name: "Lo-Fi Study", artist: "SoundHelix", duration: 203, previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3", category: "lofi", tags: ["lofi", "study", "chill"] },
  { id: "13", name: "Country Roads", artist: "SoundHelix", duration: 178, previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3", category: "country", tags: ["country", "roads", "travel"] },
  { id: "14", name: "R&B Smooth", artist: "SoundHelix", duration: 215, previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3", category: "rnb", tags: ["rnb", "smooth", "soul"] },
  { id: "15", name: "Reggae Vibes", artist: "SoundHelix", duration: 188, previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3", category: "reggae", tags: ["reggae", "vibes", "island"] },
  { id: "16", name: "Uplifting Motivation", artist: "SoundHelix", duration: 156, previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3", category: "uplifting", tags: ["uplifting", "motivation", "inspiring"] },
  { id: "17", name: "Sad Piano", artist: "SoundHelix", duration: 234, previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", category: "sad", tags: ["sad", "emotional", "piano"] },
  { id: "18", name: "Happy Ukulele", artist: "SoundHelix", duration: 145, previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", category: "happy", tags: ["happy", "ukulele", "cheerful"] },
  { id: "19", name: "Dark Atmosphere", artist: "SoundHelix", duration: 267, previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", category: "dark", tags: ["dark", "atmosphere", "tension"] },
  { id: "20", name: "Funky Groove", artist: "SoundHelix", duration: 183, previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", category: "funky", tags: ["funky", "groove", "bass"] },
];

const CATEGORIES = [
  { id: "all", name: "All Music", icon: "🎵" },
  { id: "pop", name: "Pop", icon: "🎤" },
  { id: "rock", name: "Rock", icon: "🎸" },
  { id: "electronic", name: "Electronic", icon: "🎛️" },
  { id: "hiphop", name: "Hip Hop", icon: "🎧" },
  { id: "jazz", name: "Jazz", icon: "🎷" },
  { id: "classical", name: "Classical", icon: "🎻" },
  { id: "ambient", name: "Ambient", icon: "🌌" },
  { id: "folk", name: "Folk", icon: "🪕" },
  { id: "country", name: "Country", icon: "🤠" },
  { id: "rnb", name: "R&B", icon: "💜" },
  { id: "reggae", name: "Reggae", icon: "🌴" },
  { id: "cinematic", name: "Cinematic", icon: "🎥" },
  { id: "lofi", name: "Lo-Fi", icon: "📻" },
  { id: "dance", name: "Dance", icon: "🕺" },
  { id: "acoustic", name: "Acoustic", icon: "🪗" },
  { id: "happy", name: "Happy", icon: "😊" },
  { id: "sad", name: "Sad", icon: "😢" },
  { id: "uplifting", name: "Uplifting", icon: "🚀" },
  { id: "dark", name: "Dark", icon: "🌑" },
  { id: "funky", name: "Funky", icon: "🪩" },
];

export function MusicSearch({ onSelectTrack }: MusicSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showCategories, setShowCategories] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filter tracks based on search and category
  const filteredTracks = useMemo(() => {
    return SAMPLE_TRACKS.filter(track => {
      const matchesCategory = selectedCategory === "all" || track.category === selectedCategory;
      const matchesSearch = !searchQuery || 
        track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = (track: MusicTrack) => {
    if (playingTrackId === track.id) {
      audioRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(track.previewUrl);
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingTrackId(null);
      setPlayingTrackId(track.id);
    }
  };

  const handleAddTrack = (track: MusicTrack) => {
    onSelectTrack({
      id: track.id,
      name: `${track.name} - ${track.artist}`,
      url: track.previewUrl,
      duration: track.duration,
      volume: 0.8,
      fadeIn: 0,
      fadeOut: 0,
    });
    toast.success(`Added "${track.name}" to your video! 🎶`);
  };

  const toggleFavorite = (trackId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(trackId)) {
        newFavorites.delete(trackId);
      } else {
        newFavorites.add(trackId);
      }
      return newFavorites;
    });
  };

  const selectedCategoryData = CATEGORIES.find(c => c.id === selectedCategory);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Music Library</h3>
        <Badge variant="secondary" className="text-[10px]">
          {filteredTracks.length} tracks
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search songs, artists, tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-8 text-xs"
        />
      </div>

      {/* Category Selector */}
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCategories(!showCategories)}
          className="w-full justify-between text-xs h-7"
        >
          <span className="flex items-center gap-2">
            <span>{selectedCategoryData?.icon}</span>
            <span>{selectedCategoryData?.name}</span>
          </span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showCategories ? 'rotate-180' : ''}`} />
        </Button>
        
        {showCategories && (
          <div className="grid grid-cols-3 gap-1 p-2 bg-muted/50 rounded-lg max-h-[150px] overflow-y-auto">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setShowCategories(false);
                }}
                className={`flex items-center gap-1 px-1.5 py-1 rounded text-[9px] transition-colors ${
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                <span>{category.icon}</span>
                <span className="truncate">{category.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active Filters */}
      {(selectedCategory !== "all" || searchQuery) && (
        <div className="flex flex-wrap gap-1">
          {selectedCategory !== "all" && (
            <Badge variant="secondary" className="text-[9px] gap-1 h-5">
              {selectedCategoryData?.icon} {selectedCategoryData?.name}
              <X 
                className="w-2 h-2 cursor-pointer" 
                onClick={() => setSelectedCategory("all")}
              />
            </Badge>
          )}
          {searchQuery && (
            <Badge variant="secondary" className="text-[9px] gap-1 h-5">
              "{searchQuery}"
              <X 
                className="w-2 h-2 cursor-pointer" 
                onClick={() => setSearchQuery("")}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Track List */}
      <ScrollArea className="h-[200px]">
        <div className="space-y-1.5 pr-2">
          {filteredTracks.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-xs">
              <Music className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p>No tracks found. Try a different search.</p>
            </div>
          ) : (
            filteredTracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-2 p-1.5 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group"
              >
                {/* Album Art */}
                <div className="relative w-9 h-9 rounded overflow-hidden bg-muted flex-shrink-0">
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <button
                    onClick={() => handlePlayPause(track)}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {playingTrackId === track.id ? (
                      <Pause className="w-3 h-3 text-white" />
                    ) : (
                      <Play className="w-3 h-3 text-white" />
                    )}
                  </button>
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium truncate">{track.name}</p>
                  <p className="text-[9px] text-muted-foreground truncate">{track.artist} • {formatDuration(track.duration)}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5"
                    onClick={() => toggleFavorite(track.id)}
                  >
                    <Heart className={`w-2.5 h-2.5 ${favorites.has(track.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button 
                    variant="default" 
                    size="icon" 
                    className="h-5 w-5"
                    onClick={() => handleAddTrack(track)}
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Attribution */}
      <div className="text-[9px] text-muted-foreground pt-1 border-t border-border">
        🎵 Royalty-free sample tracks from SoundHelix
      </div>
    </div>
  );
}
