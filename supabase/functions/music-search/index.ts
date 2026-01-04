import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PixabayTrack {
  id: number;
  title: string;
  description: string;
  duration: number;
  audio_url: string;
  user: string;
  user_id: number;
  tags: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, category, page = 1, limit = 50 } = await req.json();
    
    const apiKey = Deno.env.get("PIXABAY_API_KEY");
    if (!apiKey) {
      throw new Error("PIXABAY_API_KEY is not configured");
    }
    
    // Build Pixabay Music API URL
    let url = `https://pixabay.com/api/music/?key=${apiKey}&per_page=${limit}&page=${page}`;
    
    // Add search query if provided
    if (query && query.trim()) {
      url += `&q=${encodeURIComponent(query.trim())}`;
    }
    
    // Map categories to Pixabay genres
    const categoryToGenre: Record<string, string> = {
      "pop": "pop",
      "rock": "rock",
      "electronic": "beats",
      "hiphop": "hip hop",
      "jazz": "jazz",
      "classical": "classical",
      "ambient": "ambient",
      "folk": "folk",
      "country": "country",
      "rnb": "r&b",
      "metal": "metal",
      "punk": "punk",
      "reggae": "reggae",
      "blues": "blues",
      "latin": "latin",
      "world": "world",
      "soundtrack": "cinematic",
      "cinematic": "cinematic",
      "lofi": "lo-fi",
      "chillout": "chill out",
      "dance": "dance",
      "indie": "indie",
      "acoustic": "acoustic",
      "piano": "piano",
      "orchestral": "orchestral",
      "epic": "epic",
      "romantic": "romantic",
      "happy": "happy",
      "sad": "sad",
      "energetic": "upbeat",
      "relaxing": "relaxing",
      "dramatic": "dramatic",
      "uplifting": "uplifting",
      "dark": "dark",
      "funky": "funky",
    };
    
    // Add genre filter if category is specified
    if (category && category !== "all") {
      const genre = categoryToGenre[category.toLowerCase()];
      if (genre) {
        // Pixabay uses 'genre' parameter
        url += `&genre=${encodeURIComponent(genre)}`;
      }
    }

    console.log("Fetching from Pixabay Music:", url.replace(apiKey, "[REDACTED]"));
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pixabay API error:", response.status, errorText);
      throw new Error(`Pixabay API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform Pixabay response to our format
    const tracks = (data.hits || []).map((track: PixabayTrack) => ({
      id: track.id.toString(),
      name: track.title || "Untitled Track",
      artist: track.user || "Unknown Artist",
      duration: track.duration || 0,
      previewUrl: track.audio_url,
      downloadUrl: track.audio_url,
      image: `https://pixabay.com/static/img/public/music_placeholder.svg`,
      album: track.tags ? track.tags.split(",")[0]?.trim() : "Pixabay Music",
      source: "Pixabay",
      tags: track.tags,
    }));
    
    const total = data.totalHits || tracks.length;
    
    console.log(`Found ${tracks.length} tracks from Pixabay (total: ${total})`);
    
    return new Response(
      JSON.stringify({
        tracks,
        total,
        page,
        hasMore: page * limit < total,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Music search error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        tracks: [],
        total: 0,
        page: 1,
        hasMore: false 
      }),
      {
        status: 200, // Return 200 with empty results to avoid breaking UI
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
