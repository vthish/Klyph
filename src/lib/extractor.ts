import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { VideoFormat, VideoMetadata, detectPlatform } from './types';

export * from './types';

const execFileAsync = promisify(execFile);

/**
 * Formats raw byte count into human-readable KB, MB, or GB string
 */
export function formatBytes(bytes?: number | null): string | undefined {
  if (!bytes || bytes <= 0 || isNaN(bytes)) return undefined;

  const KB = 1024;
  const MB = 1024 * KB;
  const GB = 1024 * MB;

  if (bytes >= GB) {
    return `${parseFloat((bytes / GB).toFixed(2))} GB`;
  }
  if (bytes >= MB) {
    return `${(bytes / MB).toFixed(1)} MB`;
  }
  return `${Math.round(bytes / KB)} KB`;
}

/**
 * Estimates video bytes based on resolution height and duration in seconds
 */
function estimateBytes(height: number, durationSeconds?: number): number | undefined {
  if (!durationSeconds || durationSeconds <= 0) return undefined;
  let bytesPerSec = 60 * 1024;
  if (height >= 2160) bytesPerSec = 2200 * 1024;
  else if (height >= 1440) bytesPerSec = 1100 * 1024;
  else if (height >= 1080) bytesPerSec = 450 * 1024;
  else if (height >= 720) bytesPerSec = 220 * 1024;
  else if (height >= 480) bytesPerSec = 110 * 1024;
  else if (height >= 360) bytesPerSec = 60 * 1024;
  else bytesPerSec = 35 * 1024;
  return Math.round(bytesPerSec * durationSeconds);
}

/**
 * Estimates audio bytes based on duration in seconds and bitrate
 */
function estimateAudioBytes(durationSeconds?: number, abr: number = 128): number | undefined {
  if (!durationSeconds || durationSeconds <= 0) return undefined;
  return Math.round(((abr * 1000) / 8) * durationSeconds);
}

/**
 * Dedicated TikTok fetcher using TikWM (Bypasses regional geo-blocks & redirects)
 */
async function extractTikTok(url: string): Promise<VideoMetadata> {
  const apiUrl = 'https://www.tikwm.com/api/?url=' + encodeURIComponent(url);
  const res = await fetch(apiUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const data = await res.json();
  if (data && data.code === 0 && data.data) {
    const d = data.data;
    const duration = typeof d.duration === 'number' ? d.duration : undefined;
    const formats: VideoFormat[] = [];

    if (d.hdplay) {
      const hdBytes = d.hd_size || estimateBytes(1080, duration);
      formats.push({
        id: 'tt-hd',
        quality: '1080p HD (No Watermark)',
        resolution: '1080p',
        ext: 'mp4',
        type: 'video',
        url: d.hdplay,
        filesize: formatBytes(hdBytes),
        isDirect: true
      });
    }
    if (d.play) {
      const sdBytes = d.size || estimateBytes(720, duration);
      formats.push({
        id: 'tt-sd',
        quality: 'Watermark Free (Original)',
        resolution: '720p',
        ext: 'mp4',
        type: 'video',
        url: d.play,
        filesize: formatBytes(sdBytes),
        isDirect: true
      });
    }
    if (d.music) {
      const musicBytes = d.music_info?.size || estimateAudioBytes(duration, 128);
      formats.push({
        id: 'tt-audio',
        quality: 'Audio Only (MP3)',
        ext: 'mp3',
        type: 'audio',
        url: d.music,
        filesize: formatBytes(musicBytes),
        isDirect: true
      });
    }
    return {
      platform: 'tiktok',
      title: d.title || 'TikTok Video',
      author: d.author?.nickname || d.author?.unique_id || 'TikTok Creator',
      thumbnail: d.cover || d.origin_cover || '',
      duration: d.duration ? `${Math.floor(d.duration / 60)}:${(d.duration % 60).toString().padStart(2, '0')}` : undefined,
      formats
    };
  }
  throw new Error(data?.msg || 'Could not fetch TikTok media');
}

/**
 * Robustly sanitizes raw cookie input (handles Base64, missing tabs, and noise)
 * and writes a verified Netscape format cookie file.
 */
function sanitizeAndWriteCookies(rawInput: string): string | null {
  if (!rawInput || !rawInput.trim()) return null;
  let raw = rawInput.trim();

  // Strip wrapping quotes
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    raw = raw.slice(1, -1).trim();
  }

  // Auto-detect and decode Base64 encoded string
  try {
    const cleaned = raw.replace(/\s+/g, '');
    const decoded = Buffer.from(cleaned, 'base64').toString('utf-8');
    if (decoded.includes('.youtube.com') || decoded.includes('Netscape HTTP Cookie File')) {
      raw = decoded;
    }
  } catch (_) {}

  // Restore escaped newlines (\n -> actual line break)
  if (raw.includes('\\n')) {
    raw = raw.replace(/\\n/g, '\n').replace(/\\r/g, '');
  }

  // Parse and reconstruct standard Netscape cookie format with true tabs
  const rawLines = raw.split(/\r?\n/);
  const validLines: string[] = [
    '# Netscape HTTP Cookie File',
    '# http://curl.haxx.se/rfc/cookie_spec.html',
    '# This is a generated file! Do not edit.',
    ''
  ];

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Filter strictly youtube.com cookies
    if (!trimmed.includes('.youtube.com') && !trimmed.includes('youtube.com')) continue;

    if (trimmed.includes('\t')) {
      validLines.push(trimmed);
    } else {
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 7) {
        const domain = parts[0];
        const flag = parts[1];
        const p = parts[2];
        const secure = parts[3];
        const expiry = parts[4];
        const name = parts[5];
        const value = parts.slice(6).join(' ');
        validLines.push(`${domain}\t${flag}\t${p}\t${secure}\t${expiry}\t${name}\t${value}`);
      }
    }
  }

  const realCookies = validLines.filter(l => !l.startsWith('#') && l.trim());
  if (realCookies.length === 0) {
    return null;
  }

  const reconstructed = validLines.join('\n') + '\n';
  const targetPath = process.platform === 'win32'
    ? path.join(process.cwd(), 'klyph_cookies.txt')
    : '/tmp/klyph_cookies.txt';

  try {
    fs.writeFileSync(targetPath, reconstructed, 'utf-8');
    return targetPath;
  } catch (err) {
    console.error('Failed to write cookies file:', err);
    return null;
  }
}

/**
 * Safely resolves cookies from Render Secret Files, YOUTUBE_COOKIES env, or local workspace
 */
function resolveCookiesPath(): string | null {
  // 1. Check Render Secret Files directory first (/etc/secrets/cookies.txt)
  const renderSecret = '/etc/secrets/cookies.txt';
  if (fs.existsSync(renderSecret)) {
    try {
      const content = fs.readFileSync(renderSecret, 'utf-8');
      const sanitized = sanitizeAndWriteCookies(content);
      if (sanitized) return sanitized;
    } catch (_) {}
  }

  // 2. Check YOUTUBE_COOKIES environment variable
  const envCookies = process.env.YOUTUBE_COOKIES;
  if (envCookies) {
    const sanitized = sanitizeAndWriteCookies(envCookies);
    if (sanitized) return sanitized;
  }

  // 3. Fallback to local cookies.txt in workspace
  const localFile = path.join(process.cwd(), 'cookies.txt');
  if (fs.existsSync(localFile)) {
    try {
      const content = fs.readFileSync(localFile, 'utf-8');
      const sanitized = sanitizeAndWriteCookies(content);
      if (sanitized) return sanitized;
    } catch (_) {}
    return localFile;
  }

  return null;
}

export async function extractMedia(url: string): Promise<VideoMetadata> {
  const platform = detectPlatform(url);

  // TikTok specialized fetcher
  if (platform === 'tiktok') {
    try {
      return await extractTikTok(url);
    } catch (_) {
      // Fallback to yt-dlp below
    }
  }

  try {
    const cleanUrl = url.trim();
    const args = ['-m', 'yt_dlp', '-j', '--no-playlist', '--no-check-certificates', '--geo-bypass'];

    // Platform-specific extractor optimizations
    if (platform === 'youtube') {
      args.push('--js-runtimes', 'node');

      const cookiesPath = resolveCookiesPath();
      if (cookiesPath && fs.existsSync(cookiesPath)) {
        args.push('--cookies', cookiesPath);
      }
    }

    args.push(cleanUrl);

    const pythonCmd = process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');
    const { stdout } = await execFileAsync(pythonCmd, args, {
      maxBuffer: 30 * 1024 * 1024,
      timeout: 35000
    });

    const info = JSON.parse(stdout);
    const rawFormats = info.formats || [];
    const formats: VideoFormat[] = [];
    const seenQualities = new Set<string>();

    // 1. Extract best dedicated audio stream first (excluding m3u8 playlists)
    const audioStreams = rawFormats
      .filter((f: any) => (!f.vcodec || f.vcodec === 'none') && f.acodec && f.acodec !== 'none' && f.url && !(f.protocol || '').includes('m3u8'))
      .sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0));

    const bestAudio = audioStreams.length > 0 ? audioStreams[0] : null;
    const bestAudioUrl = bestAudio ? bestAudio.url : undefined;
    const audioAbr = bestAudio ? (bestAudio.abr || bestAudio.tbr || 128) : 128;
    const rawAudioBytes = bestAudio
      ? (bestAudio.filesize || bestAudio.filesize_approx || (
          info.duration ? Math.round(((audioAbr * 1000) / 8) * info.duration) : 0
        ))
      : (info.duration ? estimateAudioBytes(info.duration, 128) : 0);

    // 2. Extract best video streams (prioritize direct https mp4 streams over m3u8 playlists)
    const videoStreams = rawFormats
      .filter((f: any) => f.vcodec && f.vcodec !== 'none' && f.url)
      .sort((a: any, b: any) => {
        const aM3u8 = (a.protocol || '').includes('m3u8') ? 1 : 0;
        const bM3u8 = (b.protocol || '').includes('m3u8') ? 1 : 0;
        if (aM3u8 !== bM3u8) return aM3u8 - bM3u8;

        const hA = a.height || a.width || 0;
        const hB = b.height || b.width || 0;
        if (hB !== hA) return hB - hA;

        if (a.ext === 'mp4' && b.ext !== 'mp4') return -1;
        if (b.ext === 'mp4' && a.ext !== 'mp4') return 1;

        return (b.tbr || 0) - (a.tbr || 0);
      });

    for (const f of videoStreams) {
      const height = f.height || (f.width && f.width < 1080 ? f.width : 720);
      let label = `${height}p`;
      if (height >= 2160) label = '4K Ultra HD (2160p)';
      else if (height >= 1440) label = '2K Quad HD (1440p)';
      else if (height >= 1080) label = '1080p Full HD';
      else if (height >= 720) label = '720p HD';
      else if (height >= 480) label = '480p Standard';
      else if (height >= 360) label = '360p Mobile';
      else label = `${height}p Video`;

      if (!seenQualities.has(label) && height >= 144) {
        seenQualities.add(label);
        const hasNativeAudio = Boolean(f.acodec && f.acodec !== 'none');
        const rawVideoBytes = f.filesize || f.filesize_approx || (
          (f.tbr || f.vbr) && info.duration
            ? Math.round(((f.tbr || (f.vbr || 0) + (f.abr || 0)) * 1000 / 8) * info.duration)
            : estimateBytes(height, info.duration)
        );

        // If video-only (DASH stream), attach best audio stream for FFmpeg muxing
        const attachedAudioUrl = !hasNativeAudio && bestAudioUrl ? bestAudioUrl : undefined;
        const totalBytes = hasNativeAudio 
          ? rawVideoBytes 
          : (rawVideoBytes ? rawVideoBytes + (rawAudioBytes || 0) : rawVideoBytes);

        formats.push({
          id: f.format_id || `v-${height}`,
          quality: label,
          resolution: `${height}p`,
          ext: f.ext || 'mp4',
          type: 'video',
          url: f.url,
          audioUrl: attachedAudioUrl,
          filesize: formatBytes(totalBytes),
          isDirect: hasNativeAudio
        });
      }
      if (formats.length >= 7) break;
    }

    // 3. Add dedicated Audio Only (MP3) track
    if (bestAudio) {
      formats.push({
        id: bestAudio.format_id || 'best-audio',
        quality: `Audio Only (${bestAudio.abr ? Math.round(bestAudio.abr) + 'kbps' : 'HQ MP3'})`,
        ext: 'mp3',
        type: 'audio',
        url: bestAudio.url,
        filesize: formatBytes(rawAudioBytes),
        isDirect: true
      });
    } else if (formats.length > 0) {
      const primaryStream = formats[0];
      const fallbackAudioBytes = estimateAudioBytes(info.duration, 128);
      formats.push({
        id: 'fallback-audio',
        quality: 'Audio Only (MP3)',
        ext: 'mp3',
        type: 'audio',
        url: primaryStream.url,
        filesize: formatBytes(fallbackAudioBytes) || primaryStream.filesize,
        isDirect: true
      });
    }

    // Fallback if no specific video stream matched
    if (formats.length === 0 && info.url) {
      const defaultBytes = info.filesize || info.filesize_approx || (
        info.tbr && info.duration
          ? Math.round((info.tbr * 1000 / 8) * info.duration)
          : estimateBytes(720, info.duration)
      );
      formats.push({
        id: 'direct-default',
        quality: 'Default Video (Best)',
        ext: info.ext || 'mp4',
        type: 'video',
        url: info.url,
        filesize: formatBytes(defaultBytes),
        isDirect: true
      });
    }

    let durStr: string | undefined = undefined;
    if (info.duration) {
      const mins = Math.floor(info.duration / 60);
      const secs = (info.duration % 60).toString().padStart(2, '0');
      durStr = `${mins}:${secs}`;
    }

    return {
      platform,
      title: info.title || 'Media Video',
      author: info.uploader || info.channel || `${platform.toUpperCase()} Creator`,
      thumbnail: info.thumbnail || '',
      duration: durStr,
      formats
    };
  } catch (err: any) {
    const rawMsg = err.stderr || err.message || '';
    console.error(`[Extractor Error] [Platform: ${platform}] [URL: ${url}]:`, rawMsg);
    if (rawMsg.includes("This video is unavailable")) {
      throw new Error("This video is unavailable or has been removed from YouTube.");
    }
    if (rawMsg.includes("Sign in to confirm you're not a bot")) {
      throw new Error("YouTube requires sign-in verification. Add cookies.txt or YOUTUBE_COOKIES to download YouTube videos.");
    }
    throw new Error(`Could not resolve video: ${rawMsg}`);
  }
}
