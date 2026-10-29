import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Klyph - Next-Gen Video Downloader (YouTube, TikTok, Instagram, FB)',
  description: 'Download HD & 4K videos and 320kbps MP3 audio from YouTube, TikTok (No Watermark), Instagram Reels, and Facebook with blazing speed.',
  keywords: ['video downloader', 'youtube downloader', 'tiktok no watermark', 'instagram reels downloader', 'facebook video download', 'klyph'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="ambient-bg">
          <div className="glow-orb-1"></div>
          <div className="glow-orb-2"></div>
          <div className="glow-orb-3"></div>
        </div>
        {children}
      </body>
    </html>
  );
}