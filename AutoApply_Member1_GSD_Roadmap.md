# AutoApply — Member 1 Backend Development Roadmap

## Role

**Member 1 — Foundation & Backend**

Responsibilities:

- Project setup
- Supabase configuration
- Database schema and migrations
- Row Level Security (RLS)
- Authentication backend
- Profile module
- Resume CRUD backend
- Resume intake/storage foundation
- AI service interface and mock provider
- Backend integration support

---

# Team Development Rules

## GitHub Flow

For every task:

1. Pull the latest `main`
2. Create an issue
3. Create a branch from `main`
4. Use `feat/...`, `fix/...`, `test/...`, or `docs/...`
5. Push the branch
6. Open a Draft PR early
7. Keep the PR small, ideally under approximately 300 changed lines
8. Make sure CI is green
9. Request review from a teammate
10. The author must not self-approve or self-merge
11. Merge only after approval
12. Pull `main` daily to reduce merge conflicts

## Never

- Push directly to `main`
- Self-merge a PR
- Commit secrets
- Commit `.env`
- Commit API keys, tokens, service-role keys, or credentials
- Mix unrelated work into the same PR
- Modify another member's area without coordination

---

# Recommended Branch Workflow

```bash
git switch main
git pull origin main

git switch -c feat/example-feature
```

After making changes:

```bash
git add .
git commit -m "feat: describe the change"
git push -u origin feat/example-feature
```

Then open a **Draft Pull Request**.

To sync with `main`:

```bash
git fetch origin
git rebase origin/main
```

Use the team's agreed synchronization strategy consistently.

---

# Phase 0 — Project Planning and Repository Contract

## Goal

Define project rules and technical boundaries before feature development.

## Deliverables

- `CLAUDE.md`
- Project architecture rules
- Coding conventions
- Git workflow rules
- Environment variable contract
- Ownership boundaries
- CI expectations

## Branch

```text
docs/project-foundation
```

## PR Scope

Documentation only.

## Required Rules for `CLAUDE.md`

```text
- Never push directly to main.
- Never merge a PR.
- Never self-approve.
- Branch from updated main.
- Use feat/... or fix/... branches.
- Open a Draft PR early.
- Keep each PR under approximately 300 changed lines where practical.
- Never commit .env, secrets, tokens, private keys, or service-role keys.
- Run lint, typecheck, tests, and build before requesting review.
- Pull or rebase from main daily.
- Do not modify UI owned by Member 2 unless required for backend integration.
- Do not implement Member 3 AI or job logic beyond shared interfaces.
```

---

# Phase 1 — Next.js Project Foundation

## Phase 1.1 — Bootstrap Application

### Branch

```text
feat/project-setup
```

### Work

- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4
- Base folder structure
- `.gitignore`
- `.env.example`
- Basic README setup instructions

### Do Not Add Yet

- Supabase schema
- Authentication
- Profile logic
- Resume logic
- AI logic

### Acceptance Criteria

```text
npm install
npm run dev
npm run lint
npm run build
```

All commands must pass.

---

## Phase 1.2 — Add CI

### Branch

```text
feat/ci-pipeline
```

### Work

Add GitHub Actions for:

```text
install
lint
typecheck
test
build
```

Recommended scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "..."
  }
}
```

CI should exist early because every later PR depends on it.

---

## Phase 1.3 — Shared Project Structure

### Branch

```text
feat/project-structure
```

### Suggested Structure

```text
src/
├── app/
├── components/
├── features/
│   ├── auth/
│   ├── profile/
│   └── resume/
├── lib/
│   ├── supabase/
│   ├── validation/
│   └── ai/
├── services/
├── types/
└── utils/
```

Do not create unnecessary empty architecture layers.

---

# Phase 2 — Supabase Foundation

## Phase 2.1 — Supabase Client Setup

### Branch

```text
feat/supabase-client
```

### Work

Create Supabase client utilities for:

```text
Browser client
Server client
Session-aware server usage
```

Possible structure:

```text
src/lib/supabase/client.ts
src/lib/supabase/server.ts
src/lib/supabase/middleware.ts
```

Add:

```text
.env.example
```

Example:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Never commit:

```text
.env
service-role keys
actual secrets
access tokens
```

### Acceptance Criteria

- Browser client works
- Server client works
- Missing environment variables fail clearly

---

## Phase 2.2 — Database Foundation

### Branch

```text
feat/database-foundation
```

### Work

Set up:

```text
supabase/
└── migrations/
```

### Conventions

```text
snake_case for SQL
UUID primary keys
created_at
updated_at
user_id references auth.users
```

Do not add the complete application schema in this PR.

---

# Phase 3 — Core Database Schema

## Phase 3.1 — Profiles Schema

### Branch

```text
feat/profile-schema
```

### Table

```text
profiles
```

### Suggested Fields

```text
id
user_id
name
email
phone
location
github_url
linkedin_url
portfolio_url
tagline
bio
image_url
created_at
updated_at
```

### Recommended Relationship

```text
profiles.id = application entity ID
profiles.user_id = auth.users.id
```

Add a unique constraint on `user_id`.

Do not use email as the primary relationship key.

---

## Phase 3.2 — Experience and Education Schema

### Branch

```text
feat/career-history-schema
```

### Tables

```text
experiences
education
```

### Experience Fields

```text
id
user_id
company
title
company_url
start_date
end_date
is_current
accomplishments
skills
created_at
updated_at
```

For the MVP, arrays or JSON may be acceptable for bullet-style accomplishments.

Avoid unnecessary over-normalization.

---

## Phase 3.3 — Projects and Certificates Schema

### Branch

```text
feat/portfolio-schema
```

### Tables

```text
projects
certificates
```

---

## Phase 3.4 — Skills Schema

### Branch

```text
feat/skills-schema
```

### Recommended Structure

```text
skills
user_skills
```

Example:

```text
skills
- id
- normalized_name

user_skills
- user_id
- skill_id
```

Keep the design simple enough for the assignment.

---

# Phase 4 — Row Level Security

## Phase 4.1 — Profile RLS

### Branch

```text
feat/profile-rls
```

### Rules

Authenticated users can:

```text
SELECT own profile
INSERT own profile
UPDATE own profile
DELETE own profile
```

Core ownership rule:

```sql
auth.uid() = user_id
```

### Required Tests

```text
User A cannot read User B
User A cannot update User B
User A cannot delete User B
```

---

## Phase 4.2 — Career Data RLS

### Branch

```text
feat/career-data-rls
```

Apply ownership protection to:

```text
experiences
education
projects
skills
certificates
```

---

## Phase 4.3 — RLS Security Verification

### Branch

```text
test/rls-policies
```

Do not assume the SQL is correct just because it looks correct.

Test actual cross-user access.

---

# Phase 5 — Authentication Backend

## Phase 5.1 — Email and Password Authentication

### Branch

```text
feat/auth-backend
```

### Implement

```text
sign up
sign in
sign out
session handling
```

Member 2 owns the UI.

Expose a clean backend contract.

---

## Phase 5.2 — Google Authentication

### Branch

```text
feat/google-auth
```

### Work

```text
Google provider integration
OAuth callback handling
session establishment
```

Keep this separate if the first authentication PR becomes too large.

---

## Phase 5.3 — Auth Session and Protected Access

### Branch

```text
feat/auth-session
```

### Work

```text
session refresh
protected route behavior
server-side authentication utilities
```

Remember:

```text
Authentication = Who are you?
Authorization = Are you allowed to access this record?
```

Middleware does not replace RLS.

---

# Phase 6 — Profile Backend

## Phase 6.1 — Profile Validation and Types

### Branch

```text
feat/profile-contract
```

### Define

```text
Profile
CreateProfileInput
UpdateProfileInput
ProfileSchema
```

Use Zod if it is the project standard.

---

## Phase 6.2 — Profile Service

### Branch

```text
feat/profile-service
```

### Operations

```text
getProfile()
createProfile()
updateProfile()
```

Optionally:

```text
deleteProfile()
```

Avoid placing raw Supabase queries inside random React components.

---

## Phase 6.3 — Experience CRUD

### Branch

```text
feat/experience-api
```

### Operations

```text
create
read
update
delete
```

---

## Phase 6.4 — Education CRUD

### Branch

```text
feat/education-api
```

---

## Phase 6.5 — Projects CRUD

### Branch

```text
feat/projects-api
```

---

## Phase 6.6 — Skills CRUD

### Branch

```text
feat/skills-api
```

---

## Phase 6.7 — Certificates CRUD

### Branch

```text
feat/certificates-api
```

Keep skills and certificates separate if the combined PR becomes too large.

---

# Phase 7 — Resume Domain

## Architecture

Use:

```text
Profile
    ↓
Resume
    ↓
Resume Version
```

The profile is reusable career data.

A resume is a specific presentation of that data.

A resume version is a snapshot.

---

## Phase 7.1 — Resume Schema

### Branch

```text
feat/resume-schema
```

### Suggested Tables

```text
resumes
resume_versions
```

### Example `resumes`

```text
id
user_id
name
template_id
is_master
created_at
updated_at
```

### Example `resume_versions`

```text
id
resume_id
version_number
content
created_at
```

Structured JSON is acceptable for immutable resume-version snapshots.

---

## Phase 7.2 — Resume Types and Validation

### Branch

```text
feat/resume-contract
```

### Define

```text
Resume
ResumeVersion
ResumeContent
CreateResumeInput
UpdateResumeInput
```

Members 2 and 3 should reuse these contracts.

---

## Phase 7.3 — Resume CRUD

### Branch

```text
feat/resume-service
```

If the PR grows too large, split into:

```text
feat/resume-create-read
feat/resume-update-delete
```

---

## Phase 7.4 — Resume Versioning Foundation

### Branch

```text
feat/resume-versioning
```

Member 1 should own:

```text
schema
shared types
basic persistence contract
```

Coordinate with Member 3 before implementing full version-history behavior.

---

# Phase 8 — Resume Intake Foundation

## Phase 8.1 — Resume Upload Storage

### Branch

```text
feat/resume-upload-storage
```

### Work

```text
Supabase Storage bucket
file ownership
upload metadata
PDF validation
file-size restriction
storage policies
```

Do not implement parsing yet unless explicitly assigned.

---

## Phase 8.2 — Parsed Resume Storage Contract

### Branch

```text
feat/resume-parsed-schema
```

### Structured Blocks

```text
role
company
startDate
endDate
bullets
skills
```

Member 1 provides the storage contract.

The parser implementation may belong to Member 3.

---

# Phase 9 — AI Service Interface

## Phase 9.1 — Provider Interface

### Branch

```text
feat/ai-service-interface
```

### Example Concept

```ts
interface AIProvider {
  generateText(input: GenerateTextInput): Promise<GenerateTextResult>
}
```

### Supporting Types

```text
AIProviderName
AIRequest
AIResponse
AIError
```

Do not implement the complete provider fallback system unless it is assigned to Member 1.

---

## Phase 9.2 — Mock AI Provider

### Branch

```text
feat/ai-mock-provider
```

### Behavior

```text
input
    ↓
deterministic mock response
```

Member 3 can later implement:

```text
Groq
Gemini
OpenRouter
OpenAI
fallback chain
rate limiting
```

The interface should allow new providers without rewriting application services.

---

# Phase 10 — Integration Hardening

## Phase 10.1 — Backend Integration Tests

### Branch

```text
test/backend-integration
```

### Test

```text
authentication
profile ownership
profile CRUD
career data CRUD
resume CRUD
unauthorized access
```

---

## Phase 10.2 — Backend Documentation

### Branch

```text
docs/backend-integration
```

### Document

```text
environment variables
database setup
migration workflow
authentication usage
profile service usage
resume service usage
AI interface usage
```

---

# Recommended Issue → Branch → PR Map

```text
PHASE 0
#1  docs/project-foundation

PHASE 1
#2  feat/project-setup
#3  feat/ci-pipeline
#4  feat/project-structure

PHASE 2
#5  feat/supabase-client
#6  feat/database-foundation

PHASE 3
#7  feat/profile-schema
#8  feat/career-history-schema
#9  feat/portfolio-schema
#10 feat/skills-schema

PHASE 4
#11 feat/profile-rls
#12 feat/career-data-rls
#13 test/rls-policies

PHASE 5
#14 feat/auth-backend
#15 feat/google-auth
#16 feat/auth-session

PHASE 6
#17 feat/profile-contract
#18 feat/profile-service
#19 feat/experience-api
#20 feat/education-api
#21 feat/projects-api
#22 feat/skills-api
#23 feat/certificates-api

PHASE 7
#24 feat/resume-schema
#25 feat/resume-contract
#26 feat/resume-service
#27 feat/resume-versioning

PHASE 8
#28 feat/resume-upload-storage
#29 feat/resume-parsed-schema

PHASE 9
#30 feat/ai-service-interface
#31 feat/ai-mock-provider

PHASE 10
#32 test/backend-integration
#33 docs/backend-integration
```

Not every item must become a separate PR.

Combine neighboring tasks only when the change remains:

- Coherent
- Easy to review
- Under approximately 300 changed lines where practical

---

# GSD Workflow

Do not ask GSD to build the entire Member 1 assignment in one execution.

Use GSD at the milestone or phase level.

Example:

```text
Milestone: Project Foundation

Goal:
Create a production-ready Next.js 16 foundation for AutoApply.

Includes:
- Next.js
- TypeScript
- Tailwind
- environment contract
- CI
- directory structure

Excludes:
- Supabase schema
- authentication
- profile features
- resume features
- AI implementation
```

Before executing a GSD plan, verify:

```text
Does this belong to Member 1?
Will this likely exceed 300 changed lines?
Is it modifying Member 2's UI?
Is it implementing Member 3's AI or job logic?
Does it include secrets?
Does it contain unrelated refactoring?
```

If yes, narrow the plan before execution.

---

# Recommended Starting Order

Start with:

```text
Phase 0
↓
Phase 1.1
↓
Phase 1.2
↓
Phase 2.1
```

Recommended first PRs:

```text
1. Project rules and CLAUDE.md
2. Next.js project setup
3. CI pipeline
4. Supabase client setup
```

Do not start with the full database schema before the repository workflow, CI, environment handling, and ownership rules are stable.

---

# Definition of Done for Every PR

A PR is ready for review only when:

- Scope matches the issue
- No unrelated files are changed
- No secrets are committed
- `.env` is not committed
- Lint passes
- Typecheck passes
- Tests pass
- Build passes
- CI is green
- Draft PR has been updated with a clear description
- A teammate reviews it
- The author does not self-merge

---

# Core Principle

> One issue → one owner → one branch → one PR → one teammate review → CI green → merge.

Build AutoApply incrementally.

Do not optimize for how much code Claude can generate.

Optimize for how much code the team can understand, review, test, and safely merge.
