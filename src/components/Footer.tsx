import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-links">
          <Link href="/terms" className="footer-link">Terms of Service</Link>
          <Link href="/privacy" className="footer-link">Privacy Policy</Link>
          <a 
            href="https://github.com/vthish/Klyph" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="footer-link"
          >
            GitHub Repository
          </a>
          <Link href="/docs" className="footer-link">API Docs</Link>
        </div>
        <p>© {new Date().getFullYear()} Klyph Media Downloader. Built with Next.js & Edge Streaming.</p>
        <p style={{ marginTop: '8px', fontSize: '11px', opacity: 0.6 }}>
          Disclaimer: Klyph is designed for personal, fair-use archival and educational purposes. Please respect copyright laws and content creators rights.
        </p>
      </div>
    </footer>
  );
}