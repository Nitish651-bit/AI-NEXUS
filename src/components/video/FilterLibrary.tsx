import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Sparkles, Check } from "lucide-react";
import { 
  VideoFilter, 
  videoFilters, 
  filterMoods, 
  filterCategories,
  getFiltersByMood,
  searchFilters 
} from "@/data/videoFiltersData";

interface FilterLibraryProps {
  onApplyFilter: (filter: VideoFilter) => void;
}

export function FilterLibrary({ onApplyFilter }: FilterLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [appliedFilterIds, setAppliedFilterIds] = useState<Set<string>>(new Set());

  const filteredFilters = useMemo(() => {
    let filters = videoFilters;
    
    if (searchQuery) {
      filters = searchFilters(searchQuery);
    }
    
    if (selectedMood) {
      filters = filters.filter(f => f.mood === selectedMood);
    }
    
    // Return first 50 for performance
    return filters.slice(0, 50);
  }, [searchQuery, selectedMood]);

  const handleApply = (filter: VideoFilter) => {
    onApplyFilter(filter);
    setAppliedFilterIds(prev => new Set([...prev, filter.id]));
  };

  const popularFilters = useMemo(() => {
    return videoFilters
      .filter(f => f.intensity === 50) // Medium intensity
      .slice(0, 8);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Filter Library</h3>
        <Badge variant="secondary" className="text-xs">
          {videoFilters.length}+ filters
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search filters..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Mood Filter */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Filter by Mood</label>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            <Badge
              variant={selectedMood === null ? "default" : "outline"}
              className="cursor-pointer shrink-0"
              onClick={() => setSelectedMood(null)}
            >
              All
            </Badge>
            {filterMoods.map((mood) => (
              <Badge
                key={mood}
                variant={selectedMood === mood ? "default" : "outline"}
                className="cursor-pointer shrink-0"
                onClick={() => setSelectedMood(mood)}
              >
                {mood}
              </Badge>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Popular Filters */}
      {!searchQuery && !selectedMood && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-medium">Popular</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {popularFilters.map((filter) => (
              <FilterCard
                key={filter.id}
                filter={filter}
                isApplied={appliedFilterIds.has(filter.id)}
                onApply={() => handleApply(filter)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Filters */}
      <div className="space-y-2">
        <span className="text-xs font-medium">
          {searchQuery || selectedMood ? `Results (${filteredFilters.length})` : "All Filters"}
        </span>
        <div className="grid grid-cols-2 gap-2">
          {filteredFilters.map((filter) => (
            <FilterCard
              key={filter.id}
              filter={filter}
              isApplied={appliedFilterIds.has(filter.id)}
              onApply={() => handleApply(filter)}
            />
          ))}
        </div>
        {filteredFilters.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No filters found. Try a different search.
          </div>
        )}
      </div>
    </div>
  );
}

interface FilterCardProps {
  filter: VideoFilter;
  isApplied: boolean;
  onApply: () => void;
}

function FilterCard({ filter, isApplied, onApply }: FilterCardProps) {
  return (
    <button
      onClick={onApply}
      className={`relative group rounded-lg overflow-hidden border transition-all hover:scale-105 hover:shadow-lg ${
        isApplied ? "ring-2 ring-primary border-primary" : "border-border hover:border-primary/50"
      }`}
    >
      {/* Color Preview */}
      <div 
        className="h-12 w-full"
        style={{ 
          background: `linear-gradient(135deg, ${filter.previewColor}CC, ${filter.previewColor}66)`,
        }}
      />
      
      {/* Info */}
      <div className="p-2 bg-card text-left">
        <p className="text-xs font-medium truncate">{filter.name}</p>
        <p className="text-[10px] text-muted-foreground truncate">{filter.mood}</p>
      </div>

      {/* Applied Indicator */}
      {isApplied && (
        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
    </button>
  );
}
