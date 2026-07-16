# Stack Research

**Domain:** Landing page design for AI-powered resume builder
**Researched:** 2026-07-16
**Confidence:** MEDIUM

## Recommended Stack

### Core Technologies (Already Installed)

These are the existing foundation — no changes needed.

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.2.10 | React framework with App Router | Already in project; server components, streaming, image optimization built-in |
| React | 19.2.4 | UI library | Already in project; concurrent features, Server Components support |
| Tailwind CSS | 4.x | Utility-first CSS | Already in project; CSS-first config with `@theme` directive, perfect for bold landing pages |
| TypeScript | 5.x | Type safety | Already in project; catches errors at build time |

### Landing Page Stack (New Dependencies)

These are the additions needed to build a bold, energetic landing page like Stripe/Notion.

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `motion` | ^11.x | Animation library | Formerly framer-motion; best React 19 + Next.js App Router support; declarative animations, layout animations, scroll-triggered effects, gestures |
| `lenis` | ^1.1.x | Smooth scrolling | Buttery-smooth scroll experience; pairs with motion for scroll-triggered animations; lightweight (~5kB) |
| `@fontsource-variable/space-grotesk` | ^5.x | Variable font (headings) | Bold, modern, tech-forward; variable font = single file for all weights; great for hero sections |
| `@fontsource-variable/inter` | ^5.x | Variable font (body) | Clean, highly readable; excellent for body text and UI elements |

### Component Pattern: Custom Landing Page Components

Rather than pulling in a heavy component library, build custom components using Tailwind + motion. This gives full control over the bold aesthetic and avoids vendor lock-in.

| Component | Purpose | Implementation |
|-----------|---------|----------------|
| `FadeInView` | Scroll-triggered fade-in | `motion.div` with `whileInView` |
| `StaggerChildren` | Sequential child animations | `motion.div` with `staggerChildren` variant |
| `ParallaxSection` | Depth effect on scroll | `motion.div` with `scrollY` transform |
| `GradientText` | Bold gradient headlines | Tailwind `bg-gradient-to-r bg-clip-text text-transparent` |
| `BentoGrid` | Feature showcase layout | CSS Grid with motion hover effects |
| `AnimatedCounter` | Social proof numbers | `motion.span` with `useInView` |

## Installation

```bash
# Animation
npm install motion lenis

# Typography
npm install @fontsource-variable/space-grotesk @fontsource-variable/inter
```

No additional dev dependencies needed — Tailwind CSS 4 and TypeScript are already configured.

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `framer-motion` (old package) | Deprecated alias; may have compatibility gaps with React 19 | `motion` (the new package name) |
| GSAP for this project | Overkill for landing page animations; requires client-only components, larger bundle (~25kB), steeper learning curve | `motion` — simpler API, React-native, ~30kB but with more features you actually need |
| `@aceternity-ui` | Heavy dependency; pulls in many components you won't use; may conflict with existing UI patterns | Custom components with `motion` — full control, no bloat |
| `react-scroll` or `react-intersection-observer` | Unnecessary when `motion` has `whileInView` built-in | `motion`'s viewport detection |
| `@next/font` (legacy) | Next.js 16 uses `next/font` (not `@next/font`) | `next/font/google` or `@fontsource-variable/*` |
| `tailwind.config.js` | Tailwind CSS 4 uses CSS-first config with `@theme` directive | `globals.css` with `@theme` block |

## Stack Patterns by Variant

**If building a Stripe-style gradient hero:**
- Use `motion` for entrance animations (staggered fade-in of headline, subtext, CTA)
- Use CSS `background: radial-gradient(...)` or `mesh-gradient` for animated backgrounds
- Pair with `lenis` for smooth scroll into feature sections

**If building a Notion-style clean layout:**
- Focus on typography and whitespace over animation
- Use `motion` sparingly — only for scroll-triggered reveals
- Use `Space Grotesk` for headlines, `Inter` for body

**If adding hover interactions on cards:**
- Use `motion`'s `whileHover` prop for scale/rotation effects
- Use CSS `transition` for simple color/shadow changes
- Avoid GSAP for hover — `motion` is simpler and performant

## Typography Configuration

### globals.css additions

```css
/* Fonts */
@import "@fontsource-variable/space-grotesk";
@import "@fontsource-variable/inter";

@theme inline {
  --font-heading: "Space Grotesk Variable", "Space Grotesk", sans-serif;
  --font-body: "Inter Variable", "Inter", sans-serif;
}
```

### Usage in components

```tsx
<h1 className="font-heading text-6xl font-extrabold tracking-tight text-zinc-900">
  Bold Headline
</h1>
<p className="font-body text-xl text-zinc-500">
  Supporting copy
</p>
```

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `motion@^11` | `react@19.x`, `next@16.x` | Use `"use client"` directive in App Router |
| `lenis@^1.1` | `react@19.x`, `next@16.x` | Must be client-side only; wrap in `"use client"` |
| `@fontsource-variable/*` | `next@16.x` | Import in CSS or component; no special config needed |
| `tailwindcss@4.x` | `motion`, `lenis` | No conflicts; Tailwind handles styling, motion handles animation |

## Performance Considerations

| Concern | Approach |
|---------|----------|
| Bundle size | `motion` (~30kB) + `lenis` (~5kB) = ~35kB added; acceptable for landing page |
| Font loading | Variable fonts = single file per font; `@fontsource` bundles them locally (no FOUT) |
| Animation perf | `motion` uses CSS transforms and opacity (composited, GPU-accelerated) |
| Scroll perf | `lenis` uses `requestAnimationFrame` + `IntersectionObserver`; lightweight |
| SEO | Landing page is mostly static content; animations are progressive enhancement |

## Sources

- motion.dev — Official docs for motion (formerly framer-motion)
- lenis.darkroom.engineering — Official Lenis docs
- tailwindcss.com — Tailwind CSS 4 documentation
- @fontsource — Variable font packages for self-hosted fonts

---

*Stack research for: AutoApply landing page*
*Researched: 2026-07-16*
