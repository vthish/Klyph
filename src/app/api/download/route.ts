import { NextRequest, NextResponse } from 'next/server';
import { spawn, execFile, execSync } from 'child_process';
import { promisify } from 'util';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { resolveFfmpegPath, resolveCookiesPath } from '@/lib/extractor';

const execFileAsync = promisify(execFile);

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 120;

let cachedHasAria2: boolean | null = null;
function hasAria2(): boolean {
  if (cachedHasAria2 !== null) return cachedHasAria2;
  try {
    const cmd = process.platform === 'win32' ? 'where aria2c' : 'which aria2c';
    execSync(cmd, { stdio: 'ignore' });
    cachedHasAria2 = true;
  } catch (_) {
    cachedHasAria2 = false;
  }
  return cachedHasAria2;
}

/**
 * Safely builds RFC 5987 / RFC 6266 compliant Content-Disposition header.
 * HTTP headers in Node.js/Fetch API only accept ByteString (ISO-8859-1, code <= 255).
 * Non-ASCII characters (Sinhala, Tamil, Arabic, Hindi, CJK, Emoji) trigger:
 * "TypeError: Cannot convert argument to a ByteString".
 */
function buildContentDisposition(filename: string, defaultExt: string = 'mp4'): string {
  let clean = filename
    .replace(/[\/\\:\*\?"<>\|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  clean = clean.replace(/\.(mp4|mkv|webm|mp3|m4a)$/i, '');
  clean = `${clean}.${defaultExt}`;

  const asciiFallback = clean
    .replace(/[^\x20-\x7E]/g, '_')
    .replace(/["\\]/g, '')
    .replace(/_{2,}/g, '_')
    .trim() || `media.${defaultExt}`;

  const encoded = encodeURIComponent(clean)
    .replace(/['()]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/\*/g, '%2A');

  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

/**
 * Deletes old temporary klyph media files in tmpdir older than 10 minutes
 */
function cleanOldTempFiles() {
  try {
    const tempDir = os.tmpdir();
    const now = Date.now();
    const files = fs.readdirSync(tempDir);
    for (const f of files) {
      if (f.startsWith('klyph_')) {
        const p = path.join(tempDir, f);
        try {
          const stat = fs.statSync(p);
          if (now - stat.mtimeMs > 10 * 60 * 1000) {
            fs.unlinkSync(p);
          }
        } catch (_) { }
      }
    }
  } catch (_) { }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get('fileId');
  const filename = searchParams.get('filename') || 'Klyph_Media';

  // 1. PREPARED FILE DELIVERY (Ultra High-Speed Instant Local Stream)
  // When fileId is provided, the high-speed engine has already downloaded and muxed the file to tmpdir.
  // We stream it instantly with exact Content-Length in < 2ms, achieving client's max line speed without proxy timeouts!
  if (fileId) {
    const safeFileId = path.basename(fileId);
    if (!safeFileId.startsWith('klyph_') || !/^[a-zA-Z0-9_\.-]+$/.test(safeFileId)) {
      return NextResponse.json({ error: 'Invalid fileId' }, { status: 400 });
    }

    const filePath = path.join(os.tmpdir(), safeFileId);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File expired or not found. Please try downloading again.' }, { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const ext = safeFileId.toLowerCase().endsWith('.mp3') ? 'mp3' : 'mp4';
    const contentType = ext === 'mp3' ? 'audio/mpeg' : 'video/mp4';
    const cleanFilename = filename
      .replace(/[\/\\:\*\?"<>\|]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
    const downloadName = cleanFilename.toLowerCase().endsWith(`.${ext}`) ? cleanFilename : `${cleanFilename}.${ext}`;

    const resHeaders = new Headers();
    resHeaders.set('Content-Type', contentType);
    resHeaders.set('Content-Length', stat.size.toString());
    resHeaders.set('Content-Disposition', buildContentDisposition(downloadName, ext));
    resHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    resHeaders.set('Pragma', 'no-cache');
    resHeaders.set('Expires', '0');
    resHeaders.set('Accept-Ranges', 'bytes');

    const fileStream = fs.createReadStream(filePath);
    fileStream.on('close', () => {
      setTimeout(() => {
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (_) { }
      }, 15000);
    });

    return new Response(Readable.toWeb(fileStream) as any, {
      status: 200,
      headers: resHeaders
    });
  }

  const targetUrl = searchParams.get('url') || '';
  const audioUrl = searchParams.get('audioUrl');
  const sourceUrl = searchParams.get('sourceUrl');
  const platform = searchParams.get('platform') || (targetUrl.includes('googlevideo.com') ? 'youtube' : 'unknown');
  const formatId = searchParams.get('formatId');
  const resolution = searchParams.get('resolution') || '';
  const type = searchParams.get('type') || (filename.toLowerCase().endsWith('.mp3') ? 'audio' : 'video');

  if (!targetUrl && !sourceUrl) {
    return NextResponse.json({ error: 'URL or sourceUrl parameter missing' }, { status: 400 });
  }

  const cleanFilename = filename
    .replace(/[\/\\:\*\?"<>\|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  // 2. INSTANT STREAM-MUXING ENGINE (Facebook HD, Instagram Reels)
  // When both video (targetUrl) and audio (audioUrl) streams are available for non-YouTube platforms,
  // mux and stream them immediately via FFmpeg pipe. Meta CDNs do not throttle unchunked requests!
  if (audioUrl && targetUrl && type !== 'audio') {
    try {
      const ffmpegPath = resolveFfmpegPath();
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

      let referer = 'https://www.youtube.com/';
      if (platform === 'facebook' || targetUrl.includes('fbcdn.net')) {
        referer = 'https://www.facebook.com/';
      } else if (platform === 'instagram' || targetUrl.includes('cdninstagram.com')) {
        referer = 'https://www.instagram.com/';
      } else if (platform === 'tiktok' || targetUrl.includes('tiktokcdn.com')) {
        referer = 'https://www.tiktok.com/';
      }

      const cfWorkerBase = process.env.NEXT_PUBLIC_CF_WORKER_URL || 'https://klyph-stream.venushathishan06.workers.dev';
      const isYouTube = platform === 'youtube' || targetUrl.includes('googlevideo.com') || (audioUrl ? audioUrl.includes('googlevideo.com') : false);
      const heightMatch = resolution.match(/(\d+)p?/);
      const height = heightMatch ? parseInt(heightMatch[1], 10) : 1080;
      const isLowRes = height <= 480;

      // Route all YouTube streams (video and audio) through the Cloudflare Worker 8MB Range-Chunking engine
      // to eliminate Google Video's playback rate throttling across all resolutions (144p to 8K)
      const isAlreadyProxied = (u: string) => u.startsWith(cfWorkerBase);
      const streamVideoUrl = (isYouTube && !isAlreadyProxied(targetUrl))
        ? `${cfWorkerBase}/?url=${encodeURIComponent(targetUrl)}`
        : targetUrl;
      const streamAudioUrl = (isYouTube && audioUrl && !isAlreadyProxied(audioUrl))
        ? `${cfWorkerBase}/?url=${encodeURIComponent(audioUrl)}`
        : audioUrl;

      const ffmpegArgs = [
        '-hide_banner',
        '-loglevel', 'warning',
        '-reconnect', '1',
        '-reconnect_streamed', '1',
        '-reconnect_at_eof', '1',
        '-reconnect_delay_max', '5',
        '-user_agent', userAgent,
        '-headers', `Referer: ${referer}\r\n`,
        '-i', streamVideoUrl,
        '-reconnect', '1',
        '-reconnect_streamed', '1',
        '-reconnect_at_eof', '1',
        '-reconnect_delay_max', '5',
        '-user_agent', userAgent,
        '-headers', `Referer: ${referer}\r\n`,
        '-i', streamAudioUrl,
        '-map', '0:v:0',
        '-map', '1:a:0?',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', isLowRes ? '128k' : '192k',
        '-strict', '-2',
        '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
        '-shortest',
        '-f', 'mp4',
        'pipe:1'
      ];

      const ffmpegProc = spawn(ffmpegPath, ffmpegArgs);

      req.signal.addEventListener('abort', () => {
        try { ffmpegProc.kill('SIGKILL'); } catch (_) { }
      });

      ffmpegProc.stderr.on('data', (d) => {
        const msg = d.toString();
        if (msg.includes('Error') || msg.includes('Invalid') || msg.includes('403')) {
          console.error('[Download Mux] FFmpeg stderr:', msg);
        }
      });

      ffmpegProc.on('error', (err) => {
        console.error('[Download Mux] FFmpeg spawn error:', err);
      });

      const webStream = Readable.toWeb(ffmpegProc.stdout);
      const downloadName = cleanFilename.endsWith('.mp4') ? cleanFilename : `${cleanFilename}.mp4`;

      const streamHeaders = new Headers();
      streamHeaders.set('Content-Type', 'video/mp4');
      streamHeaders.set('Content-Disposition', buildContentDisposition(downloadName, 'mp4'));
      streamHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      streamHeaders.set('Pragma', 'no-cache');
      streamHeaders.set('Expires', '0');

      return new Response(webStream as any, {
        status: 200,
        headers: streamHeaders
      });
    } catch (muxErr) {
      console.error('[Download Mux] FFmpeg pipeline failed, falling back to server engine:', muxErr);
    }
  }

  // 3. HIGH-SPEED YOUTUBE ENGINE FALLBACK (for direct GET requests)
  if (platform === 'youtube' && sourceUrl) {
    cleanOldTempFiles();

    const tempId = `klyph_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const tempDir = os.tmpdir();
    const tempFileBase = path.join(tempDir, tempId);

    const pythonCmd = process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');
    const ffmpegPath = resolveFfmpegPath();
    const cookiesPath = resolveCookiesPath();

    const ytdlpArgs = [
      '-m', 'yt_dlp',
      '--no-playlist',
      '--no-check-certificates',
      '--geo-bypass',
      '--js-runtimes', 'node',
      '--http-chunk-size', '10M',
      '--concurrent-fragments', '8',
    ];

    if (hasAria2()) {
      ytdlpArgs.push(
        '--downloader', 'aria2c',
        '--downloader-args', 'aria2c:-x 16 -s 16 -k 5M -j 16 --file-allocation=none'
      );
    }

    if (ffmpegPath && ffmpegPath !== 'ffmpeg' && fs.existsSync(ffmpegPath)) {
      ytdlpArgs.push('--ffmpeg-location', ffmpegPath);
    }

    if (cookiesPath && fs.existsSync(cookiesPath)) {
      ytdlpArgs.push('--cookies', cookiesPath);
    }

    const isAudio = type === 'audio' || cleanFilename.toLowerCase().endsWith('.mp3');
    const outTemplate = `${tempFileBase}.%(ext)s`;

    if (isAudio) {
      ytdlpArgs.push(
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '-o', outTemplate,
        sourceUrl
      );
    } else {
      const heightMatch = resolution.match(/(\d+)p?/);
      const height = heightMatch ? parseInt(heightMatch[1], 10) : 1080;

      let formatSelector = `bv*[height<=${height}][ext=mp4]+ba[ext=m4a]/bv*[height<=${height}]+ba[ext=m4a]/bv*[height<=${height}]+ba/best`;
      if (formatId && !formatId.startsWith('v-')) {
        formatSelector = `${formatId}+ba[ext=m4a]/${formatId}+ba/bv*[height<=${height}]+ba/best`;
      }

      ytdlpArgs.push(
        '-f', formatSelector,
        '--merge-output-format', 'mp4/mkv',
        '--postprocessor-args', 'ffmpeg:-c:v copy -c:a aac -b:a 192k',
        '-o', outTemplate,
        sourceUrl
      );
    }

    try {
      console.log(`[YouTube Engine] Accelerating download for: ${sourceUrl} (Type: ${type}, Res: ${resolution})`);
      await execFileAsync(pythonCmd, ytdlpArgs, {
        timeout: 120000,
        maxBuffer: 50 * 1024 * 1024
      });

      const possibleExtensions = isAudio ? ['mp3', 'm4a', 'aac'] : ['mp4', 'mkv', 'webm'];
      let targetFile = '';
      for (const ext of possibleExtensions) {
        const candidate = `${tempFileBase}.${ext}`;
        if (fs.existsSync(candidate)) {
          targetFile = candidate;
          break;
        }
      }

      if (!targetFile) {
        const allFiles = fs.readdirSync(tempDir);
        const candidates = allFiles
          .filter(f => f.startsWith(tempId) && !f.endsWith('.part') && !f.endsWith('.ytdl'))
          .map(f => path.join(tempDir, f))
          .filter(p => {
            try { return fs.existsSync(p) && fs.statSync(p).isFile() && fs.statSync(p).size > 0; }
            catch { return false; }
          });

        if (candidates.length > 0) {
          candidates.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size);
          targetFile = candidates[0];
        }
      }

      if (fs.existsSync(targetFile)) {
        const stat = fs.statSync(targetFile);
        const fileStream = fs.createReadStream(targetFile);
        const webStream = Readable.toWeb(fileStream);

        const actualExt = path.extname(targetFile).replace('.', '').toLowerCase() || (isAudio ? 'mp3' : 'mp4');
        const downloadExt = actualExt === 'mkv' ? 'mkv' : (actualExt === 'webm' ? 'webm' : (isAudio ? 'mp3' : 'mp4'));

        const downloadName = cleanFilename.toLowerCase().endsWith(`.${downloadExt}`)
          ? cleanFilename
          : `${cleanFilename.replace(/\.(mp4|mkv|webm|mp3|m4a)$/i, '')}.${downloadExt}`;

        let contentType = 'video/mp4';
        if (isAudio) {
          contentType = actualExt === 'm4a' ? 'audio/mp4' : 'audio/mpeg';
        } else if (actualExt === 'mkv') {
          contentType = 'video/x-matroska';
        } else if (actualExt === 'webm') {
          contentType = 'video/webm';
        }

        const streamHeaders = new Headers();
        streamHeaders.set('Content-Type', contentType);
        streamHeaders.set('Content-Length', stat.size.toString());
        streamHeaders.set('Content-Disposition', buildContentDisposition(downloadName, downloadExt));
        streamHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        streamHeaders.set('Pragma', 'no-cache');
        streamHeaders.set('Expires', '0');
        streamHeaders.set('Accept-Ranges', 'bytes');

        const cleanupTemp = () => {
          try {
            const files = fs.readdirSync(tempDir);
            for (const f of files) {
              if (f.startsWith(tempId)) {
                try { fs.unlinkSync(path.join(tempDir, f)); } catch (_) { }
              }
            }
          } catch (_) { }
        };

        fileStream.on('close', cleanupTemp);
        req.signal.addEventListener('abort', () => {
          try { fileStream.destroy(); } catch (_) { }
          cleanupTemp();
        });

        return new Response(webStream as any, {
          status: 200,
          headers: streamHeaders
        });
      }
    } catch (ytdlpErr) {
      console.error('[YouTube Engine] Fast engine error, falling back to direct stream / FFmpeg:', ytdlpErr);
      try {
        const files = fs.readdirSync(tempDir);
        for (const f of files) {
          if (f.startsWith(tempId)) {
            fs.unlinkSync(path.join(tempDir, f));
          }
        }
      } catch (_) { }
    }
  }

  // 4. SINGLE STREAM & NON-YOUTUBE PLATFORMS
  const isYouTubeTarget = platform === 'youtube' || targetUrl.includes('googlevideo.com');
  const cfWorkerUrl = process.env.CF_WORKER_URL || process.env.NEXT_PUBLIC_CF_WORKER_URL || 'https://klyph-stream.venushathishan06.workers.dev';

  // For NON-YOUTUBE formats (TikTok, Instagram, Facebook):
  // They are not IP-locked, so redirecting to the Cloudflare Worker gives optimal edge performance!
  if (cfWorkerUrl && targetUrl) {
    return NextResponse.redirect(`${cfWorkerUrl}/?url=${encodeURIComponent(targetUrl)}&filename=${encodeURIComponent(cleanFilename)}`);
  }

  // For single-stream formats (or when CF worker is unset):
  if (!targetUrl) {
    return NextResponse.json({ error: 'Stream URL not available' }, { status: 400 });
  }

  try {
    const rangeHeader = req.headers.get('range') || 'bytes=0-';
    const reqHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Referer': isYouTubeTarget ? 'https://www.youtube.com/' : '',
      'Range': rangeHeader
    };

    const response = await fetch(targetUrl, { headers: reqHeaders });

    if (!response.ok && response.status !== 206) {
      return NextResponse.redirect(targetUrl);
    }

    const ext = cleanFilename.toLowerCase().endsWith('.mp3') ? 'mp3' : 'mp4';
    const contentType = response.headers.get('content-type') || (ext === 'mp3' ? 'audio/mpeg' : 'video/mp4');
    const resHeaders = new Headers();
    resHeaders.set('Content-Type', contentType);
    resHeaders.set('Content-Disposition', buildContentDisposition(cleanFilename, ext));
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

/**
 * High-Speed Streaming Preparation Engine (Eliminates cloud proxy 30s timeouts & Google throttling)
 * The client sends a POST request with video metadata. The server immediately returns an active chunked stream
 * with heartbeats and progress events while yt-dlp accelerates the video using 10M range chunks and aria2c multi-connection acceleration.
 * Once complete, it sends { status: 'ready', downloadUrl } which the client triggers to receive the muxed file instantly.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { platform = 'youtube', sourceUrl, formatId, resolution, type, filename = 'Klyph_Media' } = body;

    if (!sourceUrl) {
      return NextResponse.json({ error: 'sourceUrl is required' }, { status: 400 });
    }

    cleanOldTempFiles();

    const tempId = `klyph_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const tempDir = os.tmpdir();
    const tempFileBase = path.join(tempDir, tempId);

    const pythonCmd = process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');
    const ffmpegPath = resolveFfmpegPath();
    const cookiesPath = resolveCookiesPath();

    const cleanFilename = filename
      .replace(/[\/\\:\*\?"<>\|]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();

    const isAudio = type === 'audio' || cleanFilename.toLowerCase().endsWith('.mp3');
    const outTemplate = `${tempFileBase}.%(ext)s`;

    const ytdlpArgs = [
      '-m', 'yt_dlp',
      '--no-playlist',
      '--no-check-certificates',
      '--geo-bypass',
      '--js-runtimes', 'node',
      '--http-chunk-size', '10M',
      '--concurrent-fragments', '8',
      '--progress',
      '--newline',
    ];

    if (hasAria2()) {
      ytdlpArgs.push(
        '--downloader', 'aria2c',
        '--downloader-args', 'aria2c:-x 16 -s 16 -k 5M -j 16 --file-allocation=none --summary-interval=1'
      );
    }

    if (ffmpegPath && ffmpegPath !== 'ffmpeg' && fs.existsSync(ffmpegPath)) {
      ytdlpArgs.push('--ffmpeg-location', ffmpegPath);
    }

    if (cookiesPath && fs.existsSync(cookiesPath)) {
      ytdlpArgs.push('--cookies', cookiesPath);
    }

    if (isAudio) {
      ytdlpArgs.push(
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '-o', outTemplate,
        sourceUrl
      );
    } else {
      const heightMatch = (resolution || '').match(/(\d+)p?/);
      const height = heightMatch ? parseInt(heightMatch[1], 10) : 1080;

      let formatSelector = `bv*[height<=${height}][ext=mp4]+ba[ext=m4a]/bv*[height<=${height}]+ba[ext=m4a]/bv*[height<=${height}]+ba/best`;
      if (formatId && !formatId.startsWith('v-')) {
        formatSelector = `${formatId}+ba[ext=m4a]/${formatId}+ba/bv*[height<=${height}]+ba/best`;
      }

      ytdlpArgs.push(
        '-f', formatSelector,
        '--merge-output-format', 'mp4/mkv',
        '--postprocessor-args', 'ffmpeg:-c:v copy -c:a aac -b:a 192k',
        '-o', outTemplate,
        sourceUrl
      );
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // 1. Send instant initial chunk (TTFB < 10ms - completely satisfies proxy timeout!)
    await writer.write(encoder.encode(JSON.stringify({ status: 'started', message: 'Engine accelerating...' }) + '\n'));

    // 2. Keepalive heartbeat every 2 seconds to keep connection indefinitely alive
    const heartbeat = setInterval(() => {
      try {
        writer.write(encoder.encode(JSON.stringify({ status: 'progress', message: 'Accelerating chunks...' }) + '\n')).catch(() => { });
      } catch (_) { }
    }, 2000);

    const ytdlpProc = spawn(pythonCmd, ytdlpArgs);

    req.signal.addEventListener('abort', () => {
      try {
        clearInterval(heartbeat);
        ytdlpProc.kill('SIGKILL');
      } catch (_) { }
    });

    const handleProgress = (data: Buffer) => {
      const text = data.toString();
      // Match yt-dlp native progress: "[download]  45.2% of 50.00MiB at 12.30MiB/s"
      let match = text.match(/\[download\]\s+([\d\.]+)%/);
      if (!match) {
        // Match aria2c progress: "[#abc123 45.2MiB/120MiB(37%) CN:16 DL:42.5MiB]"
        match = text.match(/\((\d+(?:\.\d+)?)%\)/);
      }
      if (match && match[1]) {
        const pct = parseFloat(match[1]);
        try {
          writer.write(encoder.encode(JSON.stringify({ status: 'progress', percent: pct }) + '\n')).catch(() => { });
        } catch (_) { }
      }
    };

    ytdlpProc.stdout.on('data', handleProgress);
    ytdlpProc.stderr.on('data', handleProgress);

    ytdlpProc.on('close', async (code) => {
      clearInterval(heartbeat);

      if (code !== 0) {
        try {
          await writer.write(encoder.encode(JSON.stringify({ status: 'error', message: 'Download engine error' }) + '\n'));
          await writer.close();
        } catch (_) { }
        return;
      }

      try {
        const files = fs.readdirSync(tempDir);
        let producedFile: string | null = null;
        for (const f of files) {
          if (f.startsWith(tempId)) {
            producedFile = path.join(tempDir, f);
            break;
          }
        }

        if (!producedFile || !fs.existsSync(producedFile)) {
          await writer.write(encoder.encode(JSON.stringify({ status: 'error', message: 'Produced file missing' }) + '\n'));
          await writer.close();
          return;
        }

        const actualExt = path.extname(producedFile).replace('.', '') || (isAudio ? 'mp3' : 'mp4');
        const finalFilename = cleanFilename.toLowerCase().endsWith(`.${actualExt}`) ? cleanFilename : `${cleanFilename}.${actualExt}`;
        const baseName = path.basename(producedFile);

        await writer.write(encoder.encode(JSON.stringify({
          status: 'ready',
          fileId: baseName,
          filename: finalFilename,
          downloadUrl: `/api/download?fileId=${encodeURIComponent(baseName)}&filename=${encodeURIComponent(finalFilename)}`
        }) + '\n'));
        await writer.close();
      } catch (err: any) {
        try {
          await writer.write(encoder.encode(JSON.stringify({ status: 'error', message: err.message || 'Processing failed' }) + '\n'));
          await writer.close();
        } catch (_) { }
      }
    });

    ytdlpProc.on('error', async (err) => {
      clearInterval(heartbeat);
      try {
        await writer.write(encoder.encode(JSON.stringify({ status: 'error', message: err.message }) + '\n'));
        await writer.close();
      } catch (_) { }
    });

    return new Response(readable, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
