# Decision log

Record durable decisions here when an alternative is likely to be reconsidered.
Each entry states the date, decision, context, and consequences. This file is
not a changelog or a place for short-lived implementation notes.

## 2026-08-17 — Root documentation is split by concern

**Decision:** Keep `README.md` for orientation, `ARCHITECTURE.md` for technical
boundaries, `DOMAIN.md` for Fantasy rules, `DATA_SOURCES.md` for provenance and
imports, `DESIGN.md` for interface rules, `DEVELOPMENT.md` for working practice,
`ROADMAP.md` for scope, and this file for durable rationale.

**Context:** The application grew from a visual prototype into a database-backed
Fantasy rules and scoring system. A single README no longer exposes enough
context for safe changes.

**Consequences:** Update the owning document in the same change as behavior.
Link rather than duplicate detailed rules across files. `AGENTS.md` points
contributors to the relevant context and keeps only non-negotiable instructions.

## 2026-08-17 — Game scoring is FPL-inspired with explicit Thai Fantasy deviations

**Decision:** Use the familiar FPL structure for appearances, goals, assists,
clean sheets, saves, cards, own goals, captaincy, automatic substitutions, Bench
Boost, Triple Captain, and Wildcard, but assign goalkeeper goals 10 points and
exclude bonus/BPS and Defensive Contributions.

**Context:** The product needs recognizable Fantasy behavior while retaining an
explicit Thai Fantasy ruleset. Bonus and defensive contribution data are not
part of the approved input/review workflow.

**Consequences:** Scoring differences must stay explicit in `DOMAIN.md`, the
profile rules, and automated tests. Do not introduce an upstream FPL rule merely
because it exists there; it requires a new product decision and source data.

## 2026-08-17 — Historical selections store player classification snapshots

**Decision:** Store club, position, tier, and Thai status on every
selection-player row. Store player tiers as effective-from-Gameweek records.
Current Thai-status corrections apply to subsequent selections, while existing
selection snapshots preserve the prior decision.

**Context:** Club registration, nationality decisions, availability, and tier
can change during a season. Re-reading the latest player row would rewrite the
meaning and validity of an earlier squad.

**Consequences:** Score and historical display code should use selection
snapshots. New classification fields that affect eligibility should be assessed
for snapshot treatment and, where necessary, effective dating. Corrections
require an audit reason rather than silent mutation of history.

## 2026-08-17 — External football data is imported before runtime

**Decision:** Fetch Thai League and Transfermarkt data through explicit scripts,
normalize and validate it, and persist it in PostgreSQL. Runtime pages read the
database and do not call those sources directly.

**Context:** The application needs stable page rendering, repeatable Fantasy
derivation, source provenance, and protection from runtime source outages or
schema changes.

**Consequences:** Data freshness depends on an import operation. Every source
mapping needs a stable external identifier and verification. A future scheduler
must invoke the same controlled import boundary rather than bypass it from page
code.

## 2026-08-17 — Production demo mutations default to disabled

**Decision:** Server Actions reject demo writes in production unless
`FANTASY_DEMO_WRITE_ENABLED=true`.

**Context:** The prototype has state-changing team, transfer, scoring, and admin
actions but no authentication or authorization.

**Consequences:** Production should remain read-only by default. The flag is a
temporary safety guard, not access control. It must not be enabled for a public
deployment, and `/admin/fantasy` must not be treated as a production admin
surface, until identity and permission boundaries are implemented.

## 2026-08-14 — Neon Postgres and Drizzle own persisted application state

**Decision:** Use Neon Postgres for competition and Fantasy data, Drizzle schema
definitions in `src/db/schema.ts`, the shared server-only client in
`src/db/index.ts`, and committed generated migrations under `drizzle`.

**Context:** The product needs relational integrity, historical snapshots,
repeatable imports, scoring derivation, and environment separation beyond a
static UI dataset.

**Consequences:** Schema changes require reviewed forward migrations. Database
access stays server-only. The selected Neon branch determines the environment,
so migrations and seeds require an explicit target check. The old static
`src/lib/fantasy-data.ts` file is not a runtime source of truth.
