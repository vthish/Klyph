import React from 'react';
import { Zap, ShieldCheck, Video, Music, Sparkles, Smartphone } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: <Zap size={22} />,
      title: 'Ultra-Fast CDN Stream',
      desc: 'Streams media directly from edge delivery servers straight to your storage without throttling.'
    },
    {
      icon: <Video size={22} />,
      title: 'Up to 4K & 1080p Full HD',
      desc: 'Download videos with highest bitrates and original frame rates preserved.'
    },
    {
      icon: <Sparkles size={22} />,
      title: 'No Watermarks',
      desc: 'Save clean TikTok videos, Instagram Reels, and YouTube Shorts without intrusive overlay logos.'
    },
    {
      icon: <Music size={22} />,
      title: 'Audio Extractor',
      desc: 'Convert any video into 320kbps MP3 audio for music, speeches, and podcasts.'
    },
    {
      icon: <Smartphone size={22} />,
      title: 'Universal Device Support',
      desc: 'Fully optimized for iOS Safari, Android Chrome, Windows, macOS, and Linux.'
    },
    {
      icon: <ShieldCheck size={22} />,
      title: '100% Secure & Private',
      desc: 'No account required, zero tracking cookies, and completely private downloads.'
    }
  ];

  return (
    <section className="features-section">
      <div className="container">
        <h2 className="section-title">Engineered for Speed & Quality</h2>
        
        <div className="features-grid">
          {features.map((feat, idx) => (
            <div key={idx} className="feature-box">
              <div className="feature-icon-wrap">
                {feat.icon}
              </div>
              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-desc">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}