import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 300; // Allow up to 5 minutes for huge 2.5GB 4K videos

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch (_) {
    return new Response(JSON.stringify({ error: 'Invalid JSON request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { url, audioUrl, resolution, filename, platform } = body;
  if (!url || !audioUrl) {
    return new Response(JSON.stringify({ error: 'Missing url or audioUrl' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const hfBase = process.env.HF_ENGINE_URL || 'https://venu17-klyph-engine.hf.space';
  const cfWorkerBase = process.env.NEXT_PUBLIC_CF_WORKER_URL || 'https://klyph-stream.venushathishan06.workers.dev';

  const encoder = new TextEncoder();
  const startTime = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;
      const sendEvent = (data: any) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (_) {}
      };

      // Periodic ping every 7 seconds to keep Cloudflare, Render, and Browser alive
      const pingInterval = setInterval(() => {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        let msg = `⚡ Downloading high-speed streams (${elapsed}s)...`;
        if (elapsed > 35) {
          msg = `⚡ Processing high-res video on ZeroGPU (${elapsed}s)...`;
        }
        if (elapsed > 80) {
          msg = `⚡ Packaging full HD / 4K MP4 with FFmpeg (${elapsed}s)...`;
        }
        sendEvent({
          type: 'progress',
          status: 'processing',
          elapsed,
          message: msg
        });
      }, 7000);

      try {
        sendEvent({
          type: 'init',
          status: 'connecting',
          message: '⚡ Connecting to ZeroGPU Accelerator Engine...'
        });

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
          signal: AbortSignal.timeout(300000)
        });

        if (!callRes.ok) {
          const errText = await callRes.text();
          throw new Error(`HF Space status ${callRes.status}: ${errText.slice(0, 100)}`);
        }

        const initData = await callRes.json();
        if (!initData.event_id) {
          throw new Error('No event_id returned from Hugging Face Space');
        }

        sendEvent({
          type: 'progress',
          status: 'processing',
          elapsed: Math.round((Date.now() - startTime) / 1000),
          message: '⚡ Engine active, downloading streams...'
        });

        // 2. Stream SSE events until completed
        const sseRes = await fetch(`${hfBase}/gradio_api/call/process_video/${initData.event_id}`, {
          signal: AbortSignal.timeout(300000)
        });

        if (!sseRes.ok || !sseRes.body) {
          throw new Error(`Hugging Face SSE connection failed (${sseRes.status})`);
        }

        const reader = sseRes.body.getReader();
        const decoder = new TextDecoder();
        let fileUrl: string | null = null;
        let errorMessage: string | null = null;
        let sseBuffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split('\n');
          sseBuffer = lines.pop() || '';

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('event: heartbeat')) {
              const elapsed = Math.round((Date.now() - startTime) / 1000);
              let msg = `⚡ Downloading high-speed streams (${elapsed}s)...`;
              if (elapsed > 35) {
                msg = `⚡ Processing high-res video on ZeroGPU (${elapsed}s)...`;
              }
              if (elapsed > 80) {
                msg = `⚡ Packaging full HD / 4K MP4 with FFmpeg (${elapsed}s)...`;
              }
              sendEvent({
                type: 'progress',
                status: 'processing',
                elapsed,
                message: msg
              });
            } else if (line.startsWith('event: error')) {
              const nextData = lines[i + 1]?.replace(/^data:\s*/, '');
              errorMessage = nextData || 'Error reported by processing engine';
              break;
            } else if (line.startsWith('event: complete')) {
              const nextData = lines[i + 1]?.replace(/^data:\s*/, '');
              if (nextData) {
                try {
                  const parsed = JSON.parse(nextData);
                  if (Array.isArray(parsed) && parsed[0]?.url) {
                    fileUrl = parsed[0].url;
                  }
                } catch (_) {}
              }
              break;
            }
          }

          if (fileUrl || errorMessage) break;
        }

        clearInterval(pingInterval);

        if (errorMessage) {
          throw new Error(errorMessage);
        }

        if (!fileUrl) {
          throw new Error('Processing timed out on HF Space');
        }

        // 3. Deliver via Cloudflare Worker for Colombo Edge Routing & Content-Disposition attachment
        const downloadUrl = `${cfWorkerBase}/?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(filename || 'video.mp4')}`;

        sendEvent({
          type: 'complete',
          status: 'success',
          downloadUrl,
          fileUrl,
          elapsed: Math.round((Date.now() - startTime) / 1000)
        });

      } catch (err: any) {
        clearInterval(pingInterval);
        console.error('[/api/accelerate error]:', err);
        sendEvent({
          type: 'error',
          status: 'error',
          error: err.message || 'Acceleration failed'
        });
      } finally {
        isClosed = true;
        try {
          controller.close();
        } catch (_) {}
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}
