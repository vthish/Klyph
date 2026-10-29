# ==========================================
# Klyph Multi-Platform Video/Audio Downloader
# Optimized Dockerfile for Railway & Render
# ==========================================

FROM node:20-slim

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies: Python 3, FFmpeg, Curl, Unzip, CA Certificates, and Deno JS runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python-is-python3 \
    ffmpeg \
    curl \
    unzip \
    ca-certificates \
    && curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh \
    && rm -rf /var/lib/apt/lists/*

# Install latest yt-dlp engine and EJS solver for YouTube challenges
RUN pip3 install --no-cache-dir --break-system-packages yt-dlp yt-dlp-ejs

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Clean production dependencies install
RUN npm ci

# Copy application source code
COPY . .

# Build optimized Next.js production bundle
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Set production environment and expose port (Railway binds via $PORT)
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Start Next.js server
CMD ["npm", "start"]
