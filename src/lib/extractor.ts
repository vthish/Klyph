export interface VideoFormat {
  id: string;
  quality: string;
  resolution?: string;
  ext: 'mp4' | 'mp3';
  type: 'video' | 'audio';
  url: string;
  filesize?: string;
  isDirect?: boolean;
}

export interface VideoMetadata {
  platform: 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'unknown';
  title: string;
  author: string;
  thumbnail: string;
  duration?: string;
  formats: VideoFormat[];
}

export function detectPlatform(url: string): VideoMetadata['platform'] {
  if (!url) return 'unknown';
  const cleanUrl = url.toLowerCase().trim();
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) return 'youtube';
  if (cleanUrl.includes('tiktok.com')) return 'tiktok';
  if (cleanUrl.includes('instagram.com')) return 'instagram';
  if (cleanUrl.includes('facebook.com') || cleanUrl.includes('fb.watch') || cleanUrl.includes('fb.com')) return 'facebook';
  return 'unknown';
}

async function extractTikTok(url: string): Promise<VideoMetadata> {
  const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
  const res = await fetch(apiUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const data = await res.json();
  if (!data || data.code !== 0 || !data.data) {
    throw new Error(data?.msg || 'Could not fetch TikTok media. Please verify the link.');
  }

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

async function extractViaMediaEngine(url: string, platform: VideoMetadata['platform']): Promise<VideoMetadata> {
  const instances = [
    'https://api.cobalt.tools',
    'https://cobalt.api.scpt.tw',
    'https://co.wuk.sh'
  ];

  let lastError: any = null;

  for (const instance of instances) {
    try {
      const response = await fetch(`${instance}/api/json`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        body: JSON.stringify({
          url,
          vQuality: 'max',
          filenamePattern: 'basic',
          isAudioOnly: false
        }),
        signal: AbortSignal.timeout(9000)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url || data.picker) {
          const formats: VideoFormat[] = [];
          
          if (data.url) {
            formats.push({
              id: 'best-video',
              quality: 'Best Available (Up to 1080p)',
              ext: 'mp4',
              type: 'video',
              url: data.url,
              isDirect: true
            });
          }

          if (data.picker && Array.isArray(data.picker)) {
            data.picker.forEach((item: any, idx: number) => {
              formats.push({
                id: `fmt-${idx}`,
                quality: item.quality || item.type || `Stream ${idx + 1}`,
                ext: item.type === 'audio' ? 'mp3' : 'mp4',
                type: item.type === 'audio' ? 'audio' : 'video',
                url: item.url,
                isDirect: true
              });
            });
          }

          return {
            platform,
            title: `${platform.toUpperCase()} Media Stream`,
            author: `${platform.toUpperCase()} Creator`,
            thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
            formats
          };
        }
      }
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  throw lastError || new Error(`Unable to resolve stream from ${platform}. Please check the link.`);
}

export async function extractMedia(url: string): Promise<VideoMetadata> {
  const platform = detectPlatform(url);
  if (platform === 'unknown') {
    throw new Error('Unsupported platform. Please enter a valid YouTube, TikTok, Instagram, or Facebook URL.');
  }

  if (platform === 'tiktok') {
    try {
      return await extractTikTok(url);
    } catch (err) {
      return await extractViaMediaEngine(url, platform);
    }
  }

  return await extractViaMediaEngine(url, platform);
}