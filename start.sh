#!/usr/bin/env bash
set -e
echo "⚡ Starting PocketVerse Tech-Noir Command Center..."

# Resolve script directory so this works from any cwd
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Install deps if missing
[ ! -d "backend/node_modules" ] && echo "📦 Installing backend deps..." && npm --prefix backend install
[ ! -d "frontend/node_modules" ] && echo "📦 Installing frontend deps..." && npm --prefix frontend install

# Ensure backend is built
echo "🔨 Building backend..."
npm --prefix backend run build

# Run backend API server and frontend Vite dev server concurrently
echo "🚀 Launching servers..."
npx concurrently --kill-others --names "BACKEND,FRONTEND" --prefix-colors "cyan,magenta" \
  "node backend/dist/server.js" \
  "npm --prefix frontend run dev -- --host 0.0.0.0 --port 3000"
