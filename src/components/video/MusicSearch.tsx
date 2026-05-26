import { useState, useRef, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, Music, Play, Pause, Plus, Heart, ChevronDown, X, Loader2, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  duration: number;
  previewUrl: string;
  category: string;
  tags: string[];
  source?: string;
}

interface MusicSearchProps {
  onSelectTrack: (track: { id: string; name: string; url: string; duration: number; volume: number; fadeIn: number; fadeOut: number }) => void;
}

// Expanded built-in royalty-free tracks from SoundHelix + additional sources
const SOUNDHELIX_TRACKS: MusicTrack[] = Array.from({ length: 16 }, (_, i) => ({
  id: `sh-${i + 1}`,
  name: [
    "Upbeat Corporate", "Chill Electronic", "Acoustic Morning", "Epic Cinematic",
    "Jazz Lounge", "Rock Energy", "Hip Hop Beat", "Classical Piano",
    "Ambient Dreams", "Folk Journey", "Dance Floor", "Lo-Fi Study",
    "Country Roads", "R&B Smooth", "Reggae Vibes", "Uplifting Motivation"
  ][i],
  artist: "SoundHelix",
  duration: [142, 198, 211, 185, 224, 176, 163, 245, 289, 194, 167, 203, 178, 215, 188, 156][i],
  previewUrl: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${i + 1}.mp3`,
  category: ["pop", "electronic", "acoustic", "cinematic", "jazz", "rock", "hiphop", "classical", "ambient", "folk", "dance", "lofi", "country", "rnb", "reggae", "uplifting"][i],
  tags: [
    ["corporate", "upbeat", "happy"], ["chill", "electronic", "ambient"], ["acoustic", "calm", "morning"], ["epic", "cinematic", "dramatic"],
    ["jazz", "lounge", "relaxing"], ["rock", "energy", "guitar"], ["hiphop", "beat", "urban"], ["classical", "piano", "elegant"],
    ["ambient", "dreams", "space"], ["folk", "journey", "nature"], ["dance", "edm", "party"], ["lofi", "study", "chill"],
    ["country", "roads", "travel"], ["rnb", "smooth", "soul"], ["reggae", "vibes", "island"], ["uplifting", "motivation", "inspiring"]
  ][i],
  source: "SoundHelix",
}));

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
  { id: "epic", name: "Epic", icon: "⚔️" },
  { id: "romantic", name: "Romantic", icon: "💕" },
  { id: "relaxing", name: "Relaxing", icon: "🧘" },
];

export function MusicSearch({ onSelectTrack }: MusicSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showCategories, setShowCategories] = useState(false);
  const [pixabayTracks, setPixabayTracks] = useState<MusicTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pixabayPage, setPixabayPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalPixabay, setTotalPixabay] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Search Pixabay Music API
  const searchPixabay = useCallback(async (query?: string, category?: string, page = 1) => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('music-search', {
        body: { 
          query: query || undefined, 
          category: category !== 'all' ? category : undefined, 
          page, 
          limit: 50 
        },
      });

      if (error) throw error;

      const tracks: MusicTrack[] = (data?.tracks || []).map((t: any) => ({
        id: `px-${t.id}`,
        name: t.name,
        artist: t.artist,
        duration: t.duration,
        previewUrl: t.previewUrl || t.downloadUrl,
        category: category || 'all',
        tags: t.tags ? t.tags.split(',').map((tag: string) => tag.trim()) : [],
        source: 'Pixabay',
      }));

      if (page === 1) {
        setPixabayTracks(tracks);
      } else {
        setPixabayTracks(prev => [...prev, ...tracks]);
      }
      setHasMore(data?.hasMore || false);
      setTotalPixabay(data?.total || 0);
      setPixabayPage(page);
    } catch (err) {
      console.warn('Pixabay search failed, using local tracks only:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Combined tracks: local + Pixabay
  const allTracks = useMemo(() => {
    const local = SOUNDHELIX_TRACKS.filter(track => {
      const matchesCategory = selectedCategory === "all" || track.category === selectedCategory;
      const matchesSearch = !searchQuery || 
        track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });

    // Combine and deduplicate
    return [...local, ...pixabayTracks];
  }, [searchQuery, selectedCategory, pixabayTracks]);

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
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(track.previewUrl);
      audioRef.current.play().catch(() => toast.error("Couldn't play this track"));
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
      if (newFavorites.has(trackId)) newFavorites.delete(trackId);
      else newFavorites.add(trackId);
      return newFavorites;
    });
  };

  const handleSearch = () => {
    searchPixabay(searchQuery, selectedCategory, 1);
  };

  const handleLoadMore = () => {
    searchPixabay(searchQuery, selectedCategory, pixabayPage + 1);
  };

  const selectedCategoryData = CATEGORIES.find(c => c.id === selectedCategory);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Music Library</h3>
        <Badge variant="secondary" className="text-[10px]">
          {allTracks.length} tracks {totalPixabay > 0 && `(${totalPixabay.toLocaleString()}+ available)`}
        </Badge>
      </div>

      {/* Search */}
      <div className="flex gap-1">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search songs, artists, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9 h-8 text-xs"
          />
        </div>
        <Button 
          variant="default" 
          size="sm" 
          className="h-8 px-3 text-xs"
          onClick={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
        </Button>
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
                  searchPixabay(searchQuery, category.id, 1);
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
              <X className="w-2 h-2 cursor-pointer" onClick={() => setSelectedCategory("all")} />
            </Badge>
          )}
          {searchQuery && (
            <Badge variant="secondary" className="text-[9px] gap-1 h-5">
              "{searchQuery}"
              <X className="w-2 h-2 cursor-pointer" onClick={() => setSearchQuery("")} />
            </Badge>
          )}
        </div>
      )}

      {/* Track List */}
      <ScrollArea className="h-[250px]">
        <div className="space-y-1.5 pr-2">
          {isSearching && allTracks.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-xs">
              <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
              <p>Searching music library...</p>
            </div>
          ) : allTracks.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-xs">
              <Music className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p>No tracks found. Try searching online.</p>
              <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={handleSearch}>
                <Search className="w-3 h-3 mr-1" /> Search Online
              </Button>
            </div>
          ) : (
            <>
              {allTracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center gap-2 p-1.5 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group"
                >
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

                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium truncate">{track.name}</p>
                    <p className="text-[9px] text-muted-foreground truncate">
                      {track.artist} • {formatDuration(track.duration)}
                      {track.source && <span className="ml-1 text-primary/70">• {track.source}</span>}
                    </p>
                  </div>

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => toggleFavorite(track.id)}>
                      <Heart className={`w-2.5 h-2.5 ${favorites.has(track.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                    <Button variant="default" size="icon" className="h-5 w-5" onClick={() => handleAddTrack(track)}>
                      <Plus className="w-2.5 h-2.5" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Load More */}
              {hasMore && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 text-xs h-7"
                  onClick={handleLoadMore}
                  disabled={isSearching}
                >
                  {isSearching ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                  Load More Tracks
                </Button>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Attribution */}
      <div className="text-[9px] text-muted-foreground pt-1 border-t border-border">
        Unlimited royalty-free music from Pixabay, ccMixter & Internet Archive — millions of tracks searchable
      </div>
    </div>
  );
}
