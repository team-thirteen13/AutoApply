# Landing Page Architecture

**Domain:** Marketing landing page for AI-powered resume builder
**Researched:** 2026-07-16
**Project context:** Next.js 16 App Router, existing auth/dashboard, Tailwind CSS 4

## Recommended Architecture

### Overview

The landing page replaces the current minimal `src/app/page.tsx` with a full marketing page. It follows the existing project patterns: Server Components by default, Client Components only for interactivity, and feature modules for any data fetching.

### Route Structure

```
src/app/
├── page.tsx                    # Landing page (replaces current)
├── layout.tsx                  # Root layout (unchanged)
├── (marketing)/                # Route group for public pages
│   ├── layout.tsx              # Marketing-specific layout (optional)
│   └── page.tsx                # Landing page (alternative)
├── login/page.tsx              # Existing auth
├── register/page.tsx           # Existing auth
└── dashboard/                  # Existing protected routes
```

**Decision:** Keep landing page at `src/app/page.tsx` (root) rather than a route group. Reason: The proxy already allows `/` as public, and the root path is the natural landing page location. No need for a `(marketing)` group unless we add more public pages later.

### Component Boundaries

```
src/components/landing/
├── index.ts                    # Barrel export
├── hero.tsx                    # Server Component - Hero section
├── features.tsx                # Server Component - Current features
├── ai-preview.tsx              # Server Component - AI workflow preview
├── testimonials.tsx            # Client Component - Testimonial carousel
├── cta.tsx                     # Server Component - Final CTA
├── nav.tsx                     # Client Component - Mobile menu + auth state
└── footer.tsx                  # Server Component - Footer links

src/components/ui/
├── button.tsx                  # Existing - use for CTAs
├── card.tsx                    # NEW - Feature cards
├── badge.tsx                   # NEW - Status badges ("Live", "Coming Soon")
└── section.tsx                 # NEW - Reusable section wrapper
```

### Server vs Client Component Map

| Component | Type | Reason |
|-----------|------|--------|
| `page.tsx` | **Server** | Auth state check, metadata, static composition |
| `hero.tsx` | **Server** | Static content, SEO keywords, no interactivity |
| `features.tsx` | **Server** | Static feature grid, no state |
| `ai-preview.tsx` | **Server** | Static preview cards, no state |
| `testimonials.tsx` | **Client** | Carousel/swiper needs `useState` for navigation |
| `cta.tsx` | **Server** | Static CTA section |
| `nav.tsx` | **Client** | Mobile menu toggle, auth state display |
| `footer.tsx` | **Server** | Static links, no interactivity |
| `card.tsx` | **Server** | Presentational, receives props |
| `badge.tsx` | **Server** | Presentational, receives props |
| `section.tsx` | **Server** | Layout wrapper, receives children |

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Request Flow                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Browser requests "/"                                     │
│           ↓                                                  │
│  2. Proxy (src/proxy.ts) checks:                             │
│     - "/" is in public routes → allows through               │
│           ↓                                                  │
│  3. Root Layout (src/app/layout.tsx) renders:                │
│     - HTML shell, fonts, global styles                       │
│           ↓                                                  │
│  4. Page (src/app/page.tsx) - Server Component:              │
│     - Calls getAuthenticatedUser()                           │
│     - Passes user state to Nav component                     │
│     - Composes all landing sections                          │
│           ↓                                                  │
│  5. Nav Component (Client):                                  │
│     - Receives user prop from Server Component               │
│     - Renders: Logo, Sign In/Sign Up (if no user)            │
│                or Dashboard link (if user)                    │
│     - Handles mobile menu toggle                             │
│           ↓                                                  │
│  6. Static Sections (Server Components):                     │
│     - Hero, Features, AI Preview, CTA, Footer                │
│     - No data fetching needed (all static content)           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Auth State Integration

The landing page needs to show different CTAs based on auth state:

```typescript
// src/app/page.tsx (Server Component)
import { getAuthenticatedUser } from "@/lib/supabase/session";
import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
// ... other imports

export default async function LandingPage() {
  const user = await getAuthenticatedUser();

  return (
    <main>
      <Nav user={user} />
      <Hero isAuthenticated={!!user} />
      <Features />
      <AiPreview />
      <Testimonials />
      <Cta isAuthenticated={!!user} />
      <Footer />
    </main>
  );
}
```

**Key pattern:** Server Component fetches auth state, passes boolean/user object as props to Client Components. No client-side auth checks needed.

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| `page.tsx` | Page composition, auth state | All landing components |
| `nav.tsx` | Navigation, mobile menu, auth links | Receives `user` prop |
| `hero.tsx` | Hero section, primary CTA | Receives `isAuthenticated` prop |
| `features.tsx` | Current feature showcase | None (static) |
| `ai-preview.tsx` | AI workflow preview | None (static) |
| `testimonials.tsx` | Testimonial carousel | None (self-contained) |
| `cta.tsx` | Final conversion CTA | Receives `isAuthenticated` prop |
| `footer.tsx` | Footer links | None (static) |
| `card.tsx` | Reusable card wrapper | Receives children, variant |
| `badge.tsx` | Status indicator | Receives text, variant |
| `section.tsx` | Section layout wrapper | Receives children, className |

### Patterns to Follow

#### Pattern 1: Server Component Composition
**What:** Page is a Server Component that composes all sections
**When:** Building the landing page
**Example:**
```tsx
// src/app/page.tsx
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";

export const metadata: Metadata = {
  title: "AutoApply - AI-Powered Resume Builder",
  description: "Create professional resumes with AI...",
};

export default async function LandingPage() {
  const user = await getAuthenticatedUser();

  return (
    <main className="min-h-screen">
      <Nav user={user} />
      <Hero isAuthenticated={!!user} />
      <Features />
      {/* ... other sections */}
    </main>
  );
}
```

#### Pattern 2: Client Island for Interactivity
**What:** Only mark interactive sections as `"use client"`
**When:** Section needs state, effects, or event handlers
**Example:**
```tsx
// src/components/landing/testimonials.tsx
"use client";

import { useState } from "react";

export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  // ... carousel logic
}
```

#### Pattern 3: Props Down, Events Up
**What:** Server Components pass data down, Client Components handle events
**When:** Nav or CTA needs to react to auth state
**Example:**
```tsx
// Server Component passes data
<Nav user={user} />

// Client Component handles interactions
"use client";
export function Nav({ user }: { user: User | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  // ... render based on user prop
}
```

### Anti-Patterns to Avoid

#### Anti-Pattern 1: Client-Side Auth Check
**What:** Checking auth state in Client Components using cookies
**Why bad:** Insecure, can be manipulated
**Instead:** Use `getAuthenticatedUser()` in Server Component, pass as prop

#### Anti-Pattern 2: Wrapping Entire Page in "use client"
**What:** Making the whole page a Client Component
**Why bad:** Loses SEO benefits, sends all JS to client
**Instead:** Keep page as Server Component, use Client islands

#### Anti-Pattern 3: Inline Styles for Landing Page
**What:** Using style={{}} for layout
**Why bad:** Inconsistent with Tailwind patterns, harder to maintain
**Instead:** Use Tailwind classes, extend theme if needed

#### Anti-Pattern 4: Duplicated Section Wrappers
**What:** Each section defines its own max-width/padding
**Why bad:** Inconsistent spacing, harder to update
**Instead:** Create reusable `Section` component with consistent padding

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| Page Load | Instant (static) | Instant (CDN) | Instant (CDN) |
| Auth Check | Fast (Supabase) | Fast (cached) | Fast (cached) |
| Images | Local/CDN | CDN | CDN + optimization |
| Analytics | None | Add tracking | Full analytics |

## Build Order Implications

Based on component dependencies:

1. **Phase 1: Foundation** - `section.tsx`, `card.tsx`, `badge.tsx` (reusable UI)
2. **Phase 2: Layout** - `nav.tsx`, `footer.tsx` (page structure)
3. **Phase 3: Content** - `hero.tsx`, `features.tsx`, `ai-preview.tsx` (static sections)
4. **Phase 4: Interactivity** - `testimonials.tsx` (client component)
5. **Phase 5: Conversion** - `cta.tsx` (final CTA with auth state)
6. **Phase 6: Integration** - Update `page.tsx`, test auth flow

**Dependencies:**
- `nav.tsx` depends on auth state pattern
- `hero.tsx` depends on `button.tsx` (existing)
- `testimonials.tsx` is independent (self-contained)
- `cta.tsx` depends on auth state pattern
- `page.tsx` depends on all components

## Sources

- Next.js App Router documentation on Server/Client Components
- Existing codebase patterns (src/app/page.tsx, src/app/login/page.tsx)
- Tailwind CSS 4 utility-first patterns
- Project requirements (PROJECT.md)

---

*Architecture analysis: 2026-07-16*
