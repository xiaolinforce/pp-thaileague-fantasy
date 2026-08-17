# Architecture

## Overview

PP Thaileague Fantasy is a Next.js 16 App Router application backed by Neon
Postgres through Drizzle ORM. Server Components load competition and fantasy
state, focused Client Components own interactive team-management screens, and
Server Actions validate and persist demo-game changes.

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
              Drizzle server-only queries
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

The application currently presents one playable demo identity, `PIYA FC`.
Other seeded managers provide league standings but cannot sign in or take over
their teams.

## Main boundaries

| Area                     | Location                             | Responsibility                                                                                   |
| ------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Routes and screens       | `src/app`                            | App Router pages, layouts, loading/error boundaries, and fantasy Server Actions.                 |
| Fantasy UI               | `src/components/fantasy`             | Shared shell, player identity, kit, position, gameweek, localization, and data-state components. |
| UI primitives            | `src/components/ui`                  | Reusable Base UI/shadcn interaction primitives.                                                  |
| Read models              | `src/data`                           | Server-only competition, squad, points, league, and admin queries.                               |
| Game rules               | `src/lib/fantasy/rules.ts`           | Squad, lineup, transfer, chip, and deadline validation.                                          |
| Scoring                  | `src/lib/fantasy/scoring.ts`         | Pure player-points and team-score calculation.                                                   |
| Score persistence        | `src/lib/fantasy/scoring-service.ts` | Server-only Gameweek recalculation and score upserts.                                            |
| Persistence              | `src/db`                             | Drizzle client and the PostgreSQL schema source of truth.                                        |
| Migrations               | `drizzle`                            | Generated, ordered SQL migrations and Drizzle snapshots.                                         |
| Imports and operations   | `scripts`                            | Competition import, fantasy seed, normalization, club identities, and database verification.     |
| External-source adapters | `scripts/sources`                    | Thai League API, Transfermarkt, and curated normalization/visual identity records.               |

`src/lib/fantasy-data.ts` is an unused static prototype dataset. Runtime routes
read from `src/data` and the database. Do not build new behavior on the static
file; remove it in a deliberate cleanup once no design reference depends on it.

## Route model

| Route            | Rendering and data                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------- |
| `/`              | Static product landing page.                                                                  |
| `/dashboard`     | Server-loads competition and demo fantasy summaries.                                          |
| `/team`          | Server-loads data, then hands interactive lineup management to a Client Component.            |
| `/transfers`     | Server-loads data, then hands search, filtering, and squad changes to a Client Component.     |
| `/points`        | Server-renders the selected Gameweek score and its breakdown.                                 |
| `/leagues`       | Server-renders Overall and Private Classic standings.                                         |
| `/fixtures`      | Server-loads competition fixtures, then delegates interactive browsing to a Client Component. |
| `/profile`       | Client-owned prototype settings, language selection, and game-rules presentation.             |
| `/admin/fantasy` | Server-rendered internal controls for stats, classification, locking, and finalization.       |

The root layout provides Mitr, the language context, shared tooltips, and toast
feedback. Database-backed pages are dynamically rendered: their data modules
are server-only and call the current Next.js connection API before querying.

## Read flow

1. A route calls `getCompetitionDataset`, `getDemoFantasyState`,
   `getDemoPointsState`, or `getFantasyAdminGameweeks`.
2. The server-only data module queries Drizzle using the shared client from
   `src/db/index.ts`.
3. Competition records are normalized into UI-facing club, player, fixture,
   and table shapes. Fantasy records are assembled around the current season,
   open/planned Gameweek, and `PIYA FC` selection.
4. The page renders directly or passes serializable data to a focused Client
   Component.

External services are not called during normal page rendering. They are read
by explicit import scripts and persisted before the application serves them.

## Write flow

1. The team, transfer, or admin UI invokes an action in
   `src/app/fantasy-actions.ts`.
2. The action blocks production demo mutations unless
   `FANTASY_DEMO_WRITE_ENABLED=true`.
3. The server reloads current database snapshots and validates deadlines,
   squad composition, lineup, chips, and transfer settlement.
4. Drizzle writes selections, revisions, stats, classifications, or Gameweek
   state. Administrative corrections also append application-level audit rows.
5. Affected fantasy routes are revalidated.

The production environment flag is a safety guard, not authorization. There is
currently no authentication, role model, or protected admin boundary. Do not
enable demo writes or expose `/admin/fantasy` as a production administration
surface until server-side identity and permission checks exist.

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
late or corrected match data to update the original Gameweek.

## Persistence model

The schema is organized into three related groups:

- Competition: competitions, seasons, competition seasons, venues, clubs,
  visual identities, entries, players, registrations, and fixtures.
- Fantasy configuration and play: Fantasy seasons, Gameweeks, tier definitions,
  player classifications, managers, teams, selections, selection snapshots,
  transfer revisions, leagues, and memberships.
- Scoring and review: match stats, stat overrides, player match points, team
  Gameweek scores, and the fantasy admin audit log.

Selection-player rows intentionally snapshot club, position, tier, and Thai
status. Historical squads and scores must not silently change when the current
player classification changes.

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
