# Phase 3: Footer & Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-16
**Phase:** 3-Footer & Polish
**Areas discussed:** Footer content & links, Footer visual treatment, Accessibility scope, Performance budget

---

## Footer content & links

### Link structure

| Option | Description | Selected |
|--------|-------------|----------|
| Standard SaaS links | Product: Features, Pricing, Demo, Integrations \| Resources: Blog, Help Center, API Docs, Status \| Company: About, Careers, Contact, Press \| Legal: Privacy, Terms, Security, Cookies | |
| Minimal links | Product: Features, Pricing \| Resources: Blog, Help Center \| Company: About, Contact \| Legal: Privacy, Terms | ✓ |
| You decide | Claude picks appropriate links for an AI-powered job application platform | |

**User's choice:** Minimal links
**Notes:** User prefers a cleaner footer with fewer links — reduces cognitive load.

### Social icons

| Option | Description | Selected |
|--------|-------------|----------|
| Twitter/X + LinkedIn + GitHub | Common for developer/SaaS products — covers professional + open-source presence | |
| Twitter/X + LinkedIn | Professional focus only — no GitHub if not open-source | |
| None | No social icons — keep footer minimal | ✓ |

**User's choice:** None
**Notes:** User wants to keep the footer minimal — no social media presence needed for v1.

### Copyright text

| Option | Description | Selected |
|--------|-------------|----------|
| Dynamic year | © {currentYear} AutoApply. All rights reserved. (automatically updates) | ✓ |
| Static year | © 2026 AutoApply. All rights reserved. | |
| Minimal | © AutoApply (no year, no rights reserved) | |

**User's choice:** Dynamic year
**Notes:** Auto-updating year avoids manual maintenance.

### Footer layout

| Option | Description | Selected |
|--------|-------------|----------|
| Contained (max-w-6xl) | Matches hero and other sections — consistent width throughout the page | ✓ |
| Full-width | Spans entire viewport — footer feels like a distinct section | |
| You decide | Claude picks based on what looks best with the design | |

**User's choice:** Contained (max-w-6xl)
**Notes:** Consistency with other sections is prioritized.

---

## Footer visual treatment

### Color scheme

| Option | Description | Selected |
|--------|-------------|----------|
| Dark (gray-900) | Classic SaaS footer — dark background with light text. Creates clear separation from content. | ✓ |
| Light (white) | Continues the page's white background — seamless feel, no hard break | |
| Gradient | 续 hero gradient style — ties back to the top of the page | |

**User's choice:** Dark (gray-900)
**Notes:** Classic SaaS footer aesthetic — dark background creates clear visual separation.

### Top edge treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Subtle border | Thin gray-700 border — clean separation without heavy visual break | |
| Gradient fade | Gradual transition from white to dark — more elegant, matches section transitions | ✓ |
| Hard cut | No transition — immediate color change, bold and direct | |

**User's choice:** Gradient fade
**Notes:** Matches the section transition pattern established in Phase 2.

### Mobile column layout

| Option | Description | Selected |
|--------|-------------|----------|
| Stack vertically | Each column stacks on mobile — simple, readable, matches most SaaS footers | ✓ |
| 2x2 grid | Two columns per row on mobile — more compact, but text might be small | |
| You decide | Claude picks the best mobile layout | |

**User's choice:** Stack vertically
**Notes:** Simplicity and readability on mobile are prioritized.

### Bottom section content

| Option | Description | Selected |
|--------|-------------|----------|
| Copyright only | Just the dynamic year copyright text — clean and minimal | |
| Copyright + tagline | © {year} AutoApply + short tagline like 'AI-powered job applications' | |
| Copyright + links | © {year} AutoApply + repeated key links (Privacy, Terms) for accessibility | ✓ |

**User's choice:** Copyright + links
**Notes:** Repeated Privacy/Terms links improve accessibility — users don't have to scroll up.

---

## Accessibility scope

### WCAG compliance level

| Option | Description | Selected |
|--------|-------------|----------|
| WCAG 2.1 AA (Recommended) | Industry standard — covers color contrast, keyboard nav, screen reader support. Most SaaS products target this. | ✓ |
| WCAG 2.1 A | Basic level — minimum legal compliance in some regions. Less rigorous contrast/interaction requirements. | |
| You decide | Claude picks appropriate level for a marketing landing page | |

**User's choice:** WCAG 2.1 AA (Recommended)
**Notes:** Industry standard for SaaS products — good balance of compliance and implementation effort.

### ARIA patterns

| Option | Description | Selected |
|--------|-------------|----------|
| Essential only | Focus management for mobile nav, skip-to-content link, proper heading hierarchy, alt text for images | |
| Comprehensive | Essential + landmark roles, live regions for dynamic content, aria-labels for all interactive elements | ✓ |
| You decide | Claude picks patterns appropriate for a marketing landing page | |

**User's choice:** Comprehensive
**Notes:** User wants thorough accessibility coverage — landmark roles, live regions, aria-labels.

### Focus trap for mobile nav

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, trap focus | Standard a11y pattern — prevents keyboard users from tabbing behind the menu. Requires focus restoration on close. | ✓ |
| No focus trap | Simpler implementation — users can tab through the rest of the page while menu is open | |
| You decide | Claude picks based on a11y best practices | |

**User's choice:** Yes, trap focus
**Notes:** Standard accessibility pattern — prevents confusing keyboard navigation.

### Skip-to-content link

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, add skip link | Hidden by default, appears on focus — allows keyboard users to bypass nav. Standard a11y pattern. | ✓ |
| No skip link | Not critical for a single-page landing page with minimal nav | |
| You decide | Claude picks based on a11y best practices | |

**User's choice:** Yes, add skip link
**Notes:** Essential for keyboard users on a multi-section landing page.

---

## Performance budget

### Performance targets

| Option | Description | Selected |
|--------|-------------|----------|
| ROADMAP targets only | Stick to the success criteria: Lighthouse >90, LCP <2.5s, CLS <0.1. No extra constraints. | ✓ |
| Aggressive targets | Lighthouse >95, LCP <1.8s, CLS <0.05 — push for best-in-class marketing page performance | |
| You decide | Claude picks appropriate targets based on current page state | |

**User's choice:** ROADMAP targets only
**Notes:** No need to over-engineer — the ROADMAP criteria are sufficient for v1.

### Lazy loading

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, lazy load | Use Intersection Observer to load sections as they scroll into view — improves initial LCP | ✓ |
| No lazy loading | Load everything upfront — simpler implementation, page is small enough | |
| You decide | Claude picks based on current bundle size and performance needs | |

**User's choice:** Yes, lazy load
**Notes:** Improves initial LCP by deferring below-the-fold content.

### Image optimization

| Option | Description | Selected |
|--------|-------------|----------|
| Next/Image for all | Use Next.js Image component with automatic optimization, lazy loading, and responsive sizes | ✓ |
| CSS only (no images) | Current design uses CSS gradients and Lucide icons — no actual image files to optimize | |
| You decide | Claude picks based on current design needs | |

**User's choice:** Next/Image for all
**Notes:** Future-proofs for when actual images are added (testimonials, etc.).

### Font loading

| Option | Description | Selected |
|--------|-------------|----------|
| next/font (Recommended) | Auto-optimizes fonts: self-hosts, preloads, generates fallback CSS. Built into Next.js. | ✓ |
| Google Fonts CDN | External CDN — simpler setup but adds DNS lookup + render-blocking request | |
| You decide | Claude picks the best font loading strategy | |

**User's choice:** next/font (Recommended)
**Notes:** Built into Next.js — optimal performance with minimal configuration.

---

## Claude's Discretion

- Exact gradient colors and angles for footer transition — use aesthetic judgment consistent with Phase 1 palette
- Focus trap implementation details — standard React patterns
- Skip-to-content link positioning and styling — hidden offscreen, visible on focus
- Lazy loading threshold and intersection observer configuration — standard patterns
- Footer column spacing and typography — follow Stripe/Notion SaaS patterns

## Deferred Ideas

None — discussion stayed within phase scope.
