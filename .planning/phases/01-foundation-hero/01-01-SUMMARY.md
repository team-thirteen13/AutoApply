---
plan_id: "01-01"
phase: 1
subsystem: landing-page
tags: [theme, typography, tailwind, layout]
dependency_graph:
  requires: []
  provides: [theme-tokens, landing-layout]
  affects: [globals.css, layout.tsx]
tech_stack:
  added: [space-grotesk, inter]
  patterns: [tailwind-theme-inline, server-component-wrapper]
key_files:
  created: [src/components/landing/landing-layout.tsx]
  modified: [src/app/layout.tsx, src/app/globals.css]
decisions:
  - "Replaced Geist fonts with Space Grotesk (headings) and Inter (body)"
  - "Added full color palette as Tailwind @theme inline tokens"
  - "Created minimal LandingLayout server component wrapper"
metrics:
  duration: "163s"
  completed: "2026-07-16"
  tasks_completed: 4
  files_changed: 3
status: complete
---

# Phase 1 Plan 1: Theme Foundation & Typography Summary

Established the visual foundation for the AutoApply landing page: replaced Geist fonts with Space Grotesk (headings) and Inter (body), defined the full color palette as Tailwind theme variables, and created a LandingLayout server component wrapper.

## Implementation Details

### Step 1: Root Layout Font Update

Replaced `Geist` and `Geist_Mono` with `Space_Grotesk` and `Inter` from `next/font/google`. Created font instances with CSS variable bindings (`--font-space-grotesk`, `--font-inter`) and updated the `<html>` className to reference the new variables.

### Step 2: Global CSS Theme Variables

Updated `@theme inline` block with:
- Font mappings: `--font-sans` -> Inter (body), `--font-heading` -> Space Grotesk (headings)
- Color tokens: hero gradient (`#1e3a8a` -> `#7c3aed`), accent (`#22c55e`), text hierarchy, nav, destructive

### Step 3: LandingLayout Component

Created `src/components/landing/landing-layout.tsx` — a server component wrapper with `min-h-screen` class for consistent landing page section layout.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- `npm run typecheck`: PASSED
- `npm run lint`: PASSED (0 errors, 6 pre-existing warnings in unrelated files)
- `npm run build`: PASSED (16 routes generated successfully)

## Known Stubs

None - all theme tokens are fully wired and the LandingLayout component is functional.

## Threat Flags

None - no new network endpoints, auth paths, or trust boundary changes.

## Self-Check: PASSED

- `src/app/layout.tsx` EXISTS
- `src/app/globals.css` EXISTS
- `src/components/landing/landing-layout.tsx` EXISTS
- Commit `0aec92e` VERIFIED in git log
