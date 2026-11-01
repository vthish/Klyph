[Klyph.webm](https://github.com/user-attachments/assets/80598bc7-783e-4d4d-a28a-e6fb82270a71)
<div align="center">

# ⚡ KLYPH

### Next-Gen Hybrid Multi-Cloud Video & Audio Downloader

**An ultra-fast, modern, ad-free web platform engineered to extract, accelerate, and download high-definition media from YouTube, TikTok, Instagram, and Facebook at full line speed.**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Edge_Worker-F38020?style=for-the-badge&logo=cloudflare)](https://workers.cloudflare.com/)
[![Hugging Face](https://img.shields.io/badge/Hugging_Face-ZeroGPU_Engine-FFD21E?style=for-the-badge&logo=huggingface)](https://huggingface.co/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![Python](https://img.shields.io/badge/Python-yt--dlp-3776AB?style=for-the-badge&logo=python)](https://github.com/yt-dlp/yt-dlp)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

<br />

🔗 **Live Platform:** [https://klyph.auto-ledger.tech](https://klyph.auto-ledger.tech)  
🌐 **Primary Mirror:** [https://klyph.onrender.com](https://klyph.onrender.com)

</div>

---

## 🎬 Live Product Preview

<div align="center">
  <video src="Klyph.webm" width="100%" controls="controls" muted="muted" style="max-height: 520px; border-radius: 12px; box-shadow: 0 8px 30px rgba(0, 242, 254, 0.15);">
    Your browser does not support the video tag.
  </video>
  <p><em>🎥 Full demo walkthrough of Klyph in action. <a href="Klyph.webm">Click here to download or view the video directly</a>.</em></p>
</div>

---

## 💡 Why Klyph?

Traditional online video downloaders are bloated with intrusive pop-up advertisements, malicious redirects, captchas, and forced low-resolution limits. Even worse, single-server downloaders suffer from RAM crashes and throttled 100 KB/s playback streams on high-resolution formats like 1080p and 4K.

**Klyph** was re-architected with a **Hybrid Multi-Cloud Pipeline** to completely eliminate these bottlenecks:
- **Zero Ads & Zero Pop-ups:** Clean, distraction-free glassmorphic interface.
- **⚡ Y2Mate-Style High-Speed Acceleration:** 1080p, 4K, and 8K videos are prepared in seconds using 32 parallel Aria2c threads on Hugging Face ZeroGPU and delivered with exact `Content-Length` at full ISP bandwidth (10–50 MB/s+).
- **🚀 0-RAM Edge Delivery:** Non-muxed formats (360p, MP3, TikTok, IG, FB) stream directly through Cloudflare Edge workers with 0 MB server RAM consumption and under 200ms start time.
- **Accurate Real-Time Sizing:** Calculates and displays exact file sizes in **KB, MB, or GB** for every available resolution before clicking download.
- **High-Speed Resumable Downloads:** Built-in streaming reverse proxy with complete HTTP `Range` header and multi-connection chunking support.

---

## 🔥 Key Features

| Platform | Supported Resolutions & Media Types | Key Capabilities |
| :--- | :--- | :--- |
| **YouTube** | **8K (4320p)**, **4K Ultra HD (2160p)**, **2K Quad HD (1440p)**, **1080p Full HD**, **720p HD**, **480p**, **360p**, **Dedicated MP3 Audio** | Multi-client rotation (`web_embedded` + `tv samsung`), zero watermark, automatic JS challenge solver, and Hugging Face Aria2c acceleration. |
| **TikTok** | **1080p HD (No Watermark)**, **720p HD (Original)**, **Audio Only (MP3)** | Powered by dedicated TikWM integration with zero watermark retention. |
| **Instagram** | **1080p / 720p Reels**, **Video Posts**, **Carousels** | High-speed direct media link resolution via Cloudflare Edge. |
| **Facebook** | **HD 1080p**, **SD Videos** | Handles public posts, reels, and video clips seamlessly. |

### Additional Capabilities
- 📊 **Dynamic File Size Formatting:** Small audio files show in `KB`, standard videos in `MB`, and large 4K streams scale smoothly to `GB` (e.g. `1.25 GB`).
- ⚡ **Multi-Cloud Acceleration Engine:** High-resolution DASH formats utilize remote 16-thread video & audio parallel chunking on Hugging Face, avoiding free-tier 512MB RAM limits.
- 🛡️ **Automated Cookie Sanitizer:** Built-in parser supporting standard Netscape format, Base64 strings, and auto-repair for broken whitespace/tabs.
- 📱 **Cyberpunk Glassmorphism UI:** Mobile-first responsive design featuring deep dark palettes (`#07090e`), glowing neon cyan accents, and real-time status micro-interactions (`⚡ Converting high-speed...`).

---

## 🛠️ Hybrid Multi-Cloud Architecture

```mermaid
flowchart TD
    User["📱 User (Browser / Mobile Phone)"]
    CF["☁️ Cloudflare Edge Worker"]
    Render["▲ Next.js Web Service on Render (klyph.auto-ledger.tech)"]
    FetchAPI["/api/fetch (Metadata Extractor)"]
    AccAPI["/api/accelerate (High-Speed Dispatcher)"]
    HF["🤖 Hugging Face ZeroGPU Engine (Aria2c + FFmpeg)"]
    CDNs["🎥 YouTube / TikTok / Meta CDNs"]

    User -->|1. Paste Link & Fetch| Render
    Render --> FetchAPI
    FetchAPI -->|yt-dlp Extraction| CDNs

    %% Direct Route
    User -.->|2a. Direct Formats: 360p, MP3, TikTok, IG, FB| CF
    CF -.->|Instant 0.2s Stream with 0 MB RAM| CDNs

    %% High-Res Accelerated Route
    User -->|2b. High-Res Formats: 720p, 1080p, 4K, 8K| AccAPI
    AccAPI -->|3. Parallel Download Job| HF
    HF -->|Aria2c 32 Threads & Instant Copy Mux| CDNs
    HF -->|4. Static MP4 with exact Content-Length| AccAPI
    AccAPI -->|5. High-Speed Download URL| User
    User -->|6. Full Line Speed Multi-Connection Download| CF
```

### Technology Breakdown
- **Frontend & App Gateway:** [Next.js 14](https://nextjs.org/) (App Router), React 18, TypeScript, [Lucide React](https://lucide.dev/)
- **Hosting & Web Services:** [Render](https://render.com/) Web Service, Automated Continuous Deployment
- **Edge Acceleration & CDN:** [Cloudflare Workers](https://workers.cloudflare.com/) (Edge routing, custom headers, Range passthrough)
- **High-Performance Muxing Engine:** [Hugging Face Spaces](https://huggingface.co/) (ZeroGPU, 16 GB RAM, Aria2c multi-thread downloader, FFmpeg copy-muxing)
- **Extraction Engine:** [yt-dlp](https://github.com/yt-dlp/yt-dlp), `yt-dlp-ejs`, [TikWM API](https://www.tikwm.com/)
- **Containerization:** Multi-stage Dockerfile based on `node:20-slim` with Node memory hardening

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- **Node.js:** v18.17 or higher
- **Python:** v3.10 or higher
- **FFmpeg:** Installed and added to system PATH

### 1. Clone the Repository
```bash
git clone https://github.com/vthish/Klyph.git
cd Klyph
```

### 2. Install Node Dependencies
```bash
npm install
```

### 3. Install Python Engine Dependencies
```bash
pip install yt-dlp yt-dlp-ejs
```

### 4. (Optional) Configure YouTube Cookies
To bypass YouTube datacenter bot checks in production, you can provide cookies in the project root:
- Place your exported Netscape cookies in a file named `cookies.txt` in the root directory.

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🐳 Docker Deployment

Klyph includes a production-ready, security-hardened `Dockerfile` configured for container platforms such as **Render**, **Railway**, or self-hosted **Docker/Kubernetes**.

### Build Docker Image
```bash
docker build -t klyph-downloader .
```

### Run Container
```bash
docker run -p 3000:3000 --name klyph klyph-downloader
```

The app will be accessible at [http://localhost:3000](http://localhost:3000).

---

## ⚙️ Environment Variables

| Variable | Description | Example / Default | Required |
| :--- | :--- | :--- | :--- |
| `PORT` | The port the Next.js server binds to (default: `3000`). | `3000` | No |
| `NEXT_PUBLIC_CF_WORKER_URL` | Cloudflare Worker Edge Proxy URL for instant downloads and edge caching. | `https://your-worker-subdomain.workers.dev` | Optional |
| `HF_ENGINE_URL` | Hugging Face Space accelerator endpoint for high-speed multi-threaded muxing. | `https://your-space-name.hf.space` | Optional |
| `YOUTUBE_COOKIES` | Raw Netscape cookie content or Base64-encoded cookie file for YouTube extraction. | `-` | Optional (Recommended for Datacenter / Cloud IPs) |
| `/etc/secrets/cookies.txt` | Render Secret Files path (automatically detected and prioritized). | `-` | Optional |

---

## 🌿 Branching & Trunk-Based Release Strategy

Klyph follows a strict, disciplined trunk-based release workflow:
1. `feature/*` or `fix/*`: All development work is performed in isolated feature branches.
2. `dev`: Staging branch where all features and fixes are integrated via pull requests.
3. `main`: Production release branch. Merging into `main` automatically rolls out deployments.

---

## 📄 License & Disclaimer

Distributed under the **MIT License**. See `LICENSE` for more information.

> [!NOTE]
> **Disclaimer:** Klyph is developed strictly for educational, research, and personal backup purposes under fair-use provisions. Please respect content creators' intellectual property rights and the terms of service of each respective platform.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/vthish">Vithish</a></sub>
</div>
