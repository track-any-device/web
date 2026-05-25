# @trackany-device/components — Next.js (App Router) integration

Use this skill when adding, modifying, or troubleshooting the use of `@trackany-device/components` in a Next.js App Router project.

---

## 1. Install

```bash
npm install @trackany-device/components
# peer deps (only the ones you actually use)
npm install lucide-react tailwindcss
```

The package ships source CSS — no build step needed for styles.

---

## 2. Tailwind CSS setup

In your global CSS file (e.g. `app/globals.css`):

```css
@import "tailwindcss";

/* Component library base styles & design tokens */
@import "@trackany-device/components/styles/themes.css";

/* Optional: KeenIcons font (only if you use <KeenIcon>) */
@import "@trackany-device/components/styles/keenicons.css";
```

Apply a theme and optional dark mode via `data-theme` on `<html>` in `app/layout.tsx`:

```tsx
// app/layout.tsx (Server Component)
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" data-theme="blue">
            <body>{children}</body>
        </html>
    );
}
```

Add `.dark` to `<html>` for dark mode: `<html data-theme="blue" class="dark">`.

Available themes: `blue` (default) · `green` · `purple` · `red` · `orange` · `rose` · `sky` · `teal` · `cyan` · `indigo` · `violet` · `emerald` · `lime` · `yellow` · `amber` · `pink` · `fuchsia` · `neutral` · `slate` · `gray`

---

## 3. Wire up the Next.js adapter

Because the adapter uses client hooks (`useRouter`, `usePathname`), create a dedicated **Client Component** wrapper and call it from the server root layout.

```tsx
// app/providers.tsx  ← new file, mark as client
'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { PlatformProvider, createNextjsAdapter } from '@trackany-device/components';

interface ProvidersProps {
    children: React.ReactNode;
    /** Shared server data (auth, nav_links, …) passed down from the root layout */
    pageProps?: Record<string, unknown>;
}

export function Providers({ children, pageProps = {} }: ProvidersProps) {
    const adapter = createNextjsAdapter({ Link, useRouter, usePathname, pageProps });
    return <PlatformProvider adapter={adapter}>{children}</PlatformProvider>;
}
```

```tsx
// app/layout.tsx (Server Component)
import './globals.css';
import { Providers } from './providers';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    // Fetch shared data server-side and pass as pageProps
    const auth = await getAuthUser(); // your own helper

    return (
        <html lang="en" data-theme="blue">
            <body>
                <Providers pageProps={{ auth }}>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
```

`createNextjsAdapter` accepts:

| Prop | Type | Purpose |
|------|------|---------|
| `Link` | `next/link` | SPA navigation links |
| `useRouter` | `next/navigation` hook | Programmatic navigation |
| `usePathname` | `next/navigation` hook | Current pathname (active nav highlighting) |
| `pageProps` | `Record<string, unknown>` | Shared server data (auth, nav config, etc.) |

> **Important:** `pageProps` is frozen at adapter creation time. For data that changes between navigations, re-render `Providers` from the server (it re-creates the adapter with fresh props on each page load).

> **Document `<head>`:** Next.js manages `<head>` via the `metadata` export on Server Components. The `PlatformHead` from this library is a no-op in the Next.js adapter — use Next.js's own `metadata` API instead.

---

## 4. Choose a layout

Wrap your page in any layout component. Because layouts use the platform hooks, they must run in a Client Component context — either mark the page `'use client'` or wrap the layout in a client shell.

```tsx
// app/dashboard/page.tsx
'use client';

import { NavbarSidebarLayout, usePlatformPageProps, usePlatformUrl } from '@trackany-device/components';

interface PageProps {
    auth: { user: { name: string; email: string; avatar_url: string | null } };
}

export default function DashboardPage() {
    const { auth } = usePlatformPageProps<PageProps>();

    return (
        <NavbarSidebarLayout
            logo={<img src="/logo.svg" className="h-8" />}
            appName="My App"
            logoHref="/dashboard"
            currentUrl={usePlatformUrl()}
            user={{
                name: auth.user.name,
                email: auth.user.email,
                avatar: auth.user.avatar_url,
            }}
            navItems={[
                { title: 'Dashboard', href: '/dashboard' },
                {
                    title: 'Settings',
                    items: [
                        { title: 'Profile', href: '/profile' },
                        { title: 'Team', href: '/team' },
                    ],
                },
            ]}
            title="Dashboard"
            breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]}
            logoutUrl="/logout"
            settingsUrl="/profile"
        >
            {/* page content */}
        </NavbarSidebarLayout>
    );
}
```

### Available layouts

| Component | Description |
|-----------|-------------|
| `SidebarFixedLayout` | Fixed sidebar + fixed header. Most common. |
| `NavbarSidebarLayout` | Horizontal navbar + collapsible sidebar |
| `NavbarCollapsibleLayout` | Horizontal navbar + optional sidebar |
| `TopNavLayout` | Sticky top nav only, no sidebar |
| `MegaMenuLayout` | Full-width header with integrated mega menu |
| `MegaMenuNavbarLayout` | Mega menu header + secondary navbar |
| `WorkspaceSidebarLayout` | Workspace strip + sidebar (Slack-style) |
| `SidebarDualMenuLayout` | Icon strip + full sidebar |
| `SplitSidebarLayout` | Primary icon strip + secondary nav panel |
| `SidebarTabsLayout` | Tabbed sidebar with section switcher |
| `SidebarMinimalLayout` | Single clean sidebar |

All layouts are **mobile-responsive**: sidebar collapses to an overlay drawer on small screens.

---

## 5. Platform hooks in client components

Inside any component rendered under `<PlatformProvider>`, use these hooks:

```tsx
'use client';

import {
    usePlatformUrl,       // current pathname
    usePlatformPageProps, // shared pageProps passed to createNextjsAdapter
    usePlatformNavigate,  // programmatic navigation (wraps useRouter)
    usePlatformForm,      // fetch-based form hook (same API as Inertia useForm)
    PlatformLink,         // <Link> that uses the adapter
} from '@trackany-device/components';

// Current pathname (used for active nav highlighting)
const url = usePlatformUrl();

// Shared props from pageProps (auth, nav_links, etc.)
const { auth } = usePlatformPageProps<{ auth: { user: User } }>();

// Programmatic navigation
const navigate = usePlatformNavigate();
navigate('/dashboard', { replace: true });

// Fetch-based form (not tied to Next.js server actions)
const form = usePlatformForm({ email: '', password: '' });
form.post('/api/login', {
    onError: (errors) => console.error(errors),
});
```

> `usePlatformPageProps` reads from the `pageProps` object you passed to `createNextjsAdapter` — **not** from any server context at call time. Keep server-fetched shared data in `pageProps`.

---

## 6. Common components

```tsx
import {
    // Feedback
    AlertError,   // <AlertError message="Something went wrong" />
    InputError,   // field-level error below inputs

    // Navigation
    Breadcrumbs,  // <Breadcrumbs items={[{ title, href }]} />
    PlatformLink, // SPA-aware <a> — uses next/link under the hood

    // Icons
    KeenIcon,     // <KeenIcon icon="home" style="duotone" />

    // Layout primitives (if building custom layouts)
    AppShell, AppHeader, AppSidebar, AppContent,
} from '@trackany-device/components';
```

---

## 7. TypeScript: shared page props

Define your props once and reuse everywhere:

```ts
// types/page-props.ts
export interface Auth {
    user: {
        id: number;
        name: string;
        email: string;
        avatar_url: string | null;
    };
}

export interface SharedPageProps {
    auth: Auth;
    flash?: { success?: string; error?: string };
}
```

Pass on the server:

```tsx
// app/layout.tsx
const auth = await getAuthUser();
<Providers pageProps={{ auth } satisfies SharedPageProps}>
```

Consume on the client:

```tsx
const { auth } = usePlatformPageProps<SharedPageProps>();
```

---

## 8. Shared layout with Next.js nested layouts

Instead of per-page `'use client'` wrappers, define the layout once in a route group:

```
app/
  (dashboard)/
    layout.tsx   ← client layout with NavbarSidebarLayout
    page.tsx     ← plain server component
    settings/
      page.tsx
```

```tsx
// app/(dashboard)/layout.tsx
'use client';

import { NavbarSidebarLayout, usePlatformPageProps, usePlatformUrl } from '@trackany-device/components';
import type { SharedPageProps } from '@/types/page-props';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { auth } = usePlatformPageProps<SharedPageProps>();

    return (
        <NavbarSidebarLayout
            currentUrl={usePlatformUrl()}
            user={{ name: auth.user.name, email: auth.user.email, avatar: auth.user.avatar_url }}
            navItems={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Settings', href: '/settings' },
            ]}
            title="App"
            logoutUrl="/api/logout"
            settingsUrl="/settings"
        >
            {children}
        </NavbarSidebarLayout>
    );
}
```

Pages inside `(dashboard)/` are plain Server Components — no `'use client'` needed.

---

## 9. Website section components

The library ships a full set of marketing/website section components with a `SectionRenderer` that maps database records to React components. Use these for landing pages, marketing sites, and CMS-driven pages.

### 9.1 Available sections and variants

| Component | Import name | Variants |
|-----------|-------------|---------|
| `TopBarSection` | `topbar` | `announcement` · `promo` · `contact` · `social` |
| `LogoCloudSection` | `logo_cloud` | `row` · `grid` · `grayscale` · `bordered` |
| `ServicesSection` | `services` | `cards` · `list` · `compact` · `detailed` |
| `AboutSection` | `about` | `split` · `mission-vision` · `founder` · `compact` |
| `StatsSection` | `stats` | `simple` · `card-grid` · `icon-stats` · `dark-band` |
| `HowItWorksSection` | `how_it_works` | `3-step` · `horizontal` · `vertical` · `timeline` |
| `TestimonialsSection` | `testimonials` | `cards` · `carousel` · `single-quote` · `masonry` |
| `CaseStudiesSection` | `case_studies` | `grid` · `featured` · `compact` · `detailed` |
| `PricingSection` | `pricing` | `tiers` · `comparison` · `enterprise` · `compact` |
| `FaqSection` | `faq` | `simple` · `two-column` · `grouped` · `support` |
| `NewsletterSection` | `newsletter` | `simple` · `boxed` · `dark` · `image-side` · `footer-inline` |
| `TeamSection` | `team` | `grid` · `leadership` · `compact` · `profile-card` |
| `TimelineSection` | `timeline` | `vertical` · `horizontal` · `roadmap` · `milestone` |

### 9.2 Static use — import and render directly

All sections are **Server Component-compatible** except `TopBarSection` (dismissible state), `PricingSection` (billing toggle), `FaqSection` (accordion), and `NewsletterSection` (form state). Mark only those `'use client'`.

```tsx
// app/(marketing)/about/page.tsx  — Server Component, no 'use client' needed
import {
    HeroSection,
    AboutSection,
    StatsSection,
    TestimonialsSection,
    CtaSection,
} from '@trackany-device/components';

export default function AboutPage() {
    return (
        <>
            <HeroSection content={{
                size: 'half',
                eyebrow: 'Our story',
                title: 'Built for fleets that cannot afford downtime',
                bg: { kind: 'gradient', gradient_from: '#0f172a', gradient_to: '#1e3a5f', gradient_direction: 'to-br' },
                buttons: [{ label: 'Meet the team', link: '/team', variant: 'primary' }],
            }} />

            <AboutSection content={{
                variant: 'split',
                image_side: 'right',
                eyebrow: 'Who we are',
                title: 'A small team with big ambitions',
                body: '<p>We started in 2020 with one goal: make fleet visibility simple and affordable.</p>',
                stats: [
                    { value: '50K+', label: 'Devices tracked' },
                    { value: '120+', label: 'Enterprise clients' },
                ],
            }} />

            <StatsSection content={{
                variant: 'dark-band',
                items: [
                    { value: '50,000', suffix: '+', label: 'Devices' },
                    { value: '99.9', suffix: '%', label: 'Uptime' },
                    { value: '4.8', suffix: '/5', label: 'Rating' },
                ],
            }} />

            <TestimonialsSection content={{
                variant: 'cards',
                eyebrow: 'What clients say',
                title: 'Trusted nationwide',
                items: [
                    { name: 'Zara Khan', role: 'Fleet Manager', company: 'LogiPak', rating: 5, quote: 'Reduced fuel costs by 22% in three months.' },
                ],
            }} />
        </>
    );
}
```

### 9.3 CMS-driven use — SectionRenderer

When sections are stored in a database (Laravel `page_sections` table), fetch them server-side and pass to `SectionRenderer`. It reads the `type` field, looks it up in the registry, and renders the matching component with the `content` JSON.

```tsx
// app/(marketing)/[slug]/page.tsx  — Server Component
import { SectionRenderer } from '@trackany-device/components';
import type { PageSection } from '@trackany-device/components';

async function getPageSections(slug: string): Promise<PageSection[]> {
    const res = await fetch(`${process.env.API_URL}/api/pages/${slug}/sections`, {
        next: { revalidate: 60 }, // ISR: re-fetch every 60 s
    });
    if (!res.ok) return [];
    return res.json();
}

export default async function CmsPage({ params }: { params: { slug: string } }) {
    const sections = await getPageSections(params.slug);
    return <SectionRenderer sections={sections} />;
}

export async function generateStaticParams() {
    const res = await fetch(`${process.env.API_URL}/api/pages`);
    const pages: { slug: string }[] = await res.json();
    return pages.map((p) => ({ slug: p.slug }));
}
```

`PageSection` shape (matches the Laravel migration):

```ts
type PageSection = {
    id: number;
    type: string;        // e.g. 'hero', 'faq', 'pricing'
    identifier?: string; // CSS id="" for anchor links
    active: boolean;     // inactive sections are skipped
    sort_order: number;  // lower = higher on page
    content: Record<string, unknown>; // the section's props JSON
};
```

### 9.4 Overriding a single section in the registry

Pass a `registry` prop to swap out one component without touching the global registry:

```tsx
import { SectionRenderer } from '@trackany-device/components';
import { MyCustomHero } from '@/components/my-custom-hero';

<SectionRenderer
    sections={sections}
    registry={{ hero: MyCustomHero }}
/>
```

### 9.5 Interactive sections need 'use client'

`PricingSection`, `FaqSection`, `NewsletterSection`, and `TopBarSection` hold local state. When used directly (§ 9.2), mark the page or a wrapper `'use client'`. When used via `SectionRenderer`, the components handle this themselves — no extra marking needed.

```tsx
// Direct static use of interactive section
'use client';
import { PricingSection, pricingSampleProps } from '@trackany-device/components';

export default function PricingPage() {
    return <PricingSection content={pricingSampleProps} />;
}
```

### 9.6 Sample props for every section

Every section exports a `*SampleProps` object — useful for previews, admin UIs, and Storybook stories:

```tsx
import {
    topBarSampleProps,
    logoCloudSampleProps,
    servicesSampleProps,
    aboutSampleProps,
    statsSampleProps,
    howItWorksSampleProps,
    testimonialsSampleProps,
    caseStudiesSampleProps,
    pricingSampleProps,
    faqSampleProps,
    newsletterSampleProps,
    teamSampleProps,
    timelineSampleProps,
} from '@trackany-device/components';
```

### 9.7 Typical marketing page structure

```
app/
  (marketing)/
    layout.tsx         ← SiteHeader + SiteFooter (Server Component)
    page.tsx           ← home: SectionRenderer with DB sections
    about/page.tsx     ← static AboutSection + StatsSection
    pricing/page.tsx   ← 'use client' — PricingSection
    [slug]/page.tsx    ← CMS: SectionRenderer with ISR
```

```tsx
// app/(marketing)/layout.tsx  — Server Component
import { SiteHeader, SiteFooter } from '@trackany-device/components';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <SiteHeader />
            <main>{children}</main>
            <SiteFooter />
        </>
    );
}
```

---

## Key rules

- Always wrap with `<PlatformProvider adapter={adapter}>` **in a Client Component** — `createNextjsAdapter` calls `useRouter` and `usePathname`, which require client context.
- Pass server-fetched shared data (auth, nav config) via `pageProps` — `usePlatformPageProps` reads from there, not from React context at call time.
- Import `themes.css` (and optionally `keenicons.css`) in your global CSS before any component renders — design tokens (colours, spacing) come from there.
- Use Next.js `metadata` exports for document `<head>` management — `PlatformHead` is a no-op in this adapter.
- Mobile layouts are built-in — do not add your own hamburger/overlay logic around layout components.
- Website section components are Server Component-safe except `TopBarSection`, `PricingSection`, `FaqSection`, and `NewsletterSection` — mark only those pages/wrappers `'use client'`.
- For CMS-driven pages, fetch sections server-side and pass to `SectionRenderer` — inactive sections are skipped, order is by `sort_order`.
