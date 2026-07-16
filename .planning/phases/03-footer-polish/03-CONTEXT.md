# Phase 3: Footer & Polish - Context

**Gathered:** 2026-07-16
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase completes the landing page with a 4-column footer and applies full responsive, accessibility, and performance polish across the entire page. The footer provides navigation links and copyright, while polish ensures the page is production-ready at all viewports with WCAG 2.1 AA compliance and strong Lighthouse scores.

**Requirements:** LP-06 (Mobile-First Responsive Design), LP-08 (Footer with Relevant Links)

</domain>

<decisions>
## Implementation Decisions

### Footer Content & Structure
- **D-01:** Minimal links: Product (Features, Pricing), Resources (Blog, Help Center), Company (About, Contact), Legal (Privacy, Terms)
- **D-02:** No social media icons — keep footer minimal
- **D-03:** Dynamic copyright year (© {currentYear} AutoApply) — auto-updates via JavaScript
- **D-04:** Contained layout (max-w-6xl) — matches hero and other sections for consistency
- **D-05:** Bottom section: Copyright text + repeated key links (Privacy, Terms) for accessibility

### Footer Visual Treatment
- **D-06:** Dark background (gray-900) with light text — classic SaaS footer aesthetic
- **D-07:** Gradient fade from content to footer — matches section transitions from Phase 2
- **D-08:** Mobile layout: columns stack vertically — simple, readable, standard SaaS pattern

### Accessibility (WCAG 2.1 AA)
- **D-09:** Comprehensive ARIA patterns: landmark roles, live regions for dynamic content, aria-labels for all interactive elements
- **D-10:** Focus trap for mobile navigation — prevents keyboard users from tabbing behind the menu, restores focus on close
- **D-11:** Skip-to-content link — hidden by default, appears on focus, allows keyboard users to bypass nav

### Performance
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — Full v1 requirements (LP-06, LP-08 apply to this phase)
- `.planning/ROADMAP.md` — Phase 3 details, success criteria, plan structure

### Codebase Context
- `src/app/page.tsx` — Current landing page structure (Phases 1-2 foundation)
- `src/components/landing/` — All existing landing components to polish
- `src/app/globals.css` — Tailwind theme setup (may need footer-specific variables)
- `.planning/codebase/CONVENTIONS.md` — Naming, imports, file structure patterns
- `.planning/codebase/STRUCTURE.md` — Directory layout, where to add footer component
- `.planning/codebase/STACK.md` — Tech stack details (Tailwind 4, Next.js 16, React 19)

### Prior Phase Context
- `.planning/phases/01-foundation-hero/01-CONTEXT.md` — Phase 1 decisions (color palette, typography, hero layout, nav)
- `.planning/phases/02-content-sections/02-CONTEXT.md` — Phase 2 decisions (section gradients, CTAs, responsive patterns)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/landing/navbar.tsx` — Existing nav component (needs focus trap + skip link)
- `src/components/landing/mobile-nav.tsx` — Mobile nav (needs focus trap implementation)
- `src/components/ui/button.tsx` — Button component for any footer CTAs
- `src/app/globals.css` — Tailwind theme (extend with footer color variables)

### Established Patterns
- Server components for pages, `"use client"` for interactive components
- `@/` path alias for all internal imports
- Section gradients between sections (Phase 2 D-14/D-15)
- Contained layout (max-w-6xl) for content sections

### Integration Points
- `src/app/page.tsx` — Add footer component at bottom
- `src/components/landing/` — Add new Footer component
- `src/app/globals.css` — Add footer-specific gradient variables
- `src/app/layout.tsx` — Verify next/font setup for Space Grotesk + Inter

</code_context>

<specifics>
## Specific Ideas

- Footer should feel like a distinct section — dark background creates clear separation
- Gradient fade from content to footer matches the visual flow established in Phase 2
- Skip-to-content link is essential for keyboard users on a multi-section landing page
- Focus trap for mobile nav is standard a11y — prevents confusing keyboard navigation
- Lazy loading improves LCP by deferring below-the-fold content until needed
- Dynamic copyright year avoids manual updates — small but useful detail
- Repeated Privacy/Terms links in footer bottom improves accessibility (users don't have to scroll up)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 3-Footer & Polish*
*Context gathered: 2026-07-16*
