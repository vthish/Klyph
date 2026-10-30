import { NextRequest, NextResponse } from 'next/server';
import { spawn, execFile } from 'child_process';
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
        } catch (_) {}
      }
    }
  } catch (_) {}
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url') || '';
  const audioUrl = searchParams.get('audioUrl');
  const filename = searchParams.get('filename') || 'Klyph_Media';
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

  // 1. HIGH-SPEED YOUTUBE ENGINE (Unthrottled Range-Chunking + Guaranteed Muxed Audio)
  // When sourceUrl is provided for YouTube, use yt-dlp on the server with 10M chunk ranges.
  // This bypasses Google Video's 40-60 KB/s SABR bandwidth throttling and merges audio+video with FFmpeg!
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
      '--concurrent-fragments', '4',
    ];

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

      // 1. Check direct expected merged outputs
      const possibleExtensions = isAudio ? ['mp3', 'm4a', 'aac'] : ['mp4', 'mkv', 'webm'];
      let targetFile = '';
      for (const ext of possibleExtensions) {
        const candidate = `${tempFileBase}.${ext}`;
        if (fs.existsSync(candidate)) {
          targetFile = candidate;
          break;
        }
      }

      // 2. Fallback if no exact extension matched (e.g. unmerged streams or custom container)
      if (!targetFile) {
        const allFiles = fs.readdirSync(tempDir);
        const candidates = allFiles
          .filter(f => f.startsWith(tempId) && !f.endsWith('.part') && !f.endsWith('.ytdl'))
          .map(f => path.join(tempDir, f))
          .filter(p => {
            try { return fs.existsSync(p) && fs.statSync(p).isFile() && fs.statSync(p).size > 0; }
            catch { return false; }
          });

        if (isAudio) {
          candidates.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size);
          if (candidates.length > 0) targetFile = candidates[0];
        } else {
          // Identify unmerged video and audio candidates
          const videoCand = candidates
            .filter(p => !/\.(m4a|mp3|opus|aac|ogg|wav)$/i.test(p) && !p.includes('.f140.') && !p.includes('.ba.'))
            .sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0];

          const audioCand = candidates
            .filter(p => /\.(m4a|mp3|opus|aac|ogg|wav)$/i.test(p) || p.includes('.f140.') || p.includes('.ba.'))
            .sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0];

          if (videoCand && audioCand) {
            console.log(`[YouTube Engine] Unmerged streams detected (${path.basename(videoCand)} + ${path.basename(audioCand)}). Performing fast local mux...`);
            const muxOutput = `${tempFileBase}_merged.mp4`;
            try {
              await execFileAsync(ffmpegPath, [
                '-hide_banner',
                '-loglevel', 'error',
                '-i', videoCand,
                '-i', audioCand,
                '-c:v', 'copy',
                '-c:a', 'copy',
                '-movflags', '+faststart',
                muxOutput
              ], { timeout: 45000 });
              if (fs.existsSync(muxOutput)) {
                targetFile = muxOutput;
              }
            } catch (muxErr) {
              console.error('[YouTube Engine] Local mux failed, falling back to video stream:', muxErr);
              targetFile = videoCand;
            }
          } else if (videoCand) {
            targetFile = videoCand;
          } else if (candidates.length > 0) {
            candidates.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size);
            targetFile = candidates[0];
          }
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
                try { fs.unlinkSync(path.join(tempDir, f)); } catch (_) {}
              }
            }
          } catch (_) {}
        };

        fileStream.on('close', cleanupTemp);
        req.signal.addEventListener('abort', () => {
          try { fileStream.destroy(); } catch (_) {}
          cleanupTemp();
        });

        console.log(`[YouTube Engine] Prepared ${downloadName} (${stat.size} bytes). Streaming to user.`);
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
      } catch (_) {}
    }
  }

  // 2. FFMPEG MULTI-STREAM MUXING FALLBACK
  // If audioUrl is provided, mux video and audio streams together using FFmpeg
  if (audioUrl && targetUrl) {
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

      const ffmpegArgs = [
        '-hide_banner',
        '-loglevel', 'warning',
        '-reconnect', '1',
        '-reconnect_streamed', '1',
        '-reconnect_delay_max', '5',
        '-user_agent', userAgent,
        '-headers', `Referer: ${referer}\r\n`,
        '-i', targetUrl,
        '-reconnect', '1',
        '-reconnect_streamed', '1',
        '-reconnect_delay_max', '5',
        '-user_agent', userAgent,
        '-headers', `Referer: ${referer}\r\n`,
        '-i', audioUrl,
        '-map', '0:v:0',
        '-map', '1:a:0?',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-strict', '-2',
        '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
        '-shortest',
        '-f', 'mp4',
        'pipe:1'
      ];

      const ffmpegProc = spawn(ffmpegPath, ffmpegArgs);

      req.signal.addEventListener('abort', () => {
        try { ffmpegProc.kill('SIGKILL'); } catch (_) {}
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
      console.error('[Download Mux] FFmpeg pipeline failed, falling back to direct stream:', muxErr);
    }
  }

  // 3. SINGLE STREAM & NON-YOUTUBE PLATFORMS
  const isYouTubeTarget = platform === 'youtube' || targetUrl.includes('googlevideo.com');
  const cfWorkerUrl = process.env.CF_WORKER_URL || process.env.NEXT_PUBLIC_CF_WORKER_URL || 'https://klyph-stream.venushathishan06.workers.dev';

  // For NON-YOUTUBE formats (TikTok, Instagram, Facebook):
  // They are not IP-locked, so redirecting to the Cloudflare Worker gives optimal edge performance!
  if (!isYouTubeTarget && cfWorkerUrl && targetUrl) {
    return NextResponse.redirect(`${cfWorkerUrl}/?url=${encodeURIComponent(targetUrl)}&filename=${encodeURIComponent(cleanFilename)}`);
  }

  // For YOUTUBE single-stream formats (or when CF worker is unset):
  // Stream directly through the server with HTTP Range requests so the server IP matches without 403 Forbidden!
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
