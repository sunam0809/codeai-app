#!/bin/bash
set -e

echo "=== CodeAI Render Build ==="
echo "Node: $(node --version)"

# Install pnpm globally
npm install -g pnpm@9 --quiet

# Install only production workspace packages with minimal memory
# Skip preinstall check by using pnpm directly
NODE_OPTIONS="--max-old-space-size=384" pnpm install --no-frozen-lockfile --ignore-scripts 2>&1 | tail -20

# Build frontend
echo "=== Building frontend ==="
PORT=3000 BASE_PATH=/ NODE_OPTIONS="--max-old-space-size=384" pnpm --filter @workspace/codeai run build

# Build API server
echo "=== Building API server ==="
NODE_OPTIONS="--max-old-space-size=384" pnpm --filter @workspace/api-server run build

echo "=== Build complete ==="
ls -la artifacts/api-server/dist/
ls -la artifacts/codeai/dist/public/
