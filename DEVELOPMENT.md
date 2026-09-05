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
| `CRON_SECRET`                                                   | Production-only bearer secret for the daily auth-maintenance Vercel Cron.                   |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                      | Google OAuth web application credentials.                                                   |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`        | Required pair for every Email OTP request.                                                  |
| `AUTH_EMAIL_PROVIDERS`, `EMAIL_FROM`, provider keys/limits      | Resend → Mailjet delivery routing and quota headroom.                                       |
| `NEXT_PUBLIC_SITE_URL`                                          | Optional public metadata base URL; local fallback is `http://localhost:3006`.               |
| `FANTASY_SCENARIO_BRANCH_ID`                                    | Exact disposable Neon branch ID required by the destructive QA scenario runner.             |
| `FANTASY_SCENARIO_SEASON_SLUG`, `FANTASY_SCENARIO_PRIMARY_TEAM` | Optional scenario target overrides when more than one season or tester team exists.         |
| `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_ENVIRONMENT`      | Public Sentry ingestion endpoint and `development`/`preview`/`production` event tag.        |
| `SENTRY_AUTH_TOKEN`                                             | Secret build-only token for Sentry release and source-map uploads; never expose to clients. |

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

### Production runtime locality and performance

`vercel.json` pins Vercel Functions to `sin1`, matching the production Neon
region in Singapore. Confirm both sides before changing either region. A region
mismatch adds network latency to every SQL round trip and is especially costly
for authenticated Server Component routes.

Runtime data loaders emit JSON `server_timing` log entries for Fantasy profile,
team state, League overview, fixture, and competition reads. Use Vercel Runtime
Logs to compare `durationMs` after deployment. Test cold and warm requests
separately: competition data and the fixture-only model have five-minute tagged
caches. In-app Fantasy mutations invalidate those tags; direct data maintenance
may remain visible for at most the cache lifetime.

### Error monitoring

Sentry receives uncaught browser, Server Component, Route Handler, Server
Action, and Edge errors through the Next.js instrumentation hooks. Keep the DSN
in `.env.local` for local verification and set the environment tag to
`development`; Vercel Preview and Production use their matching tags. The
ignored `.env.sentry-build-plugin` file may be used for a one-off local
source-map test, but the persistent build token belongs in Vercel environment
variables.

Do not attach email addresses, OTPs, cookies, session values, OAuth tokens,
Turnstile responses, request/response bodies, raw database values, or invite
codes to Sentry events or logs. The shared SDK configuration disables those
automatic data categories and fully masks error-only Session Replays. Use
`Sentry.logger` only for bounded operational events with field names reviewed
for the same privacy rule.

Keep the shared Sentry privacy hooks enabled in Browser, Node and Edge configs.
SDK data-collection switches alone do not scrub SQL parameters embedded in
exception messages. `test:observability` checks redaction and ensures that
Facebook bridge classification never drops genuine application errors.
`test:maintenance` exercises the actual Drizzle HTTP batch through a fake
transport (including failure propagation), without loading `.env.local` or
contacting Neon.

`test:i18n` checks that opaque/lazy and resolved server children emit identical
source HTML for both language preferences, while direct consumers receive the
member language. Browser regression checks must also reload English Points
with a populated bench and exercise Thai/English switching after hydration.

When reviewing incidents, separate `development` from `production` and compare
the event release with the deployed release. After shipping a maintenance fix,
verify a successful `auth-maintenance` check-in before resolving its monitor
issue. Hydration and Facebook-browser incidents require a check on the affected
mobile browser; a clean desktop reload alone does not establish recovery.

## Commands

| Command                          | Purpose                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------- |
| `npm run dev`                    | Start the development server on port 3006.                                        |
| `npm run build`                  | Create a production Next.js build.                                                |
| `npm run start`                  | Serve an existing production build.                                               |
| `npm run lint`                   | Run ESLint.                                                                       |
| `npm run types`                  | Run TypeScript without emitting files.                                            |
| `npm run test:email`             | Run transactional email routing and fallback tests.                               |
| `npm run test:email:integration` | Exercise real delivery orchestration with fake provider/database HTTP transports. |
| `npm run test:auth`              | Run authentication preference parsing tests.                                      |
| `npm run test:rules`             | Run squad, transfer, deadline, scoring, and substitution tests.                   |
| `npm run format:check`           | Check repository formatting with Prettier.                                        |
| `npm run format`                 | Rewrite formatting across the repository; use intentionally.                      |
| `npm run db:check`               | Verify that the configured database can be reached.                               |
| `npm run db:generate`            | Generate a new Drizzle migration from schema changes.                             |
| `npm run db:migrate`             | Apply committed Drizzle migrations.                                               |
| `npm run db:studio`              | Open Drizzle Studio for the configured database.                                  |
| `npm run db:rank:leagues`        | Backfill the latest persisted Overall standings after scoring exists.             |
| `npm run db:report:participants` | Report human and bot season-team totals without identity details.                 |
| `npm run db:scenario -- <name>`  | Apply one fast, guarded Fantasy QA database scenario.                             |
| `npm run db:verify:competition`  | Assert expected source/import structure.                                          |
| `npm run db:verify:fantasy`      | Verify Fantasy, ranking, Gameweek, and League invariants.                         |
| `npm run db:verify:player-stats` | Verify stored official current-season player-stat rows.                           |
| `npm run db:verify:transaction`  | Prove rollback on the exact development branch.                                   |

The production deployment runs `/api/cron/auth-maintenance` daily at 02:17
Asia/Bangkok (19:17 UTC). Vercel supplies `CRON_SECRET` as a bearer token. The
Sentry monitor allows 60 minutes for check-in scheduling jitter, matching the
hour-level timing of Vercel Hobby daily jobs; execution still times out after
five minutes. The monitor configuration is code-managed and takes effect at
the next check-in after deployment. A late successful run must not produce a
missed-check-in alert merely because it started more than ten minutes late.
The job deletes only expired sessions and OTP verification rows, rate-limit rows
older than two days, and privacy-safe email delivery records older than 90
days. It must never delete accounts, Fantasy managers, teams, selections,
scores, transfers, league history, or audit records.

Database commands use a small Windows Node user-info compatibility shim. Keep
the wrapper in package scripts unless the underlying Windows issue is confirmed
resolved for the pinned toolchain.

Prettier excludes generated migration history under `drizzle/` so formatting
does not rewrite committed SQL, snapshots, or the migration journal.
`.gitattributes` keeps text-file checkouts on LF line endings across platforms,
matching Prettier and preventing Windows `core.autocrlf` from reintroducing
format-check failures.

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

The guarded production Actions workflow, migration compatibility policy and
activation status are documented in [RELEASE.md](RELEASE.md). Run
`npm run test:release` when modifying its guards. Building the application alone
does not migrate the database; production automation requires the documented
GitHub and Vercel configuration before activation.

`READINESS_SECRET` optionally authorizes `/api/health/ready` for CI and monitors.
Store it server-only in Vercel Production and GitHub's Production environment.
It provides no maintenance permission. Existing `CRON_SECRET` readiness probes
continue to work; the Cron route still accepts only `CRON_SECRET`.

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

### Bot participants and internal reporting

Bot provisioning is a separate owner-authorized, task-scoped maintenance
operation, not a QA scenario. Confirm the branch, preview all squads using the
published candidate pool, validate fresh eligibility and the open deadline in
the write transaction, and preserve snapshots, revisions, Overall membership,
and audit context. Use unique bot keys and a batch key so retries cannot add
duplicate participants or replace existing squads. Rehearse with rollback on
development before production. Never copy human or bot team rows between
environments. Remove temporary import tools and plans after verification.

`db:report:participants` is read-only and reports season teams, including
preserved Guests, rather than unique humans or active users. Run `db:check`
against the intended environment first. `db:verify:fantasy` additionally checks
bot identity invariants while continuing to reject obsolete seeded managers.

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
npm run test:maintenance
npm run test:observability
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

## Reviewing the admin workspace

Use the local `/admin/fantasy` workspace with an existing authorized admin
session. Check mode switching, URL-backed filters, loaded current values and
confirmation cancellation before exercising any mutation. Compare participant
counts with `npm run db:report:participants`. Full mutation/scoring scenarios
still require a confirmed disposable development branch; do not lock a real
Gameweek or change player stats merely to capture UI evidence.

## Fantasy persistence verification

After confirming the development branch, run:

```bash
node --conditions react-server --require ./scripts/windows-node-user-info-shim.cjs --import tsx ./scripts/verify-fantasy-persistence.ts --branch-id=<confirmed-development-branch>
```

This requires a complete squad in an open Gameweek and reviewed scored match data.
It rejects malformed/unknown-player saves, stale revisions, expired and locked
selections; verifies concurrent lock exclusion and database constraints; injects a
scoring failure; and rehearses classification and batched lock/carryover/scoring.
Every transaction rolls back and checksums verify all affected Fantasy tables.
It does not reset QA scenarios. On 2026-09-05, branch `br-green-queen-az934b4e`
passed; the 200-team lifecycle rehearsal used 41 SQL statements including
transaction and verification reads. Production migration was applied separately
on 2026-09-05 after the owner deployed the matching application release; see
`PRODUCTION.md` for the branch, journal, recovery reference, and verification.
Older writers do not supply its required season keys, so rollback must account
for application/schema compatibility.

## Dependency security patches (2026-09-05)

The lockfile resolves `fast-uri` 3.1.7 and `qs` 6.16.0. A scoped override moves
`@esbuild-kit/core-utils` to esbuild 0.25.12, matching Drizzle Kit’s existing
esbuild generation instead of accepting the audit suggestion to downgrade
Drizzle Kit. `db:generate` still reads the schema successfully with no changes.
Both the complete dependency audit and production audit report zero known
vulnerabilities at verification time. Review/remove the scoped override when
Drizzle Kit drops the legacy loader.

Upstream advisories: [fast-uri](https://github.com/fastify/fast-uri/security/advisories/GHSA-f65p-4m7j-42xc),
[qs](https://github.com/ljharb/qs/security/advisories/GHSA-4mjr-xmp4-gh2g), and
[esbuild](https://github.com/evanw/esbuild/security/advisories/GHSA-67mh-4wv8-2f99).
