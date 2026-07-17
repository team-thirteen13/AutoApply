# Requirements: AutoApply Landing Page

## Scope

This document covers v1 requirements for the AutoApply marketing landing page. The existing resume builder product (auth, profiles, resume CRUD, experience/education/projects modules, AI provider interface, dashboard, route protection, RLS) is already validated and functional.

## V1 Requirements

### LP-01: Hero Section with Sign-Up CTA

A hero section at the top of the landing page with a clear value proposition headline, supporting subheadline, and a prominent sign-up call-to-action button. The hero must communicate what AutoApply does in under 5 seconds.

### LP-02: Feature Showcase Section

A section showcasing 4-6 current resume builder features with icons, short descriptions, and visual emphasis. Features include: resume creation, profile management, experience/education tracking, project listings, skill management, and ATS optimization.

### LP-03: AI Workflow Preview Section

A section previewing the upcoming AI-powered job application pipeline: resume analysis, job matching, cover letter generation, ATS scoring, skills gap analysis, and interview prep. Presented as a forward-looking roadmap/walkthrough, not a live feature.

### LP-04: Testimonials / Social Proof Section

A section with 3-6 testimonials including names, titles, companies, and photos. For v1, this may use placeholder data with a clear visual pattern that can be updated with real testimonials.

### LP-05: Bold, Energetic Visual Style

A cohesive visual design inspired by Stripe/Notion with bold typography (Space Grotesk headings, Inter body), energetic color palette, and modern SaaS aesthetic. Consistent across all sections.

### LP-06: Mobile-First Responsive Design

The landing page must work seamlessly across all viewports: phones (375px+), tablets (768px+), and desktops (1024px+). Mobile-first CSS approach with fluid typography using clamp().

### LP-07: Navigation with Sign-Up / Sign-In Links

A sticky navigation bar with the AutoApply logo, minimal links (3-4 items), and auth-state-aware CTAs. When logged out: show Sign Up and Sign In links. When logged in: show Dashboard link.

### LP-08: Footer with Relevant Links

A 4-column footer layout with sections: Product links, Resources links, Company links, and Legal links. Includes social media icons and copyright notice.

## Out of Scope (v1)

- Waitlist / email capture form
- Backend changes (no new API routes or database tables)
- AI feature implementation (preview only)
- Multi-language support (English only)
- Analytics tracking
- Interactive product demo
- Video testimonials
- Dark mode toggle
- Comparison table

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LP-01 | Phase 1 | Complete |
| LP-02 | Phase 2 | Complete |
| LP-03 | Phase 2 | Complete |
| LP-04 | Phase 2 | Complete |
| LP-05 | Phase 1 | Complete |
| LP-06 | Phase 3 | Complete |
| LP-07 | Phase 1 | Complete |
| LP-08 | Phase 3 | Complete |
