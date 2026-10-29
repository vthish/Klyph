import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1, padding: '40px 0 60px' }}>
        <div className="container" style={{ maxWidth: '850px' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div className="feature-icon-wrap" style={{ margin: 0 }}>
                <Lock size={24} />
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Privacy Policy</h1>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '28px' }}>
              Effective Date: October 2026
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: 'var(--text-main)', fontSize: '15px', lineHeight: '1.7' }}>
              <section>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                  1. Zero Logs &amp; Anonymous Access
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>
                  We believe in fundamental privacy. Klyph does not require registration, login credentials, or personal email addresses. We do not maintain databases of user search histories, IP addresses, or downloaded files.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                  2. Direct Edge Streaming
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>
                  When you download a video, the stream is delivered straight from the respective content delivery network (CDN) directly to your local device. We do not store, duplicate, or re-encode your downloaded media on intermediary servers.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                  3. Cookies &amp; Tracking
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>
                  Klyph does not set commercial tracking cookies, analytics pixels, or sell telemetry data to third parties. Your browsing and downloading activity remains private to your device.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}