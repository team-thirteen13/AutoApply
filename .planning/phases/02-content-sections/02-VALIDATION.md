---
phase: 2
slug: content-sections
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-16
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.10 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test && npm run lint && npm run typecheck` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test && npm run lint && npm run typecheck`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-T1 | 01 | 1 | LP-02 | — | N/A | smoke | `npx vitest run src/test/feature-showcase.test.tsx` | ❌ W0 | ⬜ pending |
| 02-01-T2 | 01 | 1 | LP-02 | — | N/A | source | `grep -q "FeatureShowcase" src/app/page.tsx` | ❌ W0 | ⬜ pending |
| 02-01-T3 | 01 | 1 | LP-02 | — | N/A | source | `grep -q "gradient-to-b" src/components/landing/hero.tsx` | ❌ W0 | ⬜ pending |
| 02-02-T1 | 02 | 2 | LP-03 | — | N/A | smoke | `npx vitest run src/test/ai-workflow.test.tsx` | ❌ W0 | ⬜ pending |
| 02-02-T2 | 02 | 2 | LP-03 | — | N/A | source | `grep -q "AIWorkflow" src/app/page.tsx` | ❌ W0 | ⬜ pending |
| 02-02-T3 | 02 | 2 | LP-03 | — | N/A | source | `grep -q "CTASection" src/app/page.tsx` | ❌ W0 | ⬜ pending |
| 02-03-T1 | 03 | 3 | LP-04 | — | N/A | smoke | `npx vitest run src/test/testimonials.test.tsx` | ❌ W0 | ⬜ pending |
| 02-03-T2 | 03 | 3 | LP-04 | — | N/A | source | `grep -q "Testimonials" src/app/page.tsx` | ❌ W0 | ⬜ pending |
| 02-03-T3 | 03 | 3 | LP-04 | — | N/A | build | `npm run build` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/test/feature-showcase.test.tsx` — stubs for LP-02
- [ ] `src/test/ai-workflow.test.tsx` — stubs for LP-03
- [ ] `src/test/testimonials.test.tsx` — stubs for LP-04

*Wave 0 test files must be created before implementation tasks begin.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual gradient fade from hero to first section | LP-02, D-15 | Visual/visual regression | Load page, scroll from hero to features, confirm smooth gradient transition |
| Pipeline arrows render correctly on desktop | LP-03, D-05 | Visual layout | View at 1024px+, confirm horizontal arrows between pipeline steps |
| Pipeline stacks vertically on mobile | LP-03 | Responsive visual | View at 375px, confirm steps stack with down arrows |
| Testimonial avatars show initials in circles | LP-04, D-11 | Visual rendering | View testimonial cards, confirm circular avatars with initials |
| Two CTAs visible on page | LP-04, D-17 | Content presence | Scroll full page, confirm CTA after AI workflow and after testimonials |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
