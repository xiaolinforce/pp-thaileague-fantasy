# PP Thai League Fantasy

PP Thai League Fantasy is a Thai-first, responsive Thai League 1 Fantasy
Football prototype built with Next.js 16, Drizzle ORM, and Neon Postgres. It
reads reviewed competition data from PostgreSQL, provisions an empty opening
draft for each account, applies the agreed Fantasy rules, calculates
provisional/final Gameweek scores, and presents Classic league standings.

## Current scope

- Thai League 1 season 2026/27.
- Passwordless Email OTP, Google OAuth, and device-bound Guest accounts through Better Auth.
- One manager identity per account, with one automatically provisioned empty team draft per season.
- Landing, team selection, transfers, points, leagues, fixtures, profile,
  settings, public rules/help, and internal Fantasy administration screens.
- Thai source interface with an English display preference persisted per member
  account and stored on the current device for Guests.
- Fifteen-player squads, valid FPL-style formations, tier and Thai-player
  limits, automatic substitutions, captain/vice-captain, Triple Captain, Bench
  Boost, Wildcard, free transfers, and transfer-point deductions capped at 12
  points per Gameweek.
- Tier-guided squad auto-fill that completes vacant slots without changing the
  current formation or lineup roles, targets the full tier allocation, prefers
  likely first-choice goalkeepers and foreign players, then randomizes among
  high-quality players from the published projection while preserving
  captaincy and keeping the result editable until the manager saves.
- Real Overall and invite-only Private Classic leagues with owner controls,
  membership limits, audit history, and persisted latest Overall ranks.
- Internally marked bot managers with saved auto-filled squads, normal Overall
  participation and scoring, and separate internal participant counts.
- FPL-inspired scoring without bonus/BPS or Defensive Contributions, with a
  Thai Fantasy-specific 10 points for a goalkeeper goal.
- Read-only access to the final team, points, fixtures, and standings after the
  last Gameweek closes.
- Reviewed competition and player data persisted in Neon before runtime, with
  the official Thai League roster owning current eligibility.

Authentication and server-side admin roles are implemented. The verified
Production domain now has Google and Email OTP enabled with public privacy and
terms pages. See [Production operations](PRODUCTION.md) and
[Roadmap](ROADMAP.md) for the remaining controls required before public entries
open.

## Routes

| Route                         | Purpose                                                              |
| ----------------------------- | -------------------------------------------------------------------- |
| `/`                           | Account/Guest onboarding and sign-in.                                |
| `/upgrade`                    | Upgrade the current Guest while preserving its team when possible.   |
| `/team`                       | Lineup, captaincy, chips, player discovery, and squad revisions.     |
| `/points`                     | Gameweek score and category breakdown.                               |
| `/leagues`                    | Overall standings plus Private League creation and joining.          |
| `/leagues/[id]`               | Member-only standings and owner/member League controls.              |
| `/fixtures`                   | Competition fixtures grouped by Gameweek.                            |
| `/profile`                    | Account details, the public team name, or Guest upgrade.             |
| `/settings`                   | Interface language preference for the current identity/device.       |
| `/rules`                      | Public rules generated from the executable Fantasy configuration.    |
| `/help`                       | Public Facebook and email support, plus privacy and terms links.     |
| `/privacy`                    | Public bilingual privacy policy and data-rights contact.             |
| `/terms`                      | Public bilingual service and fair-play terms.                        |
| `/admin/fantasy`              | Admin overview with season-team counts and pending operations.       |
| `/admin/fantasy/participants` | Filtered, paginated team directory and read-only details at `/[id]`. |
| `/admin/fantasy/gameweeks`    | Gameweek status, locking, and finalization.                          |
| `/admin/fantasy/matches`      | Fixture-scoped player statistics and corrections.                    |
| `/admin/fantasy/players`      | Current player search, effective tiers and Thai status.              |
| `/admin/fantasy/audit`        | Paginated administrative operation history.                          |

## Getting started

Use the Node.js and npm versions pinned in `package.json`, then install
dependencies and create the local environment file:

```powershell
npm install
Copy-Item .env.example .env.local
```

Add the pooled connection string for the populated Neon `development` branch,
apply any schema migrations, verify its data, and start the application:

```bash
npm run db:check
npm run db:migrate
npm run db:verify:competition
npm run db:verify:fantasy
npm run dev
```

Open [http://localhost:3006](http://localhost:3006). `.env.local` is excluded
from Git. A schema-only database is intentionally not populated by repository
scripts; competition or Fantasy data changes use a reviewed task-scoped
operation against the intended Neon branch.

## Database workflow

- Local development uses the Neon `development` branch.
- Vercel Production must use a separate Neon `production` branch through
  `DATABASE_URL`.
- Add Drizzle table definitions to `src/db/schema.ts`.
- Generate and review migrations with `npm run db:generate`.
- Apply committed migrations with `npm run db:migrate`, testing development
  before production.
- Inspect the configured database with `npm run db:studio`.
- Use the guarded `npm run db:scenario -- <name>` runner on a disposable Neon
  branch for fast, repeatable Gameweek and Private League UI states; see the
  [Development guide](DEVELOPMENT.md#fantasy-qa-scenarios).
- Use `npm run db:scenario -- --advance` to lock and score the primary tester's
  saved team, preserve its transfer history, and carry it into the next
  Gameweek draft without replacing it with a preset squad.

Competition rosters, classifications, effective tiers, ranking versions, and
season setup are maintained in the database with source provenance and audit
context. Repository scripts do not rebuild or overwrite that source data. A
real account or Guest receives an empty opening draft and chooses all 15
players before the first save. Standings include account-owned teams,
historically preserved Guest teams, and explicitly provisioned bot teams.
Bot identities are tracked internally; saved squads use the same scoring
and Gameweek lifecycle.
The League ranking command backfills current Overall standings only after a
provisional or final Gameweek exists; normal scoring recalculation keeps those
latest rows current afterward. Runtime Overall reads fetch the current team's
stored rank and the Top 100 rather than aggregating the full season.
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

If delivery fails, the website shows a temporary email-unavailable message
instead of asking for an unsent OTP. Sentry owns operational email alerts.
See `PRODUCTION.md` for sender verification, shared-account budgets, and the
alert rule; local and Preview share the development database budget.

Keep `AUTH_PRODUCTION_READY=false` until the public domain, OAuth verification,
privacy policy, and terms have been reviewed. The production gate disables
both Email OTP and Google even if their individual flags are set.

## Quality checks

```bash
npm run test:rules
npm run test:email
npm run test:auth
npm run types
npm run lint
npm run format:check
npm run build
```

## Project documentation

- [Product](PRODUCT.md) — users, purpose, positioning, constraints, principles, and brand commitments.
- [Architecture](ARCHITECTURE.md) — routes, boundaries, data/write flow, and persistence.
- [Fantasy domain](DOMAIN.md) — vocabulary, squad rules, transfers, chips, scoring, and lifecycle.
- [Data sources](DATA_SOURCES.md) — provenance, identifiers, import order, and verification.
- [Design guide](DESIGN.md) — stable product-wide UI, localization, responsive, and accessibility rules.
- [UI patterns](UI_PATTERNS.md) — reusable compositions and the Team/Points reference contracts.
- [UI review status](UI_REVIEW.md) — route maturity, state inventory, evidence, and audit backlog.
- [Development guide](DEVELOPMENT.md) — setup, commands, database workflow, and checks.
- [Roadmap](ROADMAP.md) — current prototype, production blockers, next steps, and exclusions.
- [Production operations](PRODUCTION.md) — releases, recovery, retention, monitoring, and incidents.
- [Decision log](DECISIONS.md) — durable choices and their consequences.
- [Agent instructions](AGENTS.md) — non-negotiable contribution rules for coding agents.

## Deployment note

Configure `DATABASE_URL` and all auth secrets separately for every Vercel
environment. Never expose server secrets with a `NEXT_PUBLIC_` prefix; the
Turnstile site key is the intentional exception because it is public by design.
