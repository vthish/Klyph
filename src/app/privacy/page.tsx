import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ShieldCheck, 
  EyeOff, 
  HardDrive, 
  Lock, 
  CheckCircle2, 
  ServerOff,
  UserX
} from 'lucide-react';

export default function PrivacyPage() {
  const pillars = [
    {
      icon: <UserX size={22} color="#00f2fe" />,
      title: 'No User Registration',
      desc: 'You never have to create an account, log in with an email, or provide personal identity details to use Klyph.'
    },
    {
      icon: <ServerOff size={22} color="#4facfe" />,
      title: 'Zero Search Logs',
      desc: 'We do not log, track, or maintain archives of the URLs you paste, search for, or download.'
    },
    {
      icon: <HardDrive size={22} color="#8a2be2" />,
      title: 'Direct Client Storage',
      desc: 'Media streams pass straight from the content provider CDN to your device. We store zero video files on our servers.'
    },
    {
      icon: <EyeOff size={22} color="#10b981" />,
      title: 'No Ad Trackers or Telemetry',
      desc: 'Klyph is completely free of third-party advertising trackers, profiling cookies, or behavioral telemetry.'
    }
  ];

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1, padding: '40px 0 70px' }}>
        <div className="container" style={{ maxWidth: '920px' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(0,242,254,0.15))',
                border: '1px solid rgba(16,185,129,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 25px rgba(16,185,129,0.2)'
              }}>
                <ShieldCheck size={32} color="#34d399" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <h1 style={{ fontSize: '30px', fontWeight: 800 }}>Privacy Policy</h1>
                  <span style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    background: 'rgba(16,185,129,0.1)',
                    color: '#34d399',
                    border: '1px solid rgba(16,185,129,0.3)',
                    fontWeight: 700
                  }}>
                    PRIVACY-FIRST GUARANTEE
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
                  At Klyph, your digital privacy is built into our core software architecture, not an afterthought.
                </p>
              </div>
            </div>
          </div>

          {/* 4 Pillars Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
            gap: '18px', 
            marginBottom: '32px' 
          }}>
            {pillars.map((p, idx) => (
              <div key={idx} className="feature-box" style={{ padding: '24px' }}>
                <div className="feature-icon-wrap" style={{ marginBottom: '14px' }}>
                  {p.icon}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>{p.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Data Handling Transparency Table */}
          <div className="downloader-card" style={{ padding: '36px', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Data Transparency Matrix
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
              Summary of data types and our handling commitments:
            </p>

            <div style={{ 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1.5fr 1fr 1.5fr', 
                padding: '12px 18px', 
                borderBottom: '1px solid var(--border-subtle)', 
                fontWeight: 700, 
                fontSize: '12px', 
                color: 'var(--text-sub)' 
              }}>
                <span>DATA TYPE</span>
                <span>COLLECTED?</span>
                <span>RETENTION PERIOD</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr', padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px' }}>
                <span style={{ fontWeight: 600 }}>Personal Identity (Name, Email)</span>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>None (0%)</span>
                <span style={{ color: 'var(--text-muted)' }}>Never collected or stored</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr', padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px' }}>
                <span style={{ fontWeight: 600 }}>Pasted Video Links</span>
                <span style={{ color: 'var(--accent-cyan)' }}>Processed in RAM</span>
                <span style={{ color: 'var(--text-muted)' }}>Discarded immediately after resolution</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr', padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px' }}>
                <span style={{ fontWeight: 600 }}>Downloaded Video / Audio Files</span>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>Never on server</span>
                <span style={{ color: 'var(--text-muted)' }}>Saved directly to your local device</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr', padding: '14px 18px', fontSize: '13px' }}>
                <span style={{ fontWeight: 600 }}>Tracking Cookies &amp; Fingerprints</span>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>None</span>
                <span style={{ color: 'var(--text-muted)' }}>Zero cross-site tracking</span>
              </div>
            </div>
          </div>

          {/* Legal Compliance & Contact */}
          <div className="downloader-card" style={{ padding: '36px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '14px' }}>
              GDPR &amp; CCPA Compliance
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.7', marginBottom: '20px' }}>
              Because Klyph processes zero personal data, maintains no user databases, and collects no profiling identifiers, your rights under the General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA) are fully respected by default. No personal data exists to be requested, altered, or deleted.
            </p>

            <div style={{ 
              background: 'rgba(0,242,254,0.05)', 
              border: '1px solid rgba(0,242,254,0.2)', 
              borderRadius: '10px', 
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <CheckCircle2 size={20} color="#00f2fe" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: '#e2e8f0' }}>
                For open-source security audits or privacy inquiries, inspect our source code publicly on{' '}
                <a 
                  href="https://github.com/vthish/Klyph" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}
                >
                  GitHub
                </a>.
              </span>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}