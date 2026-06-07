#!/bin/bash
set -e

echo "=== CodeAI Render Build ==="
echo "Node: $(node --version)"
echo "npm: $(npm --version)"

# Install pnpm
npm install -g pnpm@9

# Install dependencies with reduced memory footprint
NODE_OPTIONS="--max-old-space-size=400" pnpm install --no-frozen-lockfile

# Build frontend
echo "=== Building frontend ==="
PORT=3000 BASE_PATH=/ NODE_OPTIONS="--max-old-space-size=400" pnpm --filter @workspace/codeai run build

# Build API server
echo "=== Building API server ==="
NODE_OPTIONS="--max-old-space-size=400" pnpm --filter @workspace/api-server run build

echo "=== Build complete ==="
