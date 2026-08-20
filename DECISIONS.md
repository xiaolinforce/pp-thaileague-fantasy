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

**Superseded on 2026-08-19:** Player mutations now resolve an authenticated
team and admin mutations require the database-backed `admin` role. Provider
launch remains separately gated by `AUTH_PRODUCTION_READY`.

## 2026-08-19 — Better Auth owns passwordless member and Guest identity

**Decision:** Use Better Auth with Email OTP and Google as the only member
methods, plus its anonymous plugin for Guest play. Store sessions for 30 days
with daily sliding refresh. Protect Email OTP requests with Turnstile and
database-backed rate limits; store OTP values hashed and rotate them on resend.

**Context:** Players must be able to begin without registering, while members
need cross-device access without application passwords. Google verified-email
matching should safely converge with an OTP-created account.

**Consequences:** Email OTP itself verifies mailbox ownership, so no separate
verification email exists. Google is trusted only for matching verified email;
different-email linking is disabled. Auth providers are opt-in and remain off
in production until the domain, privacy/terms, and provider setup are approved.

## 2026-08-19 — Guest Fantasy history survives auth access and linking

**Decision:** Keep Fantasy managers and teams when a Guest session expires.
Upgrading a Guest to a new account transfers manager ownership. Signing into an
account that already has a team keeps the account team and marks the Guest
manager abandoned; teams and selections are never merged.

**Context:** Fantasy scores and league history must remain reproducible, while
one account must have one manager identity and one team per season.

**Consequences:** The manager-to-auth-user foreign key is nullable and uses
`ON DELETE SET NULL`. Abandoned and expired Guest teams remain in rankings.
Operational cleanup may delete expired auth artifacts but must not delete
historical Fantasy data.

## 2026-08-20 — OTP delivery uses Resend with Mailjet fallback

**Decision:** Use Resend as the primary transactional email provider and
Mailjet as the only fallback. Skip either provider at 90% of its configured
daily or monthly allowance. Fall through after safely retryable hard failures,
but stop after an ambiguous network outcome to avoid sending two valid OTPs.
Reject unsupported provider names instead of silently ignoring stale
configuration.

**Context:** Two providers cover the intended free-quota strategy with less
configuration and operational surface than the previous three-provider route.
Resend remains the preferred sender and Mailjet supplies controlled continuity.

**Consequences:** Brevo has no runtime adapter or environment configuration.
The existing database enum value remains solely so historical delivery rows can
still be read without rewriting migration history. `EMAIL_FROM` must be valid
for both active providers, and delivery logs continue to exclude plaintext
addresses and OTPs.

## 2026-08-19 — OTP delivery uses ordered providers with quota headroom

**Superseded on 2026-08-20:** Runtime delivery now uses only Resend followed by
Mailjet. The historical database provider value is retained for old log rows.

**Decision:** Try Resend, Brevo, then Mailjet, skipping a provider at 90% of its
configured daily or monthly allowance and falling through after definite hard
failures. Do not fall through after an ambiguous network timeout, to avoid
delivering two valid OTP messages. Log only salted recipient hashes and delivery
metadata.

**Context:** Multiple free allowances reduce early operating cost, but retries
must not leak OTPs, addresses, or create confusing duplicate delivery.

**Consequences:** Provider limits are explicit environment configuration and
need monitoring as plans change. `EMAIL_FROM` must be valid for each enabled
provider. No OTP or plaintext recipient email is stored in the delivery log.

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
