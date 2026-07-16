# Technology Stack

**Analysis Date:** 2026-07-16

## Languages

**Primary:**
- TypeScript 5 - Application logic, components, services, and API routes (`src/app/`, `src/lib/`, `src/features/`)
- SQL - Database schema and migrations (`supabase/migrations/`)

**Secondary:**
- JavaScript - Build configuration (`next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`)
- CSS/Tailwind - Styling via PostCSS plugin integration

## Runtime

**Environment:**
- Node.js 20 (Alpine Docker image for dev: `node:20-alpine`)
- Next.js 16 with App Router (`src/app/`)
- React 19.2.4 Server and Client Components

**Package Manager:**
- npm (lockfile: `package-lock.json` present)
- Version: npm 9+ (implied by lockfile format)

## Frameworks

**Core:**
- Next.js 16.2.10 - React framework with App Router, server actions, API routes
- React 19.2.4 - UI library with concurrent features
- Tailwind CSS 4 - Utility-first CSS via PostCSS plugin

**Testing:**
- Vitest 4.1.10 - Test runner and assertion library
- Testing Library React 16.3.2 - Component testing utilities
- @testing-library/jest-dom 6.9.1 - DOM assertion matchers
- @testing-library/user-event 14.6.1 - User interaction simulation
- jsdom 29.1.1 - DOM environment for tests

**Build/Dev:**
- TypeScript 5 - Static type checking (`tsc --noEmit`)
- ESLint 9 - Code linting with Next.js core-web-vitals and TypeScript configs

## Key Dependencies

**Critical:**
- `@supabase/ssr` ^0.12.0 - Server-side Supabase client with cookie handling
- `@supabase/supabase-js` ^2.110.2 - Supabase JavaScript client for auth and database
- `zod` ^4.4.3 - Schema validation for environment, API payloads, and domain data
- `next` 16.2.10 - Full-stack React framework

**Infrastructure:**
- `@tailwindcss/postcss` ^4 - Tailwind CSS PostCSS integration
- `supabase` ^2.109.1 (dev) - Supabase CLI for local development and migrations

**UI:**
- `lucide-react` ^1.24.0 - Icon library for UI components

## Configuration

**Environment:**
- `.env` and `.env.example` - Environment configuration (never commit `.env`)
- Variables validated at startup via Zod schemas (`src/lib/env.ts`)
- Required variables:
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase anon/publishable key
  - `APP_URL` - Application base URL (defaults to `http://localhost:3000`)

**Build:**
- `next.config.ts` - Next.js configuration with security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy)
- `tsconfig.json` - TypeScript config with path alias `@/*` → `./src/*`
- `postcss.config.mjs` - PostCSS with Tailwind CSS plugin
- `vitest.config.ts` - Test configuration with path aliases and setup file
- `eslint.config.mjs` - ESLint 9 flat config with Next.js plugins

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Next.js dev server (port 3000)
npm run build        # Production build
npm start            # Start production server
npm run lint         # ESLint checks
npm run typecheck    # TypeScript type checking
npm run test         # Run Vitest tests
```

## Platform Requirements

**Development:**
- Node.js 20+
- npm 9+
- Docker (optional, for `npm run docker:dev`)
- Supabase CLI (for local development and migrations)

**Production:**
- Node.js 20 (Alpine base image used in Docker)
- Supabase hosted project (auth, database, storage)
- Environment variables must be configured at deployment

**Docker:**
- `Dockerfile` present with Node.js 20 Alpine base
- `docker-compose.yml` available for local development with Supabase
- Dev mode: `npm run docker:dev`

---

*Stack analysis: 2026-07-16*
