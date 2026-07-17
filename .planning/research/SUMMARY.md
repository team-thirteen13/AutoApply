# Project Research Summary

**Project:** AutoApply Landing Page
**Domain:** SaaS Marketing Landing Page (AI-powered resume builder)
**Researched:** 2026-07-16
**Confidence:** HIGH

## Executive Summary

AutoApply needs a bold, energetic marketing landing page that follows established SaaS patterns used by companies like Linear, Notion, and Vercel. The research converges on a clear approach: use the existing Next.js 16 / React 19 / Tailwind CSS 4 stack and layer in `motion` (formerly framer-motion) for animations, `lenis` for smooth scrolling, and variable fonts (Space Grotesk for headings, Inter for body) for typography. The page should be built as a Server Component by default, with Client Component islands only for interactive elements like mobile navigation and testimonial carousels. This architecture pattern maximizes SEO and performance while allowing interactivity where needed.

The feature set is well-defined through competitive analysis of 5+ top SaaS landing pages. The MVP must include: a hero section with clear value proposition, sticky navigation, 4-6 feature showcase blocks, repeated CTAs, testimonials, social proof, and a footer -- all fully mobile-responsive. Differentiators like an interactive product demo, workflow preview, and animated stats should be deferred to v1.x. Anti-features to avoid include video backgrounds, popups, countdown timers, and chatbots, which create UX problems without meaningful conversion gains.

The primary risks are performance degradation from excessive animations, CLS issues from unoptimized images and fonts, and accessibility failures that violate WCAG 2.1 AA requirements. These can be mitigated through strict animation budgets, mandatory Lighthouse CI on every PR, semantic HTML, and testing at mobile viewports first. The architecture already supports these patterns through Server Component composition, and the research provides specific prevention strategies for each pitfall.

## Key Findings

### Recommended Stack

The existing project foundation is solid and requires no changes. The landing page adds four lightweight dependencies: `motion` (~30kB) for animations, `lenis` (~5kB) for smooth scrolling, and two variable font packages from `@fontsource`. Total added bundle is approximately 35kB, which is acceptable for a marketing page. No heavy component libraries are needed -- custom components built with Tailwind + motion give full control over the bold aesthetic.

**Core technologies (already installed):**
- **Next.js 16.2.10**: React framework with App Router, server components, streaming, image optimization
- **React 19.2.4**: UI library with concurrent features and Server Components support
- **Tailwind CSS 4.x**: CSS-first config with `@theme` directive, perfect for bold landing pages
- **TypeScript 5.x**: Type safety, catches errors at build time

**New dependencies:**
- **motion ^11.x**: Animation library (formerly framer-motion), best React 19 + Next.js App Router support
- **lenis ^1.1.x**: Smooth scrolling, pairs with motion for scroll-triggered animations
- **@fontsource-variable/space-grotesk**: Variable font for headings -- bold, modern, tech-forward
- **@fontsource-variable/inter**: Variable font for body -- clean, highly readable

### Expected Features

**Must have (table stakes):**
- Hero Section with clear value proposition and CTA -- users need to understand the product in 5 seconds
- Sticky Navigation -- minimal (3-4 items), with auth-state-aware CTAs
- Feature Showcase -- 4-6 feature blocks with icons/screenshots and short descriptions
- Primary CTA repeated 3+ times throughout the page -- hero, after features, before footer
- Footer with 4-column layout -- Product, Resources, Company, Legal links
- Mobile Responsive -- 50%+ traffic is mobile, must work at 375px minimum
- Social Proof Bar -- customer logos or "Trusted by X users" near hero
- Testimonials -- 3-6 real testimonials with names, titles, companies, photos

**Should have (competitive advantage):**
- Workflow Preview Section -- 6-step AI workflow journey in Linear-style numbered format
- Interactive Product Demo -- mini resume builder widget in hero (requires polished product)
- Animated Stats Counter -- resumes created, ATS improvement rate (requires usage data)
- Comparison Table -- "AutoApply vs alternatives" (requires competitor analysis)

**Defer (v2+):**
- Video Testimonials -- requires customer base
- Dark Mode Toggle -- nice-to-have, not essential
- Multi-Language Support -- expensive to maintain, English-only for v1
- Live Chat / Chatbot -- requires staffing or AI, premature for early stage

**Anti-features to avoid:**
- Video background in hero -- hurts Core Web Vitals, battery drain on mobile
- Popup/modal CTAs -- annoying, increases bounce rate
- Countdown timers -- fake urgency destroys trust
- Excessive testimonials (10+) -- wall of text, diminishing returns after 6
- Pricing section on landing page -- premature, link to separate page instead

### Architecture Approach

The landing page replaces the current minimal `src/app/page.tsx` with a full marketing page following Server Component composition. The root page acts as a Server Component that fetches auth state via `getAuthenticatedUser()` and passes user data as props to Client Components. Most sections (hero, features, AI preview, CTA, footer) are Server Components since they render static content. Only `nav.tsx` (mobile menu + auth state) and `testimonials.tsx` (carousel) require the `"use client"` directive. This pattern maximizes SEO, minimizes JS bundle, and maintains the project's existing architecture conventions.

**Major components:**
1. `page.tsx` (Server) -- Page composition, auth state, metadata
2. `nav.tsx` (Client) -- Mobile menu toggle, auth-aware navigation links
3. `hero.tsx` (Server) -- Hero section with headline, subheadline, CTA
4. `features.tsx` (Server) -- Feature showcase grid with icons and descriptions
5. `ai-preview.tsx` (Server) -- AI workflow preview cards
6. `testimonials.tsx` (Client) -- Testimonial carousel with navigation
7. `cta.tsx` (Server) -- Final conversion CTA with auth-aware messaging
8. `footer.tsx` (Server) -- Footer links, social icons, copyright
9. `section.tsx`, `card.tsx`, `badge.tsx` (Server) -- Reusable UI primitives

### Critical Pitfalls

1. **Hero Section Death** -- Burying the value proposition under vague copy or too much text. Prevention: Write hero copy FIRST, headline under 10 words answering "What does AutoApply do?", single primary CTA above the fold.

2. **Animation Overload** -- Excessive motion causing LCP delays, CLS, and accessibility failures. Prevention: Max 2-3 subtle entrance animations per section, no looping animations, always implement `prefers-reduced-motion` fallback, use CSS animations over framer-motion where possible.

3. **CLS Catastrophe** -- Layout shifts from images without dimensions, late-loading fonts, or dynamic content. Prevention: Explicit width/height on every image, `aspect-ratio` CSS, preload critical fonts, reserve space for dynamic content with `min-height`.

4. **Mobile-First Lip Service** -- Designing desktop-first and adapting for mobile as afterthought. Prevention: Design at 375px first, test on real devices, ensure 44x44px minimum tap targets, use `clamp()` for fluid typography.

5. **Accessibility Compliance Theater** -- Adding ARIA labels to divs instead of using semantic HTML. Prevention: Use semantic HTML (`<nav>`, `<main>`, `<section>`, `<button>`), never remove focus outlines, test keyboard-only navigation, verify color contrast with WebAIM.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation and Hero
**Rationale:** The hero section is the most critical element -- if it fails, nothing else matters. Building the reusable UI primitives (section, card, badge) and the hero section first establishes the visual language and layout patterns. Auth state integration happens here since nav depends on it.
**Delivers:** Reusable section/card/badge components, hero section with copy, sticky navigation with auth state, root page.tsx with metadata and auth check, SEO metadata (title, description, Open Graph tags).
**Addresses:** Hero Section (P1), Sticky Navigation (P1), Primary CTA (P1), Mobile Responsive (P1)
**Avoids:** Hero Section Death (copy-first approach), CLS Catastrophe (explicit image dimensions from start), SEO Neglect (metadata in first commit), Mobile-First Lip Service (test at 375px first)

### Phase 2: Content Sections
**Rationale:** With the visual language established in Phase 1, the static content sections follow naturally. These are all Server Components with no interactivity, making them straightforward to implement. Feature showcase, AI preview, and testimonials build out the full page content.
**Delivers:** Feature showcase (4-6 blocks), AI workflow preview, testimonials section, social proof bar, final CTA section.
**Addresses:** Feature Showcase (P1), Social Proof Bar (P1), Testimonials (P1), Footer (P1)
**Avoids:** Animation Overload (establish animation budget and accessibility requirements before building)

### Phase 3: Footer and Polish
**Rationale:** Footer completes the page structure. This phase also handles responsive testing, accessibility verification, and performance optimization -- all of which should happen after the full page is assembled.
**Delivers:** 4-column footer with all required links, full responsive testing (375px, 768px, 1024px, 1440px), accessibility audit (axe DevTools, keyboard navigation), performance verification (Lighthouse > 90, LCP < 2.5s, CLS < 0.1), back-to-top button.
**Addresses:** All P1 features complete, responsive (P1), accessibility compliance
**Avoids:** Accessibility Compliance Theater, Performance Traps (Lighthouse CI on every PR)

### Phase 4: Enhanced Features (v1.x)
**Rationale:** Once the core landing page is live and converting, add differentiators that require product polish or usage data. These are P2 features that enhance conversion but are not launch-blocking.
**Delivers:** Workflow Preview Section (6-step AI journey), Animated Stats Counter (requires usage data), Comparison Table (requires competitor analysis), Changelog Section.
**Addresses:** Workflow Preview (P2), Animated Stats (P2), Comparison Table (P2), Changelog (P2)

### Phase 5: Advanced Enhancements (v2+)
**Rationale:** Features requiring a customer base, staffing, or significant maintenance. Defer until product-market fit is established.
**Delivers:** Interactive Product Demo (mini resume builder widget), Video Testimonials (requires customer base), Dark Mode Toggle, Multi-Language Support.
**Addresses:** Interactive Demo (P2), Video Testimonials (P3), Dark Mode (P3)

### Phase Ordering Rationale

- **Copy-first approach:** Hero copy is finalized before any code is written, preventing the most common landing page failure
- **Mobile-first testing:** Every phase is tested at 375px viewport before scaling up
- **Server Component priority:** Phases 1-3 are entirely Server Components, establishing SEO and performance baseline before adding Client Component interactivity
- **Dependency chain:** Navigation depends on auth state (Phase 1), features depend on visual language (Phase 1), testimonials are independent but benefit from established patterns (Phase 2), footer completes the structure (Phase 3)
- **Pitfall prevention:** Animation budgets and accessibility requirements are established in Phase 1, not bolted on later

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4:** Workflow Preview needs research on how to represent AI features visually without misleading users about current capabilities
- **Phase 5:** Interactive Product Demo needs research on embedding strategies and performance implications

Phases with standard patterns (skip research-phase):
- **Phase 1:** Well-documented Server Component patterns, standard SaaS hero layout
- **Phase 2:** Static content sections follow established component patterns
- **Phase 3:** Footer and responsive testing are standard practices

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies are existing or well-established; motion and lenis have strong React 19 support |
| Features | HIGH | Based on analysis of 5+ top SaaS landing pages (Linear, Notion, Vercel, Framer, Refactoring UI) |
| Architecture | HIGH | Follows existing codebase patterns and Next.js 16 App Router conventions; Server Component composition is well-documented |
| Pitfalls | MEDIUM | Based on training data and web search synthesis; specific CLS/animation metrics need validation with real implementation |

**Overall confidence:** HIGH

### Gaps to Address

- **Hero copy finalization:** Research provides structure but not actual copy for AutoApply. Must be written and tested with real users before coding begins.
- **Customer logos/testimonials:** Social proof requires real data. For v1, "Trusted by early adopters" or placeholder logos may be needed.
- **Performance baselines:** Lighthouse targets (Performance > 90, LCP < 2.5s, CLS < 0.1) need to be validated against actual page weight with motion + lenis loaded.
- **Accessibility testing tools:** axe DevTools integration into development workflow needs setup during Phase 1.

## Sources

### Primary (HIGH confidence)
- motion.dev -- Official docs for motion (formerly framer-motion)
- lenis.darkroom.engineering -- Official Lenis docs
- tailwindcss.com -- Tailwind CSS 4 documentation
- @fontsource -- Variable font packages for self-hosted fonts
- Next.js App Router documentation on Server/Client Components

### Secondary (MEDIUM confidence)
- Linear landing page (linear.app) -- analyzed 2026-07-16
- Notion landing page (notion.com) -- analyzed 2026-07-16
- Vercel landing page (vercel.com) -- analyzed 2026-07-16
- Framer landing page (framer.com) -- analyzed 2026-07-16
- Refactoring UI landing page (refactoringui.com) -- analyzed 2026-07-16

### Tertiary (LOW confidence)
- SaaS landing page best practices (training data, 2024-2025)
- Common pitfalls from React/Next.js community discussions (training data)
- WCAG 2.1 Level AA requirements (training data)

---
*Research completed: 2026-07-16*
*Ready for roadmap: yes*
