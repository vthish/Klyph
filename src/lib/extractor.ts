import { execFile } from 'child_process';
import { promisify } from 'util';
import { VideoFormat, VideoMetadata, detectPlatform } from './types';

export * from './types';

const execFileAsync = promisify(execFile);

/**
 * High-performance extraction using local yt-dlp engine
 */
export async function extractMedia(url: string): Promise<VideoMetadata> {
  const platform = detectPlatform(url);
  if (platform === 'unknown') {
    throw new Error('Unsupported platform. Please enter a valid YouTube, TikTok, Instagram, or Facebook URL.');
  }

  try {
    const { stdout } = await execFileAsync('python', ['-m', 'yt_dlp', '-j', '--no-playlist', url.trim()], {
      maxBuffer: 20 * 1024 * 1024,
      timeout: 25000
    });

    const info = JSON.parse(stdout);
    const rawFormats = info.formats || [];
    const formats: VideoFormat[] = [];
    const seenQualities = new Set<string>();

    // Extract best video streams
    const videoStreams = rawFormats
      .filter((f: any) => f.vcodec !== 'none' && f.url && (f.protocol === 'https' || f.protocol === 'http'))
      .sort((a: any, b: any) => (b.height || 0) - (a.height || 0));

    for (const f of videoStreams) {
      const height = f.height || 0;
      let label = `${height}p`;
      if (height >= 2160) label = '4K Ultra HD (2160p)';
      else if (height >= 1440) label = '2K Quad HD (1440p)';
      else if (height >= 1080) label = '1080p Full HD';
      else if (height >= 720) label = '720p HD';
      else if (height >= 480) label = '480p Standard';
      else if (height >= 360) label = '360p Mobile';
      else label = `${height}p Video`;

      if (!seenQualities.has(label) && height >= 240) {
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

    // Extract best audio stream
    const audioStreams = rawFormats
      .filter((f: any) => f.vcodec === 'none' && f.acodec !== 'none' && f.url && (f.protocol === 'https' || f.protocol === 'http'))
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
    throw new Error(`Could not resolve video stream. Please verify the URL: ${err.message || ''}`);
  }
}