# Dreamline — Local Setup

## Prerequisites

- Node.js 20+
- npm 10+
- (Optional) PostgreSQL for production persistence
- (Optional) Google OAuth credentials

## Quick start (demo mode)

Demo mode uses a local JSON store under `.data/` and mock AI providers — no database or API keys required.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo login:

- Email: `demo@dreamline.app`
- Password: `dreamline`

Five seed dreams load automatically on first visit.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push Prisma schema to PostgreSQL |
| `npm run seed` | Reseed demo dreams via API (dev server must be running) |

## Architecture overview

```text
src/
  app/                 # Next.js App Router pages + API routes
  components/          # UI (web)
  features/recorder/   # Platform-agnostic recorder interface + web impl
  lib/
    ai/                # Provider interfaces, mocks, prompts
    auth/              # Auth.js (NextAuth) configuration
    db/                # Repository + local store + Prisma client
    storage/           # StorageProvider (local / Vercel Blob stub)
  server/dreams/       # Server-side dream orchestration
  types/               # Shared types + Zod schemas (Expo-ready)
```

Core business logic (types, validation, AI contracts, dream repository) does **not** depend on React or the browser. The web recorder implements `AudioRecorder`; Expo can later provide `ExpoAudioRecorder`.

### Suggested future monorepo split

```text
apps/web          ← this Next.js app
apps/mobile       ← Expo
packages/types
packages/validation
packages/dream-engine
packages/api-contracts
```

## Authentication

Auth.js (NextAuth v5) with:

- Email/password credentials (demo account included)
- Google OAuth when `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are set

Set a strong `AUTH_SECRET` before deploying.

## Database

Prisma schema targets **PostgreSQL** (`prisma/schema.prisma`).

Local demo defaults to the file store (`DEMO_STORE=true`) so you can run without Postgres.

To use Postgres:

1. Set `DATABASE_URL`
2. Set `DEMO_STORE=false`
3. Run `npm run db:generate && npm run db:push`
4. Wire `dream-repository.ts` to the Prisma implementation (schema is ready; repository currently uses the local store for the MVP)

Models: `User`, `Dream`, `DreamPerson`, `DreamEvent`, `DreamMedia`, `PersonReference`, plus Auth.js tables.

## Storage

`StorageProvider` abstracts file storage:

- **Local** (default): `.data/uploads`, served via authenticated `/api/media/[...path]`
- **Vercel Blob**: set `STORAGE_TOKEN` / `BLOB_READ_WRITE_TOKEN` and `USE_VERCEL_BLOB=true`, then complete the stub in `src/lib/storage/index.ts`

Audio, generated images, and reference photos are never stored as DB blobs — only URLs/metadata.

## AI providers

See [docs/AI_PROVIDERS.md](docs/AI_PROVIDERS.md) for exactly where to plug in real APIs.

Mocks power the full flow today, including real-person detection and the reference-photo step for “my ex”.

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the project in Vercel
3. Set environment variables from `.env.example`
4. Provision Postgres (Vercel Postgres / Neon / Supabase)
5. Set `DEMO_STORE=false` and run migrations on deploy
6. Optionally enable Vercel Blob for media

```bash
npm run build
```

must pass before deploy.

## Privacy

Users can:

- Delete individual dreams
- Delete reference photos
- Choose whether to retain original audio
- Delete their account and associated data

Reference media is served through an authenticated media route rather than public predictable URLs.

## Product notes

Dream analysis **describes** dreams; it does not diagnose or interpret psychological meaning. Interpretation can be added later as an opt-in feature.
