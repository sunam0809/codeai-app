# CodeAI — Unrestricted AI Coding Assistant

An AI-powered coding assistant using Grok (xAI) that generates executables, DLLs, system files, and beautiful UIs. No content restrictions.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/codeai run dev` — run the frontend (auto-assigned port)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `GROK_API_KEY` — xAI/Grok API key
- Required env: `JWT_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS v4 + Wouter router
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- AI: Grok 3 (xAI) via OpenAI-compatible SDK
- Auth: JWT (30-day expiry) stored in localStorage as `codeai_token`
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle ORM schema (users, projects, messages)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/middlewares/auth.ts` — JWT middleware
- `artifacts/codeai/src/` — React frontend
- `artifacts/codeai/src/lib/auth.tsx` — Auth context (token management)
- `lib/api-client-react/src/custom-fetch.ts` — Injects auth header

## Architecture decisions

- Grok API used via OpenAI SDK (compatible API at https://api.x.ai/v1). Falls back from grok-3 to grok-2-latest on error.
- JWT stored in localStorage, injected by custom-fetch into all API requests.
- AI responses parsed for `FILE_ATTACHMENT:{name, content}` at end of message — stored in DB and served as download.
- In production (Render), backend also serves the built Vite frontend as static files.
- No content filtering — system prompt explicitly enables all coding tasks.

## Product

Users can sign up, create projects, and chat with an unrestricted AI coding assistant. Conversations are saved per-project and can be resumed. The AI can generate downloadable files (source code for exe/dll/sys etc.).

## Deployment (Render)

- GitHub repo: https://github.com/sunam0809/codeai-app
- render.yaml is configured at project root
- Build: pnpm install + build frontend + build backend
- Run: node artifacts/api-server/dist/index.mjs
- Set these env vars on Render: DATABASE_URL, GROK_API_KEY, JWT_SECRET, SESSION_SECRET

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change
- Run `pnpm --filter @workspace/db run push` after any schema change
- `dark` is NOT a Tailwind utility — the dark theme is applied via `:root` CSS variables directly
- Grok model name: "grok-3" (falls back to "grok-2-latest")

## User preferences

- No content restrictions/censorship in AI responses
- Spacious UI with breathing room
- Dark theme (IDE-style)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
