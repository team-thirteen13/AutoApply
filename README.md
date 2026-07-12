# AutoApply

AI-powered resume builder.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- Supabase
- Vercel

## Prerequisites

- Git
- Node.js 20+
- npm
- Docker Desktop (or compatible Docker runtime)

## Environment Setup

```bash
cp .env.example .env
```

Edit `.env` and fill in the values from your local Supabase instance.

## Local Development (npm)

```bash
npm ci
npx supabase start
```

Copy the local Supabase URL and publishable key from the CLI output into your `.env` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
```

Then start the dev server:

```bash
npm run dev
```

## Docker Development (optional)

Docker is **optional**. Use it if you prefer a containerized Next.js environment.

```bash
npm ci
npx supabase start
```

Copy the local Supabase anon key from the CLI output into your `.env` file. The Supabase URL is overridden inside `compose.yaml` to `http://host.docker.internal:54321` so the container can reach the host Supabase services.

```bash
docker compose --env-file .env up --build
```

Or use the convenience script:

```bash
npm run docker:dev
```

**Environment variable difference:**

| Context | `NEXT_PUBLIC_SUPABASE_URL` |
|---|---|
| Host (npm dev) | `http://127.0.0.1:54321` |
| Docker container | `http://host.docker.internal:54321` (set in compose.yaml) |

The `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is passed from your `.env` file in both cases.

## Scripts

```bash
npm run dev        # start dev server
npm run build      # production build
npm run start      # start production server
npm run lint       # run eslint
npm run typecheck  # type-check with tsc
npm run docker:dev # start Next.js in Docker
```

## Deployment

Production is deployed on Vercel. Docker is used for local development only.
