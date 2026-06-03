# web — AI Instructions

This is the **Next.js 15 public website and "my" user portal** for the Track Any Device platform.
Docker image: `trackanydevice/server-web`

This app serves two distinct contexts:

1. **Marketing site** — public-facing pages (product info, pricing, device catalogue). Content
   comes from `server-graphql` via Apollo Client. No authentication required.

2. **"My" portal** — authenticated end-user area (`/my/*`). Users manage their own devices,
   orders, beats, and incidents. Authentication via NextAuth SSO. Data comes from the `app/`
   REST API.

Read this file before making any change.

---

## Platform-Wide Rules

These three rules apply in every repository under the `track-any-device` organisation.

**Cross-repo changes: file a GitHub issue first.**
If a task in this repository requires a change in another package or server app — stop. Open a
GitHub issue in the target repository describing exactly what is needed and why. Reference that
issue number in your commit message (`ref track-any-device/{repo}#{n}`). Do not directly edit
files in another repository. When picking up a cross-repo issue, run Claude locally inside that
repository's working directory and work only within its scope.

**Release order: packages before server apps.**
This app depends on `@trackany-device/components` (npm) and the `app/` REST API + `server-graphql`
GraphQL API. Never ship a feature here that depends on an API change before that API change is
deployed. Always confirm API changes are live before deploying this app.

**Database layer lives in `package-core` only.**
This is a frontend app. No database interaction here. API calls go to `app/` or `server-graphql`.

---

## Rule 1 — Plan before implementing

Before writing any code, ask clarifying questions. Present a plan and get explicit agreement.
Only begin once the approach is confirmed.

---

## Authentication ("my" portal)

Authentication uses **NextAuth** configured as an SSO OAuth2 consumer:

```
User visits /my/* (unauthenticated)
  → NextAuth redirects to login.tad.com/oauth/authorize?client_id=MY_CLIENT_ID
  → User authenticates on login.*
  → Passport issues auth code → NextAuth callback at /api/auth/callback/sso
  → NextAuth exchanges code for access token
  → NextAuth stores session (HTTP-only cookie)
  → Server components call app/ REST API with Bearer token from session
```

**OAuth client used:** `OAuthClientKind::My` (env: `MY_CLIENT_ID`, `MY_CLIENT_SECRET`)

---

## Data Sources

| Data type | Source | Auth |
|---|---|---|
| Device types, solutions, public content | `server-graphql` (Apollo) | None (public queries) |
| User's devices, orders, beats, incidents | `app/` REST API (`/api/my/*`) | Bearer token (NextAuth session) |
| Real-time device updates | Soketi (Pusher JS client) | Channel auth via `app/` REST endpoint |

---

## Rule 2 — Public pages must not require authentication

Marketing pages (`/`, `/devices`, `/solutions`, `/pricing`, etc.) must render without a session.
They may use Apollo for GraphQL content queries. Never add `auth` guards to public routes.

---

## Rule 3 — "My" pages must redirect unauthenticated users

All routes under `/my/*` must be protected by NextAuth middleware. Unauthenticated requests
redirect to the SSO provider. Never render "my" page content without a valid session.

---

## Rule 4 — Only use `@trackany-device/components` for UI

Pages and layouts must import components from `@trackany-device/components`.
No raw HTML in page files. No inline Tailwind without a component wrapping it.
If a component is missing, add it to `ui-kit` and file an issue there first.

---

## Rule 5 — `'use client'` only where needed

Use React Server Components for pages that fetch data and don't need browser APIs.
Add `'use client'` only for components that use hooks, event handlers, or browser APIs.
Avoid making entire page routes client components — use the client-boundary pattern.

---

## Rule 6 — `transpilePackages` is required for `@trackany-device/components`

`next.config.ts` must include:
```ts
transpilePackages: ['@trackany-device/components']
```

This is required so Next.js transpiles the raw TypeScript source from the package.
Do not remove this setting.

---

## Rule 7 — Do not alias React in `next.config.ts`

Do not add `react` or `react-dom` to `webpackConfig.resolve.alias`. Next.js manages its own
React alias internally. Overriding it breaks static generation with a null context error.
The `resolve.modules` addition pointing to `web/node_modules` is sufficient.

---

## Directory Structure

```
src/
├── app/                    ← Next.js App Router
│   ├── (marketing)/        ← Public marketing pages
│   │   ├── page.tsx        ← Homepage
│   │   ├── devices/        ← Device catalogue
│   │   └── solutions/      ← Solution pages
│   ├── my/                 ← Authenticated "my" portal
│   │   ├── layout.tsx      ← Auth guard + shell layout
│   │   ├── devices/        ← User's devices
│   │   ├── orders/         ← User's orders
│   │   └── incidents/      ← User's incidents
│   └── api/
│       └── auth/[...nextauth]/  ← NextAuth handler
├── lib/
│   ├── api.ts              ← app/ REST API client (fetch with Bearer token)
│   ├── graphql/            ← Apollo client + queries
│   └── auth.ts             ← NextAuth configuration
```

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXTAUTH_URL` | Public URL of this app (e.g. `https://track-any-device.com`) |
| `NEXTAUTH_SECRET` | NextAuth JWT signing secret |
| `MY_CLIENT_ID` | OAuth2 client ID for the "my" portal |
| `MY_CLIENT_SECRET` | OAuth2 client secret |
| `LOGIN_DOMAIN` | SSO provider base URL (e.g. `https://login.track-any-device.com`) |
| `API_URL` | app/ REST API base URL |
| `GRAPHQL_URL` | server-graphql endpoint |
| `NEXT_PUBLIC_PUSHER_APP_KEY` | Pusher JS client app key |
| `NEXT_PUBLIC_PUSHER_HOST` | Soketi host |
| `NEXT_PUBLIC_PUSHER_PORT` | Soketi port |

---

## Versioning

Docker images are built and pushed on every merge to `main`.
Tag format: `latest` + `v0.1.{commit-count}-{short-sha}`.
