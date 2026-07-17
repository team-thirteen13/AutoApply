# Phase 1: Foundation & Hero - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-16
**Phase:** 1-Foundation & Hero
**Areas discussed:** Hero layout composition, Color palette, Navigation mobile, Hero visual element

---

## Hero layout composition

| Option | Description | Selected |
|--------|-------------|----------|
| Centered text + gradient | Full-width hero with centered headline, subheadline, and CTA. Background uses a bold gradient. | ✓ |
| Split layout | Text on one side, visual/graphic on the other. More complex, more visually rich. | |
| Centered + abstract shapes | Centered text with abstract geometric shapes or blobs as background elements. | |

**User's choice:** Centered text + gradient (Recommended)
**Notes:** Matches Stripe/Notion inspiration. Clean, modern SaaS look.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Full-section gradient | The entire hero section has a gradient background. Text overlays it. | ✓ |
| Text area only | Gradient applied only behind the headline/subheadline area. More subtle. | |
| You decide | Let me pick the best approach. | |

**User's choice:** Full-section gradient (Recommended)
**Notes:** Immersive, most common in modern SaaS landing pages.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Contained | Hero gradient is full-width, text in max-width container (max-w-6xl). | ✓ |
| Full-bleed text | Text spans full viewport width. More dramatic, harder to read on ultra-wide. | |
| You decide | Let me pick the best approach. | |

**User's choice:** Contained (Recommended)
**Notes:** Keeps text readable, prevents overly long line lengths.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Sharp edge | Hero gradient ends cleanly at the bottom. Next section starts on white. | ✓ |
| Soft fade | Hero gradient fades out at the bottom, blending into next section. | |
| You decide | Let me pick the best approach. | |

**User's choice:** Sharp edge (Recommended)
**Notes:** Simple, clean, modern.

---

## Color palette

| Option | Description | Selected |
|--------|-------------|----------|
| Deep blue → purple gradient | Modern SaaS feel (Stripe, Linear). Primary: #1e3a8a → #7c3aed. | ✓ |
| Indigo → cyan gradient | More energetic and techy. Primary: #312e81 → #06b6d4. | |
| You decide | Pick the best palette based on Stripe/Notion inspiration. | |

**User's choice:** Deep blue → purple gradient (Recommended)
**Notes:** Conveys trust + innovation. Works well with white text overlay.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Bright green | High contrast against blue/purple hero. Example: #22c55e. | ✓ |
| Orange | Warm, energetic. Good contrast with cool tones. Example: #f97316. | |
| White/light | Clean, minimal. CTA stands out through shape and size. | |

**User's choice:** Bright green (Recommended)
**Notes:** High contrast, energetic, action-oriented.

---

| Option | Description | Selected |
|--------|-------------|----------|
| White | Clean, high contrast with the gradient hero. Standard SaaS pattern. | ✓ |
| Light gray | Subtle separation between sections. Example: #f9fafb. | |
| You decide | Pick the best based on the overall aesthetic. | |

**User's choice:** White (Recommended)
**Notes:** Clean, high contrast, open and airy.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Tailwind theme variables | Define colors in globals.css via @theme inline. Matches existing Tailwind 4 setup. | ✓ |
| Inline utility classes | Use Tailwind classes directly. Simpler, harder to maintain consistency. | |
| You decide | Pick the best approach for this codebase. | |

**User's choice:** Tailwind theme variables (Recommended)
**Notes:** Enables consistent use across all components. Matches existing Tailwind 4 setup.

---

## Navigation mobile

| Option | Description | Selected |
|--------|-------------|----------|
| Hamburger menu | Classic hamburger icon that opens a slide-out or dropdown menu. | ✓ |
| Bottom bar | Fixed bottom navigation bar on mobile. More app-like feel. | |
| You decide | Pick the best approach for this codebase. | |

**User's choice:** Hamburger menu (Recommended)
**Notes:** Familiar pattern, works well for 3-4 nav items.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Transparent → solid | Nav starts transparent over hero, becomes solid white on scroll. | ✓ |
| Always solid | Nav is always solid white. Simpler, no scroll animation. | |
| You decide | Pick the best approach. | |

**User's choice:** Transparent → solid (Recommended)
**Notes:** Creates visual depth, modern feel. Common in Stripe/Linear.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Slide from right | Menu slides in from the right side. Modern, smooth. | ✓ |
| Fade + scale down | Menu fades in and scales down from the top. Subtle, elegant. | |
| Full-screen overlay | Menu covers the entire screen. Bold, immersive. | |
| You decide | Pick the best animation approach. | |

**User's choice:** Slide from right (Recommended)
**Notes:** Feels native, common in iOS/macOS patterns.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Build from scratch | Create a new MobileNav component. Clean, purpose-built. | ✓ |
| Extend existing Button | Use existing Button component for hamburger trigger. | |
| You decide | Pick the best approach for this codebase. | |

**User's choice:** Build from scratch (Recommended)
**Notes:** No dependency on existing UI primitives. Clean, purpose-built for the landing page.

---

## Hero visual element

| Option | Description | Selected |
|--------|-------------|----------|
| Abstract gradient shapes | CSS/SVG abstract blobs or shapes with gradient colors. Playful, energetic. | ✓ |
| Product screenshot/mockup | Show the actual resume builder UI. More concrete, may look dated. | |
| No visual element | Just the gradient background with text. Clean and minimal. | |
| You decide | Pick the best visual approach. | |

**User's choice:** Abstract gradient shapes (Recommended)
**Notes:** Pure CSS/SVG, fast loading, no images needed.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Behind text, subtle | Shapes positioned behind text with low opacity. Adds depth without competing. | ✓ |
| Below text, decorative | Shapes appear below the headline as a decorative divider. | |
| You decide | Pick the best positioning. | |

**User's choice:** Behind text, subtle (Recommended)
**Notes:** Most common SaaS pattern. Adds depth without distracting from the headline.

---

| Option | Description | Selected |
|--------|-------------|----------|
| CSS gradients + blur | Use CSS radial-gradient with blur filters. Pure CSS, lightweight. | ✓ |
| SVG blobs | Hand-crafted SVG shapes with gradient fills. More control, requires SVG authoring. | |
| CSS only (no blur) | Simple CSS circles/ellipses with gradient fills. Sharp edges, geometric. | |
| You decide | Pick the best technique. | |

**User's choice:** CSS gradients + blur (Recommended)
**Notes:** No images, no SVGs, pure CSS. Lightweight, fast, easy to animate.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Subtle fade-in on load | Text and shapes fade in when page loads. Respects prefers-reduced-motion. | ✓ |
| No animation | Static hero. Fastest load, no motion. | |
| You decide | Pick the best approach. | |

**User's choice:** Subtle fade-in on load (Recommended)
**Notes:** Simple, elegant, no distraction. Respects prefers-reduced-motion.

---

## Claude's Discretion

- Exact gradient angle, blur radius, and shape positions — use aesthetic judgment
- Specific font sizes and spacing within the Tailwind theme — follow Stripe/Notion SaaS patterns
- Nav bar height, padding, and breakpoint behavior — standard responsive patterns

## Deferred Ideas

None — discussion stayed within phase scope.
