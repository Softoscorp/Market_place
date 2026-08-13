# House Agent — Engineering Standards

Global standards for any AI agent (and human) editing this repo. Follow these before and while making changes.

## Repository Layout

- `frontend/` — Next.js 16 (App Router), React 19, TypeScript (strict). Deployed to Vercel.
- `backend/` — FastAPI + SQLAlchemy. Deployed to Railway (`https://marketplace-production-2905.up.railway.app`).
- `frontend/components/ui/` — shared atoms/molecules (Button, Input, Card, Modal, Badge, ...).
- `frontend/components/<feature>/` — feature-specific organisms/sections.
- `frontend/lib/store/` — Zustand stores.
- `frontend/lib/i18n/translations.ts` — all UI strings. EN and TR keys MUST stay in parity.

## Frontend Conventions

- **TypeScript strict.** Use `unknown` over `any`; narrow with type guards. Type every state, store slice, and API response.
- **Styling: CSS Modules only.** One `X.module.css` next to each component. No Tailwind, no inline styles, no global CSS classes in components. Class names use camelCase. Theme-aware values MUST come from CSS variables, never hardcoded hex.
- **State:** Zustand stores under `frontend/lib/store/`. One store per domain (auth, chat, language). Keep components stateless where possible; read/write through the store.
- **i18n:** Every user-visible string MUST use the `t()` from `useLanguageStore` (or `makeT`), with the key added to BOTH `en` and `tr` in `translations.ts`. Do NOT hardcode English text. Keep EN/TR key parity — add both keys in the same commit.
- **Data access:** backend calls go through `lib/api.ts` / `lib/admin-api.ts`; never call `fetch` ad hoc in components.
- **Supabase:** import and call `getSupabase()` (lazy, browser-only) from `lib/supabaseClient.ts`. NEVER instantiate `createClient` at module scope — it throws at build/prerender time (`supabaseUrl is required`) and breaks the Vercel build. Never use supabase client inside Server Components; gate on the browser.
- **Server vs Client:** Server Components for data-fetching/static pages. Mark interactive pages `'use client'`. `useSearchParams()` MUST be wrapped in a `<Suspense>` boundary on any page using it.
- **Hooks/effects:** place logic in `lib/hooks/` when reusable; keep components thin.

## Backend Conventions

- FastAPI routers in `backend/app/routers/`, schemas in `backend/app/schemas.py`.
- Every mutation validates the caller (auth dependency). Do not trust client-sent IDs without checking ownership/permissions.
- Pydantic schemas define request/response contracts; map model ↔ schema explicitly.
- Run tests with `pytest` in `backend/` before finishing backend work.

## Design System Direction

- Aim for 3-tier design tokens: primitives (raw px/hex) → semantic aliases (roles like `--color-surface`, `--space-4`) → component tokens. Refactor existing modules to consume semantic variables instead of raw values.
- Spacing: 4px grid (4, 8, 12, 16, 20, 24, 32, 40, 48, 64...).
- Typography: geometric scale (base 16px, ratio 1.25) exposed as variables.

## Security Rules (non-negotiable)

- NEVER commit secrets, API keys, or tokens to git. `.env*` stays untracked.
- Only `NEXT_PUBLIC_*` env vars are safe in the client bundle (public identifiers like supabase URL/anon key). All real secrets live server-side (Railway env for backend).
- Supabase tables: ensure RLS is enabled for authenticated users; never ship tables with RLS disabled.
- Server-side keys are proxied through the FastAPI backend — never fetched by the browser directly.
- If editing git history or remote URLs, never print or reuse embedded credentials.

## Verification

- Frontend: `npm run build` (in `frontend/`) must pass; `npm run lint` — zero errors expected (5 legacy `no-img-element` warnings tolerated).
- Backend: `pytest` in `backend/` must pass.
- i18n: after any string change, confirm `en` and `tr` counts match in `translations.ts`.

## Workflow

- Commit only what is asked; never stage design mockups (`.html` files at repo root) or build artifacts (`frontend/out/`, `HouseAgent.apk`).
- Push to `main` after completing a committed task (remote already configured).