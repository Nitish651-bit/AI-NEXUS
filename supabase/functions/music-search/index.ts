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

async function searchInternetArchive(
  query: string | undefined,
  category: string | undefined,
  limit: number,
  page: number,
): Promise<{ tracks: UnifiedTrack[]; total: number }> {
  try {
    const terms = [query, category && category !== "all" ? category : ""]
      .filter(Boolean).join(" ").trim() || "music";
    const q = `mediatype:(audio) AND collection:(opensource_audio OR netlabels OR audio_music) AND format:(MP3) AND (${terms})`;
    const url =
      `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}` +
      `&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=subject&fl[]=runtime` +
      `&rows=${limit}&page=${page}&output=json&sort[]=downloads+desc`;
    const res = await fetch(url);
    if (!res.ok) return { tracks: [], total: 0 };
    const data = await res.json();
    const docs = data?.response?.docs || [];
    const total = data?.response?.numFound || docs.length;

    // Resolve real playable mp3 URL per item via the metadata API (parallel).
    const resolved = await Promise.all(docs.map(async (d: any) => {
      const id = d.identifier;
      try {
        const metaRes = await fetch(`https://archive.org/metadata/${id}`);
        if (!metaRes.ok) return null;
        const meta = await metaRes.json();
        const files: any[] = meta?.files || [];
        // Prefer VBR MP3, then any MP3, then OGG
        const file =
          files.find((f) => /VBR MP3/i.test(f.format)) ||
          files.find((f) => /MP3/i.test(f.format)) ||
          files.find((f) => /Ogg/i.test(f.format));
        if (!file?.name) return null;
        const streamUrl = `https://archive.org/download/${id}/${encodeURIComponent(file.name)}`;
        const duration = Number(file.length)
          ? Math.round(Number(file.length))
          : Number(file.length?.toString().split(":").reduce((a: number, b: string) => a * 60 + Number(b), 0)) || 0;
        return {
          id: `ia-${id}`,
          name: Array.isArray(d.title) ? d.title[0] : d.title || id,
          artist: Array.isArray(d.creator) ? d.creator[0] : d.creator || "Internet Archive",
          duration: duration || 0,
          previewUrl: streamUrl,
          downloadUrl: streamUrl,
          image: `https://archive.org/services/img/${id}`,
          album: "Internet Archive",
          source: "Internet Archive",
          tags: Array.isArray(d.subject) ? d.subject.join(", ") : (d.subject || ""),
        } as UnifiedTrack;
      } catch {
        return null;
      }
    }));

    const tracks = resolved.filter((t): t is UnifiedTrack => t !== null);
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
      sources: z.array(z.enum(["pixabay", "archive"])).optional(),
    });
    const { query, category, page = 1, limit = 40, sources } = schema.parse(body);
    const enabled = new Set(sources && sources.length ? sources : ["pixabay", "archive"]);

    const perSource = Math.max(10, Math.floor(limit / enabled.size));
    const [pix, ia] = await Promise.all([
      enabled.has("pixabay") ? searchPixabay(query, category, page, perSource) : { tracks: [], total: 0 },
      enabled.has("archive") ? searchInternetArchive(query, category, perSource, page) : { tracks: [], total: 0 },
    ]);

    // Interleave so the user sees variety across sources
    const buckets = [pix.tracks, ia.tracks];
    const merged: UnifiedTrack[] = [];
    const max = Math.max(...buckets.map((b) => b.length));
    for (let i = 0; i < max; i++) {
      for (const b of buckets) if (b[i]) merged.push(b[i]);
    }

    const total = pix.total + ia.total;
    const hasMore = merged.length >= perSource; // optimistic

    console.log(`music-search: pixabay=${pix.tracks.length} archive=${ia.tracks.length} total~${total}`);

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
