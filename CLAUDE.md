# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AutoApply** — an AI-powered resume builder. Tech stack: Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Supabase (auth, database, storage).

## Ownership Boundaries

This is a 3-member team project with strict ownership:

- **Member 1 (this codebase)**: Project setup, Supabase config, database schema/migrations, RLS, auth backend, profile module, resume CRUD backend, AI service interface + mock provider
- **Member 2**: UI/frontend components, all user-facing views
- **Member 3**: AI logic, job logic, full provider implementations (Groq, Gemini, OpenRouter, OpenAI), resume parsing

**Do not modify another member's area without coordination.**

## Commands

```bash
npm install          # install dependencies
npm run dev          # start dev server
npm run lint         # run eslint
npm run typecheck    # tsc --noEmit
npm run test         # run tests
npm run build        # production build
```

All six must pass before requesting review on any PR.

## Git Workflow

- **Never** push directly to `main`
- **Never** self-approve or self-merge a PR
- Branch from updated `main`
- Branch naming: `feat/...`, `fix/...`, `test/...`, `docs/...`
- Open a Draft PR early; keep PRs under ~300 changed lines
- Pull or rebase from `main` daily
- Merge only after teammate approval

## Security

Never commit:
- `.env` files
- API keys, tokens, service-role keys, credentials
- Supabase service-role keys

## Architecture

```
src/
├── app/                    # Next.js app router
├── components/             # Shared UI components (Member 2 owns)
├── features/               # Domain modules
│   ├── auth/
│   ├── profile/
│   └── resume/
├── lib/
│   ├── supabase/           # client.ts, server.ts, middleware.ts
│   ├── validation/         # Zod schemas
│   └── ai/                 # AI provider interface + mock
├── services/               # Business logic / data access
├── types/                  # Shared TypeScript types
└── utils/
```

## Database Conventions

- snake_case for SQL, camelCase for TypeScript
- UUID primary keys on all tables
- `created_at` / `updated_at` on all tables
- `user_id` references `auth.users.id` (not email)
- RLS enforced: `auth.uid() = user_id` ownership rule
- Supabase migrations in `supabase/migrations/`

## Data Model

Profile → Resume → Resume Version (hierarchical). Profile is reusable career data; a resume is a specific presentation; a version is a snapshot.

Core tables: `profiles`, `experiences`, `education`, `projects`, `certificates`, `skills`, `user_skills`, `resumes`, `resume_versions`.

## Environment Variables

Required (see `.env.example`):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```
