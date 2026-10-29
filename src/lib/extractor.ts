import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { VideoFormat, VideoMetadata, detectPlatform } from './types';

export * from './types';

const execFileAsync = promisify(execFile);

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
    const formats: VideoFormat[] = [];
    if (d.hdplay) {
      formats.push({
        id: 'tt-hd',
        quality: '1080p HD (No Watermark)',
        resolution: '1080p',
        ext: 'mp4',
        type: 'video',
        url: d.hdplay,
        filesize: d.hd_size ? `${(d.hd_size / (1024 * 1024)).toFixed(1)} MB` : undefined,
        isDirect: true
      });
    }
    if (d.play) {
      formats.push({
        id: 'tt-sd',
        quality: 'Watermark Free (Original)',
        resolution: '720p',
        ext: 'mp4',
        type: 'video',
        url: d.play,
        filesize: d.size ? `${(d.size / (1024 * 1024)).toFixed(1)} MB` : undefined,
        isDirect: true
      });
    }
    if (d.music) {
      formats.push({
        id: 'tt-audio',
        quality: 'Audio Only (MP3)',
        ext: 'mp3',
        type: 'audio',
        url: d.music,
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
 * Universal media extractor
 */
export async function extractMedia(url: string): Promise<VideoMetadata> {
  const platform = detectPlatform(url);
  if (platform === 'unknown') {
    throw new Error('Unsupported platform. Please enter a valid YouTube, TikTok, Instagram, or Facebook URL.');
  }

  // Handle TikTok directly via cloud engine
  if (platform === 'tiktok') {
    try {
      return await extractTikTok(url);
    } catch (_) {
      // Fallback to yt-dlp below
    }
  }

  try {
    const cleanUrl = url.trim();
    const args = ['-m', 'yt_dlp', '-j', '--no-playlist'];

    // Provide Node.js runtime for YouTube JavaScript n-challenge solving
    const nodePath = 'C:\\Program Files\\nodejs\\node.exe';
    if (fs.existsSync(nodePath)) {
      args.push('--js-runtimes', `node:${nodePath}`);
    } else {
      args.push('--js-runtimes', 'node');
    }

    // Auto-detect or restore cookies.txt from environment variable (for Railway / Cloud hosting)
    const cookiesPath = path.join(process.cwd(), 'cookies.txt');
    if (process.env.YOUTUBE_COOKIES && !fs.existsSync(cookiesPath)) {
      try {
        fs.writeFileSync(cookiesPath, process.env.YOUTUBE_COOKIES, 'utf-8');
      } catch (_) {}
    }
    if (fs.existsSync(cookiesPath)) {
      args.push('--cookies', cookiesPath);
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

    // Extract best video streams (including progressive, DASH, and m3u8_native for Shorts)
    const videoStreams = rawFormats
      .filter((f: any) => f.vcodec && f.vcodec !== 'none' && f.url)
      .sort((a: any, b: any) => (b.height || b.width || 0) - (a.height || a.width || 0));

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

      if (!seenQualities.has(label) && height >= 180) {
        seenQualities.add(label);
        const bytes = f.filesize || f.filesize_approx;
        formats.push({
          id: f.format_id || `v-${height}`,
          quality: label,
          resolution: `${height}p`,
          ext: f.ext || 'mp4',
          type: 'video',
          url: f.url,
          filesize: bytes ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : undefined,
          isDirect: true
        });
      }
      if (formats.length >= 4) break;
    }

    // Extract audio stream
    const audioStreams = rawFormats
      .filter((f: any) => (!f.vcodec || f.vcodec === 'none') && f.acodec && f.acodec !== 'none' && f.url)
      .sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0));

    if (audioStreams.length > 0) {
      const bestAudio = audioStreams[0];
      const audioBytes = bestAudio.filesize || bestAudio.filesize_approx;
      formats.push({
        id: bestAudio.format_id || 'best-audio',
        quality: `Audio Only (${bestAudio.abr ? Math.round(bestAudio.abr) + 'kbps' : 'HQ'})`,
        ext: 'mp3',
        type: 'audio',
        url: bestAudio.url,
        filesize: audioBytes ? `${(audioBytes / (1024 * 1024)).toFixed(1)} MB` : undefined,
        isDirect: true
      });
    }

    // Fallback if no specific video stream matched
    if (formats.length === 0 && info.url) {
      formats.push({
        id: 'direct-default',
        quality: 'Default Video (Best)',
        ext: info.ext || 'mp4',
        type: 'video',
        url: info.url,
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
    const rawMsg = err.message || '';
    if (rawMsg.includes("Sign in to confirm you're not a bot")) {
      throw new Error("YouTube requires sign-in verification. Add cookies.txt to project root to download YouTube videos.");
    }
    throw new Error(`Could not resolve video: ${rawMsg}`);
  }
}