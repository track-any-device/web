# web — AI Instructions

This is the **Next.js 15 web app** for the TAD-PAK platform (Track Any Device, Pakistan) — the
public website **and** every authenticated portal. Deployed to **Cloudflare Pages** on merge to `main`.

Read this file before making any change.

It serves four contexts, all in one Next.js app:

1. **Marketing site** — public pages (`/`, `/products`, `/business`, `/about`, `/stores`,
   `/contact`, `/status`, …). Content comes from **Sanity**. No authentication.
2. **`/my` — customer portal** — end users manage their own devices/orders/incidents.
3. **`/operations` — internal staff portals** — Support / Procurement / Workshop / Orders.
4. **`/admin` — internal admin** — users, organisations, devices, device-types, incidents.

Portals 2–4 require a session; data comes from the `app/` REST API.

---

## Platform-Wide Rules (every repo in the org)

**Cross-repo changes: file a GitHub issue first.** If a task here needs a change in another repo —
stop, open an issue in that repo, reference it in the commit (`ref track-any-device/{repo}#{n}`).
Don't edit another repo's files from here.

**API before UI.** Never ship a feature here that depends on an `app/` API change before that
change is deployed. Confirm the endpoint is live first.

**No database layer here.** This is a frontend app. All data comes from the `app/` REST API or Sanity.

**This repo owns the public API docs** (`src/app/docs/`). When a web integration changes (new API
call shape, new auth flow), update the matching docs page **in the same PR**.

---

## Authentication — first-party SMS-OTP (Sanctum), no SSO

There is **no NextAuth, no OAuth redirect, no `login.*` provider.** The app is its own identity.

```
User → /login (phone) → POST /api/auth/otp/request   (BFF → app /api/auth/otp/request)
     → enters OTP      → POST /api/auth/otp/verify    → app returns { token, user }
     → web stores an encrypted session in the `tad_session` cookie (lib/auth.ts)
     → server components/handlers call app's REST API with `Authorization: Bearer {token}`
```

- `src/lib/auth.ts` — `getSession()`, `encodeSession`/`decodeSessionValue`, `SESSION_COOKIE = 'tad_session'`, `AUTH_API`.
- `src/middleware.ts` — gates `['/my/:path*', '/operations/:path*', '/admin/:path*']`; no session → redirect `/login`.
- **Role gating is server-side**, inside the portal layouts: `/admin` requires Admin/Core, `/operations`
  requires Admin/Core + operations roles (`src/lib/portal-data.ts` `ADMIN_ROLES`/`OPS_ROLES`), else `redirect('/my')`.

### BFF route handlers
The browser never talks to `app/` directly. Route handlers under `src/app/api/*` proxy to the API
(attaching the session token server-side): `api/auth/{login,otp/request,otp/verify,logout}`,
`api/my/*`, `api/pusher/auth`. Server components may also fetch the API directly server-side (the
Next server IS the BFF) — see `src/lib/api-client.ts` and `src/lib/admin-api.ts` (`fetchPortal`).

---

## Data sources

| Data | Source | How |
|---|---|---|
| Marketing content, device catalogue | **Sanity** | `src/lib/sanity.ts`, `catalog.ts`, `products.ts` |
| `/my` device/order/incident data | `app/` REST `/api/my/*` | server fetch w/ session token (`api-client.ts`) |
| `/admin` + `/operations` data | `app/` REST `/api/admin/*`, `/api/ops/*` (role-gated) | `admin-api.ts` `fetchPortal(path, fallback)` |
| Real-time device updates | Soketi (Pusher JS) | channel auth via `api/pusher/auth` |

---

## UI — in-house TAD-PAK design system

Build UI from the in-house component sets, **not** a third-party kit:
- `src/components/ui/` — primitives (Button, Input, Badge, Card, …).
- `src/components/tad/` — TAD-PAK compositions (SiteShell, marketing, PortalShell, DataTable, Hero, …).

Tokens/fonts/brand follow the **`track-any-device-ui-guidelines`** skill (Pakistan green `#01411C`,
Plus Jakarta Sans + DM Mono, warm sand neutrals, rounded everything, gentle motion). TAD-PAK styles
are scoped under the `.tad` class (`src/styles/tad.css`); Tailwind v4 via `@tailwindcss/postcss`.

The legacy `@trackany-device/components` (ui-kit) dependency has been **fully removed** — build only
on `@/components/{ui,tad}`. Device map-marker helpers live in `src/lib/map-markers.ts`.

`'use client'` only where a component uses hooks / event handlers / browser APIs; keep pages and
data-fetching layouts as Server Components.

---

## Directory structure

```
src/
├── app/
│   ├── page.tsx, (marketing routes: products, business, about, stores, contact, status, …)
│   ├── login/                ← SMS-OTP login UI
│   ├── my/                   ← customer portal (session-gated)
│   ├── operations/           ← Support / Procurement / Workshop / Orders (layout role-gates)
│   ├── admin/                ← Dashboard + Users / Organisations / Devices / Device-types / Incidents
│   ├── docs/                 ← public API documentation (this repo owns it)
│   └── api/                  ← BFF route handlers (auth, my, pusher)
├── components/{ui,tad,docs}/ ← in-house design system
├── lib/                      ← auth.ts, api-client.ts, admin-api.ts, sanity.ts, catalog.ts, portal-data.ts
└── styles/tad.css            ← TAD-PAK tokens/components (.tad scope)

studio/                       ← Sanity Studio (co-located, versioned with the frontend)
```

---

## Sanity Studio (`web/studio/`)

The Studio lives in this repo so its **schema** and the frontend that **consumes** it stay in sync.
It is its **own** project (own `package.json`/lockfile) — **not** part of the Next build (excluded in
`tsconfig.json`; `studio/{node_modules,dist,.sanity}` are gitignored). Editing a schema here and the
matching GROQ query in `src/lib/` happens in one PR.

Deploy is separate from the web deploy (it publishes to **tad-pak.sanity.studio**, not Cloudflare):
```
cd studio
SANITY_AUTH_TOKEN=$SANITY_DEPLOY_TOKEN ./node_modules/.bin/sanity deploy   # direct binary, not `pnpm exec`
```
(`SANITY_DEPLOY_TOKEN` is in the untracked `.env.sanity`. The direct binary avoids pnpm 11's
pre-run deps check, which exits 1 on the blocked esbuild build script.)

---

## Environment variables

| Variable | Purpose |
|---|---|
| `API_URL` / `NEXT_PUBLIC_API_URL` | `app/` REST API base URL |
| `SESSION_SECRET` | key for encrypting the `tad_session` cookie |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` / `_DATASET` | Sanity content source |
| `NEXT_PUBLIC_PUSHER_*` | Soketi/Pusher JS client (key, host, port) |

---

## Versioning / deploy

Cloudflare Pages builds and deploys on merge to `main` (`.github/workflows/deploy.yml`).
