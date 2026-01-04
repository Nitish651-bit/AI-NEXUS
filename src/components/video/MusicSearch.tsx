import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
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
  X,
  Sparkles,
  Wand2,
  Lightbulb
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
  clipCount?: number;
  totalDuration?: number;
  appliedFilters?: string[];
}

interface AIRecommendation {
  searchQuery: string;
  category: string;
  reason: string;
  timing: string;
}

interface AIAnalysis {
  mood: string;
  energy: string;
  pace: string;
  emotion: string;
}

interface AIResponse {
  analysis: AIAnalysis;
  recommendations: AIRecommendation[];
  mixingTips: string[];
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

export function MusicSearch({ onSelectTrack, clipCount = 0, totalDuration = 0, appliedFilters = [] }: MusicSearchProps) {
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
  
  // AI Recommendations
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [videoDescription, setVideoDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchTracks = useCallback(async (reset = false, query?: string, category?: string) => {
    const currentPage = reset ? 1 : page;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("music-search", {
        body: {
          query: query ?? searchQuery,
          category: category ?? selectedCategory,
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

  const handleAIAnalyze = async () => {
    if (!videoDescription.trim() && clipCount === 0) {
      toast.error("Please describe your video or add some clips first");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-music-recommend", {
        body: {
          videoDescription: videoDescription.trim(),
          currentFilters: appliedFilters,
          clipCount,
          totalDuration,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setAiResponse(data);
      toast.success("AI analysis complete! 🎵");
    } catch (error: any) {
      console.error("AI Analysis error:", error);
      toast.error(error.message || "Failed to analyze video");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyRecommendation = (rec: AIRecommendation) => {
    setSearchQuery(rec.searchQuery);
    setSelectedCategory(rec.category);
    setShowAIPanel(false);
    fetchTracks(true, rec.searchQuery, rec.category);
    toast.success(`Searching for "${rec.searchQuery}"...`);
  };

  const selectedCategoryData = CATEGORIES.find(c => c.id === selectedCategory);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Music Library</h3>
        <div className="flex items-center gap-2">
          <Button
            variant={showAIPanel ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAIPanel(!showAIPanel)}
            className="h-6 text-[10px] gap-1"
          >
            <Wand2 className="w-3 h-3" />
            AI Recommend
          </Button>
          <Badge variant="secondary" className="text-[10px]">
            {totalTracks > 0 ? `${totalTracks.toLocaleString()}+` : "600K+"}
          </Badge>
        </div>
      </div>

      {/* AI Recommendation Panel */}
      {showAIPanel && (
        <div className="p-3 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg border border-primary/20 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium">AI Music Advisor</span>
          </div>
          
          <Textarea
            placeholder="Describe your video... (e.g., 'A travel vlog showing sunset beaches in Bali with slow-motion waves')"
            value={videoDescription}
            onChange={(e) => setVideoDescription(e.target.value)}
            className="text-xs min-h-[60px] resize-none"
          />
          
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>
              {clipCount > 0 && `${clipCount} clips • `}
              {totalDuration > 0 && `${Math.round(totalDuration)}s • `}
              {appliedFilters.length > 0 && `${appliedFilters.length} filters`}
            </span>
            <Button
              size="sm"
              onClick={handleAIAnalyze}
              disabled={isAnalyzing}
              className="h-7 text-xs gap-1"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Wand2 className="w-3 h-3" />
                  Get Recommendations
                </>
              )}
            </Button>
          </div>

          {/* AI Response */}
          {aiResponse && (
            <div className="space-y-3 pt-2 border-t border-border/50">
              {/* Analysis */}
              <div className="grid grid-cols-4 gap-1">
                <div className="text-center p-1.5 bg-background/50 rounded">
                  <p className="text-[9px] text-muted-foreground">Mood</p>
                  <p className="text-[10px] font-medium capitalize">{aiResponse.analysis.mood}</p>
                </div>
                <div className="text-center p-1.5 bg-background/50 rounded">
                  <p className="text-[9px] text-muted-foreground">Energy</p>
                  <p className="text-[10px] font-medium capitalize">{aiResponse.analysis.energy}</p>
                </div>
                <div className="text-center p-1.5 bg-background/50 rounded">
                  <p className="text-[9px] text-muted-foreground">Pace</p>
                  <p className="text-[10px] font-medium capitalize">{aiResponse.analysis.pace}</p>
                </div>
                <div className="text-center p-1.5 bg-background/50 rounded">
                  <p className="text-[9px] text-muted-foreground">Emotion</p>
                  <p className="text-[10px] font-medium capitalize">{aiResponse.analysis.emotion}</p>
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <p className="text-[10px] font-medium flex items-center gap-1">
                  <Music className="w-3 h-3" />
                  Recommended Tracks
                </p>
                {aiResponse.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="p-2 bg-background/50 rounded-lg hover:bg-background/80 transition-colors cursor-pointer group"
                    onClick={() => handleApplyRecommendation(rec)}
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[9px]">
                        {CATEGORIES.find(c => c.id === rec.category)?.icon} {rec.category}
                      </Badge>
                      <Button variant="ghost" size="sm" className="h-5 text-[9px] opacity-0 group-hover:opacity-100">
                        <Search className="w-2.5 h-2.5 mr-1" />
                        Search
                      </Button>
                    </div>
                    <p className="text-[10px] font-medium mt-1">"{rec.searchQuery}"</p>
                    <p className="text-[9px] text-muted-foreground">{rec.reason}</p>
                    <p className="text-[9px] text-primary/80 mt-0.5">⏱ {rec.timing}</p>
                  </div>
                ))}
              </div>

              {/* Mixing Tips */}
              {aiResponse.mixingTips.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-medium flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" />
                    Mixing Tips
                  </p>
                  <ul className="space-y-0.5">
                    {aiResponse.mixingTips.map((tip, i) => (
                      <li key={i} className="text-[9px] text-muted-foreground flex items-start gap-1">
                        <span className="text-primary">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search songs, artists..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="pl-9 pr-16 h-8 text-xs"
        />
        <Button
          size="sm"
          onClick={handleSearch}
          disabled={isLoading}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 text-[10px]"
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
                onClick={() => {
                  setSearchQuery("");
                  fetchTracks(true, "", selectedCategory);
                }}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Track List */}
      <ScrollArea className="h-[200px]">
        <div className="space-y-1.5 pr-2">
          {isLoading && tracks.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-xs">
              <Music className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p>No tracks found. Try a different search.</p>
            </div>
          ) : (
            <>
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center gap-2 p-1.5 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group"
                >
                  {/* Album Art */}
                  <div className="relative w-9 h-9 rounded overflow-hidden bg-muted flex-shrink-0">
                    {track.image ? (
                      <img src={track.image} alt={track.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-3 h-3 text-muted-foreground" />
                      </div>
                    )}
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
              ))}
              
              {hasMore && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMore}
                  disabled={isLoading}
                  className="w-full text-[10px] h-7"
                >
                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                  Load More
                </Button>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Attribution */}
      <div className="flex items-center justify-between text-[9px] text-muted-foreground pt-1 border-t border-border">
        <span>🎵 Royalty-free from Jamendo</span>
        <a 
          href="https://www.jamendo.com/start" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-primary"
        >
          Browse <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
}
