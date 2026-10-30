import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');
  const audioUrl = searchParams.get('audioUrl');
  const filename = searchParams.get('filename') || 'Klyph_Media';

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL parameter missing' }, { status: 400 });
  }

  const cleanFilename = filename
    .replace(/[\/\\:\*\?"<>\|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  // If audioUrl is provided, mux video and audio streams together using FFmpeg
  if (audioUrl) {
    try {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const cfWorkerUrl = process.env.CF_WORKER_URL || process.env.NEXT_PUBLIC_CF_WORKER_URL || 'https://klyph-stream.venushathishan06.workers.dev';

      // Use direct streams for FFmpeg on server so Google Video IP match succeeds without 403
      const ffmpegArgs = [
        '-hide_banner',
        '-loglevel', 'error',
        '-reconnect', '1',
        '-reconnect_streamed', '1',
        '-reconnect_delay_max', '5',
        '-user_agent', userAgent,
        '-i', targetUrl,
        '-user_agent', userAgent,
        '-i', audioUrl,
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
        '-shortest',
        '-f', 'mp4',
        'pipe:1'
      ];

      const ffmpegProc = spawn('ffmpeg', ffmpegArgs);

      // Kill FFmpeg immediately if client cancels or disconnects
      req.signal.addEventListener('abort', () => {
        try {
          ffmpegProc.kill('SIGKILL');
        } catch (_) {}
      });

      let spawnFailed = false;
      ffmpegProc.on('error', (err) => {
        spawnFailed = true;
        console.error('[Download Mux] FFmpeg spawn error:', err);
      });

      // Stream the combined MP4 directly to the browser
      const webStream = Readable.toWeb(ffmpegProc.stdout);
      const downloadName = cleanFilename.endsWith('.mp4') ? cleanFilename : `${cleanFilename}.mp4`;

      return new Response(webStream as any, {
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': `attachment; filename="${downloadName}"`,
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    } catch (muxErr) {
      console.error('[Download Mux] FFmpeg pipeline failed, falling back to direct stream:', muxErr);
    }
  }

  // Direct single-stream fallback: redirect straight to Cloudflare Worker edge proxy
  const cfWorkerUrl = process.env.CF_WORKER_URL || process.env.NEXT_PUBLIC_CF_WORKER_URL || 'https://klyph-stream.venushathishan06.workers.dev';
  if (cfWorkerUrl) {
    return NextResponse.redirect(`${cfWorkerUrl}/?url=${encodeURIComponent(targetUrl)}&filename=${encodeURIComponent(cleanFilename)}`);
  }

  // Fallback to direct stream if CF worker URL is unset
  try {
    const rangeHeader = req.headers.get('range') || 'bytes=0-';
    const reqHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Range': rangeHeader
    };

    const response = await fetch(targetUrl, {
      headers: reqHeaders
    });

    if (!response.ok && response.status !== 206) {
      return NextResponse.redirect(targetUrl);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const resHeaders = new Headers();
    resHeaders.set('Content-Type', contentType);
    resHeaders.set('Content-Disposition', `attachment; filename="${cleanFilename}"`);
    resHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    resHeaders.set('Pragma', 'no-cache');
    resHeaders.set('Expires', '0');

    const contentLength = response.headers.get('content-length');
    if (contentLength) resHeaders.set('Content-Length', contentLength);

    const contentRange = response.headers.get('content-range');
    if (contentRange) resHeaders.set('Content-Range', contentRange);

    const acceptRanges = response.headers.get('accept-ranges');
    if (acceptRanges) resHeaders.set('Accept-Ranges', acceptRanges);

    return new Response(response.body, {
      status: response.status,
      headers: resHeaders
    });
  } catch (err) {
    return NextResponse.redirect(targetUrl);
  }
}
