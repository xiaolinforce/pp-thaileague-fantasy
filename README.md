# PP Thai League Fantasy

PP Thai League Fantasy is a Thai-first, responsive Thai League 1 Fantasy
Football prototype built with Next.js 16, Drizzle ORM, and Neon Postgres. It
imports competition data, provisions a squad for each account, applies the agreed
Fantasy rules, calculates provisional/final Gameweek scores, and presents
Classic league standings.

## Current scope

- Thai League 1 season 2026/27.
- Passwordless Email OTP, Google OAuth, and device-bound Guest accounts through Better Auth.
- One manager identity per account, with one automatically provisioned team per season.
- Landing, dashboard, team selection, transfers, points, leagues, fixtures,
  profile/rules, and internal Fantasy administration screens.
- Thai source interface with a client-side English display preference.
- Fifteen-player squads, valid FPL-style formations, tier and Thai-player
  limits, automatic substitutions, captain/vice-captain, Triple Captain, Bench
  Boost, Wildcard, free transfers, and transfer-point deductions.
- FPL-inspired scoring without bonus/BPS or Defensive Contributions, with a
  Thai Fantasy-specific 10 points for a goalkeeper goal.
- Competition import from the Thai League official API and public Transfermarkt
  squad pages, persisted before runtime.

Authentication and server-side admin roles are implemented, but production
providers remain gated until a verified domain, reviewed privacy/terms pages,
and provider credentials are ready. See [Roadmap](ROADMAP.md) for the remaining
production-readiness work.

## Routes

| Route            | Purpose                                                            |
| ---------------- | ------------------------------------------------------------------ |
| `/`              | Account/Guest onboarding and sign-in.                              |
| `/upgrade`       | Upgrade the current Guest while preserving its team when possible. |
| `/dashboard`     | Current manager and Gameweek overview.                             |
| `/team`          | Starting lineup, bench, captaincy, and chip management.            |
| `/transfers`     | Player discovery and squad revisions.                              |
| `/points`        | Gameweek score and category breakdown.                             |
| `/leagues`       | Overall and Private Classic standings.                             |
| `/fixtures`      | Competition fixtures and supporting statistics.                    |
| `/profile`       | Prototype manager settings, language, and game rules.              |
| `/admin/fantasy` | Internal match stats, classification, locking, and finalization.   |

## Getting started

Use the Node.js and npm versions pinned in `package.json`, then install
dependencies and create the local environment file:

```powershell
npm install
Copy-Item .env.example .env.local
```

Add the pooled connection string for the Neon `development` branch and prepare
the database:

```bash
npm run db:check
npm run db:migrate
npm run db:seed:competition
npm run db:verify:competition
npm run db:seed:fantasy
npm run db:verify:fantasy
npm run dev
```

Open [http://localhost:3006](http://localhost:3006). `.env.local` is excluded
from Git. The competition import requires network access; the application reads
the imported database during normal runtime.

## Database workflow

- Local development uses the Neon `development` branch.
- Vercel Production must use a separate Neon `production` branch through
  `DATABASE_URL`.
- Add Drizzle table definitions to `src/db/schema.ts`.
- Generate and review migrations with `npm run db:generate`.
- Apply committed migrations with `npm run db:migrate`, testing development
  before production.
- Import competition data before seeding the dependent Fantasy records.
- Inspect the configured database with `npm run db:studio`.

The Fantasy seed is idempotent for the configured season. It creates Gameweeks,
seeded league opponents, two Classic leagues, and effective tier metadata. A
real account or Guest receives a deterministic valid 15-player opening squad.
All player mutations derive the team from the current server session; admin
mutations additionally require `role=admin`.

## Authentication setup

Copy `.env.example`, generate the Better Auth secrets, and apply migration
`0003` to the confirmed development branch. Email OTP is enabled only when
`AUTH_EMAIL_ENABLED=true`, both Turnstile keys exist, and at least one email
provider is configured. Delivery preference is Resend, then Mailjet; the server
moves to Mailjet when Resend is near quota or returns a safely retryable hard
failure. Google is enabled separately with
`AUTH_GOOGLE_ENABLED=true` and its OAuth credentials.

Keep `AUTH_PRODUCTION_READY=false` until the public domain, OAuth verification,
privacy policy, and terms have been reviewed. The production gate disables
both Email OTP and Google even if their individual flags are set.

## Quality checks

```bash
npm run test:rules
npm run test:email
npm run types
npm run lint
npm run format:check
npm run build
```

## Project documentation

- [Architecture](ARCHITECTURE.md) — routes, boundaries, data/write flow, and persistence.
- [Fantasy domain](DOMAIN.md) — vocabulary, squad rules, transfers, chips, scoring, and lifecycle.
- [Data sources](DATA_SOURCES.md) — provenance, identifiers, import order, and verification.
- [Design guide](DESIGN.md) — product character, UI system, localization, responsive, and accessibility rules.
- [Development guide](DEVELOPMENT.md) — setup, commands, database workflow, and checks.
- [Roadmap](ROADMAP.md) — current prototype, production blockers, next steps, and exclusions.
- [Decision log](DECISIONS.md) — durable choices and their consequences.
- [Agent instructions](AGENTS.md) — non-negotiable contribution rules for coding agents.

## Deployment note

Configure `DATABASE_URL` and all auth secrets separately for every Vercel
environment. Never expose server secrets with a `NEXT_PUBLIC_` prefix; the
Turnstile site key is the intentional exception because it is public by design.
