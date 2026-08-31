# Development guide

## Requirements

- Node.js 24.18.1 and npm 12.0.2, pinned through Volta in `package.json`.
- A PostgreSQL-compatible Neon database branch.
- Network access when importing Thai League and Transfermarkt source data.

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

| Variable                                                   | Purpose                                                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                             | Server runtime, Drizzle Kit, migration, seed, and verification connection.                  |
| `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`                    | Better Auth origin and signing/encryption secret.                                           |
| `AUTH_EMAIL_HASH_SECRET`                                   | Separate salt for privacy-safe recipient hashes in delivery logs.                           |
| `AUTH_EMAIL_ENABLED`, `AUTH_GOOGLE_ENABLED`                | Opt each sign-in method into the current environment.                                       |
| `AUTH_PRODUCTION_READY`                                    | Additional production-only gate; keep false until domain/legal/provider review is complete. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                 | Google OAuth web application credentials.                                                   |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`   | Required pair for every Email OTP request.                                                  |
| `AUTH_EMAIL_PROVIDERS`, `EMAIL_FROM`, provider keys/limits | Resend → Mailjet delivery routing and quota headroom.                                       |
| `NEXT_PUBLIC_SITE_URL`                                     | Optional public metadata base URL; local fallback is `http://localhost:3006`.               |

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

Prepare and start a fresh development database:

```bash
npm run db:check
npm run db:migrate
npm run db:seed:competition
npm run db:normalize:player-short-names -- --apply
npm run db:verify:competition
npm run db:seed:fantasy
npm run db:rank:players -- --publish
npm run db:verify:fantasy
npm run dev
```

Open `http://localhost:3006`.

## Commands

| Command                                   | Purpose                                                               |
| ----------------------------------------- | --------------------------------------------------------------------- |
| `npm run dev`                             | Start the development server on port 3006.                            |
| `npm run build`                           | Create a production Next.js build.                                    |
| `npm run start`                           | Serve an existing production build.                                   |
| `npm run lint`                            | Run ESLint.                                                           |
| `npm run types`                           | Run TypeScript without emitting files.                                |
| `npm run test:email`                      | Run transactional email routing and fallback tests.                   |
| `npm run test:auth`                       | Run authentication preference parsing tests.                          |
| `npm run test:rules`                      | Run squad, transfer, deadline, scoring, and substitution tests.       |
| `npm run format:check`                    | Check repository formatting with Prettier.                            |
| `npm run format`                          | Rewrite formatting across the repository; use intentionally.          |
| `npm run db:check`                        | Verify that the configured database can be reached.                   |
| `npm run db:generate`                     | Generate a new Drizzle migration from schema changes.                 |
| `npm run db:migrate`                      | Apply committed Drizzle migrations.                                   |
| `npm run db:studio`                       | Open Drizzle Studio for the configured database.                      |
| `npm run db:seed:competition`             | Fetch, normalize, and upsert competition data.                        |
| `npm run db:seed:fantasy`                 | Refresh Fantasy configuration, player tiers, and Overall membership.  |
| `npm run db:rank:players`                 | Preview or explicitly publish a versioned player ranking.             |
| `npm run db:rank:leagues`                 | Backfill the latest persisted Overall standings after scoring exists. |
| `npm run db:seed:club-colors`             | Reapply the curated club visual identity registry.                    |
| `npm run db:normalize:clubs`              | Apply explicit club display-name normalization.                       |
| `npm run db:normalize:club-short-names`   | Apply curated Thai/English club short names.                          |
| `npm run db:normalize:player-short-names` | Preview or apply sourced Thai and derived English player short names. |
| `npm run db:verify:competition`           | Assert expected source/import structure.                              |
| `npm run db:verify:fantasy`               | Verify Fantasy, ranking, Gameweek, and League invariants.             |
| `npm run db:import:player-stats`          | Preview official current-season stats; apply with exact branch id.    |
| `npm run db:verify:player-stats`          | Verify stored official current-season player-stat rows.               |
| `npm run db:verify:transaction`           | Prove rollback on the exact development branch.                       |

Database commands use a small Windows Node user-info compatibility shim. Keep
the wrapper in package scripts unless the underlying Windows issue is confirmed
resolved for the pinned toolchain.

## Database workflow

1. Change `src/db/schema.ts`.
2. Run `npm run db:generate`.
3. Review the generated SQL and snapshot under `drizzle`.
4. Apply the migration to the Neon development branch with
   `npm run db:migrate`.
5. Run the relevant seed only when the schema or source data requires it.
6. Run both structural verification and the affected application checks.
7. Test development before applying the same committed migration to production.

Do not edit or replace a migration that may already have been applied. Create a
new migration for follow-up changes. Do not use production as a seed or schema
experimentation environment.

The project currently uses one `DATABASE_URL` for runtime and migrations.
Environment isolation therefore depends on selecting the correct Neon branch.
Confirm the target before any migration, import, normalization, or seed command.

### Ranking workflow

Run the ranking command without `--publish` first and retain a CSV for review.
The default version targets the 2026/27 preseason and Gameweek 1. It derives
Level 1 from the top `5%`, Level 2 from the next `15%`, Level 3 from the next
`20%`, and Level 4 from the remainder of the active ranked pool. Cumulative
boundaries are rounded to keep ranks contiguous. When changing any assumption,
pass all values explicitly and use a new version:

```bash
npm run db:rank:players -- --version=preseason-2026-27-v2 --effective-gameweek=1 --l1-percent=5 --l2-percent=15 --l3-percent=20 --output=ranking-v2.csv
npm run db:rank:players -- --publish --version=preseason-2026-27-v2 --effective-gameweek=1 --l1-percent=5 --l2-percent=15 --l3-percent=20
npm run db:verify:fantasy
```

Confirm the Neon branch before both commands because preview reads current
players and publication writes ranking runs, rankings, effective tiers, draft
snapshots, and an audit row. Published versions are not rebuilt in place.

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
  substitution, or ranking behavior changes.
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
