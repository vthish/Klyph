'use client';

import React, { useState } from 'react';
import { 
  Link2, 
  ArrowRight, 
  Clipboard, 
  X, 
  Loader2, 
  Download, 
  Music, 
  Video, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { VideoMetadata, VideoFormat, detectPlatform, AppError } from '@/lib/types';

export default function Downloader() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [data, setData] = useState<VideoMetadata | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const detectedPlatform = detectPlatform(url);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
      }
    } catch (_) {
      // Clipboard access fallback
    }
  };

  const handleClear = () => {
    setUrl('');
    setError(null);
    setData(null);
  };

  const handleFetch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch('/api/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        const errorData: AppError = json.errorDetails || {
          title: 'Unable to Process Link',
          message: json.error || 'Failed to fetch media details.',
          tip: 'Please ensure the link is a public video and try again.'
        };
        setError(errorData);
        return;
      }

      setData(json.data);
    } catch (err: any) {
      setError({
        title: 'Connection Error',
        message: 'Could not communicate with the downloader service.',
        tip: 'Please check your internet connection and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerDownload = (format: VideoFormat) => {
    setDownloadingId(format.id);
    
    const safeTitle = data?.title ? data.title.slice(0, 40) : 'video';
    const downloadFilename = `Klyph_${data?.platform || 'media'}_${safeTitle}.${format.ext}`;

    let downloadEndpoint = `/api/download?url=${encodeURIComponent(format.url)}&filename=${encodeURIComponent(downloadFilename)}`;
    if (format.audioUrl) {
      downloadEndpoint += `&audioUrl=${encodeURIComponent(format.audioUrl)}`;
    }
    
    const a = document.createElement('a');
    a.href = downloadEndpoint;
    a.setAttribute('download', downloadFilename);
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      setDownloadingId(null);
    }, 2000);
  };

  return (
    <div className="downloader-card">
      <form onSubmit={handleFetch}>
        <div className="input-container">
          <Link2 className="input-icon" size={20} />
          
          <input
            type="url"
            className="url-input"
            placeholder="Paste video link here (YouTube, TikTok, Instagram, Facebook)..."
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
            }}
            required
          />

          <div className="input-actions">
            {url ? (
              <button 
                type="button" 
                className="action-icon-btn" 
                onClick={handleClear}
                title="Clear"
              >
                <X size={16} />
              </button>
            ) : (
              <button 
                type="button" 
                className="action-icon-btn" 
                onClick={handlePaste}
                title="Paste from clipboard"
              >
                <Clipboard size={15} />
                <span>Paste</span>
              </button>
            )}

            <button 
              type="submit" 
              className="fetch-btn desktop-fetch-btn" 
              disabled={loading || !url.trim()}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <span>Download</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dedicated Full-Width Mobile Download Button */}
        <button 
          type="submit" 
          className="fetch-btn mobile-fetch-btn" 
          disabled={loading || !url.trim()}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Fetching Stream...</span>
            </>
          ) : (
            <>
              <span>Download</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      {/* Supported Platform Badges */}
      <div className="platform-badges-bar">
        <div className={`platform-pill youtube ${detectedPlatform === 'youtube' ? 'active' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          <span>YouTube</span>
        </div>
        <div className={`platform-pill tiktok ${detectedPlatform === 'tiktok' ? 'active' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
          </svg>
          <span>TikTok</span>
        </div>
        <div className={`platform-pill instagram ${detectedPlatform === 'instagram' ? 'active' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          <span>Instagram</span>
        </div>
        <div className={`platform-pill facebook ${detectedPlatform === 'facebook' ? 'active' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span>Facebook</span>
        </div>
      </div>

      {/* User-Friendly Error Card */}
      {error && (
        <div className="error-box">
          <AlertCircle className="error-icon" size={22} />
          <div className="error-content">
            <h4 className="error-title">{error.title}</h4>
            <p className="error-message">{error.message}</p>
            {error.tip && (
              <div className="error-tip">
                <HelpCircle size={14} />
                <span>Tip: {error.tip}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video Result View */}
      {data && (
        <div className="result-card">
          <div className="result-header">
            {data.thumbnail && (
              <div className="thumbnail-wrap">
                <img 
                  src={data.thumbnail} 
                  alt={data.title} 
                  className="thumbnail-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
                  }}
                />
                {data.duration && (
                  <span className="duration-badge">{data.duration}</span>
                )}
              </div>
            )}

            <div className="video-info">
              <span className="video-source-tag">
                <CheckCircle2 size={14} color="#00f2fe" />
                <span>{data.platform} Verified</span>
              </span>
              <h3 className="video-title">{data.title}</h3>
              <p className="video-author">Creator: {data.author}</p>
            </div>
          </div>

          {/* Quality Formats Selector */}
          <div className="quality-container">
            <div className="quality-section-title">
              <Video size={16} />
              <span>Select Format & Quality:</span>
            </div>

            <div className="formats-grid">
              {data.formats.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => triggerDownload(fmt)}
                  className="format-btn"
                  disabled={downloadingId === fmt.id}
                >
                  <div className="format-label">
                    <span className="format-quality">
                      {fmt.type === 'audio' ? <Music size={14} /> : <Video size={14} />}
                      {fmt.quality}
                    </span>
                    <span className="format-type">
                      {fmt.ext.toUpperCase()} {fmt.filesize ? `• ${fmt.filesize}` : ''}
                    </span>
                  </div>

                  <div className="format-action-icon">
                    {downloadingId === fmt.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}