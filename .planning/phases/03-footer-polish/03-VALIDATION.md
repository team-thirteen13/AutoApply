---
phase: 3
slug: footer-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-17
---

# Phase 3 — Validation Strategy

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
| 03-01-T1 | 01 | 1 | LP-06, LP-08 | — | N/A | smoke | `npm run test -- --testPathPattern footer` | ❌ W0 | ⬜ pending |
| 03-01-T2 | 01 | 1 | LP-06, LP-08 | — | N/A | smoke | `npm run test -- --testPathPattern "navbar\|mobile-nav"` | ❌ W0 | ⬜ pending |
| 03-02-T1 | 02 | 2 | LP-06 | — | N/A | smoke | `npm run test -- --testPathPattern "hero\|feature\|cta\|workflow\|testimonial"` | ❌ W0 | ⬜ pending |
| 03-02-T2 | 02 | 2 | LP-06 | — | N/A | smoke | `npm run test -- --testPathPattern "hero\|feature\|cta\|workflow\|testimonial"` | ❌ W0 | ⬜ pending |
| 03-03-T1 | 03 | 1 | LP-08 | — | N/A | source | `npm run test -- --testPathPattern footer && [ "$(grep -c 'bg-gradient-to-b' src/components/landing/footer.tsx)" = "0" ]` | ❌ W0 | ⬜ pending |
| 03-03-T2 | 03 | 1 | LP-08 | — | N/A | smoke | `npm run test -- --testPathPattern "cta\|feature\|testimonial\|workflow" && npm run typecheck` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/test/footer.test.tsx` — stubs for LP-08
- [ ] `src/test/navbar.test.tsx` — stubs for LP-06, LP-08
- [ ] `src/test/mobile-nav.test.tsx` — stubs for LP-06, LP-08
- [ ] `src/test/hero.test.tsx` — stubs for LP-06
- [ ] `src/test/feature-showcase.test.tsx` — existing
- [ ] `src/test/ai-workflow.test.tsx` — existing
- [ ] `src/test/testimonials.test.tsx` — existing

*Wave 0 test files must be created before implementation tasks begin.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Footer renders with 4 link columns | LP-08, D-01 | Visual layout | Load page, scroll to footer, confirm 4 columns with correct links |
| Footer copyright shows current year | LP-08, D-03 | Dynamic content | Check footer text includes current year (e.g., "2026 AutoApply") |
| Skip-to-content link appears on Tab | LP-06, D-11 | Keyboard interaction | Press Tab on page load, confirm skip link appears |
| Mobile menu focus trap works | LP-06, D-10 | Keyboard interaction | Open mobile menu, Tab through items, confirm focus doesn't escape |
| Each section has distinct gradient colors | LP-08, D-07 | Visual design | Scroll page, confirm sections use different gradient color schemes |
| Responsive layout at 375px width | LP-06 | Responsive visual | Resize browser to 375px, confirm no horizontal scroll |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
