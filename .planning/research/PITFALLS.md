# Pitfalls Research

**Domain:** SaaS Landing Page (bold/energetic style, Next.js 16, React 19)
**Researched:** 2026-07-16
**Confidence:** MEDIUM (based on training data + web search synthesis)

## Critical Pitfalls

### Pitfall 1: Hero Section Death — Burying the Value Proposition

**What goes wrong:**
The hero section fails to communicate what AutoApply does and why visitors should care within 5 seconds. Common manifestations: vague headlines like "The #1 AI Platform" that say nothing specific, or cramming too much text that dilutes the message. Visitors bounce because they cannot answer "What's in it for me?" instantly.

**Why it happens:**
Developers focus on visual design (animations, gradients, layout) before nailing the copy hierarchy. The "bold and energetic" brief tempts designers to prioritize style over clarity. Additionally, teams often try to showcase everything at once rather than distilling to one compelling headline.

**How to avoid:**
- Write the hero copy FIRST, before any code. Headline must answer: "What does AutoApply do?" in under 10 words
- Subheadline should clarify the value: "Build AI-optimized resumes that pass ATS screening"
- Single primary CTA above the fold: "Start Building for Free" — not "Learn More" or "Watch Demo"
- Use real product screenshots, not stock photos
- A/B test headline variants before launch

**Warning signs:**
- Multiple competing CTAs visible in the hero
- Headline is longer than 10 words
- Headline contains buzzwords without concrete outcomes
- Hero section requires scrolling to understand what the product does

**Phase to address:**
Phase 1 (Hero & Navigation) — copy and layout must be finalized before pixel-pushing begins

---

### Pitfall 2: Animation Overload Killing Performance and Accessibility

**What goes wrong:**
The "bold and energetic" brief leads to excessive use of Framer Motion animations, scroll-triggered effects, parallax, and particle backgrounds. This causes: (1) LCP delays from heavy JavaScript bundles, (2) CLS from animated elements shifting layout, (3) accessibility failures for users with motion sensitivity, (4) poor mobile performance where these effects are most damaging.

**Why it happens:**
Animations are visually impressive in isolation and during development. Teams import the entire Framer Motion library for a few animations, not realizing the bundle cost. They also forget to implement `prefers-reduced-motion` support, which is a WCAG 2.1 Level AA requirement.

**How to avoid:**
- Use CSS animations/transitions over Framer Motion where possible (smaller bundle, better performance)
- Lazy-load Framer Motion with dynamic import: `const Motion = dynamic(() => import('framer-motion'), { ssr: false })`
- Always wrap animations in `<motion.div>` with `prefers-reduced-motion` media query fallback
- Set animation budgets: max 2-3 subtle entrance animations per section, no looping animations
- Use `will-change` CSS property sparingly and remove after animation completes
- Test with Chrome DevTools Performance tab — any animation causing >16ms frame time needs optimization

**Warning signs:**
- Total JS bundle exceeds 200KB gzipped
- Lighthouse Performance score below 80
- LCP > 2.5s on 4G connection
- No `@media (prefers-reduced-motion: reduce)` in CSS
- Multiple elements animating simultaneously

**Phase to address:**
Phase 2 (Visual Design) — establish animation budget and accessibility requirements before building

---

### Pitfall 3: CLS Catastrophe from Unreserved Layout Space

**What goes wrong:**
Layout shifts occur from: (1) images without explicit width/height, (2) dynamic content injection (banners, cookie consent), (3) late-loading web fonts causing text reflow, (4) placeholder content replaced by real content. CLS > 0.1 causes Google to flag the page as "needs improvement" and creates a jarring user experience.

**Why it happens:**
In the rush to build a visually impressive page, developers use placeholder boxes or skeleton screens without reserving exact space. They also forget that the "bold" design with large display fonts will cause significant text reflow when fonts load.

**How to avoid:**
- ALWAYS set explicit `width` and `height` on every `<Image>` and `<img>` element
- Use `aspect-ratio` CSS property for responsive images
- Preload critical fonts with `next/font` and use `display: swap` with font-display optimization
- Reserve space for dynamic content using `min-height` on containers
- Use skeleton screens that match exact final dimensions
- Run Lighthouse CI on every PR — fail builds with CLS > 0.1

**Warning signs:**
- Lighthouse CLS score > 0.1
- Users reporting "content jumping around" on mobile
- Font-related text reflow visible on page load
- Dynamic content appearing without space reservation

**Phase to address:**
Phase 1 (Hero & Navigation) — establish layout discipline from the start

---

### Pitfall 4: Mobile-First Lip Service

**What goes wrong:**
The page is designed desktop-first and "adapted" for mobile as an afterthought. This results in: (1) cramped hero sections on small screens, (2) CTAs that are too small to tap (less than 44x44px), (3) navigation that doesn't work well on mobile, (4) text that's too small to read without zooming, (5) performance issues from loading desktop-sized images on mobile.

**Why it happens:**
Design tools (Figma, Sketch) default to desktop viewports. Developers test primarily on desktop during development. The "bold" design aesthetic often relies on large typography and spacing that doesn't scale down gracefully.

**How to avoid:**
- Design in Figma at 375px width FIRST, then scale up
- Use `next/image` with `sizes` attribute to serve appropriately sized images per viewport
- Test every component on real mobile devices, not just Chrome DevTools responsive mode
- Ensure all interactive elements meet minimum 44x44px tap target size
- Use responsive typography with `clamp()` for fluid scaling: `font-size: clamp(1rem, 2.5vw, 2rem)`
- Test on slow 3G throttled connection — mobile users often have poor connectivity

**Warning signs:**
- Tapping CTAs on iPhone requires precise finger placement
- Horizontal scrolling on mobile
- Text requires pinch-to-zoom to read
- Page feels "cramped" on 375px viewport
- Mobile Lighthouse score significantly lower than desktop

**Phase to address:**
Phase 1 (Hero & Navigation) — mobile viewport must be tested before any desktop work

---

### Pitfall 5: Accessibility Compliance Theater

**What goes wrong:**
The page appears accessible (has alt text, semantic HTML) but fails real-world accessibility testing: (1) keyboard navigation breaks at custom interactive elements, (2) screen readers cannot navigate the page structure, (3) focus indicators are invisible or missing, (4) color contrast fails WCAG AA standards, (5) dynamic content changes are not announced to assistive technology.

**Why it happens:**
Accessibility is treated as a checklist item rather than a core requirement. Developers add ARIA labels to divs instead of using semantic HTML. They use custom styling that removes default focus indicators for aesthetic reasons. Bold color palettes often fail contrast ratios.

**How to avoid:**
- Use semantic HTML first: `<nav>`, `<main>`, `<section>`, `<button>` instead of styled `<div>` elements
- NEVER remove focus outlines — style them instead: `focus-visible:ring-2 focus-visible:ring-blue-500`
- Include skip-to-content link as first focusable element
- Run axe DevTools on every page
- Test keyboard-only navigation for the entire page
- Verify color contrast with WebAIM Contrast Checker — bold colors often fail 4.5:1 ratio
- Add `aria-live="polite"` to any dynamically updated content

**Warning signs:**
- Cannot navigate the page using only Tab key
- Focus indicator disappears on custom buttons/links
- Screen reader skips sections or cannot find content
- Color contrast checker shows failures on any text
- Lighthouse Accessibility score below 90

**Phase to address:**
Phase 2 (Visual Design) — accessibility requirements must be part of the design system, not bolted on

---

### Pitfall 6: SEO Neglect — Invisible to Search Engines

**What goes wrong:**
The landing page is not discoverable via search because: (1) missing meta title/description, (2) no Open Graph tags for social sharing, (3) missing structured data, (4) JavaScript-rendered content not visible to crawlers, (5) no semantic heading hierarchy. For a SaaS product, organic search is a primary acquisition channel — this is a conversion killer.

**Why it happens:**
Developers focus on visual polish and forget that search engines are the primary visitors. Next.js makes it easy to add meta tags but also easy to forget them when working in client components. The "bold" design may use CSS for text content that crawlers cannot read.

**How to avoid:**
- Add `metadata` export to `src/app/page.tsx` with title, description, openGraph, and twitter cards
- Use Next.js `generateMetadata` for dynamic metadata if needed
- Ensure all text content is in HTML, not CSS `content` property
- Add structured data (JSON-LD) for SoftwareApplication schema
- Use semantic heading hierarchy: one `<h1>`, then `<h2>` for sections, `<h3>` for subsections
- Validate with Google Rich Results Test
- Set canonical URL to prevent duplicate content issues

**Warning signs:**
- Google Search Console shows no indexed pages for the domain
- Social media previews show blank/generic cards
- Page title shows in browser tab but not in search results
- Heading levels skip (h1 -> h3)

**Phase to address:**
Phase 1 (Hero & Navigation) — metadata must be set from the first commit

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Inline styles for one-off tweaks | Faster iteration during design | Inconsistent styling, hard to maintain, breaks design system | Never — use Tailwind utility classes |
| `!important` to override styles | Quick fix for specificity conflicts | Cascading overrides become unmanageable | Never — restructure CSS specificity |
| Importing entire Framer Motion library | Faster development, more animation options | 40KB+ gzipped bundle, hurts LCP | Never — use tree-shaken imports or CSS |
| Hardcoded magic numbers for spacing | Quick alignment fixes | Inconsistent spacing, doesn't scale with design system | Never — use Tailwind spacing scale |
| Client components for everything | Simpler mental model | Hydration cost, larger JS bundle, worse performance | Only for genuinely interactive elements |
| Skipping TypeScript for quick prototypes | Faster initial development | Type errors surface later, harder refactoring | Never in production code |
| No error boundaries | Less code to write | Unhandled errors crash entire page | Never — every route segment needs one |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Next.js Image component | Forgetting `sizes` prop — loads full-res on mobile | Always specify `sizes="(max-width: 768px) 100vw, 50vw"` or similar |
| next/font | Not preloading critical fonts — causes FOUT | Use `next/font` with `display: swap` and preload via `<link rel="preload">` |
| Tailwind CSS | Using arbitrary values instead of design tokens | Extend `theme.extend` with custom values, never use `w-[123px]` patterns |
| React 19 | Using `useEffect` for animations instead of CSS | Use CSS transitions/animations for visual effects, reserve `useEffect` for data |
| Supabase Auth | Checking auth state in client component on public page | Use `getAuthenticatedUser()` server-side in landing page for conditional CTAs |
| Third-party scripts | Loading analytics/chat widgets synchronously | Use `next/script` with `strategy="afterInteractive"` or `"lazyOnload"` |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Unoptimized hero images | LCP > 4s, large CLS | Use `<Image priority>` with explicit dimensions, WebP/AVIF formats | First load on mobile 3G |
| Client-side rendering entire page | TBT > 300ms, poor FCP | Keep landing page as server component, only use client for interactive parts | When JS bundle exceeds 150KB |
| Lazy loading above-the-fold content | Delayed LCP, content flash | Use `loading="eager"` or `priority` for hero images, defer below-fold | First paint on slow connections |
| Unoptimized web fonts | FOIT/FOUT, layout shift | Preload critical fonts, use `display: swap`, limit to 2 font families | Every page load |
| Third-party script bloat | TBT increase, CLS from injected elements | Audit every script — remove unused, defer non-critical | When adding analytics/chat widgets |
| No image format optimization | Large file sizes, slow downloads | Use Next.js Image component (auto WebP), add `quality` prop | Mobile users on data plans |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing Supabase anon key in client code | Key is public by design, but misconfigured RLS exposes data | Verify RLS policies — anon key is safe IF RLS is properly enforced |
| Hardcoded API endpoints | Changes break deployment, expose internal URLs | Use environment variables for all external endpoints |
| Missing CSP headers | XSS attacks, unauthorized script injection | Add Content-Security-Policy header in `next.config.js` |
| No rate limiting on CTA forms | Bot signups flood database, abuse | Implement Supabase Edge Functions with rate limiting for auth endpoints |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| CTA says "Sign Up" but product is "Start Building" | Confusion about what happens next | Match CTA language to user action: "Start Building for Free" |
| No indication product is free/has free tier | Users assume it's paid and leave | Clear "Free" or "No credit card required" near CTA |
| Feature section is a wall of text | Users skip entirely | Use icons + short bullets, max 3 lines per feature |
| Testimonials without photos/names | Feels fake, no trust | Use real names, company logos, headshots where possible |
| Footer is afterthought | Missing key navigation, legal links | Footer mirrors nav + adds: Privacy, Terms, Contact, Social links |
| No "back to top" on long page | Users must manually scroll up | Floating back-to-top button appears after first scroll |

## "Looks Done But Isn't" Checklist

- [ ] **Hero section:** Copy is final and tested — NOT placeholder text
- [ ] **Hero image:** Using `next/image` with `priority`, explicit `width`/`height`, and `sizes` prop
- [ ] **Navigation:** Works on mobile (hamburger menu), keyboard accessible, links to auth pages
- [ ] **Feature cards:** Each has icon, headline, and 1-2 line description — no walls of text
- [ ] **AI workflow preview:** Clearly marked as "coming soon" — NOT misleading about current capabilities
- [ ] **CTAs:** All buttons are 44x44px minimum, have focus states, and link to correct auth routes
- [ ] **Footer:** Contains nav links, legal links, social links, and copyright
- [ ] **Responsive:** Tested at 375px, 768px, 1024px, 1440px — no horizontal scroll
- [ ] **Performance:** Lighthouse Performance score > 90, LCP < 2.5s, CLS < 0.1
- [ ] **Accessibility:** Lighthouse Accessibility score > 90, keyboard navigation works, screen reader tested
- [ ] **SEO:** Meta title, description, Open Graph tags, structured data present
- [ ] **Dark mode:** All text meets contrast ratios in both light and dark themes
- [ ] **Loading state:** Page shows meaningful skeleton/shimmer while loading, not blank screen
- [ ] **Error state:** Graceful fallback if any section fails to load

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Hero copy misses the mark | LOW | Rewrite headline, re-test with users, redeploy (no code changes) |
| Animation causing performance issues | MEDIUM | Remove heavy animations, replace with CSS alternatives, re-test Core Web Vitals |
| CLS from layout issues | MEDIUM | Add explicit dimensions to all images, reserve space for dynamic content, re-test |
| Mobile layout broken | MEDIUM | Refactor responsive styles, test on real devices, may require design adjustments |
| Accessibility failures | HIGH | Audit entire page with axe DevTools, add missing ARIA labels, fix keyboard navigation, re-test |
| SEO missing metadata | LOW | Add metadata export to page.tsx, validate with Rich Results Test, deploy |
| Conversion rate below 2% | MEDIUM | A/B test headline, CTA copy, page layout — requires analytics setup |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Hero section death | Phase 1 (Hero & Navigation) | Copy review + user testing before coding |
| Animation overload | Phase 2 (Visual Design) | Animation budget documented, Lighthouse > 90 |
| CLS catastrophe | Phase 1 (Hero & Navigation) | Lighthouse CLS < 0.1 on every PR |
| Mobile-first lip service | Phase 1 (Hero & Navigation) | Test at 375px before 1440px |
| Accessibility theater | Phase 2 (Visual Design) | axe DevTools clean, keyboard navigation works |
| SEO neglect | Phase 1 (Hero & Navigation) | Metadata present, Rich Results Test passes |
| Performance traps | All phases | Lighthouse CI on every PR, bundle size monitoring |
| Technical debt shortcuts | All phases | Code review enforcing design system usage |

## Sources

- Next.js official documentation on Image optimization, font loading, and metadata
- Web.dev Core Web Vitals guides
- WCAG 2.1 Level AA requirements
- SaaS landing page conversion research (training data + web search synthesis)
- Common pitfalls from React/Next.js community discussions (training data)

---

*Pitfalls research for: AutoApply Landing Page (bold/energetic SaaS style)*
*Researched: 2026-07-16*
