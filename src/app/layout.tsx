import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#07090e',
};

export const metadata: Metadata = {
  title: 'Klyph - Next-Gen Video Downloader (YouTube, TikTok, Instagram, FB)',
  description: 'Download HD & 4K videos and 320kbps MP3 audio from YouTube, TikTok (No Watermark), Instagram Reels, and Facebook with blazing speed.',
  keywords: ['video downloader', 'youtube downloader', 'tiktok no watermark', 'instagram reels downloader', 'facebook video download', 'klyph'],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
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