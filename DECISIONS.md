# Decision log

Record durable decisions here when an alternative is likely to be reconsidered.
Each entry states the date, decision, context, and consequences. This file is
not a changelog or a place for short-lived implementation notes.

## 2026-08-26 — The interface uses three shared responsive modes

**Decision:** Use Mobile below 768px, Tablet from 768px through 1279px, and
Desktop from 1280px upward across every route. Implement these as two shared
viewport cutoffs at 48rem and 80rem. Mobile uses bottom navigation, Tablet uses
the compact icon sidebar, and Desktop uses the full sidebar and wide
multi-column workspaces.

**Context:** The earlier 620px, 640px, 900px, 980px, and 1120px route-specific
breakpoints created too many intermediate states. At 1121px the Team workspace
kept the full sidebar while its two-column content no longer fit, producing
document-level horizontal overflow. The shared cutoffs match common responsive
foundations while reserving enough width for the full 238px sidebar and the
Team pitch/market workspace.

**Consequences:** New route and component work must reuse the shared Mobile,
Tablet, and Desktop modes rather than add viewport breakpoints. Use fluid Grid,
Flexbox, `clamp()`, or container-aware layout for local adaptation. Responsive
verification covers 360px and both sides of 768px and 1280px, in Thai and
English, with document-level horizontal overflow treated as a defect.

## 2026-08-25 — Squads use four cumulative tiers

**Decision:** Define nominal squad slots as 3/3/3/6 for Levels 1–4. Validate
them cumulatively: Level 1 is capped at 3, Levels 1–2 at 6, Levels 1–3 at 9,
and the complete squad at 15. Derive player levels from the active eligible
published ranking as top 5%, next 15%, next 20%, and the remaining 60%, using
rounded cumulative boundaries.

**Context:** Four levels create more useful separation across the full player
pool while preserving the existing rule that a lower-ranked player may occupy
an unused higher-level slot. The product is still pre-launch, so the new model
can begin at Gameweek 1 without changing real-player history.

**Consequences:** Ranking runs store Level 1–3 counts and derive Level 4 from
the remainder. Seeds use Level 4 as the safe pre-ranking fallback. Validation,
auto-fill, admin classification, market filters, rule copy, and verification
must all recognize Levels 1–4. Historical selection snapshots remain the
source of truth once real Gameweeks lock.

## 2026-08-24 — Auto-fill is a ranking-weighted local draft suggestion

**Decision:** Auto-fill preserves selected players and fills only vacancies
from the complete eligible pool, independent of visible market filters. It
targets the nominal 3/3/3/6 tier allocation when feasible, then uses published
projected points with bounded randomness for quality and variety. It assigns
missing captaincy but never saves the squad automatically.

**Context:** New teams begin empty, while manually filling fifteen constrained
positions is time-consuming. A purely best-ranked result would make teams too
similar, and unrestricted randomness would undermine the value of the
published ranking.

**Consequences:** The read-only Server Action must authenticate, reload current
eligibility and the effective published ranking, and return only draft members.
The pure solver treats club, foreign-player, tier, position, lineup, and
duplicate constraints as hard limits and accepts an injected random source for
repeatable tests. The existing save action remains responsible for fresh
server validation, transfer settlement, revisions, and persistence.

## 2026-08-24 — New teams choose their opening squad from an empty draft

**Decision:** Provision Guest, Email, and Google users with a manager, season
team, Overall membership, and an empty selection. Show 15 position-locked UI
slots, but persist player snapshots and transfer revision 1 only when the user
first saves a valid 15-player squad. Existing teams and seeded demo squads are
not cleared or rebuilt.

**Context:** Automatically assigned players made the opening experience feel
preselected and reduced the manager's ownership of the first squad. The current
selection model already permits a draft selection with no player rows, so an
empty opening state does not require nullable snapshot records or a schema
migration.

**Consequences:** Partial first squads remain client-local and are lost on
reload because saving remains disabled until all 15 slots are filled. The first
valid save creates revision 1 and counts zero transfers. An unsaved empty team
locks and scores zero without creating an empty revision, and the following
Gameweek remains an empty draft. Provisioning stays idempotent and must never
clear an existing account's squad.

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

## 2026-08-22 — Player order is canonical and tiers are derived boundaries

**Tier boundaries superseded on 2026-08-25:** The canonical order remains, but
the current four-tier boundaries are defined by the decision above.

**Decision:** Store a complete versioned player ranking where rank 1 represents
the highest projected Fantasy points. Derive Level 1 from ranks 1–50, Level 2
from 51–150, and Level 3 from all remaining ranks for the 2026/27 preseason.
Published runs retain model/source facts and are never rebuilt in place.

**Context:** Tier proportions may change later, so tier alone is insufficient
as the durable evaluation. Prior-season official data has partial coverage of
the current squad pool and must be combined with current market value, expected
minutes, position priors, club context, and explicit confidence.

**Consequences:** A new proportion can reuse the stored order and publish new
effective boundaries. Source matching is conservative; manual exceptions use a
stable Transfermarkt ID, never a display name alone. Publication is blocked
after selection lock/scoring, preserves historical snapshots, and records an
admin audit entry.

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
