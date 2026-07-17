# Phase 2: Content Sections - Research

**Researched:** 2026-07-16
**Domain:** Landing page content sections (feature grid, AI pipeline, testimonials)
**Confidence:** HIGH

## Summary

Phase 2 adds three content sections below the hero: a 2x3 feature showcase grid, a 4-step horizontal AI workflow pipeline, and a 3-column testimonial grid, plus two sign-up CTAs. All sections are pure presentational components (no backend, no state, no interactivity beyond hover effects) and should be server components where possible.

The existing Phase 1 codebase provides clear patterns to follow: server components for static content, `"use client"` only when needed (hover effects, animations), Lucide icons imported as named exports, Tailwind CSS 4 utility classes, and the established color palette (hero-start: #1e3a8a, hero-end: #7c3aed, accent: #22c55e). The hero fade-in animation pattern (useState + useEffect + requestAnimationFrame) and prefers-reduced-motion handling via inline `<style>` tag are established conventions.

**Primary recommendation:** Create six new server components in `src/components/landing/` (feature-showcase, feature-card, ai-workflow, workflow-step, testimonials, testimonial-card) plus a reusable CTA section. Use Tailwind CSS grid and flexbox for layouts. Follow the existing `bg-gradient-to-br` syntax (verified backward-compatible with Tailwind CSS 4). Apply `motion-safe:` variant for new hover/transition effects.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: 6 features displayed in a 2x3 grid of cards
- D-02: Each card uses Lucide icons (already installed in project)
- D-03: Card descriptions are 1-2 sentences
- D-04: Features: resume creation, profile management, experience tracking, education tracking, project listings, skill management
- D-05: Horizontal pipeline with arrows connecting 4 steps
- D-06: Steps: Resume Analysis, Job Matching, Cover Letters, ATS Score
- D-07: Each step has a number, icon, and short label
- D-08: Section headline: "Your AI-powered job search"
- D-09: Two sign-up CTAs: one after AI workflow, one after testimonials
- D-10: 3 testimonials in a 3-column grid
- D-11: Circle avatar with initials (no placeholder photos)
- D-12: Quotes styled with quotation marks and italic text
- D-13: Each card: photo, name, title, company, quote
- D-14: Subtle gradient per section (not flat white/gray alternating)
- D-15: Hero transitions to first section via gradient fade (overrides D-03 from Phase 1)
- D-16: Vertical spacing between sections: 24-32px
- D-17: Sign-up CTA appears in two locations: after AI workflow and after testimonials

### Claude's Discretion
- Exact gradient colors and angles per section
- Feature card hover effects and transitions
- Pipeline arrow style and spacing
- Testimonial card shadow/border treatment
- Mobile layout: features stack to single column, pipeline becomes vertical, testimonials stack

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LP-02 | Feature Showcase Section: 4-6 features with icons and descriptions | Tailwind grid (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3), Lucide icons via className sizing, server components for static content |
| LP-03 | AI Workflow Preview Section: visual pipeline walkthrough | Flexbox horizontal layout with arrow connectors, responsive vertical stacking, motion-safe transitions |
| LP-04 | Testimonials Section: 3-6 cards with names, titles, companies, photos | Tailwind grid (grid-cols-1 md:grid-cols-3), circle avatar with initials, quote styling with italic/quotation marks |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Feature showcase grid | Browser / Client | CDN / Static | Static content rendered as server component, only hover effects need client |
| AI workflow pipeline | Browser / Client | CDN / Static | Static content with CSS transitions for hover states |
| Testimonials grid | Browser / Client | CDN / Static | Static content, no interactivity beyond hover |
| Section gradient backgrounds | CDN / Static | — | CSS-only, no runtime logic |
| CTA buttons | Browser / Client | — | Reuse existing Button component with Link wrapper |
| Responsive breakpoints | Browser / Client | — | Tailwind CSS responsive utilities handle at CSS level |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS 4 | ^4 (via @tailwindcss/postcss) | Utility-first CSS | Already configured, used throughout codebase |
| lucide-react | ^1.24.0 | Icon components | Already installed, tree-shakable, consistent with navbar/mobile-nav usage |
| React 19 | 19.2.4 | UI framework | Project standard, server components for static sections |
| Next.js 16 | 16.2.10 | App Router framework | Project standard, page.tsx already structured |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @/components/ui/button | — | Reusable CTA button | Sign-up CTA buttons (reuse existing Button with variant="gradient") |
| next/link | — | Client-side navigation | CTA links to /register |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind grid | CSS Grid with custom properties | Tailwind is already the standard; custom CSS adds maintenance burden |
| Lucide icons | Heroicons / react-icons | Lucide is already installed and used in navbar/mobile-nav; adding another icon lib increases bundle |
| Server components | Client components with useState | Server components are lighter and faster for static content; no intersection observer needed for simple sections |
| motion-safe: variant | Inline <style> tag | motion-safe: is cleaner Tailwind syntax; but existing hero uses inline style — planner should pick one approach consistently |

**Installation:** No new packages needed. All dependencies already installed.

## Package Legitimacy Audit

> No external packages are installed in this phase. All dependencies (lucide-react, tailwindcss, react, next) are already in the project.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| (none) | — | — | — | — | — | No new packages |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
Browser Request
      |
      v
  page.tsx (Server Component)
      |
      +---> Navbar (Client - scroll state)
      +---> Hero (Client - fade-in animation)
      +---> FeatureShowcase (Server)
      |       +---> FeatureCard x6 (Server)
      +---> AIWorkflow (Server)
      |       +---> WorkflowStep x4 (Server)
      |       +---> Arrow connectors (CSS)
      +---> CTASection (Server)
      |       +---> Button (Client - existing)
      +---> Testimonials (Server)
      |       +---> TestimonialCard x3 (Server)
      +---> CTASection (Server)
```

### Recommended Project Structure

```
src/components/landing/
  navbar.tsx              # Existing (Phase 1)
  mobile-nav.tsx          # Existing (Phase 1)
  hero.tsx                # Existing (Phase 1)
  hero-blob.tsx           # Existing (Phase 1)
  landing-layout.tsx      # Existing (Phase 1)
  feature-showcase.tsx    # NEW - Section wrapper with grid
  feature-card.tsx        # NEW - Individual feature card
  ai-workflow.tsx         # NEW - Pipeline section
  workflow-step.tsx       # NEW - Individual pipeline step
  testimonials.tsx        # NEW - Testimonials section
  testimonial-card.tsx    # NEW - Individual testimonial card
  cta-section.tsx         # NEW - Reusable CTA banner
```

### Pattern 1: Server Component for Static Content
**What:** Use server components for all new sections since they contain no interactivity
**When to use:** Sections with static content, no event handlers, no browser APIs
**Example:**
```tsx
// Source: Existing pattern from landing-layout.tsx
// Server component — no "use client" directive
export function FeatureShowcase() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Grid of FeatureCards */}
      </div>
    </section>
  );
}
```

### Pattern 2: Icon Usage with Tailwind Sizing
**What:** Import Lucide icons and size via Tailwind className (not size prop)
**When to use:** All icon rendering in new components
**Example:**
```tsx
// Source: Existing pattern from navbar.tsx (Menu icon) and mobile-nav.tsx (X icon)
import { FileText } from "lucide-react";

<FileText className="h-6 w-6 text-hero-start" />
```

### Pattern 3: Gradient Section Backgrounds
**What:** Use Tailwind gradient utilities for section backgrounds
**When to use:** Section-to-section transitions, subtle background treatments
**Example:**
```tsx
// Source: Tailwind CSS 4 docs (verified via Context7)
// Hero fades to white: hero section ends with bg-gradient-to-b ... to-white
// Content sections use subtle gradients between them
<section className="bg-gradient-to-b from-slate-50 to-white py-24">
```

### Pattern 4: Reduced Motion Handling
**What:** Use motion-safe: variant for transitions/animations
**When to use:** Any hover effect, transition, or animation in new components
**Example:**
```tsx
// Source: Tailwind CSS 4 docs (verified via Context7)
<div className="transition-transform motion-safe:hover:scale-105">
```

### Anti-Patterns to Avoid
- **Client components for static content:** Do NOT add `"use client"` to FeatureCard, TestimonialCard, or WorkflowStep — they have no event handlers or browser APIs
- **New icon library:** Do NOT install heroicons or react-icons — lucide-react is already the project standard
- **Custom CSS for grids:** Do NOT use inline styles or custom CSS for grid layouts — use Tailwind grid utilities
- **Hardcoded colors:** Do NOT use raw hex colors in components — use the theme variables defined in globals.css (`text-hero-start`, `text-accent`, etc.)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Responsive grid layout | Custom CSS Grid with media queries | Tailwind `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` | Tailwind handles breakpoints, gap, and responsive behavior automatically |
| Icon sizing and coloring | Custom SVG components or inline styles | Lucide React with `className="h-6 w-6 text-color"` | Lucide icons inherit color via currentColor; Tailwind handles sizing |
| Gradient backgrounds | Custom CSS gradient definitions | Tailwind `bg-gradient-to-b from-color to-color` | Already used in hero; backward-compatible with Tailwind CSS 4 |
| Hover transitions | Custom CSS transitions | Tailwind `transition-all motion-safe:hover:scale-105` | Built-in, consistent, respects reduced-motion |
| Reduced motion | Custom @media query in style tag | Tailwind `motion-reduce:transition-none` | Cleaner than inline styles; already available in Tailwind CSS 4 |

**Key insight:** This phase is entirely presentational. No business logic, no data fetching, no state management. Every component should be as simple as possible — static HTML structured with Tailwind utilities.

## Common Pitfalls

### Pitfall 1: Adding "use client" to Static Components
**What goes wrong:** Components like FeatureCard or TestimonialCard get `"use client"` directive unnecessarily
**Why it happens:** Habit from building interactive components; fear that animations need client-side code
**How to avoid:** Only add `"use client"` if the component uses useState, useEffect, event handlers, or browser APIs. Hover effects via Tailwind CSS classes (hover:scale-105) work in server components.
**Warning signs:** Component has no state, no effects, no event handlers — it does NOT need "use client"

### Pitfall 2: Inconsistent Gradient Syntax
**What goes wrong:** Mix of `bg-gradient-to-*` (v3 compat) and `bg-linear-to-*` (v4 canonical) across components
**Why it happens:** Phase 1 hero uses `bg-gradient-to-br`; new code might use either syntax
**How to avoid:** Use `bg-gradient-to-*` consistently — it is verified backward-compatible with Tailwind CSS 4 (build passes). The planner should decide: keep v3 compat syntax for consistency with Phase 1, or migrate all to v4 canonical.
**Warning signs:** Different gradient syntaxes in different section components

### Pitfall 3: Pipeline Arrow Responsiveness
**What goes wrong:** Horizontal arrows break on mobile; pipeline looks cramped at 375px
**Why it happens:** Horizontal flex layout with arrows doesn't reflow naturally
**How to avoid:** Use `flex-col md:flex-row` for the pipeline container. On mobile, steps stack vertically with down-arrows. On desktop, steps go horizontal with right-arrows. Plan the arrow component to accept a direction prop.
**Warning signs:** Pipeline overflows horizontally on mobile viewport

### Pitfall 4: Testimonial Grid Breaking at Medium Breakpoints
**What goes wrong:** 3-column grid looks wrong between 768px and 1024px (tablet)
**Why it happens:** `md:grid-cols-3` activates at 768px but cards may be too narrow
**How to avoid:** Use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for testimonials — 2 columns on tablet, 3 on desktop. Or use `md:grid-cols-3` if the content fits (test with actual card content).
**Warning signs:** Cards overflow or text wraps awkwardly at tablet widths

### Pitfall 5: Gradient Fade Not Matching Phase 1 Decision
**What goes wrong:** Hero-to-content transition doesn't create the gradient fade effect specified in D-15
**Why it happens:** Phase 1 D-03 said "sharp edge (no fade)" but Phase 2 D-15 overrides this with gradient fade
**How to avoid:** Modify the hero component's bottom edge to use `bg-gradient-to-b ... to-white` and ensure the first content section starts with `bg-white`. The hero currently has a hard edge — this needs to be updated.
**Warning signs:** Visible hard line between hero gradient and first content section

## Code Examples

Verified patterns from official sources and existing codebase:

### Feature Card (Server Component)
```tsx
// Source: Existing pattern from landing-layout.tsx + Tailwind CSS 4 grid docs
// No "use client" — this is static content
import { FileText } from "lucide-react";

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all motion-safe:hover:shadow-md motion-safe:hover:-translate-y-1">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-hero-start/10">
        <Icon className="h-6 w-6 text-hero-start" />
      </div>
      <h3 className="font-heading text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 text-sm text-text-secondary">{description}</p>
    </div>
  );
}
```

### Section with Gradient Background
```tsx
// Source: Tailwind CSS 4 gradient docs (verified via Context7)
// Hero-to-content gradient fade (D-15 override of Phase 1 D-03)
<section className="bg-gradient-to-b from-hero-start/5 to-white py-24">
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Section content */}
  </div>
</section>
```

### Reusable CTA Section
```tsx
// Source: Existing Button component pattern from navbar.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTASection({ headline, subtext }: { headline: string; subtext: string }) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="font-heading text-3xl font-bold text-text-primary">{headline}</h2>
        <p className="mt-4 text-text-secondary">{subtext}</p>
        <div className="mt-8">
          <Link href="/register">
            <Button variant="gradient" size="lg">Sign Up for Free</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
```

### Workflow Step with Arrow
```tsx
// Source: Flexbox pipeline pattern (verified via web search)
// Responsive: horizontal on desktop, vertical on mobile
<div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
  {/* Step */}
  <div className="flex flex-col items-center text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white font-heading font-bold">
      1
    </div>
    <span className="mt-2 text-sm font-medium text-text-primary">Resume Analysis</span>
  </div>
  {/* Arrow (hidden on mobile, shown on desktop) */}
  <div className="hidden md:block text-text-secondary">→</div>
  {/* Down arrow (shown on mobile, hidden on desktop) */}
  <div className="block md:hidden text-text-secondary">↓</div>
  {/* Next step... */}
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| bg-gradient-to-* (Tailwind v3) | bg-linear-to-* (Tailwind v4 canonical) | Tailwind CSS 4 release | bg-gradient-to-* still works as backward-compat alias; both syntaxes valid |
| Inline @media (prefers-reduced-motion) | Tailwind motion-safe: / motion-reduce: variants | Tailwind CSS 4 | Cleaner syntax, no inline style tags needed |
| Geist Sans/Mono fonts | Space Grotesk + Inter fonts | Phase 1 | Already configured in layout.tsx via next/font/google |

**Deprecated/outdated:**
- `bg-gradient-to-*`: Still works but `bg-linear-to-*` is the canonical v4 name. Use whichever is consistent with existing code (Phase 1 uses `bg-gradient-to-*`).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Hero component will need minor modification to support gradient fade to first section (D-15 override of Phase 1 D-03) | Architecture | Low — the hero already has a gradient; adding `to-white` is trivial |
| A2 | All new section components can be server components (no "use client" needed) | Common Pitfalls | Low — static content with Tailwind hover effects works in server components |
| A3 | Pipeline arrows can be done with CSS text characters or simple SVG (no library needed) | Don't Hand-Roll | Low — arrows are decorative, not interactive |
| A4 | Testimonials use placeholder data hardcoded in the component (no backend needed per LP-04) | Standard Stack | Low — requirements explicitly say "placeholder data" for v1 |

## Open Questions

1. **Should the hero bottom edge be modified for gradient fade?**
   - What we know: Phase 1 D-03 said "sharp edge (no fade)" but Phase 2 D-15 overrides this with gradient fade
   - What's unclear: Whether to modify hero.tsx or handle the fade purely from the first content section's top gradient
   - Recommendation: Handle from both sides — hero adds `bg-gradient-to-b ... to-white` at bottom, first section adds subtle `bg-white` with optional top gradient overlay. This is the cleanest approach.

2. **Should new components use motion-safe: variant or inline style tag?**
   - What we know: Phase 1 hero uses inline `<style>` tag for prefers-reduced-motion; Tailwind CSS 4 has motion-safe:/motion-reduce: variants
   - What's unclear: Which approach to standardize on going forward
   - Recommendation: Use Tailwind `motion-safe:` variant for new components — it is cleaner and more maintainable. The hero's inline style can be migrated in Phase 3 polish.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/dev | Yes | 20+ | — |
| npm | Package management | Yes | 9+ | — |
| lucide-react | Icons | Yes | ^1.24.0 | — |
| Tailwind CSS | Styling | Yes | ^4 | — |
| React | UI framework | Yes | 19.2.4 | — |
| Next.js | App framework | Yes | 16.2.10 | — |

**Missing dependencies with no fallback:** None
**Missing dependencies with fallback:** None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.10 |
| Config file | vitest.config.ts |
| Quick run command | `npm run test` |
| Full suite command | `npm run test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LP-02 | Feature showcase renders 6 feature cards with icons | smoke | `npm run test -- --testNamePattern="feature"` | No — Wave 0 |
| LP-03 | AI workflow renders 4 pipeline steps with arrows | smoke | `npm run test -- --testNamePattern="workflow"` | No — Wave 0 |
| LP-04 | Testimonials renders 3 cards with initials, quotes, attribution | smoke | `npm run test -- --testNamePattern="testimonial"` | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test && npm run lint && npm run typecheck`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/test/feature-showcase.test.tsx` — covers LP-02
- [ ] `src/test/ai-workflow.test.tsx` — covers LP-03
- [ ] `src/test/testimonials.test.tsx` — covers LP-04

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth logic in this phase |
| V3 Session Management | No | No session logic in this phase |
| V4 Access Control | No | No access control in this phase |
| V5 Input Validation | No | No user input in this phase |
| V6 Cryptography | No | No cryptographic operations in this phase |

### Known Threat Patterns for Landing Page Components

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via user-supplied testimonial content | Tampering | Content is hardcoded (no user input); if dynamic later, sanitize with DOMPurify |
| Clickjacking on CTA links | Elevation | Links use next/link with relative paths to /register; no external URLs |

## Sources

### Primary (HIGH confidence)
- Tailwind CSS 4 responsive design docs (tailwindcss.com/docs/responsive-design) - Grid breakpoints, responsive utilities
- Tailwind CSS 4 gradient docs (tailwindcss.com/docs/gradient-color-stops) - Gradient syntax, color stops, section fades
- Tailwind CSS 4 hover/focus docs (tailwindcss.com/docs/hover-focus-and-other-states) - motion-safe:/motion-reduce: variants
- Lucide React docs (lucide.dev/guide/packages/lucide-react) - Icon import, sizing, color inheritance

### Secondary (MEDIUM confidence)
- Existing codebase: src/components/landing/hero.tsx - Fade-in animation pattern, gradient background, reduced-motion handling
- Existing codebase: src/components/landing/navbar.tsx - Lucide icon usage pattern (className sizing), scroll state management
- Existing codebase: src/components/ui/button.tsx - Button component with gradient variant for CTAs
- Existing codebase: src/app/globals.css - Theme variables (hero-start, hero-end, accent, text-primary, text-secondary)
- Existing codebase: src/app/page.tsx - Server component structure, LandingLayout composition

### Tertiary (LOW confidence)
- Web search results on responsive stepper/pipeline CSS patterns (general best practices, not verified against specific source)

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH - All libraries already installed and verified in the codebase; no new dependencies needed
- Architecture: HIGH - Clear patterns from Phase 1; all new components follow established server-component pattern
- Pitfalls: MEDIUM - Gradient syntax compatibility verified via build; pipeline responsiveness is a known challenge area

**Research date:** 2026-07-16
**Valid until:** 2026-08-15 (30 days — Tailwind CSS 4 and Lucide are stable)
