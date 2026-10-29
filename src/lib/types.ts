export interface VideoFormat {
  id: string;
  quality: string;
  resolution?: string;
  ext: string;
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