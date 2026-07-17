# Roadmap: AutoApply Landing Page

## Overview

A 3-phase delivery of the AutoApply marketing landing page. Phase 1 establishes the foundation: page structure, navigation, hero section with sign-up CTA, and bold visual identity. Phase 2 builds out all content sections: feature showcase, AI workflow preview, and testimonials. Phase 3 completes the page with the footer and applies responsive, accessibility, and performance polish across the entire page. Each phase delivers a verifiable, user-facing capability.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Hero** - Page structure, navigation, hero section with sign-up CTA, and bold visual identity (completed 2026-07-16)
- [x] **Phase 2: Content Sections** - Feature showcase, AI workflow preview, and testimonials/social proof (completed 2026-07-16)
- [x] **Phase 3: Footer & Polish** - Footer, full responsive testing, accessibility, and performance verification (completed 2026-07-17)

## Phase Details

### Phase 1: Foundation & Hero

**Goal**: Visitors land on a polished page and immediately understand what AutoApply does, with a clear path to sign up
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: LP-01, LP-05, LP-07
**Success Criteria** (what must be TRUE):

  1. Visitor sees a hero section with a clear headline, subheadline, and sign-up CTA button within 5 seconds of loading the page
  2. Clicking the sign-up CTA navigates to the existing sign-up page
  3. Navigation bar is sticky, shows AutoApply logo, and displays Sign Up / Sign In links when logged out, or Dashboard link when logged in
  4. The page loads with bold typography (Space Grotesk headings, Inter body) and a cohesive color palette inspired by Stripe/Notion
  5. The layout renders correctly at 375px (mobile), 768px (tablet), and 1024px+ (desktop) without horizontal scrolling

**Plans**: 3/3 plans complete

Plans:

- [x] 01-01-PLAN.md
- [x] 01-02-PLAN.md
- [x] 01-03-PLAN.md
- [x] 01-01: TBD
- [x] 01-02: TBD
- [x] 01-03: TBD

### Phase 2: Content Sections

**Goal**: Visitors can explore AutoApply's current features and preview the AI roadmap, building confidence through social proof
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: LP-02, LP-03, LP-04
**Success Criteria** (what must be TRUE):

  1. Feature showcase section displays 4-6 resume builder features with icons and short descriptions
  2. AI workflow preview section shows the upcoming pipeline (resume analysis, job matching, cover letters, ATS scoring) as a visual walkthrough
  3. Testimonials section displays 3-6 testimonial cards with names, titles, companies, and photos
  4. At least one additional sign-up CTA appears below the content sections (repeated from hero)
  5. All content sections are responsive and maintain readability on mobile viewports

**Plans**: 3/3 plans complete + 2 gap closure plans

Plans:

- [x] 02-01-PLAN.md — Feature Showcase section with 2x3 grid and hero gradient fade
- [x] 02-02-PLAN.md — AI Workflow pipeline with 4 steps, arrows, and first CTA
- [x] 02-03-PLAN.md — Testimonials section with 3 cards and second CTA

**Gap Closure Plans** (from UAT diagnosis):

Plans:

- [ ] 02.1-01-PLAN.md — Section clip-path transitions, gradient color tokens, and custom SVG icons
- [ ] 02.1-02-PLAN.md — AI Workflow card grid layout and Testimonials carousel redesign

### Phase 3: Footer & Polish

**Goal**: The complete landing page is production-ready with a comprehensive footer, full responsive coverage, and verified accessibility and performance
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: LP-06, LP-08
**Success Criteria** (what must be TRUE):

  1. Footer displays a 4-column layout with Product, Resources, Company, and Legal link sections, social icons, and copyright
  2. Every section of the page renders correctly at 375px, 768px, 1024px, and 1440px viewports
  3. The page passes keyboard-only navigation testing (all interactive elements focusable, no focus traps)
  4. Lighthouse performance score is above 90, LCP is under 2.5 seconds, and CLS is under 0.1
  5. Animations respect `prefers-reduced-motion` and no layout shifts occur during page load

**Plans**: 3/3 plans complete

Plans:
**Wave 1**

- [x] 03-01-PLAN.md — Footer component with 4-column layout, gradient transition, and tests

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02-PLAN.md — Accessibility (skip link, focus trap, ARIA) and performance (lazy loading, motion-safe) polish

**Gap Closure Plans** (from UAT diagnosis):

Plans:

- [x] 03-03-PLAN.md — Remove gradient transition and implement per-section gradient colors

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Hero | 3/3 | Complete    | 2026-07-16 |
| 2. Content Sections | 3/3 + 2 gap | Gap closure | 2026-07-16 |
| 3. Footer & Polish | 3/3 | Complete    | 2026-07-17 |
