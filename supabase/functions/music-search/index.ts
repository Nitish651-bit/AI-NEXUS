import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface JamendoTrack {
  id: string;
  name: string;
  artist_name: string;
  duration: number;
  audio: string;
  audiodownload: string;
  image: string;
  album_name: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, category, page = 1, limit = 50 } = await req.json();
    
    // Jamendo API - Free royalty-free music with 600,000+ tracks
    // Using client_id for public access (no API key needed for basic access)
    const clientId = "b6747d04";
    
    let url = `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&limit=${limit}&offset=${(page - 1) * limit}&include=musicinfo&order=popularity_total`;
    
    // Add search query if provided
    if (query && query.trim()) {
      url += `&search=${encodeURIComponent(query)}`;
    }
    
    // Map categories to Jamendo tags
    const categoryTags: Record<string, string> = {
      "pop": "pop",
      "rock": "rock",
      "electronic": "electronic",
      "hiphop": "hiphop",
      "jazz": "jazz",
      "classical": "classical",
      "ambient": "ambient",
      "folk": "folk",
      "country": "country",
      "rnb": "rnb",
      "metal": "metal",
      "punk": "punk",
      "reggae": "reggae",
      "blues": "blues",
      "latin": "latin",
      "world": "world",
      "soundtrack": "soundtrack",
      "cinematic": "cinematic",
      "lofi": "lofi",
      "chillout": "chillout",
      "dance": "dance",
      "indie": "indie",
      "acoustic": "acoustic",
      "piano": "piano",
      "orchestral": "orchestral",
      "epic": "epic",
      "romantic": "romantic",
      "happy": "happy",
      "sad": "sad",
      "energetic": "energetic",
      "relaxing": "relaxing",
      "dramatic": "dramatic",
      "uplifting": "uplifting",
      "dark": "dark",
      "funky": "funky",
    };
    
    if (category && category !== "all" && categoryTags[category.toLowerCase()]) {
      url += `&tags=${categoryTags[category.toLowerCase()]}`;
    }

    console.log("Fetching from Jamendo:", url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Jamendo API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform Jamendo response to our format
    const tracks = data.results.map((track: JamendoTrack) => ({
      id: track.id,
      name: track.name,
      artist: track.artist_name,
      duration: track.duration,
      previewUrl: track.audio,
      downloadUrl: track.audiodownload,
      image: track.image,
      album: track.album_name,
      source: "Jamendo",
    }));
    
    return new Response(
      JSON.stringify({
        tracks,
        total: data.headers?.results_count || tracks.length,
        page,
        hasMore: tracks.length === limit,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Music search error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
