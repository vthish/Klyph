import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ArrowLeft, Code2, Terminal, CheckCircle2 } from 'lucide-react';

export default function DocsPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1, padding: '40px 0 60px' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <Link 
            href="/" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              color: 'var(--accent-cyan)', 
              textDecoration: 'none', 
              fontSize: '14px', 
              fontWeight: 600,
              marginBottom: '28px' 
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Downloader</span>
          </Link>

          <div className="downloader-card" style={{ padding: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="feature-icon-wrap" style={{ margin: 0 }}>
                <Code2 size={24} />
              </div>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Klyph Developer API</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  Programmatic access to high-speed multi-platform stream extraction
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '32px' }}>
              {/* Endpoint 1: POST /api/fetch */}
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '6px', 
                    background: 'rgba(16, 185, 129, 0.15)', 
                    color: '#34d399', 
                    fontWeight: 700, 
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)' 
                  }}>POST</span>
                  <code style={{ fontSize: '16px', color: '#fff', fontWeight: 600 }}>/api/fetch</code>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '14px' }}>
                  Extracts video metadata, channel details, available resolutions (4K, 1080p, 720p), and direct CDN streaming URLs.
                </p>

                {/* Request Payload */}
                <h4 style={{ fontSize: '13px', color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Request Body (JSON):
                </h4>
                <div style={{ 
                  background: 'rgba(5, 7, 12, 0.9)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: '10px', 
                  padding: '16px', 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '13px', 
                  color: '#e2e8f0',
                  overflowX: 'auto',
                  marginBottom: '16px'
                }}>
                  {`{\n  "url": "https://www.facebook.com/watch/?v=10153231379946729"\n}`}
                </div>

                {/* Response Schema */}
                <h4 style={{ fontSize: '13px', color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Success Response (200 OK):
                </h4>
                <div style={{ 
                  background: 'rgba(5, 7, 12, 0.9)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: '10px', 
                  padding: '16px', 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '12px', 
                  color: '#34d399',
                  overflowX: 'auto'
                }}>
{`{
  "success": true,
  "data": {
    "platform": "facebook",
    "title": "How to Share With Just Friends",
    "author": "Facebook",
    "thumbnail": "https://video-bom2-3.xx.fbcdn.net/...",
    "duration": "1:14",
    "formats": [
      {
        "id": "v-1080",
        "quality": "1080p Full HD",
        "resolution": "1080p",
        "ext": "mp4",
        "type": "video",
        "url": "https://video-bom2-3.xx.fbcdn.net/...",
        "filesize": "18.4 MB"
      },
      {
        "id": "best-audio",
        "quality": "Audio Only (HQ)",
        "ext": "mp3",
        "type": "audio",
        "url": "https://..."
      }
    ]
  }
}`}
                </div>
              </section>

              {/* Endpoint 2: GET /api/download */}
              <section style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '6px', 
                    background: 'rgba(59, 130, 246, 0.15)', 
                    color: '#60a5fa', 
                    fontWeight: 700, 
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)' 
                  }}>GET</span>
                  <code style={{ fontSize: '16px', color: '#fff', fontWeight: 600 }}>/api/download</code>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '14px' }}>
                  Proxies streams with custom <code>Content-Disposition: attachment; filename=&quot;...&quot;</code> headers for instant browser file downloads.
                </p>

                <h4 style={{ fontSize: '13px', color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Query Parameters:
                </h4>
                <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.8' }}>
                  <li><code>url</code> (required): Target media stream URL extracted from <code>/api/fetch</code>.</li>
                  <li><code>filename</code> (optional): Desired download filename (e.g. <code>Klyph_Media_Clip.mp4</code>).</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}