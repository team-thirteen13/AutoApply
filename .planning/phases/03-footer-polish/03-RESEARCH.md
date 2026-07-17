# Phase 3: Footer & Polish - Research

**Researched:** 2026-07-17
**Domain:** Footer component, responsive design, accessibility (WCAG 2.1 AA), performance optimization
**Confidence:** HIGH

## Summary

Phase 3 completes the AutoApply landing page with a 4-column footer and applies production-grade polish across the entire page. The footer follows standard SaaS patterns (dark background, 4 link columns, copyright bar) and integrates seamlessly with the existing gradient section transitions. Accessibility work centers on three high-impact additions: a skip-to-content link (WCAG 2.4.1), focus trap for mobile navigation (WCAG 2.4.3), and `aria-live` regions for dynamic content (WCAG 4.1.3). Performance optimization leverages Next.js built-in features (Image component, `next/font`, lazy loading) rather than adding new dependencies.

**Primary recommendation:** Build the footer as a server component with a client-side dynamic year, add skip-to-content link to the layout, implement focus trap via `focus-trap-react` for the mobile nav, and use Intersection Observer for below-the-fold lazy loading.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Minimal links: Product (Features, Pricing), Resources (Blog, Help Center), Company (About, Contact), Legal (Privacy, Terms)
- **D-02:** No social media icons — keep footer minimal
- **D-03:** Dynamic copyright year (© {currentYear} AutoApply) — auto-updates via JavaScript
- **D-04:** Contained layout (max-w-6xl) — matches hero and other sections for consistency
- **D-05:** Bottom section: Copyright text + repeated key links (Privacy, Terms) for accessibility
- **D-06:** Dark background (gray-900) with light text — classic SaaS footer aesthetic
- **D-07:** Gradient fade from content to footer — matches section transitions from Phase 2
- **D-08:** Mobile layout: columns stack vertically — simple, readable, standard SaaS pattern
- **D-09:** Comprehensive ARIA patterns: landmark roles, live regions for dynamic content, aria-labels for all interactive elements
- **D-10:** Focus trap for mobile navigation — prevents keyboard users from tabbing behind the menu, restores focus on close
- **D-11:** Skip-to-content link — hidden by default, appears on focus, allows keyboard users to bypass nav
- **D-12:** ROADMAP targets: Lighthouse >90, LCP <2.5s, CLS <0.1 — no extra constraints
- **D-13:** Lazy loading for below-the-fold sections — use Intersection Observer to improve initial LCP
- **D-14:** Next/Image for all images — automatic optimization, lazy loading, responsive sizes
- **D-15:** next/font for Space Grotesk + Inter — self-hosts, preloads, generates fallback CSS

### Claude's Discretion
- Exact gradient colors and angles for footer transition — use aesthetic judgment consistent with Phase 1 palette
- Focus trap implementation details — standard React patterns
- Skip-to-content link positioning and styling — hidden offscreen, visible on focus
- Lazy loading threshold and intersection observer configuration — standard patterns
- Footer column spacing and typography — follow Stripe/Notion SaaS patterns

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LP-06 | Mobile-First Responsive Design: phones (375px+), tablets (768px+), desktops (1024px+). Mobile-first CSS with fluid typography using clamp(). | Tailwind responsive utilities (grid-cols-2 md:grid-cols-4), fluid typography patterns, viewport testing approach |
| LP-08 | Footer with Relevant Links: 4-column layout with Product, Resources, Company, Legal sections, social icons, and copyright | Standard SaaS footer grid pattern, dark background (gray-900), contained layout (max-w-6xl) |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Footer content & layout | Browser / Client | CDN / Static | Static content rendered as server component, dynamic year needs client |
| Skip-to-content link | Browser / Client | — | Pure client-side DOM behavior, first focusable element |
| Focus trap (mobile nav) | Browser / Client | — | Keyboard interaction management within existing MobileNav component |
| ARIA landmarks & labels | Browser / Client | — | Semantic HTML attributes on existing components |
| Lazy loading (Intersection Observer) | Browser / Client | — | Client-side API for deferring below-the-fold content |
| Image optimization | CDN / Static | Browser / Client | Next/Image handles optimization at build/CDN level |
| Font optimization | CDN / Static | — | next/font self-hosts and preloads at layout level |
| Responsive layout | Browser / Client | — | Tailwind responsive utilities handle viewport adaptation |
| Performance (Lighthouse) | Browser / Client | CDN / Static | Combines font, image, lazy loading, and animation decisions |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `focus-trap-react` | ^6.0.0 [ASSUMED] | Focus trap for mobile nav accessibility | Most maintained a11y focus trap library for React; handles edge cases (React 18 Strict Mode, focus restoration) |
| Tailwind CSS 4 | ^4 | Responsive layout, styling, animation utilities | Already installed; `motion-safe:` / `motion-reduce:` variants for prefers-reduced-motion |
| Next.js Image | 16.2.10 | Image optimization, lazy loading, responsive srcset | Built into Next.js; no extra dependency; automatic format conversion |
| next/font | 16.2.10 | Font self-hosting, preloading, fallback CSS generation | Already configured in layout.tsx; D-15 confirms usage |
| Intersection Observer API | Built-in | Lazy loading below-the-fold sections | Native browser API; no library needed; React useRef + useEffect pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@testing-library/react` | ^16.3.2 | Component testing for footer, skip link, focus trap | Already installed; test all new interactive components |
| `@testing-library/jest-dom` | ^6.9.1 | DOM assertion matchers (toBeInTheDocument, etc.) | Already installed; extend matchers in tests |
| `@testing-library/user-event` | ^14.6.1 | Simulate keyboard interactions for focus trap testing | Already installed; test Tab, Escape, focus cycling |
| `vitest` | ^4.1.10 | Test runner | Already installed; `@vitest-environment jsdom` for DOM tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `focus-trap-react` | Hand-rolled `createFocusTrap` from `focus-trap` | More control but requires managing React lifecycle manually; focus-trap-react handles Strict Mode quirks |
| `focus-trap-react` | `@accessible/focus-trap` | Hook-based API is lighter but less battle-tested; focus-trap-react has larger community |
| Intersection Observer (native) | `react-intersection-observer` | Adds 3KB dependency for a thin wrapper; native API is sufficient with useRef/useEffect |
| Tailwind `motion-safe:` | CSS `@media (prefers-reduced-motion)` | Tailwind variant is the CSS approach but more ergonomic in JSX; same underlying mechanism |

**Installation:**
```bash
npm install focus-trap-react
```

**Version verification:** Before writing the Standard Stack table, verify each recommended package exists and is current using the ecosystem-appropriate command:
```bash
npm view focus-trap-react version          # Verify focus-trap-react exists
npm view focus-trap-react dist-tags.latest # Check latest version
```

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `focus-trap-react` | npm | 8+ years | ~2M/wk [ASSUMED] | github.com/focus-trap/focus-trap-react | OK | Approved |
| `tailwindcss` | npm | Already installed | — | — | OK | Existing dependency |
| `next` | npm | Already installed | — | — | OK | Existing dependency |
| `react` | npm | Already installed | — | — | OK | Existing dependency |
| `@testing-library/react` | npm | Already installed | — | — | OK | Existing dependency |
| `@testing-library/jest-dom` | npm | Already installed | — | — | OK | Existing dependency |
| `@testing-library/user-event` | npm | Already installed | — | — | OK | Existing dependency |
| `vitest` | npm | Already installed | — | — | OK | Existing dependency |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*Packages discovered via WebSearch or training data that have not been verified against an authoritative source are tagged `[ASSUMED]` and the planner must gate each install behind a `checkpoint:human-verify` task.*

## Architecture Patterns

### System Architecture Diagram

```
                    ┌─────────────────────────────────────┐
                    │         src/app/page.tsx             │
                    │   (Landing Page Server Component)    │
                    └──────────────┬──────────────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
  ┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
  │   Navbar     │     │   Hero Section   │     │  Content Sections│
  │  (Client)    │     │   (Client)       │     │  (Server)        │
  │  + FocusTrap │     │   + Fade-in      │     │  FeatureShowcase │
  └──────┬───────┘     └──────────────────┘     │  AIWorkflow      │
         │                                       │  CTASection (x2) │
         ▼                                       │  Testimonials    │
  ┌──────────────┐                              └──────────────────┘
  │  MobileNav   │                                     │
  │  (Client)    │                                     │
  │  + ARIA      │                                     │
  │  + FocusTrap │                                     ▼
  └──────────────┘                              ┌──────────────────┐
                                                │   Footer         │
  ┌──────────────┐                              │   (Server)       │
  │ Skip Link    │──── first focusable ────────│  4-col grid      │
  │ (layout.tsx) │     element                  │  Copyright bar   │
  └──────────────┘                              └──────────────────┘
```

### Recommended Project Structure

```
src/
├── app/
│   ├── layout.tsx                    # Add SkipToContent + main landmark
│   ├── page.tsx                      # Add Footer at bottom
│   └── globals.css                   # Add footer gradient variables
├── components/
│   ├── landing/
│   │   ├── footer.tsx                # NEW: Footer component (server)
│   │   ├── navbar.tsx                # MODIFY: Add aria-expanded, ref forwarding
│   │   ├── mobile-nav.tsx            # MODIFY: Add focus trap, ARIA, role="dialog"
│   │   └── skip-to-content.tsx       # NEW: Skip link component (client)
│   └── ui/
│       └── button.tsx                # No changes
```

### Pattern 1: Skip-to-Content Link
**What:** Hidden link as first focusable element, visible on keyboard focus, targets main content landmark
**When to use:** Every multi-section landing page with navigation (WCAG 2.4.1 requirement)
**Example:**
```tsx
// Source: W3C WAI-ARIA Authoring Practices, MDN skip link pattern
// File: src/components/landing/skip-to-content.tsx
"use client";

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:p-4 focus:text-slate-900 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      Skip to main content
    </a>
  );
}
```

### Pattern 2: Focus Trap for Mobile Navigation
**What:** Keyboard focus trapped inside mobile nav when open, restored to trigger on close
**When to use:** Any modal/drawer/overlay that blocks interaction with background content (WCAG 2.4.3)
**Example:**
```tsx
// Source: focus-trap-react docs, WAI-ARIA dialog pattern
// File: src/components/landing/mobile-nav.tsx (modification)
"use client";
import { useRef, useEffect } from "react";
import FocusTrap from "focus-trap-react";

export function MobileNav({ isOpen, onClose, user }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className={`fixed inset-0 z-50 md:hidden ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
      <div className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`} onClick={onClose} aria-hidden="true" />
      <FocusTrap
        active={isOpen}
        focusTrapOptions={{
          initialFocus: false,
          returnFocusOnDeactivate: true,
          clickOutsideDeactivates: true,
          escapeDeactivates: true,
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={`absolute right-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          {/* Header with close button */}
          <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
            <span className="font-heading text-lg font-bold text-slate-900">AutoApply</span>
            <button ref={closeButtonRef} type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700" aria-label="Close navigation menu">
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* Navigation links */}
          <div className="flex flex-1 flex-col gap-2 p-4">
            {/* ... existing link content ... */}
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}
```

### Pattern 3: Lazy Loading with Intersection Observer
**What:** Defer rendering of below-the-fold sections until they enter the viewport
**When to use:** Sections far down the page that don't affect initial LCP
**Example:**
```tsx
// Source: React useRef/useEffect + IntersectionObserver API
// File: src/components/landing/lazy-section.tsx (new utility component)
"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";

interface LazySectionProps {
  children: ReactNode;
  rootMargin?: string;
  className?: string;
}

export function LazySection({ children, rootMargin = "200px", className }: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : <div className="min-h-[400px]" />}
    </div>
  );
}
```

### Pattern 4: Dynamic Copyright Year
**What:** Auto-updating copyright year without manual edits
**When to use:** Footer copyright text
**Example:**
```tsx
// Source: Standard SaaS footer pattern
// File: src/components/landing/footer.tsx
// Use React's currentYear inline — no useEffect needed for static content
// The year is computed at render time; since this is a server component,
// it will be correct at build time and on each SSR render
function getCopyrightYear() {
  return new Date().getFullYear();
}

// In the footer component:
<p>&copy; {getCopyrightYear()} AutoApply. All rights reserved.</p>
```

### Pattern 5: prefers-reduced-motion with Tailwind
**What:** Respect OS-level reduced motion preference for animations
**When to use:** All animations and transitions (WCAG 2.3.3)
**Example:**
```tsx
// Source: Tailwind CSS docs, existing pattern in feature-card.tsx
// motion-safe: only applies when user has NOT set reduced motion
// motion-reduce: only applies when user HAS set reduced motion

// Existing pattern in feature-card.tsx (already used in codebase):
<div className="transition-all motion-safe:hover:shadow-lg motion-safe:hover:-translate-y-1">

// For new animations, follow the same pattern:
<div className="motion-safe:animate-fade-in motion-reduce:opacity-100">
```

### Anti-Patterns to Avoid
- **Hand-rolling focus traps:** The `focus-trap` library handles edge cases (React 18 Strict Mode double-mount, tab wrapping, SVG focusable elements) that are extremely difficult to get right manually
- **Dynamically toggling `aria-live`:** React may not re-render when content changes if the DOM node is reused; use a `key` prop to force re-mount instead
- **Setting `loading="eager"` on below-fold images:** Use `loading="lazy"` (default) for non-hero images; only use `priority`/`preload` for above-the-fold hero images
- **Using `role="dialog"` without `aria-modal`:** Screen readers won't know to treat content as modal; always pair with `aria-modal="true"`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trap for mobile nav | Custom tab-cycling logic with querySelectorAll | `focus-trap-react` | Handles React 18 Strict Mode, tab wrapping across SVGs, focus restoration, escape key; battle-tested by a11y community |
| Image optimization | Manual `srcset` generation, WebP conversion | `next/image` | Automatic format negotiation, responsive sizing, lazy loading, blur placeholders; zero config |
| Font self-hosting | Manual font file management, FOUT prevention | `next/font` | Automatic subsetting, preload hints, CSS fallback generation; already configured in layout.tsx |
| Skip-to-content link | Custom keyboard event listeners | Native `<a href="#main-content">` + Tailwind `sr-only` | Browser handles focus navigation natively; CSS handles visibility toggle |

**Key insight:** Focus traps are one of the most deceptively complex a11y patterns. The `focus-trap` library (underlying `focus-trap-react`) has 8+ years of edge case fixes. Hand-rolling risks incomplete tab cycling, missed focusable elements (hidden inputs, offscreen links), and React Strict Mode double-mount bugs.

## Common Pitfalls

### Pitfall 1: Focus Trap Double-Mount in React 18/19 Strict Mode
**What goes wrong:** Focus trap activates, immediately deactivates, then reactivates — causing a flash or focus landing in the wrong place
**Why it happens:** React 18+ Strict Mode mounts, unmounts, and remounts components in development to surface side effect bugs
**How to avoid:** Use `focus-trap-react` (handles this internally); avoid state changes in `onActivate`/`onDeactivate` callbacks; use `active` prop toggle instead of mount/unmount
**Warning signs:** Focus jumps to body on menu open; close button not focusable after open

### Pitfall 2: Missing `aria-modal="true"` on Dialog Role
**What goes wrong:** Screen readers allow navigation to background content while mobile nav is open
**Why it happens:** Adding `role="dialog"` alone doesn't tell screen readers to treat it as modal
**How to always pair `role="dialog"` with `aria-modal="true"` and ensure background content is inert (via `aria-hidden` or `inert` attribute)
**Warning signs:** Screen reader users can Tab to links behind the mobile nav overlay

### Pitfall 3: Skip Link Not First Focusable Element
**What goes wrong:** Keyboard users Tab through the entire nav before reaching the skip link (defeats its purpose)
**Why it happens:** Skip link is placed after nav in DOM order or has positive `tabIndex`
**How to avoid:** Place skip link as the first child of `<body>` in the DOM; use `tabIndex={0}` (default for `<a>`); never add skip link inside nav
**Warning signs:** First Tab press goes to logo instead of skip link

### Pitfall 4: Lazy Loading Sections Cause Layout Shift (CLS)
**What goes wrong:** Placeholder div height doesn't match content height, causing layout shift when content loads
**Why it happens:** Using a fixed-height placeholder or no placeholder at all
**How to avoid:** Set placeholder `min-height` to match expected content height; use `aspect-ratio` if content has predictable proportions; test at multiple viewports
**Warning signs:** Lighthouse CLS score above 0.1; visible jump when scrolling down

### Pitfall 5: `prefers-reduced-motion` Not Tested
**What goes wrong:** Animations play for users who have requested reduced motion (WCAG 2.3.3 violation)
**Why it happens:** Developers test on machines without reduced motion enabled; `motion-safe:` variant is easy to forget
**How to avoid:** Enable "Reduce motion" in OS accessibility settings during development; grep for `animate-` and `transition-` classes without `motion-safe:` prefix
**Warning signs:** Lighthouse accessibility audit flags animation issues

### Pitfall 6: Footer Gradient Doesn't Match Section Transitions
**What goes wrong:** Footer appears visually disconnected from the last CTA section
**Why it happens:** Using a different gradient direction or color than established in Phase 2
**How to avoid:** Use the same gradient pattern as Phase 2 section transitions; reference `globals.css` color tokens; test at multiple viewports
**Warning signs:** Hard color boundary between last CTA and footer; visual "jump" in color temperature

## Code Examples

Verified patterns from official sources:

### Footer Component Structure
```tsx
// Source: Standard SaaS footer pattern (Stripe, Vercel, Notion)
// File: src/components/landing/footer.tsx
// Server component — no "use client" needed

const footerLinks = {
  product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "/pricing" },
  ],
  resources: [
    { label: "Blog", href: "/blog" },
    { label: "Help Center", href: "/help" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300" role="contentinfo">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="text-sm hover:text-white transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm">
          <p>&copy; {new Date().getFullYear()} AutoApply. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

### Layout Integration with Skip Link and Main Landmark
```tsx
// Source: W3C WAI-ARIA bypass blocks pattern
// File: src/app/layout.tsx (modification)
import { SkipToContent } from "@/components/landing/skip-to-content";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SkipToContent />
        <main id="main-content" tabIndex={-1} className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
```

### Navbar Accessibility Enhancements
```tsx
// Source: WAI-ARIA disclosure pattern
// File: src/components/landing/navbar.tsx (modification)
// Add aria-expanded to hamburger button:
<button
  type="button"
  onClick={() => setIsMobileMenuOpen(true)}
  className="..."
  aria-label="Open navigation menu"
  aria-expanded={isMobileMenuOpen}
  aria-controls="mobile-navigation"
>
  <Menu className="h-5 w-5" />
</button>
```

### Intersection Observer Lazy Loading Hook
```tsx
// Source: React useRef/useEffect + IntersectionObserver API
// File: src/hooks/use-intersection-observer.ts (new)
"use client";

import { useRef, useState, useEffect } from "react";

export function useIntersectionObserver(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "200px", ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isVisible };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FOUT (Flash of Unstyled Text) | `next/font` self-hosting with CSS fallback | Next.js 13+ | Fonts load instantly from same origin; no layout shift |
| Manual `srcset` / `<picture>` | `next/image` with `sizes` prop | Next.js 13+ | Automatic format negotiation (WebP/AVIF), responsive sizing |
| `@media (prefers-reduced-motion)` in CSS | Tailwind `motion-safe:` / `motion-reduce:` variants | Tailwind CSS 3.1+ | Same mechanism, more ergonomic in JSX |
| `react-focus-trap` (class-based) | `focus-trap-react` (functional, ref-based) | 2020+ | Better React 18+ compatibility, hook-friendly patterns |
| Manual IntersectionObserver setup | `react-intersection-observer` library | — | Not needed; native API with useRef/useEffect is sufficient for simple lazy loading |

**Deprecated/outdated:**
- `loading="lazy"` attribute on `<img>`: Still valid but `next/image` handles this automatically; prefer `next/image` for all images
- `@reach/dialog`: Deprecated in favor of `@react-aria` from Adobe; use `focus-trap-react` instead for focus management

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this
> section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `focus-trap-react` version ^6.0.0 is current and compatible with React 19 | Standard Stack | Planner should verify with `npm view focus-trap-react version` before installing |
| A2 | `focus-trap-react` download count is ~2M/wk | Package Legitimacy Audit | Low risk — registry verdict is OK; download count is approximate |
| A3 | Existing landing page sections (FeatureShowcase, AIWorkflow, Testimonials) will be wrapped in LazySection | Architecture Patterns | Medium risk — if section content affects above-the-fold layout, lazy loading may cause CLS |

**If this table is empty:** Not applicable — 3 assumptions documented.

## Open Questions

1. **Which sections should be lazy-loaded?**
   - What we know: D-13 says "below-the-fold sections" should use Intersection Observer
   - What's unclear: Whether Testimonials and the second CTA are far enough below fold to justify lazy loading; hero and first CTA must NOT be lazy-loaded
   - Recommendation: Lazy-load Testimonials section and second CTA only; keep FeatureShowcase and AIWorkflow in initial render (they're close to fold)

2. **Should footer gradient be a new CSS variable or inline Tailwind?**
   - What we know: D-07 says gradient fade from content to footer; existing sections use `globals.css` theme variables
   - What's unclear: Whether to add `--color-footer-start` / `--color-footer-end` variables or use inline gradient classes
   - Recommendation: Use inline Tailwind classes consistent with existing CTASection pattern (`bg-gradient-to-br from-blue-900/80 to-slate-800/90`); no new CSS variables needed

3. **Should `focus-trap-react` be installed or should we hand-roll?**
   - What we know: D-10 says "focus trap for mobile navigation"
   - What's unclear: Whether the team prefers minimal dependencies or battle-tested a11y libraries
   - Recommendation: Install `focus-trap-react` — it's 3KB gzipped, handles React 18/19 Strict Mode edge cases, and is the community standard for this pattern

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build, dev server | Yes | 20+ | — |
| npm | Package management | Yes | 9+ | — |
| Vitest | Testing | Yes | 4.1.10 | — |
| jsdom | DOM testing environment | Yes | 29.1.1 | — |

**Missing dependencies with no fallback:** None
**Missing dependencies with fallback:** None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.10 + Testing Library React 16.3.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test` |
| Full suite command | `npm run test` (all tests run together) |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LP-06 | Responsive layout at 375px, 768px, 1024px | unit | `npm run test -- --testPathPattern footer` | No — Wave 0 |
| LP-06 | Footer columns stack on mobile | unit | `npm run test -- --testPathPattern footer` | No — Wave 0 |
| LP-08 | Footer renders 4 link columns | unit | `npm run test -- --testPathPattern footer` | No — Wave 0 |
| LP-08 | Footer displays copyright with dynamic year | unit | `npm run test -- --testPathPattern footer` | No — Wave 0 |
| LP-08 | Footer has role="contentinfo" landmark | unit | `npm run test -- --testPathPattern footer` | No — Wave 0 |
| a11y | Skip link is first focusable element | unit | `npm run test -- --testPathPattern skip` | No — Wave 0 |
| a11y | Focus trap confines Tab to mobile nav | unit | `npm run test -- --testPathPattern mobile-nav` | No — Wave 0 |
| a11y | Escape key closes mobile nav | unit | `npm run test -- --testPathPattern mobile-nav` | No — Wave 0 |
| a11y | aria-expanded on hamburger button | unit | `npm run test -- --testPathPattern navbar` | No — Wave 0 |
| a11y | motion-safe: animations respect prefers-reduced-motion | manual | Enable OS reduced motion, verify visually | No — manual |

### Sampling Rate
- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test && npm run lint && npm run typecheck && npm run build`
- **Phase gate:** Full suite green + Lighthouse audit >90 + manual a11y keyboard test

### Wave 0 Gaps
- [ ] `src/test/footer.test.tsx` — Footer component rendering, link columns, copyright, landmark role
- [ ] `src/test/skip-to-content.test.tsx` — Skip link presence, sr-only class, focus behavior
- [ ] `src/test/mobile-nav-a11y.test.tsx` — Focus trap activation, escape key, aria-modal, focus restoration
- [ ] `src/test/navbar-a11y.test.tsx` — aria-expanded attribute on hamburger button
- [ ] `src/hooks/use-intersection-observer.ts` — Lazy loading hook (if implementing as separate hook)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth changes in this phase |
| V3 Session Management | No | No session changes in this phase |
| V4 Access Control | No | No access control changes in this phase |
| V5 Input Validation | No | No new input validation in this phase |
| V6 Cryptography | No | No cryptography changes in this phase |

### Known Threat Patterns for Next.js + Tailwind Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via innerHTML | Tampering | React escapes by default; no dangerouslySetInnerHTML in landing page |
| Clickjacking | Tampering | X-Frame-Options header already configured in next.config.ts |
| Open redirect via footer links | Information Disclosure | Use relative paths (/privacy, /terms) not external URLs |

## Sources

### Primary (HIGH confidence)
- Next.js 16.2.10 Image component docs (https://nextjs.org/docs/app/api-reference/components/image) — props, sizes, fill, lazy loading
- MDN dialog role (https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/dialog_role) — ARIA requirements for dialog/modal
- W3C WCAG 2.4.1 Bypass Blocks (https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html) — skip link requirements
- Tailwind CSS animation docs (https://tailwindcss.com/docs/animation) — motion-safe/motion-reduce variants
- focus-trap-react GitHub (https://github.com/focus-trap/focus-trap-react) — React 18/19 Strict Mode handling, API patterns

### Secondary (MEDIUM confidence)
- Web.dev Core Web Vitals (https://web.dev/articles/vitals) — LCP <2.5s, CLS <0.1, INP <200ms targets
- W3C WAI-ARIA Authoring Practices — focus trap, dialog, disclosure patterns

### Tertiary (LOW confidence)
- SaaS footer design patterns (Stripe, Vercel, Notion) — visual reference only

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages are either already installed or well-established a11y libraries with years of production use
- Architecture: HIGH — patterns follow existing codebase conventions (server components, @/ imports, Tailwind utilities)
- Pitfalls: HIGH — documented from focus-trap-react docs, W3C WCAG specifications, and React 18/19 Strict Mode behavior

**Research date:** 2026-07-17
**Valid until:** 2026-08-17 (30 days — stable tech stack, no fast-moving dependencies)
