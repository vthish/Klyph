import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * ⚡ Klyph Native 5MB Range-Chunking Stream Engine
 * Google Video heavily throttles continuous TCP streams to ~34 KB/s.
 * This route splits downloads into consecutive 5MB HTTP Range slices,
 * completely bypassing Google Video's playback rate limiting.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');
  const filename = searchParams.get('filename') || 'media.mp4';

  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  const isAudio = filename.toLowerCase().endsWith('.mp3') || filename.toLowerCase().endsWith('.m4a');
  const contentType = isAudio ? 'audio/mpeg' : 'video/mp4';
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB unthrottled chunk size

  const cleanFilename = filename
    .replace(/[\/\\:\*\?"<>\|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  const encodedName = encodeURIComponent(cleanFilename);

  const stream = new ReadableStream({
    async start(controller) {
      let currentByte = 0;
      let hasMore = true;

      while (hasMore) {
        const nextByte = currentByte + CHUNK_SIZE - 1;
        try {
          const res = await fetch(targetUrl, {
            headers: {
              'Range': `bytes=${currentByte}-${nextByte}`,
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Referer': 'https://www.youtube.com/'
            }
          });

          if (!res.ok && res.status !== 206) {
            hasMore = false;
            break;
          }

          const reader = res.body?.getReader();
          if (!reader) {
            hasMore = false;
            break;
          }

          let bytesInSlice = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
            bytesInSlice += value.length;
          }

          // If the server returned less than requested or full content (200 OK), we reached EOF
          if (bytesInSlice < CHUNK_SIZE || res.status === 200) {
            hasMore = false;
          } else {
            currentByte += bytesInSlice;
          }
        } catch (_) {
          hasMore = false;
          break;
        }
      }

      try { controller.close(); } catch (_) { }
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${cleanFilename}"; filename*=UTF-8''${encodedName}`,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Accept-Ranges': 'bytes'
    }
  });
}
