import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function TermsPage() {
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
                <Shield size={24} />
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Terms of Service</h1>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '28px' }}>
              Last updated: October 2026
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: 'var(--text-main)', fontSize: '15px', lineHeight: '1.7' }}>
              <section>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                  1. Purpose & Educational Use
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>
                  Klyph is an open-source research and educational software project created for personal media archival and offline accessibility evaluation. By using this service, you agree to comply with all applicable local, national, and international laws.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                  2. Intellectual Property & Fair Use
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>
                  Klyph does not host, store, or own any video content. All trademarks, logos, audio tracks, and video streams belong to their respective copyright holders (Google LLC, Meta Platforms Inc., ByteDance Ltd., etc.). Users are strictly responsible for ensuring that their downloads fall under fair use or that they hold the necessary permissions from the original content owners.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                  3. Disclaimer of Warranties
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>
                  This application is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind, whether express or implied. The developers shall not be liable for any damages or account restrictions resulting from the use or misuse of this tool.
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