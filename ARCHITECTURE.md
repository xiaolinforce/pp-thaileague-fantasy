# Architecture

## Overview

PP Thaileague Fantasy is a Next.js 16 App Router application backed by Neon
Postgres through Drizzle ORM. Server Components load competition and fantasy
state, focused Client Components own interactive team-management screens, and
Server Actions validate authenticated player and administrative changes.

```text
Thai League API + Transfermarkt + curated club identities
                         |
                         v
                 import and seed scripts
                         |
                         v
                    Neon Postgres
                         |
                         v
          Better Auth + Drizzle server-only queries
                         |
              +----------+-----------+
              |                      |
              v                      v
       Server Component pages   Server Actions
              |                      |
              +----------+-----------+
                         |
                         v
                 interactive clients
```

Better Auth owns passwordless Email OTP, Google OAuth, anonymous Guest users,
30-day sliding sessions, and database-backed rate limiting. Fantasy managers
reference auth users without making historical teams dependent on the auth row.
Auth cookies use the application-specific `pp-thaileague-fantasy` prefix so
local sessions do not collide with other applications served from `localhost`.
League standings contain only provisioned Guest or member teams; seeds do not
create synthetic manager identities.

## Main boundaries

| Area                     | Location                             | Responsibility                                                                                      |
| ------------------------ | ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Routes and screens       | `src/app`                            | App Router pages, layouts, loading/error boundaries, and fantasy Server Actions.                    |
| Fantasy UI               | `src/components/fantasy`             | Shared shell, player identity, kit, position, gameweek, localization, and data-state components.    |
| UI primitives            | `src/components/ui`                  | Reusable Base UI/shadcn interaction primitives.                                                     |
| Read models              | `src/data`                           | Server-only competition, squad, points, league, and admin queries.                                  |
| Game rules               | `src/lib/fantasy/rules.ts`           | Squad, lineup, transfer, chip, and deadline validation.                                             |
| Squad auto-fill          | `src/lib/fantasy/auto-fill.ts`       | Pure constrained, ranking-weighted, randomized completion of vacant draft slots.                    |
| Player ranking           | `src/lib/fantasy/ranking.ts`         | Pure preseason projection, deterministic ordering, confidence, and tier-boundary derivation.        |
| Authentication           | `src/lib/auth`                       | Better Auth configuration, session identity, account linking, and name policy.                      |
| Account provisioning     | `src/lib/fantasy/provisioning.ts`    | Manager/team creation, empty opening draft, Overall membership, and Guest upgrade behavior.         |
| League operations        | `src/lib/fantasy/league-service.ts`  | Transactional Private League limits, ownership, membership, invite rotation, and audit writes.      |
| Transactional email      | `src/lib/email`                      | OTP delivery routing, provider quota headroom, and privacy-safe delivery logs.                      |
| Scoring                  | `src/lib/fantasy/scoring.ts`         | Pure player-points and team-score calculation.                                                      |
| Score persistence        | `src/lib/fantasy/scoring-service.ts` | Server-only Gameweek recalculation and score upserts.                                               |
| Persistence              | `src/db`                             | Drizzle client and the PostgreSQL schema source of truth.                                           |
| Migrations               | `drizzle`                            | Generated, ordered SQL migrations and Drizzle snapshots.                                            |
| Imports and operations   | `scripts`                            | Competition import, fantasy seed, player ranking, normalization, club identities, and verification. |
| External-source adapters | `scripts/sources`                    | Thai League API, Transfermarkt, and curated normalization/visual identity records.                  |

Runtime routes read from `src/data` and PostgreSQL. The legacy static Fantasy
dataset has been removed and must not be reintroduced as a runtime fallback.

## Route model

| Route            | Rendering and data                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------- |
| `/`              | Dynamic Email OTP, Google, and Guest onboarding; authenticated users redirect to the game.    |
| `/upgrade`       | Authenticated Guest upgrade through Email OTP or Google.                                      |
| `/team`          | Server-loads data, then hands lineup and transfer management to Client Components.            |
| `/points`        | Server-renders the selected Gameweek score and its breakdown.                                 |
| `/leagues`       | Server-loads the current team's Overall and Private League summaries.                         |
| `/leagues/[id]`  | Authorizes membership, then renders paginated standings and role-appropriate controls.        |
| `/fixtures`      | Server-loads competition fixtures, then delegates interactive browsing to a Client Component. |
| `/profile`       | Authenticated account/team identity, member naming, and Guest upgrade.                        |
| `/settings`      | Authenticated language preference; member value persists on the manager row.                  |
| `/rules`         | Public long-form rules built from shared executable rule and scoring constants.               |
| `/help`          | Public FAQ and real support destinations; no account data is required.                        |
| `/admin/fantasy` | Role-protected controls for stats, classification, locking, and finalization.                 |

The root layout provides Mitr, the language context, shared tooltips, and toast
feedback. Guest and Email OTP sign-in complete account provisioning through a
Server Action before client navigation so the application shell receives the
new identity immediately. Database-backed pages are dynamically rendered: their
data modules are server-only and call the current Next.js connection API before
querying.

## Read flow

1. A route resolves the Better Auth session and calls a server-only read model.
2. The server-only data module queries Drizzle using the shared client from
   `src/db/index.ts`.
3. Competition records are normalized into UI-facing club, player, fixture,
   and table shapes. Fantasy records are assembled around the current season,
   open/planned Gameweek, and the current account's manager/team selection.
4. The page renders directly or passes serializable data to a focused Client
   Component.

External services are not called during normal page rendering. They are read
by explicit import scripts and persisted before the application serves them.

The Team client may request an auto-fill suggestion through a read-only Server
Action. The action authenticates the current manager, reloads the published
ranking and current player eligibility from PostgreSQL, and returns only a
completed local draft. It does not persist a selection or consume transfers;
the normal save action remains the only confirmation boundary.

## Write flow

1. Team, transfer, profile, settings, League, or admin UI invokes its owning Server Action.
2. The action resolves the account-owned team from the session; admin actions
   additionally reload and require the `admin` role.
3. The server reloads current database snapshots and validates deadlines,
   squad composition, lineup, chips, and transfer settlement.
4. Drizzle writes selections, revisions, League memberships, stats,
   classifications, or Gameweek state. League and administrative operations
   append application-level audit rows.
5. Affected fantasy routes are revalidated.

Ordinary reads and fixed query batches use the Neon HTTP client. Gameweek lock
and finalization use the transaction-capable Neon serverless client. Private
League mutations use the same client and lock the current team plus target
league with `FOR UPDATE`, so the 10-owned, 20-membership, and 100-team limits
remain valid under concurrent requests.

Member team-name edits lock and reload the season team before writing the
normalized name and incrementing its seasonal rename count. A case-insensitive
database unique index prevents two teams in the same season from sharing a
name, including concurrent edits. Member language changes write
`fantasy_managers.preferred_language`; Guests never call either mutation and
use the local `thai-fantasy-language` preference instead.

Authentication providers are independently opt-in and also subject to
`AUTH_PRODUCTION_READY`. This deployment gate prevents accidental public use
before domain/legal/provider review; it complements rather than replaces the
session and role checks on each mutation.

## Account lifecycle

Anonymous users receive a 30-day sliding Better Auth session, a random unique
team name, and no naming controls. The team name is the only public Fantasy
display identity; Better Auth provider names remain internal authentication
metadata. Expiry removes access, not Fantasy rows;
the team remains in historical standings. Guest sign-out invalidates only the
current session, so the next anonymous sign-in creates a new Guest identity and
team instead of reclaiming the prior Guest. Linking a Guest to a new member
moves the manager ownership to the new auth user. Signing into an existing
account keeps that account's team and marks the Guest manager `abandoned`,
preserving both histories without merging selections. Initial account
provisioning is idempotent: concurrent auth completion requests converge on one
manager, team, and empty opening selection. Selection-player snapshots and the
opening transfer revision are created together only after the manager first
saves a valid 15-player squad.

Email OTP values are hashed in the verification table, expire after five
minutes, allow three attempts, and rotate on resend. Turnstile protects every
OTP request. Delivery logs store a salted recipient hash and provider metadata,
never the address or OTP. OTP delivery uses Resend first with Mailjet as the
only fallback; ambiguous delivery outcomes stop without retrying to avoid two
valid messages. Google may implicitly link only trusted, matching, verified
email identities; different-email linking is disabled.

## Gameweek and scoring flow

```text
planned -> open -> provisional -> final
             |          |          |
             |          |          +-- scoreComplete=true; recalculate final scores
             |          +------------- selections locked; calculate provisional scores
             +------------------------ accept lineup, transfer, and chip changes
```

The schema also permits a `locked` Gameweek status, but the current admin action
locks team selections and moves the Gameweek directly from `open` to
`provisional`. Treat the implemented action flow as current behavior until a
separate locked phase is deliberately introduced.

Player match stats are converted into per-match point breakdowns. The scoring
service aggregates all fixtures whose `matchweek` equals the Fantasy Gameweek,
then applies automatic substitutions, captaincy, chips, and transfer deductions
to every locked selection. Recalculation upserts the derived score, allowing
late or corrected match data to update the original Gameweek. The same
recalculation persists average and highest points on the Gameweek from every
scored selection that contains at least one player. Points pages read those
stored summaries instead of aggregating every team on each request.

The Fixtures and Stats read model keeps two datasets separate. Official
current-season player aggregates are imported into
`competition_player_season_stats` with source identifiers, payload, identity
match method, and import timestamp. Reviewed per-match Fantasy inputs and
derived points remain in the Fantasy scoring tables. Runtime requests read only
the database; they never fetch Thai League or synthesize leader values. The
client receives explicit availability metadata and renders a truthful empty
state until each dataset exists.

## Persistence model

The schema is organized into four related groups:

- Authentication: users, sessions, provider accounts, OTP verifications,
  rate-limit state, and privacy-safe email delivery attempts.

- Competition: competitions, seasons, competition seasons, venues, clubs,
  visual identities, entries, players, registrations, fixtures, and sourced
  player season aggregates.
- Fantasy configuration and play: Fantasy seasons, Gameweeks, tier definitions,
  player classifications, versioned ranking runs and player projections,
  managers, teams, selections, selection snapshots, transfer revisions,
  leagues, memberships, and League audit history.
- Scoring and review: match stats, stat overrides, player match points, team
  Gameweek scores, and the fantasy admin audit log.

Selection-player rows intentionally snapshot club, position, tier, and Thai
status. Historical squads and scores must not silently change when the current
player classification changes.

Ranking is an explicit server-side operation, never a runtime page dependency.
The script fetches source data, builds a complete draft run, and validates open
draft squads. A final database batch updates effective tiers and current draft
snapshots, supersedes the prior published run, publishes the new run, and adds
audit context. Locked selections, calculated scores, and prior Gameweeks are
never rewritten.

## Architectural conventions

- Keep database access and external-source fetching server-only.
- Use the shared Drizzle client; do not create route-local clients.
- Keep deterministic business calculations in `src/lib/fantasy` and test them
  independently from React and the database.
- Validate mutations against fresh database snapshots, not client-supplied
  player classifications.
- Keep pages focused on composition. Put reusable reads in `src/data` and
  reusable domain behavior in `src/lib`.
- Treat `src/db/schema.ts` as the schema source of truth and committed Drizzle
  migrations as immutable history.
- Preserve selection snapshots and append audit/revision records when changing
  consequential fantasy state.
