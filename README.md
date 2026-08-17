# PP Thaileague Fantasy

PP Thaileague Fantasy is a Thai-first, responsive Thai League 1 Fantasy
Football prototype built with Next.js 16, Drizzle ORM, and Neon Postgres. It
imports competition data, manages a playable demo squad, applies the agreed
Fantasy rules, calculates provisional/final Gameweek scores, and presents
Classic league standings.

## Current scope

- Thai League 1 season 2026/27.
- One playable demo identity (`PIYA FC`) and additional seeded league opponents.
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

This is not yet a production multi-user service. Authentication and
authorization are not implemented, and `/admin/fantasy` is not a protected
production admin surface. See [Roadmap](ROADMAP.md) for the readiness blockers.

## Routes

| Route            | Purpose                                                          |
| ---------------- | ---------------------------------------------------------------- |
| `/`              | Product landing page.                                            |
| `/dashboard`     | Current manager and Gameweek overview.                           |
| `/team`          | Starting lineup, bench, captaincy, and chip management.          |
| `/transfers`     | Player discovery and squad revisions.                            |
| `/points`        | Gameweek score and category breakdown.                           |
| `/leagues`       | Overall and Private Classic standings.                           |
| `/fixtures`      | Competition fixtures and supporting statistics.                  |
| `/profile`       | Prototype manager settings, language, and game rules.            |
| `/admin/fantasy` | Internal match stats, classification, locking, and finalization. |

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

The Fantasy seed is idempotent for the configured season. It creates Gameweeks
from imported fixture kickoff times, one playable demo squad, additional league
opponents, two Classic leagues, and effective tier metadata. Demo write actions
are disabled in production by default. `FANTASY_DEMO_WRITE_ENABLED=true` is a
temporary demo guard only; it is not authentication or authorization.

## Quality checks

```bash
npm run test:rules
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

Configure `DATABASE_URL` separately for every Vercel environment and never
expose it with a `NEXT_PUBLIC_` prefix. Keep demo writes disabled on public
deployments until the authentication, authorization, audit, and operational
requirements in the roadmap are complete.
