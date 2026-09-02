# Development guide

## Requirements

- Node.js 24.18.1 and npm 12.0.2, pinned through Volta in `package.json`.
- A populated PostgreSQL-compatible Neon database branch.

This project uses Next.js 16.3.1. Before changing framework code, read the
relevant bundled guide under `node_modules/next/dist/docs/`; APIs and conventions
may differ from older Next.js versions.

## Environment setup

Install dependencies and create the local environment file:

```powershell
npm install
Copy-Item .env.example .env.local
```

Set the pooled Neon connection string for the intended development branch:

| Variable                                                        | Purpose                                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                  | Server runtime, Drizzle Kit, migration, maintenance, and verification connection.           |
| `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`                         | Better Auth origin and signing/encryption secret.                                           |
| `AUTH_EMAIL_HASH_SECRET`                                        | Separate salt for privacy-safe recipient hashes in delivery logs.                           |
| `AUTH_EMAIL_ENABLED`, `AUTH_GOOGLE_ENABLED`                     | Opt each sign-in method into the current environment.                                       |
| `AUTH_PRODUCTION_READY`                                         | Additional production-only gate; keep false until domain/legal/provider review is complete. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                      | Google OAuth web application credentials.                                                   |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`        | Required pair for every Email OTP request.                                                  |
| `AUTH_EMAIL_PROVIDERS`, `EMAIL_FROM`, provider keys/limits      | Resend → Mailjet delivery routing and quota headroom.                                       |
| `NEXT_PUBLIC_SITE_URL`                                          | Optional public metadata base URL; local fallback is `http://localhost:3006`.               |
| `FANTASY_SCENARIO_BRANCH_ID`                                    | Exact disposable Neon branch ID required by the destructive QA scenario runner.             |
| `FANTASY_SCENARIO_SEASON_SLUG`, `FANTASY_SCENARIO_PRIMARY_TEAM` | Optional scenario target overrides when more than one season or tester team exists.         |

Never commit a real connection string, auth secret, OAuth credential, email API
key, or Turnstile secret. The Turnstile site key is intentionally public; do
not expose any other secret with a `NEXT_PUBLIC_` prefix.

Better Auth cookies use the fixed `pp-thaileague-fantasy` prefix. Keep it unique
among applications running on `localhost`; browser cookies are scoped by host
and path, not by port.

For local Email OTP testing, configure Turnstile test keys plus one email
provider and a permitted sender. For public production, use a verified sending
domain, configure the Google callback at `/api/auth/callback/google`, publish
reviewed privacy/terms pages, and only then set `AUTH_PRODUCTION_READY=true`.

Connect to and verify the populated development database:

```bash
npm run db:check
npm run db:migrate
npm run db:verify:competition
npm run db:verify:fantasy
npm run dev
```

Open `http://localhost:3006`.

## Commands

| Command                          | Purpose                                                               |
| -------------------------------- | --------------------------------------------------------------------- |
| `npm run dev`                    | Start the development server on port 3006.                            |
| `npm run build`                  | Create a production Next.js build.                                    |
| `npm run start`                  | Serve an existing production build.                                   |
| `npm run lint`                   | Run ESLint.                                                           |
| `npm run types`                  | Run TypeScript without emitting files.                                |
| `npm run test:email`             | Run transactional email routing and fallback tests.                   |
| `npm run test:auth`              | Run authentication preference parsing tests.                          |
| `npm run test:rules`             | Run squad, transfer, deadline, scoring, and substitution tests.       |
| `npm run format:check`           | Check repository formatting with Prettier.                            |
| `npm run format`                 | Rewrite formatting across the repository; use intentionally.          |
| `npm run db:check`               | Verify that the configured database can be reached.                   |
| `npm run db:generate`            | Generate a new Drizzle migration from schema changes.                 |
| `npm run db:migrate`             | Apply committed Drizzle migrations.                                   |
| `npm run db:studio`              | Open Drizzle Studio for the configured database.                      |
| `npm run db:rank:leagues`        | Backfill the latest persisted Overall standings after scoring exists. |
| `npm run db:scenario -- <name>`  | Apply one fast, guarded Fantasy QA database scenario.                 |
| `npm run db:verify:competition`  | Assert expected source/import structure.                              |
| `npm run db:verify:fantasy`      | Verify Fantasy, ranking, Gameweek, and League invariants.             |
| `npm run db:verify:player-stats` | Verify stored official current-season player-stat rows.               |
| `npm run db:verify:transaction`  | Prove rollback on the exact development branch.                       |

Database commands use a small Windows Node user-info compatibility shim. Keep
the wrapper in package scripts unless the underlying Windows issue is confirmed
resolved for the pinned toolchain.

## Database workflow

1. Change `src/db/schema.ts`.
2. Run `npm run db:generate`.
3. Review the generated SQL and snapshot under `drizzle`.
4. Apply the migration to the Neon development branch with
   `npm run db:migrate`.
5. Run both structural verification and the affected application checks.
6. Test development before applying the same committed migration to production.

Do not edit or replace a migration that may already have been applied. Create a
new migration for follow-up changes. Do not use production as a schema or data
experimentation environment.

The project currently uses one `DATABASE_URL` for runtime and migrations.
Environment isolation therefore depends on selecting the correct Neon branch.
Confirm the target before any migration or direct data-maintenance operation.

### Source-data maintenance

Competition rosters, fixtures, player facts, classifications, and ranking
versions are database-managed records. The repository does not contain scripts
that rebuild or overwrite this source data. For a requested change:

1. confirm the exact Neon branch ID and inspect fresh state;
2. create a narrowly scoped temporary operation with stable-ID targeting,
   preview output, transaction safety, and audit context;
3. apply it to development only unless production is explicitly requested;
4. run the relevant read-only database verification; and
5. remove the temporary tool and generated artifacts after success.

Never commit source payloads, spreadsheets, CSV exports, screenshots, database
exports, or task-local maintenance scripts. See `DATA_SOURCES.md` for the
current source authority and persisted snapshot.

### Fantasy QA scenarios

Use a disposable Neon branch for lifecycle and League UI testing. Set
`DATABASE_URL` to that branch and set `FANTASY_SCENARIO_BRANCH_ID` to its exact
Neon branch ID. The runner refuses a missing or mismatched branch ID and refuses
`NODE_ENV=production`. Every write is applied in one transaction and ends with
compact postcondition checks; a failure rolls the whole scenario back.

List the available scenarios or apply one directly:

```bash
npm run db:scenario -- --list
npm run db:scenario -- gw1-before
npm run db:scenario -- gw1-live
npm run db:scenario -- gw1-final
npm run db:scenario -- gw2-live
npm run db:scenario -- gw2-final
npm run db:scenario -- gw30-live
npm run db:scenario -- gw30-final
npm run db:scenario -- league-empty
npm run db:scenario -- league-populated
npm run db:scenario -- --advance
npm run db:scenario -- --refresh --primary-team=<team-name> --primary-chip=triple_captain
```

Gameweek scenarios rebuild deterministic fixtures, selections, revisions,
player match points, team scores, and Overall standings for exactly 200 active
teams. Eight distinct valid squad templates provide varied player ownership
without regenerating 200 squads on every switch; deterministic lineup and
captain variations keep teams using the same template from producing identical
results. Fixture kickoff times, deadlines, statuses, scorelines, player minutes,
goals, assists, cards, saves, team totals, summaries, and persisted Overall
ranking are kept mutually consistent. A live scenario scores only players from
the one fixture already in progress and verifies that the target Gameweek
contains both zero-point and positive provisional team totals. Final scenarios
score every completed fixture, and locked selections carry the implemented
free-transfer balance into the open successor. Gameweek scenarios also clear
Private Leagues so each lifecycle baseline is repeatable.
`league-empty` and `league-populated` are fast overlays: they preserve the
current Gameweek/scoring state and only replace Private League data. Apply the
desired Gameweek scenario first, then a League overlay when testing a combined
state. The signed-in tester's most recently active team is selected by default;
use `--primary-team=<team name>` when an explicit signed-in team is needed.
The populated League state gives that tester four memberships (two owned and
two joined), uses member identities for every owner, and preserves realistic
creation and join order.
Before committing, each League overlay compares protected row counts, score
totals, Overall membership/standings, and a Gameweek summary checksum inside
the same transaction. Any unexpected lifecycle or scoring change rolls the
entire overlay back.

Named Gameweek scenarios are reset presets: they rebuild every team's Fantasy
history for a repeatable baseline. `--advance` is the progression mode. It
infers the next lifecycle transition from the database, prioritizing a
provisional Gameweek before the already-open successor:

```text
open GW N -> provisional GW N + open GW N+1 -> final GW N
```

Progression preserves the primary tester's saved selection for every existing
Gameweek, including lineup, bench order, captaincy, chip, transfer settlement,
and transfer revisions. Passing the deadline locks the current saved draft;
the resulting squad is carried into a new draft for the following Gameweek.
Scores are regenerated from the preserved locked selection, while the other
199 teams continue to use deterministic QA squads. Only changes already saved
through the Team screen are in PostgreSQL and can be preserved; an unsaved
browser draft is intentionally invisible to the runner. Use
`--primary-team=<team name>` when automatic signed-in-team detection could be
ambiguous. If that team joined after earlier Gameweeks, progression records an
empty locked selection and zero points for those missing weeks instead of
backdating its current squad. Like named Gameweek presets, progression clears
Private Leagues; apply the desired League overlay afterward when needed.

`--refresh` regenerates fixtures, player points, team scores, and standings for
the current lifecycle state without moving its Gameweek forward. It uses the
same primary-team preservation rules as `--advance`. For chip-specific QA,
`--primary-chip=triple_captain|bench_boost|wildcard|none` overrides the primary
team's target-Gameweek chip and updates its latest transfer revision. A Triple
Captain refresh prefers a live fixture involving the saved captain so the
multiplier is observable in the resulting score.

The scenario runner is intentionally destructive inside the selected Fantasy
season on its disposable branch. Do not point it at the shared development or
production branch. Use `npm run db:verify:fantasy` only when full invariant
verification is useful; routine scenario switching already performs the narrow
checks needed for fast UI iteration.

### League standings workflow

Gameweek lock, finalization, and later score corrections rebuild current
Overall standings in the scoring transaction. A new schema deployment can run
`npm run db:rank:leagues` once after confirming the Neon branch; seasons without
a provisional or final Gameweek are intentionally skipped. Run
`npm run db:verify:fantasy` afterward to verify membership, season, contiguous
rank, and Gameweek-marker invariants. The command stores every current Overall
rank, not only the Top 100 returned by the dialog.

## Working conventions

- Read `AGENTS.md` and the relevant project context document before changing an
  unfamiliar area.
- Keep database and external-source access server-only.
- Use `src/data` for reusable read models and `src/lib/fantasy` for deterministic
  domain calculations.
- Validate Server Actions against current database state and preserve selection
  snapshots, revisions, and audit context.
- Add or update tests whenever squad, lineup, transfer, chip, deadline, points,
  substitution, or auto-fill behavior changes.
- Keep user-facing Thai and English behavior aligned. The current translation
  system uses Thai source copy and a client-side dictionary; update both in the
  same change.
- Do not use `src/lib/fantasy-data.ts` as a new runtime source; it is legacy
  prototype data.
- Derive player ownership from `requireFantasyProfile`; never accept manager or
  team ownership from a client payload. Require `requireAdmin` on every admin
  read and mutation.
- Preserve expired/abandoned Guest Fantasy rows. Session or auth cleanup must
  not cascade into managers, teams, selections, scores, or standings.

## Verification checklist

Run the narrowest relevant check first, followed by the appropriate project
checks before handoff:

```bash
npm run test:rules
npm run test:email
npm run test:auth
npm run types
npm run lint
npm run format:check
npm run build
```

Also confirm as applicable:

- database imports pass `db:verify:competition` and Fantasy counts are sensible;
- team and transfer changes reject invalid squads, expired deadlines, and
  exhausted chip uses;
- Gameweek recalculation handles zero-minute starters, captain fallback, Bench
  Boost, Triple Captain, and transfer deductions;
- loading, empty, error, pending, and success states remain understandable;
- Thai and English display modes work after a reload;
- Mobile below 768px, Tablet at 768–1279px, Desktop from 1280px, and a narrow
  360px viewport remain usable without document-level horizontal overflow;
- keyboard focus is visible and interactive controls have accessible names; and
- a production build passes after route, server, metadata, or integration work.

## Documentation ownership

| File              | Update when                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `README.md`       | Product orientation, current scope, routes, quick start, or documentation links change.       |
| `PRODUCT.md`      | Users, purpose, positioning, constraints, principles, or brand commitments change.            |
| `ARCHITECTURE.md` | Boundaries, routes, data flow, persistence, or security posture changes.                      |
| `DOMAIN.md`       | Fantasy vocabulary, rules, lifecycle, scoring, or ranking changes.                            |
| `DATA_SOURCES.md` | Source IDs, mappings, normalization, import, or verification changes.                         |
| `DESIGN.md`       | Product-wide brand, hierarchy, localization, accessibility, or responsive rules change.       |
| `UI_PATTERNS.md`  | A reusable composition or a Team/Points reference interaction changes.                        |
| `UI_REVIEW.md`    | Route maturity, reachable-state coverage, evidence, exclusions, or audit priority changes.    |
| `DEVELOPMENT.md`  | Toolchain, environment, commands, migration, verification, or documentation workflow changes. |
| `ROADMAP.md`      | Current scope, production blockers, next steps, or out-of-scope decisions change.             |
| `DECISIONS.md`    | A durable choice is made whose alternatives are likely to be reconsidered.                    |
