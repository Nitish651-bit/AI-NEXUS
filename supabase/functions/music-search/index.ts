import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface UnifiedTrack {
  id: string;
  name: string;
  artist: string;
  duration: number;
  previewUrl: string;
  downloadUrl: string;
  image: string;
  album: string;
  source: string;
  tags: string;
}

const categoryToGenre: Record<string, string> = {
  pop: "pop", rock: "rock", electronic: "beats", hiphop: "hip hop", jazz: "jazz",
  classical: "classical", ambient: "ambient", folk: "folk", country: "country",
  rnb: "r&b", metal: "metal", punk: "punk", reggae: "reggae", blues: "blues",
  latin: "latin", world: "world", soundtrack: "cinematic", cinematic: "cinematic",
  lofi: "lo-fi", chillout: "chill out", dance: "dance", indie: "indie",
  acoustic: "acoustic", piano: "piano", orchestral: "orchestral", epic: "epic",
  romantic: "romantic", happy: "happy", sad: "sad", energetic: "upbeat",
  relaxing: "relaxing", dramatic: "dramatic", uplifting: "uplifting", dark: "dark",
  funky: "funky",
};

async function searchPixabay(
  query: string | undefined,
  category: string | undefined,
  page: number,
  limit: number,
): Promise<{ tracks: UnifiedTrack[]; total: number }> {
  const apiKey = Deno.env.get("PIXABAY_API_KEY");
  if (!apiKey) return { tracks: [], total: 0 };
  let url = `https://pixabay.com/api/music/?key=${apiKey}&per_page=${limit}&page=${page}`;
  if (query?.trim()) url += `&q=${encodeURIComponent(query.trim())}`;
  if (category && category !== "all") {
    const genre = categoryToGenre[category.toLowerCase()];
    if (genre) url += `&genre=${encodeURIComponent(genre)}`;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) return { tracks: [], total: 0 };
    const data = await res.json();
    const tracks: UnifiedTrack[] = (data.hits || []).map((t: any) => ({
      id: `px-${t.id}`,
      name: t.title || "Untitled",
      artist: t.user || "Unknown",
      duration: t.duration || 0,
      previewUrl: t.audio_url,
      downloadUrl: t.audio_url,
      image: "https://pixabay.com/static/img/public/music_placeholder.svg",
      album: t.tags ? t.tags.split(",")[0]?.trim() : "Pixabay Music",
      source: "Pixabay",
      tags: t.tags || "",
    }));
    return { tracks, total: data.totalHits || tracks.length };
  } catch (e) {
    console.error("Pixabay error:", e);
    return { tracks: [], total: 0 };
  }
}

async function searchCCMixter(
  query: string | undefined,
  category: string | undefined,
  limit: number,
  offset: number,
): Promise<{ tracks: UnifiedTrack[]; total: number }> {
  try {
    const tags = [query, category && category !== "all" ? category : ""]
      .filter(Boolean).join(" ").trim();
    const params = new URLSearchParams({
      f: "json",
      limit: String(limit),
      offset: String(offset),
      sort: "rank",
    });
    if (tags) params.set("tags", tags);
    const res = await fetch(`https://ccmixter.org/api/query?${params}`);
    if (!res.ok) return { tracks: [], total: 0 };
    const data = await res.json();
    const arr = Array.isArray(data) ? data : [];
    const tracks: UnifiedTrack[] = arr
      .filter((t: any) => t.files?.[0]?.download_url)
      .map((t: any) => {
        const file = t.files.find((f: any) =>
          /\.(mp3|ogg|m4a|wav)$/i.test(f.download_url || "")
        ) || t.files[0];
        return {
          id: `cc-${t.upload_id}`,
          name: t.upload_name || "Untitled",
          artist: t.user_real_name || t.user_name || "ccMixter Artist",
          duration: Math.round(Number(file?.file_duration_raw || 0) / 1000) || 180,
          previewUrl: file.download_url,
          downloadUrl: file.download_url,
          image: t.artist_page_img || "https://ccmixter.org/sites/default/files/ccmixter-logo.png",
          album: "ccMixter",
          source: "ccMixter",
          tags: (t.upload_tags || "").replace(/,/g, ", "),
        };
      });
    return { tracks, total: tracks.length + offset + (tracks.length === limit ? limit : 0) };
  } catch (e) {
    console.error("ccMixter error:", e);
    return { tracks: [], total: 0 };
  }
}

async function searchInternetArchive(
  query: string | undefined,
  category: string | undefined,
  limit: number,
  page: number,
): Promise<{ tracks: UnifiedTrack[]; total: number }> {
  try {
    const terms = [query, category && category !== "all" ? category : ""]
      .filter(Boolean).join(" ").trim() || "music";
    const q = `mediatype:(audio) AND collection:(opensource_audio OR netlabels) AND (${terms})`;
    const url =
      `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}` +
      `&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=subject` +
      `&rows=${limit}&page=${page}&output=json&sort[]=downloads+desc`;
    const res = await fetch(url);
    if (!res.ok) return { tracks: [], total: 0 };
    const data = await res.json();
    const docs = data?.response?.docs || [];
    const total = data?.response?.numFound || docs.length;
    // Build a streaming URL guess for the most common IA layout (mp3 derivative)
    const tracks: UnifiedTrack[] = docs.map((d: any) => {
      const id = d.identifier;
      // IA exposes a deterministic stream proxy for the first audio file:
      const stream = `https://archive.org/download/${id}/${encodeURIComponent(id)}_vbr.mp3`;
      return {
        id: `ia-${id}`,
        name: Array.isArray(d.title) ? d.title[0] : d.title || id,
        artist: Array.isArray(d.creator) ? d.creator[0] : d.creator || "Internet Archive",
        duration: 0,
        previewUrl: stream,
        downloadUrl: stream,
        image: `https://archive.org/services/img/${id}`,
        album: "Internet Archive",
        source: "Internet Archive",
        tags: Array.isArray(d.subject) ? d.subject.join(", ") : (d.subject || ""),
      };
    });
    return { tracks, total };
  } catch (e) {
    console.error("Internet Archive error:", e);
    return { tracks: [], total: 0 };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Optional auth — music search is public
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const sb = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_ANON_KEY") ?? "",
          { global: { headers: { Authorization: authHeader } } },
        );
        await sb.auth.getUser();
      } catch {}
    }

    const body = await req.json();
    const schema = z.object({
      query: z.string().trim().max(200).optional(),
      category: z.string().max(50).optional(),
      page: z.number().int().min(1).max(100).optional(),
      limit: z.number().int().min(1).max(100).optional(),
      sources: z.array(z.enum(["pixabay", "ccmixter", "archive"])).optional(),
    });
    const { query, category, page = 1, limit = 40, sources } = schema.parse(body);
    const enabled = new Set(sources && sources.length ? sources : ["pixabay", "ccmixter", "archive"]);

    const perSource = Math.max(10, Math.floor(limit / enabled.size));
    const [pix, cc, ia] = await Promise.all([
      enabled.has("pixabay") ? searchPixabay(query, category, page, perSource) : { tracks: [], total: 0 },
      enabled.has("ccmixter") ? searchCCMixter(query, category, perSource, (page - 1) * perSource) : { tracks: [], total: 0 },
      enabled.has("archive") ? searchInternetArchive(query, category, perSource, page) : { tracks: [], total: 0 },
    ]);

    // Interleave so the user sees variety across sources
    const buckets = [pix.tracks, cc.tracks, ia.tracks];
    const merged: UnifiedTrack[] = [];
    const max = Math.max(...buckets.map((b) => b.length));
    for (let i = 0; i < max; i++) {
      for (const b of buckets) if (b[i]) merged.push(b[i]);
    }

    const total = pix.total + cc.total + ia.total;
    const hasMore = merged.length >= perSource; // optimistic

    console.log(`music-search: pixabay=${pix.tracks.length} ccmixter=${cc.tracks.length} archive=${ia.tracks.length} total~${total}`);

    return new Response(
      JSON.stringify({ tracks: merged, total, page, hasMore }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("music-search error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        tracks: [], total: 0, page: 1, hasMore: false,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
