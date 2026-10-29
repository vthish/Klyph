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

export interface AppError {
  title: string;
  message: string;
  tip?: string;
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

export function parseFriendlyError(rawError: string, platform?: string): AppError {
  const text = (rawError || '').toLowerCase();

  if (text.includes('this video is unavailable') || text.includes('video is unavailable') || text.includes('video unavailable') || text.includes('not found') || text.includes('does not exist') || text.includes('deleted') || text.includes('404')) {
    return {
      title: 'Video Not Found or Unavailable',
      message: 'This video is unavailable or has been removed from YouTube by the creator.',
      tip: 'Please ensure the video is public and viewable in an incognito window, then try again.'
    };
  }

  if (text.includes('unavailable') || text.includes('not available') || text.includes('removed') || text.includes('deleted')) {
    return {
      title: 'Video Unavailable',
      message: 'This video is unavailable or has been removed from YouTube.',
      tip: 'The creator may have removed this video, set it to private, or it is restricted in your region.'
    };
  }

  if (text.includes("sign in to confirm you're not a bot") || text.includes('bot protection') || text.includes('sign-in verification')) {
    return {
      title: 'YouTube Bot Verification Required',
      message: 'YouTube is temporarily restricting automated requests for this video to verify human access.',
      tip: 'Please configure valid YouTube cookies in Render settings (Secret Files cookies.txt or YOUTUBE_COOKIES).'
    };
  }

  if (text.includes('private video') || text.includes('this video is private') || text.includes('login required') || text.includes('requires login')) {
    return {
      title: 'Private or Restricted Video',
      message: 'This media is private or restricted to followers only.',
      tip: 'Please make sure the link is from a public profile or public post.'
    };
  }

  if (text.includes('connection was reset') || text.includes('timeout') || text.includes('failed to perform, curl') || text.includes('network error')) {
    return {
      title: 'Connection Issue',
      message: 'Could not establish a stable connection with the media server.',
      tip: 'Please check your internet connection or try again in a few moments.'
    };
  }

  if (text.includes('unsupported url') || text.includes('unsupported platform')) {
    return {
      title: 'Unsupported or Invalid Link',
      message: 'The pasted URL does not match any supported video formats.',
      tip: 'Please paste a direct video or reel link from YouTube, TikTok, Instagram, or Facebook.'
    };
  }

  return {
    title: 'Unable to Process Link',
    message: 'We were unable to extract media streams from this link.',
    tip: 'Ensure the link is a public video and try again.'
  };
}
