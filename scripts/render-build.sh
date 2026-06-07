#!/bin/bash
set -e

echo "=== CodeAI Render Build ==="
echo "Node: $(node --version)"
echo "npm: $(npm --version)"

# Install pnpm
npm install -g pnpm@9

# Install all dependencies (no --ignore-scripts to ensure pino workers build correctly)
NODE_OPTIONS="--max-old-space-size=460" pnpm install --no-frozen-lockfile

# Build frontend with reduced memory
echo "=== Building frontend ==="
PORT=3000 BASE_PATH=/ NODE_OPTIONS="--max-old-space-size=460" pnpm --filter @workspace/codeai run build

# Build API server
echo "=== Building API server ==="
NODE_OPTIONS="--max-old-space-size=460" pnpm --filter @workspace/api-server run build

echo "=== Build complete ==="
ls -la artifacts/api-server/dist/ | grep -v map
ls -la artifacts/codeai/dist/public/
