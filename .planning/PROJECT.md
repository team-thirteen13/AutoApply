# AutoApply Landing Page

## What This Is

A bold, energetic landing page for AutoApply — an AI-powered job application platform. The landing page showcases the current resume builder product AND previews the upcoming AI-powered workflow (resume analysis, job matching, cover letter generation, ATS scoring, interview prep, and more). It converts visitors into users with a clear sign-up CTA and builds excitement for the AI pipeline ahead.

## Core Value

Communicate the full AutoApply vision — a working resume builder today, an intelligent job application platform tomorrow — and convert visitors to sign up.

## Current State

**Shipped:** v1.0 MVP (2026-07-17)
**Phases:** 3 phases, 11 plans completed
**Lines of Code:** ~33,000 TypeScript/React

### What Was Built

- Bold visual identity with Space Grotesk headings, Inter body, and Stripe/Notion-inspired color palette
- Hero section with clear value proposition and sign-up CTA that converts visitors
- Feature showcase with 6 gradient cards displaying current resume builder capabilities
- AI workflow preview showing upcoming pipeline (resume analysis, job matching, cover letters, ATS scoring)
- Testimonials section with 6 cards in horizontal scroll carousel
- Production-ready footer with 4-column layout, accessibility polish, and responsive design across all viewports

## Requirements

### Validated

- ✓ Authentication (sign up, sign in, sign out, OAuth) — existing
- ✓ Profile management — existing
- ✓ Resume CRUD (create, read, update, delete) — existing
- ✓ Experience, education, project, certificate, skill modules — existing
- ✓ AI provider interface with mock implementation — existing
- ✓ Dashboard with resume listing — existing
- ✓ Route protection via proxy middleware — existing
- ✓ Supabase RLS authorization — existing
- ✓ Landing page with hero section and sign-up CTA — v1.0
- ✓ Feature showcase section (current resume builder features) — v1.0
- ✓ AI workflow preview section (upcoming features walkthrough) — v1.0
- ✓ Testimonials / social proof section — v1.0
- ✓ Bold, energetic visual style (Stripe/Notion-inspired) — v1.0
- ✓ Mobile-first responsive design — v1.0
- ✓ Navigation with sign-up / sign-in links — v1.0
- ✓ Footer with relevant links — v1.0

### Active

(None — next milestone not yet defined)

### Out of Scope

- Waitlist / email capture form — removed per user decision
- Backend changes — landing page only, no new API routes or database tables
- AI feature implementation — preview only, not building the actual AI workflow
- Multi-language support — English only for v1
- Analytics tracking — not in scope for landing page phase

## Context

- **Codebase**: Existing Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS 4 + Supabase project
- **Current state**: Landing page v1.0 shipped — hero, features, AI workflow, testimonials, footer all complete
- **Team**: 3-member team with strict ownership boundaries (landing page is UI/frontend — Member 2's domain)
- **Future vision**: Full AI-powered job application pipeline — resume analysis, job matching, cover letter generation, ATS scoring, skills gap analysis, interview prep, career coach, job tracking

## Constraints

- **Tech stack**: Must use existing stack — Next.js 16, React 19, Tailwind CSS 4, TypeScript 5
- **Ownership**: Landing page UI is frontend work; no changes to auth, profile, or resume backend modules
- **Existing patterns**: Follow the established architecture — feature modules, Zod validation, Result types, server/client component separation
- **Responsive**: Mobile-first design, must work well on phones, tablets, and desktops

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Bold & energetic style | User preference — like Stripe/Notion | ✓ Validated |
| No waitlist feature | User decision to remove email capture | ✓ Confirmed |
| Mobile-first responsive | User requirement for cross-device experience | ✓ Validated |
| Full product pitch (not Coming Soon) | Show current product + preview upcoming AI features | ✓ Confirmed |
| Sign-up as primary CTA | Convert visitors to users of current resume builder | ✓ Confirmed |
| Removed gradient transition div | UAT finding superseded original design decision D-07 | ✓ Resolved |

---

*Last updated: 2026-07-17 after v1.0 milestone*
