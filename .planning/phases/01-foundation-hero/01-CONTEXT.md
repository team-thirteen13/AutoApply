# Phase 1: Foundation & Hero - Context

**Gathered:** 2026-07-16
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the landing page foundation: page structure, sticky navigation with auth-aware CTAs, hero section with sign-up CTA, and a bold visual identity (Stripe/Notion-inspired). Visitors land on a polished page and immediately understand what AutoApply does, with a clear path to sign up.

**Requirements:** LP-01 (Hero Section), LP-05 (Bold Visual Style), LP-07 (Navigation)

</domain>

<decisions>
## Implementation Decisions

### Hero Layout
- **D-01:** Hero uses centered text layout with a full-section gradient background
- **D-02:** Hero gradient is full-width, but text content is in a max-width container (max-w-6xl)
- **D-03:** Hero transitions to the next section with a sharp edge (no fade)

### Color Palette
- **D-04:** Primary gradient: deep blue (#1e3a8a) → purple (#7c3aed) — modern SaaS feel
- **D-05:** CTA button accent: bright green (#22c55e) — high contrast, energetic
- **D-06:** Body background for non-hero sections: white — clean, high contrast
- **D-07:** Color system defined as Tailwind theme variables in globals.css via @theme inline

### Navigation (Mobile)
- **D-08:** Mobile navigation uses a hamburger menu pattern
- **D-09:** Nav bar transitions from transparent (over hero) to solid white on scroll
- **D-10:** Mobile menu animates with a slide-from-right transition
- **D-11:** Mobile menu built from scratch as a new MobileNav component (not reusing existing UI primitives)

### Hero Visual Element
- **D-12:** Hero includes abstract gradient shapes (CSS/SVG blobs) behind the text
- **D-13:** Shapes positioned behind text with low opacity — adds depth without competing with headline
- **D-14:** Shapes created using CSS gradients + blur filters (pure CSS, no images/SVGs)
- **D-15:** Hero has a subtle fade-in animation on page load, respects prefers-reduced-motion

### Claude's Discretion
- Exact gradient angle, blur radius, and shape positions — use aesthetic judgment
- Specific font sizes and spacing within the Tailwind theme — follow Stripe/Notion SaaS patterns
- Nav bar height, padding, and breakpoint behavior — standard responsive patterns

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — Full v1 requirements (LP-01, LP-05, LP-07 apply to this phase)
- `.planning/ROADMAP.md` — Phase 1 details, success criteria, plan structure

### Codebase Context
- `src/app/page.tsx` — Current home page to be replaced with new landing page
- `src/app/layout.tsx` — Root layout (fonts: Geist Sans/Mono, needs Space Grotesk + Inter)
- `src/app/globals.css` — Current Tailwind theme setup (needs color variables added)
- `src/components/ui/` — Existing UI components (Button, Input, etc.) for reference
- `.planning/codebase/CONVENTIONS.md` — Naming, imports, file structure patterns
- `.planning/codebase/STRUCTURE.md` — Directory layout, where to add new components
- `.planning/codebase/STACK.md` — Tech stack details (Tailwind 4, Next.js 16, React 19)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/button.tsx` — Existing Button component (can extend or reference for CTA styling)
- `src/lib/supabase/session.ts` — `getAuthenticatedUser()` for auth-state-aware nav rendering
- `lucide-react` — Icon library already installed (for hamburger icon, nav icons)

### Established Patterns
- Server components for pages, `"use client"` for interactive components
- `@/` path alias for all internal imports
- Tailwind 4 via PostCSS plugin (already configured)
- Geist fonts currently in use (will need Space Grotesk + Inter added)

### Integration Points
- `src/app/page.tsx` — Replace current home page with new landing page
- `src/app/layout.tsx` — Add new fonts (Space Grotesk, Inter) to root layout
- `src/app/globals.css` — Add color theme variables via @theme inline

</code_context>

<specifics>
## Specific Ideas

- Stripe/Notion-inspired aesthetic — bold, modern SaaS landing page
- "AutoApply" brand name (not "ApplyAI" as shown in current page)
- Sign-up CTA should be the primary conversion action
- Hero headline should communicate what AutoApply does in under 5 seconds

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Foundation & Hero*
*Context gathered: 2026-07-16*
