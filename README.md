# Jami Nutrition Clinic SoR (MVP)

Single-clinic system of record for nutrition doctors and patients.

## Stack

- Next.js (App Router)
- Clerk authentication
- Neon Postgres via Prisma
- UploadThing for plan file uploads
- Vitest for basic tests

## Environment

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`
- `DIRECT_URL`
- `UPLOADTHING_TOKEN`
- `UPLOADTHING_SECRET`
- `UPLOADTHING_APP_ID`
- `NEXT_PUBLIC_UPLOADTHING_APP_ID`

## Install + Run

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Core routes

- `/patients`: doctor/manager patient index
- `/patients/[id]`: doctor/manager patient detail, measurements, internal notes
- `/appointments/[id]`: doctor/manager appointment metrics, notes, uploads
- `/me`: patient own profile
- `/measurements`: patient self-entry form
- `/trends`: patient own measurements and trends

## Authorization model

- Server-side authorization is centralized in `src/lib/authz.ts`
- All repository queries are org-scoped (`orgId`)
- Patient role is restricted to own `patientId`
- Internal notes are doctor/manager only

## Auditing

Mutation paths write immutable records to `AuditEvent`:

- patient updates
- appointment note creation
- appointment metric creation
- internal note creation
- measurement creation
- file upload registration

## Test + quality

```bash
pnpm typecheck
pnpm test
```

