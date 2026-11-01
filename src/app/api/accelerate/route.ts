import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, audioUrl, resolution, filename, platform } = body;

    if (!url || !audioUrl) {
      return NextResponse.json({ error: 'Missing url or audioUrl' }, { status: 400 });
    }

    const hfBase = process.env.HF_ENGINE_URL || 'https://venu17-klyph-engine.hf.space';
    const cfWorkerBase = process.env.NEXT_PUBLIC_CF_WORKER_URL || 'https://klyph-stream.venushathishan06.workers.dev';

    // 1. Submit conversion task to Hugging Face ZeroGPU Engine
    const callRes = await fetch(`${hfBase}/gradio_api/call/process_video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [
          url,
          resolution || '1080p',
          filename || 'Klyph_Media.mp4',
          audioUrl
        ]
      }),
      signal: AbortSignal.timeout(35000)
    });

    if (!callRes.ok) {
      const errText = await callRes.text();
      return NextResponse.json({ error: `HF Space status ${callRes.status}: ${errText}` }, { status: 502 });
    }

    const initData = await callRes.json();
    if (!initData.event_id) {
      return NextResponse.json({ error: 'No event_id returned from Hugging Face Space' }, { status: 502 });
    }

    // 2. Stream SSE events until completed
    const sseRes = await fetch(`${hfBase}/gradio_api/call/process_video/${initData.event_id}`, {
      signal: AbortSignal.timeout(35000)
    });

    if (!sseRes.ok || !sseRes.body) {
      return NextResponse.json({ error: 'Hugging Face SSE connection failed' }, { status: 502 });
    }

    const reader = sseRes.body.getReader();
    const decoder = new TextDecoder();
    let fileUrl: string | null = null;
    let errorMessage: string | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);

      const lines = chunk.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('event: error')) {
          const nextData = lines[i + 1]?.replace(/^data:\s*/, '');
          errorMessage = nextData || 'Error reported by processing engine';
        }
        if (line.startsWith('event: complete')) {
          const nextData = lines[i + 1]?.replace(/^data:\s*/, '');
          if (nextData) {
            try {
              const parsed = JSON.parse(nextData);
              if (Array.isArray(parsed) && parsed[0]?.url) {
                fileUrl = parsed[0].url;
              }
            } catch (_) { }
          }
        }
      }
      if (fileUrl || errorMessage) break;
    }

    if (errorMessage) {
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    if (!fileUrl) {
      return NextResponse.json({ error: 'Processing timed out on HF Space' }, { status: 504 });
    }

    // 3. Deliver via Cloudflare Worker for Colombo Edge Routing & Content-Disposition attachment
    const downloadUrl = `${cfWorkerBase}/?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(filename || 'video.mp4')}`;

    return NextResponse.json({
      success: true,
      downloadUrl,
      fileUrl
    });

  } catch (err: any) {
    console.error('[/api/accelerate error]:', err);
    return NextResponse.json({ error: err.message || 'Acceleration failed' }, { status: 500 });
  }
}
