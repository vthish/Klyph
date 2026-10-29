import React from 'react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-links">
          <a href="#" className="footer-link">Terms of Service</a>
          <a href="#" className="footer-link">Privacy Policy</a>
          <a href="https://github.com/vthish/Klyph" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub Repository</a>
          <a href="#" className="footer-link">API Docs</a>
        </div>
        <p>© {new Date().getFullYear()} Klyph Media Downloader. Built with Next.js & Edge Streaming.</p>
        <p style={{ marginTop: '8px', fontSize: '11px', opacity: 0.6 }}>
          Disclaimer: Klyph is designed for personal, fair-use archival and educational purposes. Please respect copyright laws and content creators rights.
        </p>
      </div>
    </footer>
  );
}