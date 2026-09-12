# Architecture

## Overview

PP Thaileague Fantasy is a Next.js 16 App Router application backed by Neon
Postgres through Drizzle ORM. Server Components load competition and fantasy
state, focused Client Components own interactive team-management screens, and
Server Actions validate authenticated player and administrative changes.

Vercel Functions run in `sin1` so the application runtime is colocated with the
production Neon compute in Singapore. Keep this deployment affinity aligned if
the database region changes; cross-region SQL round trips multiply quickly on
authenticated pages.

```text
Thai League + reviewed external sources
                         |
                         v
           task-scoped data maintenance
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

| Area                  | Location                             | Responsibility                                                                                   |
| --------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Routes and screens    | `src/app`                            | App Router pages, layouts, loading/error boundaries, and fantasy Server Actions.                 |
| Fantasy UI            | `src/components/fantasy`             | Shared shell, player identity, kit, position, gameweek, localization, and data-state components. |
| UI primitives         | `src/components/ui`                  | Reusable Base UI/shadcn interaction primitives.                                                  |
| Read models           | `src/data`                           | Server-only competition, squad, points, league, admin, and reminder-audience queries.            |
| Game rules            | `src/lib/fantasy/rules.ts`           | Squad, lineup, transfer, chip, and deadline validation.                                          |
| Squad auto-fill       | `src/lib/fantasy/auto-fill.ts`       | Pure constrained, ranking-weighted, randomized completion of vacant draft slots.                 |
| Authentication        | `src/lib/auth`                       | Better Auth configuration, session identity, account linking, and name policy.                   |
| Observability         | `src/instrumentation*.ts`, Sentry    | Privacy-minimized client/server/edge errors, sampled traces, masked error replays, and releases. |
| Account provisioning  | `src/lib/fantasy/provisioning.ts`    | Manager/team creation, empty opening draft, Overall membership, and Guest upgrade behavior.      |
| League operations     | `src/lib/fantasy/league-service.ts`  | Transactional Private League limits, ownership, membership, invite rotation, and audit writes.   |
| Email presentation    | `src/emails`                         | Provider-neutral React Email templates, preview props, subjects, HTML, and plain-text rendering. |
| Transactional email   | `src/lib/email`                      | OTP delivery routing, provider quota headroom, and privacy-safe delivery logs.                   |
| Auth maintenance      | `/api/cron/auth-maintenance`         | Secret-protected daily cleanup of expired auth artifacts without deleting Fantasy history.       |
| Ownership maintenance | `/api/cron/fantasy-ownership`        | Daily reconciliation of persisted open-Gameweek player ownership.                                |
| Scoring               | `src/lib/fantasy/scoring.ts`         | Pure player-points and team-score calculation.                                                   |
| Score persistence     | `src/lib/fantasy/scoring-service.ts` | Server-only Gameweek recalculation and score upserts.                                            |
| Persistence           | `src/db`                             | Drizzle client and the PostgreSQL schema source of truth.                                        |
| Migrations            | `drizzle`                            | Generated, ordered SQL migrations and Drizzle snapshots.                                         |
| Database operations   | `scripts`                            | Read-only verification, guarded QA scenarios, transaction checks, and standings maintenance.     |

Runtime routes read from `src/data` and PostgreSQL. The legacy static Fantasy
dataset has been removed and must not be reintroduced as a runtime fallback.

Deadline-reminder presentation is deliberately separate from delivery. Templates
under `src/emails` receive explicit values, perform no database or provider access,
and can be inspected through React Email or rendered to ignored local artifacts.
The role-protected `/admin/fantasy/reminders` route reads audience candidates
server-side from the deployment's configured database, sends only masked addresses
to the rendered page, and combines one sample team with the same deterministic
template. It does not persist a recipient snapshot or call an email provider.
Unsubscribe persistence, provider suppression filtering, idempotent sending, and
delivery audit remain future server-only/admin responsibilities.

## Route model

| Route                      | Rendering and data                                                                                  |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `/`                        | Dynamic Email OTP, Google, and Guest onboarding; validated internal return targets survive sign-in. |
| `/upgrade`                 | Authenticated Guest upgrade through Email OTP or Google, preserving a validated return target.      |
| `/team`                    | Server-loads data, then hands lineup and transfer management to Client Components.                  |
| `/points`                  | Server-renders the selected Gameweek score and its breakdown.                                       |
| `/leagues`                 | Server-loads summaries, opens Overall standings, and links each Private League to its detail route. |
| `/leagues/[id]`            | Authorizes membership, then renders paginated standings, invite details, and role controls.         |
| `/fixtures`                | Server-loads a fixture-only read model, then delegates interactive browsing to a Client Component.  |
| `/profile`                 | Authenticated account/team identity, member naming, and Guest upgrade.                              |
| `/settings`                | Authenticated language preference; member value persists on the manager row.                        |
| `/rules`                   | Public long-form rules built from shared executable rule and scoring constants.                     |
| `/help`                    | Public support destinations and legal links; no account data is required.                           |
| `/admin/fantasy`           | Role-protected controls for stats, classification, locking, and finalization.                       |
| `/admin/fantasy/reminders` | Role-protected, read-only recipient counts, masked candidates, and email preview.                   |

The `(app)` root layout resolves identity, language and navigation for game and
document routes, and provides Mitr, shared tooltips and toast feedback. Guest and
Email OTP sign-in complete account provisioning through a Server Action before
client navigation so the application shell receives the new identity immediately.
Invite links carry a validated app-local return target through Email OTP, Google,
Guest creation, and Guest upgrade. External, malformed, authentication, and admin
targets fall back to `/team` before either server or client navigation.
Pages are dynamically rendered because the shared layout reads PostgreSQL-backed
session and navigation state; their data modules remain server-only and call the
current Next.js connection API before querying.

Authentication and Fantasy profile readers use React request memoization so a
layout and its page share one session/identity lookup. Existing complete
profiles take a read-only path; provisioning writes run only when account state
may need creation or repair. The full competition read model and the smaller
fixture-only model used by `/fixtures` are shared through tagged five-minute
server caches. Fantasy mutations invalidate the relevant tags.
Main navigation does not automatically prefetch these authenticated database
routes, avoiding duplicate hidden-sidebar requests and speculative SQL work.

Sentry initializes through the Next.js instrumentation conventions for the
browser, Node.js, and Edge runtimes. Environments are tagged as `development`,
`preview`, or `production`; errors remain fully sampled while traces are
sampled at 5% in Production. Session Replay records only sessions containing an
error and masks all text, inputs, and media. Cookies, headers, query values,
HTTP bodies, database values, user details, and local variables are disabled at
the SDK boundary. Vercel Runtime Logs remain the short-term raw operational log
source, while Sentry owns longer-lived error correlation, releases, source maps,
the daily auth-maintenance check-in, and public uptime monitoring.

Shared Sentry hooks under `src/lib/observability/sentry.ts` also scrub exception
messages, breadcrumbs, structured logs, and transaction events. In particular,
Drizzle's `Failed query` message contains bound values independently of SDK
database instrumentation, so its query text and parameters are replaced while
the chained database cause and stack locations remain available. Recognized
Facebook native-bridge errors receive `error_origin=facebook_browser_bridge`.
An event is discarded only when every exception matches a verified bridge
message and every stack frame belongs to Facebook's injected `app://`
navigation logger. Missing stacks, mixed errors, and any application frame
remain observable.

Team deadline labels are formatted once on the server in both supported
languages and serialized into the Client Component. This avoids depending on
identical Node/browser ICU date abbreviations during hydration. Root metadata
disables automatic phone/date/email/address link detection on iOS.

The shared `Localized` boundary uses a hydration-aware external-store snapshot
to keep source text unchanged during SSR and initial hydration, including late
Suspense boundaries. Recursive translation runs afterward over resolved props;
independently streamed content needs its own boundary around its source copy.
Admin uses the same shared behavior.
Explicit `useLanguage` consumers retain the language supplied by their owning
layout. A small preference cookie supplies Guest language during SSR; an existing
localStorage-only preference migrates after the first mount. Member settings
remain authoritative outside the development language tester.

## Read flow

1. A route resolves the Better Auth session and calls a server-only read model.
2. The server-only data module queries Drizzle using the shared client from
   `src/db/index.ts`.
3. Competition records are normalized into UI-facing club, player, fixture,
   and table shapes. Fantasy records are assembled around the current season,
   its open/planned Gameweek or latest read-only Gameweek after season end, and
   the current account's manager/team selection when one exists.
4. The page renders directly or passes serializable data to a focused Client
   Component.

External services are not called during normal page rendering. Competition and
Fantasy source data is maintained directly in PostgreSQL through reviewed,
task-scoped operations against a confirmed Neon branch. Those temporary tools,
source payloads, and database exports are not retained in the repository. The
current player pool is authoritative from the Thai League tournament roster;
other public sources are enrichment only.

The Team client may request an auto-fill suggestion through a read-only Server
Action. The action authenticates the current manager, reloads the published
ranking—including its projected-points and overall-rank snapshot—and current
player eligibility and persisted Gameweek ownership from PostgreSQL. The pure
rule layer forms quality bands from the ranking, then uses ownership only after
the sample reaches 30 counted human teams and only before otherwise tied random
choices. It returns a completed local draft without persisting a selection or
consuming transfers; the normal save action remains the only confirmation
boundary.

The competition read model fetches persisted per-player ownership separately
from the larger five-minute competition dataset. Market reads therefore perform
an indexed Gameweek lookup rather than aggregating selection rows. Only active
Guest/member teams with complete 15-player selections contribute; bots,
abandoned identities, and empty or partial drafts are excluded.

Gameweek recalculation combines the immutable player-pool snapshot captured at
lock with current derived player points, then uses an exact mixed-integer model
to select legal candidate squads. Each candidate squad is scored through the
canonical lineup, captaincy, and automatic-substitution rules; the solver's
lexicographic objective first maximizes the counted Gameweek score and then the
uncounted bench total. Its upper bounds and explicit squad exclusions establish
when both parts of the result are proven. Canonical evaluation also prefers
score-ordered captaincy, the strongest bench order, and fewer unnecessary
automatic substitutions. Recalculation persists one current optimal-team result
plus its 15 members. The admin read model fetches that result without running
the optimizer. An algorithm-version marker lets the release refresh historical
results once when persisted output changes, without recomputing them on every
deployment. Score corrections replace the stored result in the same transaction while
historical eligibility remains fixed; the result is not a manager-owned
selection.

## Write flow

1. Team, transfer, profile, settings, League, or admin UI invokes its owning Server Action.
2. The action resolves the account-owned team from the session; admin actions
   additionally reload and require the `admin` role.
3. The server reloads current database snapshots and validates deadlines,
   revisions, squad composition, lineup, chips, transfer settlement, and the
   per-Gameweek cap of three chargeable transfers before any selection write.
4. Drizzle writes selections, revisions, League memberships, stats,
   classifications, or Gameweek state. Gameweek locking first captures the
   eligible player pool. League and administrative operations append
   application-level audit rows.
5. A successful save updates the affected persisted ownership counts and
   percentages in the same transaction. Gameweek locking refreshes the
   final current snapshot and initializes ownership for the carried selection.
6. Affected fantasy routes are revalidated.

Ordinary reads and fixed query batches use the Neon HTTP client. Gameweek lock
and finalization use the transaction-capable Neon serverless client. Private
League mutations use the same client and lock the current team plus target
league with `FOR UPDATE`, so the 10-owned, 20-membership, and 100-team limits
remain valid under concurrent requests.

Auth maintenance uses one HTTP `db.batch` transaction for its four independent
expiry deletes. Do not use callback `db.transaction` with the HTTP client, and
do not replace the batch with separate awaited deletes: a failed statement must
roll back the whole cleanup. Retention cutoffs and the exclusion of Fantasy
history are unchanged.

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
manager and team, plus an empty selection while a Gameweek can still be
provisioned. After the last Gameweek closes, a new identity joins the season and
Overall without receiving a retroactive selection. Selection-player snapshots
and the opening transfer revision are created together only after the manager
first saves a valid 15-player squad. A team's opening Gameweek is derived from
the absence of an earlier locked complete squad, so a later entrant retains
unlimited transfers through the deadline even after saving its first squad.

Email OTP values are hashed in the verification table, expire after five
minutes, allow three attempts, and rotate on resend. Turnstile protects every
OTP request. Delivery logs store a salted recipient hash and provider metadata,
never the address or OTP. OTP delivery uses Resend first with Mailjet as the
only fallback; ambiguous delivery outcomes stop without retrying to avoid two
valid messages. Google may implicitly link only trusted, matching, verified
email identities; different-email linking is disabled.

Explicit OTP requests await delivery through a request-local Better Auth hook:
a provider rejection returns HTTP 503 with `EMAIL_DELIVERY_UNAVAILABLE`, rather
than advancing the client to code entry. Mailjet HTTP 200 responses must also
contain per-message success and a message ID. The landing and upgrade pages
read quota/last-failure availability on the server and offer a read-only retry
action. A recent provider failure suppresses its availability for 60 seconds;
an already displayed OTP verification form remains usable.

Accepted-message counts warn at 80% and stop routing to a provider at 90% of
either configured UTC daily/monthly budget. These counts are per database and
are advisory headroom, not atomic reservations or live provider billing usage.
Concurrent requests and sends outside this app may differ. Sentry receives
bounded quota, failure, fallback, recovery, and delivery-log events tagged
`area=transactional_email`; addresses, OTPs and provider response bodies are
excluded. An accepted email is not resent if writing its audit row fails.

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

The same scoring transaction rebuilds the current Overall Classic standings.
It aggregates season totals once, applies the deterministic Classic
tie-breakers, and persists one latest rank row for every ranked team. Overall
reads use the indexed stored rank directly: the overview fetches only the
current team's row and the dialog fetches ranks 1–100. Correcting an earlier
Gameweek retains the latest provisional/final Gameweek as the standings marker
while refreshing cumulative totals. Private League standings remain calculated
on read until they adopt the same persisted workflow.

The Fixtures and Stats read model keeps two datasets separate. Official
current-season player aggregates are imported into
`competition_player_season_stats` with source identifiers, payload, identity
match method, and import timestamp. Reviewed per-match Fantasy inputs and
derived points remain in the Fantasy scoring tables. Runtime requests read only
the database; they never fetch Thai League or synthesize leader values. The
client receives explicit availability metadata and renders a truthful empty
state until each dataset exists.

## Persistence model

Bot managers have `is_bot=true`, `status=bot`, a unique `bot_key`, and a
`bot_batch_key` for operational targeting. A database check requires these
markers together and disallows auth ownership for bots. Human managers default
to `is_bot=false` with null bot metadata. Bot creation uses a reviewed temporary
server-side operation, the shared database clients, the existing auto-fill
solver and lineup validation, and transactional selection snapshots, revision 1,
Overall membership, and admin audit writes. The candidate loader accepts a
transaction client so fresh eligibility can be validated within the write
transaction. No public bot mutation endpoint or scheduler exists.

Scoring, Gameweek carryover, and Overall standings include bots through the same
team/selection tables. Internal participant reporting groups teams by `is_bot`;
bot metadata is not added to public UI payloads or display components.

The schema is organized into four related groups:

- Authentication: users, sessions, provider accounts, OTP verifications,
  rate-limit state, and privacy-safe email delivery attempts.

- Competition: competitions, seasons, competition seasons, venues, clubs,
  visual identities, entries, players, registrations, fixtures, and sourced
  player season aggregates.
- Fantasy configuration and play: Fantasy seasons, Gameweeks, tier definitions,
  player classifications, versioned ranking runs and player projections,
  managers, teams, selections, selection snapshots, transfer revisions,
  leagues, memberships, latest League standings, and League audit history.
- Scoring and review: match stats, stat overrides, player match points, team
  Gameweek scores, persisted optimal Gameweek teams, and the fantasy admin audit
  log.

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

Release tooling under `scripts/release` runs outside the application runtime.
The active GitHub Actions workflow owns production build/migrate/check/promote;
its Neon Pool exists only for the guarded migration transaction. Compatible
expansions run database-first. Reviewed contractions whose candidate tolerates
the old schema run application-first: the exact candidate is checked, promoted,
and verified on the production alias before SQL can run. Mixed orders and
coordinated migrations stop automatically. Application access continues through
the shared Drizzle client. See `RELEASE.md` for activation status, environment
boundaries and recovery procedures.

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

## Admin workspace

The seven primary pages under `/admin/fantasy`, plus contextual participant
detail and player-points pages, share a role-protected layout and route-aware
`AppShell`. Admin read models check the admin session before querying the shared
Drizzle client and do not provision a personal team. Gameweek controls depend
on the Gameweek itself, not the administrator's selection. Date labels are
formatted on the server in both languages to avoid Node/browser locale
differences during hydration.

The participant directory and audit log use 30-row pages. Team counts use the
season's managers and teams. Seven-day activity uses selection `confirmed_at`,
excluding bots and abandoned managers. Carryover revisions have no confirmation
timestamp and do not count as recent activity. Fifteen-player counts include
carryover on active teams; they do not imply validation against every current
squad rule. Audit display allowlists correction fields rather than serializing
arbitrary source or bot provisioning payloads. Lock and finalize append their
audit entry inside the lifecycle transaction. Mutations invalidate admin pages.
Participant player-points pages read the selected team's immutable selection
snapshots and aggregate the persisted match points for the chosen Gameweek.
They default to the latest provisional or final Gameweek, while planned and
open Gameweeks retain the saved squad with pending point labels.

Player filters use current active registrations and available Fantasy players.
Match editors use registrations for the chosen fixture's clubs, including
historical registrations for correction work, and load existing stored stats.
Server Actions retain their fresh session and database validation boundaries.

Admin pages defer recursive localization of server-authored content until
hydration. Lazy RSC table rows may not be traversable during server rendering;
translating them only on the client prevents a mismatched initial tree. Explicit
client labels and names continue using the shared language context. This keeps
the documented client-display localization boundary without adding route i18n.

## Transactional Fantasy persistence hardening (2026-09-05)

Squad saves execute through `selection-service.ts`; admin corrections and lifecycle
operations execute through `admin-service.ts`. Actions retain session/role checks
and cache invalidation. Every operation acquires the season row first: saves use
a shared lock, and classification, scoring and lifecycle changes use an exclusive
lock. Saves then lock their selection and team, validate current eligibility and
the deadline, and compare the submitted selection ID and revision. Conflicts
retain the client draft and offer an explicit reload; they never overwrite a newer
revision. Resetting a Team workspace only replaces its client-side draft with
the Gameweek baseline and never invokes a write action. A subsequent explicit
save is the sole path that persists its players, transfer state, revisions, and
ownership updates.

Stats, override records, player points, team scores, Gameweek summaries and Overall
standings commit together. Classification, effective tier, draft snapshots and audit
context also commit together. Locked snapshots remain unchanged. Carryover loads
all members once and writes in batches of 500; recalculation loads members once
and upserts scores in batches. This keeps synchronous publication atomic without
one SQL round trip per team.

Selections and members carry a redundant, non-null season key. Composite foreign
keys bind team/Gameweek/selection/player to the same season, including parent
updates. Partial unique indexes protect bench order and each captaincy role;
bench order must be non-null and substitutes cannot hold captaincy. Migration
0016 backfills only this season key and validates all existing records.

### Cache invalidation boundaries

Squad confirmation invalidates only `fantasy-ownership`; the roster, fixture and
statistics dataset remains warm. Ownership percentages are grouped in SQL, with
the numerator and distinct populated-squad denominator read in one statement.
Stats/classification changes invalidate `competition-dataset`; lifecycle changes
also invalidate fixtures and ownership. Name changes refresh dynamic identity
data without invalidating shared datasets. Server Actions use `refresh()` for
the active router instead of expiring all page dependencies. Chip usage reads
only the current team and groups its locked selections in SQL.

### Browser security headers

All routes send an enforced CSP, frame denial, MIME-sniffing protection, a
strict-origin-when-cross-origin referrer policy, and disabled unused device/payment
permissions. CSP permits the current Turnstile script/frame, Google form
navigation, Sentry ingestion and replay workers. Inline scripts/styles remain
allowed for Next hydration and UI styles; production disallows eval. This is
a baseline CSP, not a claim that arbitrary inline-script injection is blocked.
Per-request nonces would add request-specific CSP plumbing across the application.
Recheck CSP whenever an external browser integration or Sentry region changes.

## Document rendering and localization boundaries (2026-09-06)

Rules, Help, Privacy and Terms use the `(app)` root layout and the same initial
identity, navigation availability and request language as game routes. The shell
therefore renders the current manager menu without a second client-side identity
request. These document routes depend on the database-backed layout and do not
have separate `/en/…` counterparts; English content follows the account or device
language used throughout the application.

The lightweight common namespace and explicit message keys own shared-shell copy.
The compatibility game dictionary loads only with GameProviders; the admin
namespace loads only inside the protected admin layout. Document content and Points
do not recursively translate streamed children. Points resolves text on the
server from the same request language as its layout; remaining game screens keep
the hydration-safe compatibility boundary while they migrate incrementally.

`/api/health` remains liveness. `/api/health/ready` requires the existing
CRON_SECRET Bearer credential before issuing a shared-client `select 1`; it
returns 200 or a bounded 503 with no SQL/provider details and never caches the
response. Its five-second response deadline does not claim cancellation of a
already dispatched driver request. No external monitor was created by this change.
