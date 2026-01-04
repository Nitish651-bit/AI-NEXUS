import { useState, useRef, useEffect, useCallback } from "react";
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
  ExternalLink,
  Loader2,
  ChevronDown,
  X
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  duration: number;
  previewUrl?: string;
  downloadUrl?: string;
  image?: string;
  album?: string;
  source: string;
}

interface MusicSearchProps {
  onSelectTrack: (track: { id: string; name: string; url: string; duration: number; volume: number; fadeIn: number; fadeOut: number }) => void;
}

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
  { id: "metal", name: "Metal", icon: "🤘" },
  { id: "punk", name: "Punk", icon: "⚡" },
  { id: "reggae", name: "Reggae", icon: "🌴" },
  { id: "blues", name: "Blues", icon: "🎺" },
  { id: "latin", name: "Latin", icon: "💃" },
  { id: "world", name: "World", icon: "🌍" },
  { id: "soundtrack", name: "Soundtrack", icon: "🎬" },
  { id: "cinematic", name: "Cinematic", icon: "🎥" },
  { id: "lofi", name: "Lo-Fi", icon: "📻" },
  { id: "chillout", name: "Chillout", icon: "😌" },
  { id: "dance", name: "Dance", icon: "🕺" },
  { id: "indie", name: "Indie", icon: "🎹" },
  { id: "acoustic", name: "Acoustic", icon: "🪗" },
  { id: "piano", name: "Piano", icon: "🎹" },
  { id: "orchestral", name: "Orchestral", icon: "🎼" },
  { id: "epic", name: "Epic", icon: "⚔️" },
  { id: "romantic", name: "Romantic", icon: "💕" },
  { id: "happy", name: "Happy", icon: "😊" },
  { id: "sad", name: "Sad", icon: "😢" },
  { id: "energetic", name: "Energetic", icon: "⚡" },
  { id: "relaxing", name: "Relaxing", icon: "🧘" },
  { id: "dramatic", name: "Dramatic", icon: "🎭" },
  { id: "uplifting", name: "Uplifting", icon: "🚀" },
  { id: "dark", name: "Dark", icon: "🌑" },
  { id: "funky", name: "Funky", icon: "🪩" },
];

export function MusicSearch({ onSelectTrack }: MusicSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalTracks, setTotalTracks] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showCategories, setShowCategories] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchTracks = useCallback(async (reset = false) => {
    const currentPage = reset ? 1 : page;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("music-search", {
        body: {
          query: searchQuery,
          category: selectedCategory,
          page: currentPage,
          limit: 50,
        },
      });

      if (error) throw error;

      if (reset) {
        setTracks(data.tracks);
        setPage(1);
      } else {
        setTracks(prev => [...prev, ...data.tracks]);
      }
      
      setHasMore(data.hasMore);
      setTotalTracks(data.total);
    } catch (error) {
      console.error("Error fetching tracks:", error);
      toast.error("Failed to load music. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, page]);

  // Fetch tracks on mount and when filters change
  useEffect(() => {
    fetchTracks(true);
  }, [selectedCategory]);

  const handleSearch = () => {
    fetchTracks(true);
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (page > 1) {
      fetchTracks(false);
    }
  }, [page]);

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
      if (track.previewUrl) {
        audioRef.current = new Audio(track.previewUrl);
        audioRef.current.play();
        audioRef.current.onended = () => setPlayingTrackId(null);
        setPlayingTrackId(track.id);
      } else {
        toast.error("No preview available for this track");
      }
    }
  };

  const handleAddTrack = (track: MusicTrack) => {
    onSelectTrack({
      id: track.id,
      name: `${track.name} - ${track.artist}`,
      url: track.previewUrl || track.downloadUrl || "",
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
        <Badge variant="secondary" className="text-xs">
          {totalTracks > 0 ? `${totalTracks.toLocaleString()}+ tracks` : "600,000+ tracks"}
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search songs, artists..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="pl-9 pr-16"
        />
        <Button
          size="sm"
          onClick={handleSearch}
          disabled={isLoading}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs"
        >
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Search"}
        </Button>
      </div>

      {/* Category Selector */}
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCategories(!showCategories)}
          className="w-full justify-between text-xs h-8"
        >
          <span className="flex items-center gap-2">
            <span>{selectedCategoryData?.icon}</span>
            <span>{selectedCategoryData?.name}</span>
          </span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showCategories ? 'rotate-180' : ''}`} />
        </Button>
        
        {showCategories && (
          <div className="grid grid-cols-3 gap-1 p-2 bg-muted/50 rounded-lg max-h-[200px] overflow-y-auto">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setShowCategories(false);
                }}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-[10px] transition-colors ${
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
            <Badge variant="secondary" className="text-[10px] gap-1">
              {selectedCategoryData?.icon} {selectedCategoryData?.name}
              <X 
                className="w-2.5 h-2.5 cursor-pointer" 
                onClick={() => setSelectedCategory("all")}
              />
            </Badge>
          )}
          {searchQuery && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              "{searchQuery}"
              <X 
                className="w-2.5 h-2.5 cursor-pointer" 
                onClick={() => {
                  setSearchQuery("");
                  fetchTracks(true);
                }}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Track List */}
      <ScrollArea className="h-[280px]">
        <div className="space-y-2 pr-2">
          {isLoading && tracks.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No tracks found. Try a different search.</p>
            </div>
          ) : (
            <>
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group"
                >
                  {/* Album Art */}
                  <div className="relative w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                    {track.image ? (
                      <img src={track.image} alt={track.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    {/* Play overlay */}
                    <button
                      onClick={() => handlePlayPause(track)}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {playingTrackId === track.id ? (
                        <Pause className="w-4 h-4 text-white" />
                      ) : (
                        <Play className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{track.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{track.artist}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDuration(track.duration)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => toggleFavorite(track.id)}
                    >
                      <Heart className={`w-3 h-3 ${favorites.has(track.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                    <Button 
                      variant="default" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => handleAddTrack(track)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {/* Load More */}
              {hasMore && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMore}
                  disabled={isLoading}
                  className="w-full text-xs h-8"
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-2" />
                  ) : null}
                  Load More Tracks
                </Button>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Attribution */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border">
        <span>🎵 Royalty-free music from Jamendo</span>
        <a 
          href="https://www.jamendo.com/start" 
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
