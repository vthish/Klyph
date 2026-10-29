'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Code2, 
  Terminal, 
  CheckCircle2, 
  Copy, 
  Check, 
  Zap, 
  ShieldCheck, 
  Layers, 
  Download,
  Server
} from 'lucide-react';

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<'curl' | 'js' | 'python'>('curl');
  const [copied, setCopied] = useState(false);

  const curlCode = `curl -X POST https://your-domain.vercel.app/api/fetch \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'`;

  const jsCode = `const response = await fetch('/api/fetch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  })
});
const data = await response.json();
console.log(data);`;

  const pythonCode = `import requests

url = "https://your-domain.vercel.app/api/fetch"
payload = {"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}

response = requests.post(url, json=payload)
data = response.json()
print(data)`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1, padding: '40px 0 70px' }}>
        <div className="container" style={{ maxWidth: '980px' }}>
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

          {/* Hero Banner */}
          <div className="downloader-card" style={{ padding: '36px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, rgba(0,242,254,0.15), rgba(138,43,226,0.15))',
                border: '1px solid rgba(0,242,254,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 25px rgba(0,242,254,0.2)'
              }}>
                <Code2 size={32} color="#00f2fe" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <h1 style={{ fontSize: '30px', fontWeight: 800 }}>Klyph Developer API</h1>
                  <span className="logo-badge" style={{ fontSize: '10px' }}>REST v1.0</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
                  Integrate high-speed, multi-platform media resolution directly into your websites, CLI tools, bots, and mobile apps.
                </p>
              </div>
            </div>

            {/* Feature Pills Bar */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '12px', 
              marginTop: '28px',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Zap size={18} color="#00f2fe" />
                <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 600 }}>Real-Time Stream Extract</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers size={18} color="#4facfe" />
                <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 600 }}>4K, 1080p & MP3 Audio</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={18} color="#10b981" />
                <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 600 }}>No Rate-Limits & Free</span>
              </div>
            </div>
          </div>

          {/* Architecture Flow Card */}
          <div className="downloader-card" style={{ padding: '32px', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={18} color="var(--accent-cyan)" />
              <span>How the API Works (Streaming Architecture)</span>
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
              gap: '16px',
              textAlign: 'center'
            }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '20px', marginBottom: '6px' }}>01</div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>Send Target URL</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>POST video link from YouTube, TikTok, Instagram or Facebook</p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 800, color: '#4facfe', fontSize: '20px', marginBottom: '6px' }}>02</div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>Direct CDN Extraction</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Klyph resolves available bitrates without buffering files on server</p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 800, color: '#34d399', fontSize: '20px', marginBottom: '6px' }}>03</div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>Edge Stream Trigger</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Client device streams media directly from source at maximum speed</p>
              </div>
            </div>
          </div>

          {/* Endpoint 1: POST /api/fetch */}
          <div className="downloader-card" style={{ padding: '36px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ 
                  padding: '5px 12px', 
                  borderRadius: '8px', 
                  background: 'rgba(16, 185, 129, 0.15)', 
                  color: '#34d399', 
                  fontWeight: 800, 
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)' 
                }}>POST</span>
                <code style={{ fontSize: '18px', color: '#fff', fontWeight: 700 }}>/api/fetch</code>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: '6px' }}>
                Content-Type: application/json
              </span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              Resolves platform media URLs, decrypts streaming signatures, and returns direct video resolutions (4K, 1080p, 720p) along with studio MP3 audio streams and thumbnail previews.
            </p>

            {/* Code Selector Tabs */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['curl', 'js', 'python'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: activeTab === tab ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                        background: activeTab === tab ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
                        color: activeTab === tab ? '#00f2fe' : 'var(--text-muted)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {tab.toUpperCase()}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handleCopy(activeTab === 'curl' ? curlCode : activeTab === 'js' ? jsCode : pythonCode)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border-subtle)',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>

              <div style={{ 
                background: '#04060a', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: '10px', 
                padding: '18px', 
                fontFamily: 'var(--font-mono)', 
                fontSize: '13px', 
                color: '#e2e8f0',
                overflowX: 'auto',
                lineHeight: '1.6'
              }}>
                <pre>{activeTab === 'curl' ? curlCode : activeTab === 'js' ? jsCode : pythonCode}</pre>
              </div>
            </div>

            {/* Response Schema */}
            <h4 style={{ fontSize: '13px', color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
              Response Structure (200 OK)
            </h4>
            <div style={{ 
              background: '#04060a', 
              border: '1px solid rgba(16, 185, 129, 0.2)', 
              borderRadius: '10px', 
              padding: '18px', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '12px', 
              color: '#34d399',
              overflowX: 'auto',
              lineHeight: '1.6'
            }}>
<pre>{`{
  "success": true,
  "data": {
    "platform": "youtube",
    "title": "Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)",
    "author": "Rick Astley",
    "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    "duration": "3:33",
    "formats": [
      {
        "id": "v-1080",
        "quality": "1080p Full HD",
        "resolution": "1080p",
        "ext": "mp4",
        "type": "video",
        "url": "https://rr5---sn-cvh7knzk.googlevideo.com/videoplayback?...",
        "filesize": "48.2 MB",
        "isDirect": true
      },
      {
        "id": "best-audio",
        "quality": "Audio Only (320kbps)",
        "ext": "mp3",
        "type": "audio",
        "url": "https://rr5---sn-cvh7knzk.googlevideo.com/videoplayback?...",
        "filesize": "4.8 MB",
        "isDirect": true
      }
    ]
  }
}`}</pre>
            </div>
          </div>

          {/* Endpoint 2: GET /api/download */}
          <div className="downloader-card" style={{ padding: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <span style={{ 
                padding: '5px 12px', 
                borderRadius: '8px', 
                background: 'rgba(59, 130, 246, 0.15)', 
                color: '#60a5fa', 
                fontWeight: 800, 
                fontSize: '13px',
                fontFamily: 'var(--font-mono)' 
              }}>GET</span>
              <code style={{ fontSize: '18px', color: '#fff', fontWeight: 700 }}>/api/download</code>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
              Stream download gateway. Automatically streams media bytes with customized <code>Content-Disposition: attachment; filename=&quot;...&quot;</code> headers, prompting the client browser to immediately save the file into the device Downloads directory.
            </p>

            <h4 style={{ fontSize: '13px', color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
              Parameters
            </h4>
            <div style={{ 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 1fr', padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, fontSize: '12px', color: 'var(--text-sub)' }}>
                <span>FIELD</span>
                <span>TYPE</span>
                <span>DESCRIPTION</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 1fr', padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px' }}>
                <code style={{ color: 'var(--accent-cyan)' }}>url</code>
                <span style={{ color: 'var(--text-muted)' }}>string</span>
                <span style={{ color: 'var(--text-main)' }}>The direct media stream URL returned by <code>/api/fetch</code>.</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 1fr', padding: '12px 16px', fontSize: '13px' }}>
                <code style={{ color: 'var(--accent-cyan)' }}>filename</code>
                <span style={{ color: 'var(--text-muted)' }}>string</span>
                <span style={{ color: 'var(--text-main)' }}>Custom desired filename for the downloaded media (e.g. <code>MyVideo.mp4</code>).</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}