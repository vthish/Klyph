import React from 'react';
import { Sparkles } from 'lucide-react';

export default function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-pill">
          <Sparkles size={14} color="#00f2fe" />
          <span>Next-Generation Universal Video Downloader</span>
        </div>
        <h1 className="hero-title">
          Save Any Video in <span className="title-gradient">Full HD & 4K</span>
        </h1>
        <p className="hero-subtitle">
          Paste any link from YouTube, TikTok, Instagram, or Facebook. Choose your preferred quality or extract studio-grade MP3 audio in seconds.
        </p>
      </div>
    </section>
  );
}