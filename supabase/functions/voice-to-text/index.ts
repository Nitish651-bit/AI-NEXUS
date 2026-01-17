import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768): Uint8Array {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log('Processing voice input for AI NEXUS...');

    // Try Gemini first for audio transcription
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (GEMINI_API_KEY) {
      try {
        console.log('Using Gemini for transcription...');
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: "Transcribe the following audio exactly. Return ONLY the transcribed text with no additional commentary." },
                  {
                    inlineData: {
                      mimeType: "audio/webm",
                      data: audio
                    }
                  }
                ]
              }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 1024,
              }
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const transcription = data.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (transcription) {
            console.log('Gemini transcription successful');
            return new Response(
              JSON.stringify({ success: true, text: transcription.trim(), provider: 'Google Gemini' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
        
        console.log('Gemini transcription failed, falling back to Whisper...');
      } catch (geminiError) {
        console.error('Gemini error:', geminiError);
      }
    }

    // Fallback to OpenAI Whisper
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      throw new Error('No transcription API configured');
    }

    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio);
    
    // Prepare form data
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');

    // Send to OpenAI Whisper
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Whisper error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Whisper transcription successful');

    return new Response(
      JSON.stringify({ 
        success: true,
        text: result.text,
        provider: 'OpenAI Whisper'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Voice-to-text error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Voice transcription failed' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
