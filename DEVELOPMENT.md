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

| Variable                     | Purpose                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| `DATABASE_URL`               | Server runtime, Drizzle Kit, migration, seed, and verification database connection.        |
| `FANTASY_DEMO_WRITE_ENABLED` | Allows demo mutations in production only when explicitly `true`; leave `false` by default. |
| `NEXT_PUBLIC_SITE_URL`       | Optional public metadata base URL; local fallback is `http://localhost:3006`.              |

`NEXT_PUBLIC_SITE_URL` is optional and is therefore not required in
`.env.example`. Never give `DATABASE_URL` a `NEXT_PUBLIC_` prefix or commit a
real connection string.

Prepare and start a fresh development database:

```bash
npm run db:check
npm run db:migrate
npm run db:seed:competition
npm run db:verify:competition
npm run db:seed:fantasy
npm run db:verify:fantasy
npm run dev
```

Open `http://localhost:3006`.

## Commands

| Command                         | Purpose                                                         |
| ------------------------------- | --------------------------------------------------------------- |
| `npm run dev`                   | Start the development server on port 3006.                      |
| `npm run build`                 | Create a production Next.js build.                              |
| `npm run start`                 | Serve an existing production build.                             |
| `npm run lint`                  | Run ESLint.                                                     |
| `npm run types`                 | Run TypeScript without emitting files.                          |
| `npm run test:rules`            | Run squad, transfer, deadline, scoring, and substitution tests. |
| `npm run format:check`          | Check repository formatting with Prettier.                      |
| `npm run format`                | Rewrite formatting across the repository; use intentionally.    |
| `npm run db:check`              | Verify that the configured database can be reached.             |
| `npm run db:generate`           | Generate a new Drizzle migration from schema changes.           |
| `npm run db:migrate`            | Apply committed Drizzle migrations.                             |
| `npm run db:studio`             | Open Drizzle Studio for the configured database.                |
| `npm run db:seed:competition`   | Fetch, normalize, and upsert competition data.                  |
| `npm run db:seed:fantasy`       | Create or refresh Fantasy configuration and demo state.         |
| `npm run db:seed:club-colors`   | Reapply the curated club visual identity registry.              |
| `npm run db:normalize:clubs`    | Apply explicit club display-name normalization.                 |
| `npm run db:verify:competition` | Assert expected source/import structure.                        |
| `npm run db:verify:fantasy`     | Print main Fantasy table row counts.                            |

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
- Do not enable production demo writes or treat `/admin/fantasy` as protected
  until authentication and server-side authorization are implemented.

## Verification checklist

Run the narrowest relevant check first, followed by the appropriate project
checks before handoff:

```bash
npm run test:rules
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
- desktop, 900 px navigation collapse, and narrow mobile layouts remain usable;
- keyboard focus is visible and interactive controls have accessible names; and
- a production build passes after route, server, metadata, or integration work.

## Documentation ownership

| File              | Update when                                                                         |
| ----------------- | ----------------------------------------------------------------------------------- |
| `README.md`       | Product orientation, current scope, routes, or quick start changes.                 |
| `ARCHITECTURE.md` | Boundaries, routes, data flow, persistence, or security posture changes.            |
| `DOMAIN.md`       | Fantasy vocabulary, rules, lifecycle, scoring, or ranking changes.                  |
| `DATA_SOURCES.md` | Source IDs, mappings, normalization, import, or verification changes.               |
| `DESIGN.md`       | Brand, tokens, localization, components, accessibility, or responsive rules change. |
| `DEVELOPMENT.md`  | Toolchain, environment, commands, migration, or verification workflow changes.      |
| `ROADMAP.md`      | Current scope, production blockers, next steps, or out-of-scope decisions change.   |
| `DECISIONS.md`    | A durable choice is made whose alternatives are likely to be reconsidered.          |
