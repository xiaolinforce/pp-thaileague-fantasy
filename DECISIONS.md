# Decision log

Record durable decisions here when an alternative is likely to be reconsidered.
Each entry states the date, decision, context, and consequences. This file is
not a changelog or a place for short-lived implementation notes.

## 2026-09-03 — Sentry owns privacy-minimized application monitoring

**Decision:** Use Sentry Developer Free for uncaught client, server, and Edge
errors, sampled performance traces, masked error-only Session Replay, releases,
source maps, public uptime, and the existing daily auth-maintenance Cron. Keep
Vercel Runtime Logs as the short-lived raw operational log source.

**Context:** Vercel Hobby logs are useful for immediate diagnosis but do not
provide durable grouping, release correlation, replay, uptime, or missed-Cron
notification. A full log drain or Datadog deployment would add cost and
operational scope before the public traffic level justifies it.

**Consequences:** Production traces sample at 5%, normal sessions are not
recorded, and an error may retain a fully masked replay. The SDK disables
automatic collection of user details, cookies, headers, query values, HTTP
bodies, database values, and local variables. Build credentials remain secret
in Vercel, Preview and Production use separate environment tags, and quota or
traffic growth must trigger a sampling and plan review before enabling broader
logging.

## 2026-09-03 — Auto-fill preserves formation and fills vacancies only

**Decision:** Treat every draft slot's starter or substitute role and bench
order as manager-owned. Auto-fill may select a player only for a vacant slot;
it must not move an existing player, rebuild the starting eleven, change the
formation, or reorder the bench. When starter and substitute vacancies share a
position, assign the better-tier newly selected player to the starter vacancy
first, with the likely first-choice goalkeeper preference applied before tier
for goalkeeper vacancies.

**Context:** The manager wants Auto-fill to complete unfinished work without
overriding lineup choices already made. The existing draft slots already encode
a valid formation, so preserving them makes the action predictable while still
allowing the selection search to pursue tier, goalkeeper, and foreign-player
goals.

**Consequences:** A stronger player already on the bench is not promoted, and a
weaker existing starter is not demoted. Existing captaincy remains preserved and
missing roles are still assigned by tier and position priority. Projected points
and overall rank remain excluded. The previous strongest-lineup decision below
is superseded.

## 2026-09-03 — Auto-fill rebuilds the strongest valid starting eleven

**Superseded:** Auto-fill now preserves formation and fills vacancies only, as
defined by the decision above.

**Decision:** After completing the 15-player squad, compare every valid
11-player lineup. Preserve valid existing captain and vice-captain assignments
as starters, prefer a likely club starting goalkeeper, then maximize Level 1,
Level 2, Level 3, and Level 4 starters in that order. Randomize only exact ties
and order the three outfield substitutes by the same tier-first rule.

**Context:** Filling stronger newly selected players into starter-shaped
vacancies did not reconsider stronger players already on the bench or allow a
better valid formation. The full squad is small enough to evaluate all 1,365
possible starting elevens deterministically and keep formation rules explicit.

**Consequences:** Auto-fill may change formation, starting roles, and bench
order without changing the 15 selected players. Existing valid captaincy can
keep a lower-tier player in the starting eleven. Projected points and overall
rank remain excluded, and the result stays an unsaved client draft until the
manager saves normally.

## 2026-09-03 — Auto-fill captaincy is tier and position ordered

**Decision:** Preserve each valid captain or vice-captain already assigned to a
starter and fill only a missing role. Choose independently from the best
remaining tier, then prefer forwards, midfielders, defenders, and goalkeepers
in that order. Randomize only when tier and position are tied.

**Context:** Captaincy should remain under the manager's control once set. When
auto-fill must complete it, player tier is the public quality signal and
position supplies a predictable football-oriented preference without
reintroducing projected points or overall rank.

**Consequences:** Captain and vice-captain remain distinct. If only one starter
exists in the best available tier, the other role falls through to the next
best remaining tier. A role attached to a bench player, vacancy, or missing
candidate is not preserved because both captaincy roles must belong to starters.

## 2026-09-03 — Auto-fill uses tier goals instead of projected points

**Decision:** Preserve selected players and compare valid auto-fill suggestions
lexicographically: minimize the total Level 1–3 nominal-slot shortfall, minimize
the largest single-level shortfall, prefer likely first-choice goalkeepers,
maximize foreign-player use, and finally randomize ties. Infer a likely
first-choice goalkeeper from the best current tier among eligible goalkeepers
at the same club. Do not use projected points or overall rank for selection,
lineup placement, or missing captaincy.

**Context:** The manager wants auto-fill to express the visible squad rules
rather than reproduce the unpublished differences inside the projection. A
goalkeeper's relative tier within his own club is the best current proxy for a
club starter because the persisted player data has no explicit depth chart.

**Consequences:** Exact 3/3/3 Level 1–3 use wins whenever feasible, balanced
shortfalls win when it is not, and likely club starters take priority over
using an additional foreign-player slot. Better-tier players fill starting
vacancies before bench vacancies, while tied goalkeepers and other candidates
remain variable. The published ranking still defines eligibility and effective
tiers, but its projected points and internal order do not affect auto-fill.

## 2026-09-03 — Runtime locality and bounded read caching own page performance

**Decision:** Run Vercel Functions in Singapore (`sin1`) beside the production
Neon compute. Memoize session and profile readers within each render request,
use a read-only fast path for already-provisioned accounts, cache the shared
competition dataset and the smaller Fixtures read model for five minutes.
Disable automatic prefetch for authenticated primary navigation.

**Context:** Production traces showed Functions in Washington, DC making 14–32
HTTP SQL calls to Neon in Singapore per navigation. Profile provisioning wrote
idempotent rows on every page, Fixtures loaded the complete player/stat model,
and duplicate desktop/mobile navigation links speculatively prefetched dynamic
routes.

**Consequences:** Warm reads avoid repeated competition queries, normal page
loads no longer perform provisioning writes, and navigation does not create
hidden database traffic. Fantasy actions invalidate tagged read models; direct
database maintenance can remain cached only until the short expiry. Moving the
database requires reviewing `vercel.json`, and timing regressions are visible
as structured `server_timing` runtime logs.

## 2026-09-02 — A completed season remains available read-only

**Decision:** When no `open` or `planned` Gameweek remains, use the latest
Gameweek as the display context without provisioning a new selection. Existing
teams retain read-only access to Team, Points, Fixtures, and Leagues. A new
identity may receive a season team and Overall membership after completion, but
it cannot create a retroactive squad.

**Context:** The implemented GW30 lifecycle deliberately has no successor, but
account provisioning treated the absence of an editable Gameweek as an
exception and caused every authenticated core route to enter its error
boundary.

**Consequences:** Read models distinguish a provisioning Gameweek from a
display Gameweek, team actions require an actually open Gameweek and an existing
selection, and the UI communicates completion as a normal read-only state.
Supporting multiple historical seasons remains separate future work.

## 2026-09-01 — Chargeable transfers are capped at three per Gameweek

**Decision:** Allow at most three net transfers beyond the available free
balance in one Gameweek, for a maximum 12-point deduction. Keep an over-limit
draft editable and show its actual hypothetical deduction, but disable saving
and show the standard squad-validation alert. Gameweek 1, Wildcard transfers,
and a team's first complete saved squad are exempt.

**Context:** Unlimited paid transfers could create unexpectedly large negative
scores. The product owner chose a hard confirmation boundary while preserving
the ability to explore and undo local squad changes.

**Consequences:** Client validation provides immediate feedback, while the
Server Action reloads trusted team and transfer state and rejects attempts over
the cap before writing a selection or revision. Gameweek locking repeats the
invariant defensively. The season stores the maximum chargeable-transfer count
as configuration, and public Thai/English rules describe the same boundary.

## 2026-09-01 — Overall ranks are persisted with Gameweek scoring

**Decision:** Persist one current standing row per ranked team and League,
including rank, total points, latest Gameweek points, counted transfers, score
status, and the Gameweek through which it was computed. Rebuild Overall in the
same transaction as score recalculation, retain only the latest standings, and
return ranks 1–100 in the Overall dialog. Keep the schema reusable for Private
Leagues, but leave their current read-time ranking and pagination unchanged.

**Context:** Re-aggregating and sorting every Overall member on each overview or
dialog request makes page cost grow with the full player population even though
the public table needs only the leaders and the current user's rank.

**Consequences:** Overall requests use indexed standing lookups and never sort
season scores. Every ranked team's current position is persisted so the outer
card can read its own row directly. A team provisioned after the latest refresh
shows “รออัปเดตอันดับ” until the next provisional/final scoring pass. Rank
history is deliberately unavailable; adding movement or historical standings
would require a separate snapshot model.

## 2026-09-01 — The team name is the only public Fantasy identity

**Decision:** Use `fantasy_teams.name` as the sole public display name across
the application. Team names are unique within a Fantasy season using
case-insensitive comparison, and members may rename a team up to three times
per season. Better Auth provider names remain internal authentication metadata.
Keep the manager record for account ownership, Guest linking, status, language
preference, and historical continuity, but do not store a second manager name.

**Context:** The interface exposed both a manager display name and a team name
for the same account. Profile, the account menu, and League standings repeated
those identities without adding a distinct product purpose.

**Consequences:** Remove manager display-name and cooldown columns through a
forward migration, preserve every existing team name, and enforce the seasonal
name invariant in PostgreSQL as well as server validation. Guest provisioning
retries random team-name collisions. Profile and standings show one team name,
while abandoned Guest managers and historical teams remain intact.

## 2026-08-31 — Account tasks use separate routes behind one manager menu

**Decision:** Keep Team, Points, Leagues, and Fixtures as the primary product
navigation. Consolidate Profile, Settings, public Game Rules, public Help,
Guest upgrade, and sign-out in a single manager menu. Profile owns account/team
identity, Settings owns language, and Rules/Help are independent public routes.
Use neutral initial avatars and do not expose a crest upload/selection workflow.

Member language preference persists on the Fantasy manager row. Guest language
remains a device preference and never creates an account mutation. Rules copy
is generated from the shared executable Fantasy configuration and exported
scoring constants instead of duplicated sample values.

**Context:** The previous Profile combined unrelated identity, settings, help,
and long-form rules behind hash links, while a floating development language
control duplicated navigation. The product owner requested one manager entry
point, a separate rules page, real Facebook support, and no simulated UI data.

**Consequences:** Add a forward migration for `preferred_language`, keep
`/profile` and `/settings` identity-gated, and keep `/rules` and `/help` public.
Future account preferences belong in Settings, rules changes must update the
executable source and derived copy together, and crest controls require a new
product decision plus a persisted model.

## 2026-08-31 — UI guidance separates rules, patterns, and review evidence

**Decision:** Treat `/team` and `/points` as the current design reference
implementations without making their route-specific layouts universal. Keep
product-wide interface rules in `DESIGN.md`, proven reusable compositions and
reference-route contracts in `UI_PATTERNS.md`, and route maturity, state
coverage, evidence, and audit backlog in `UI_REVIEW.md`. Mark every other
current route `Unreviewed` until a rendered pass supports a stronger status.

**Context:** The prior design guide mixed global foundations, shared patterns,
and detailed Team/Points behavior. Existing but unreviewed routes could
therefore be mistaken for design precedent, while copying the dense Fantasy
workspace layout would not suit authentication, ranking, settings, data
browsing, or operational tasks.

**Consequences:** New UI work starts from the route's task archetype and the
shared design contract, uses Team and Points as a quality bar, and records
rendered evidence before promoting a route or pattern. Documentation-only
status does not claim that an unreviewed route is defective, and reference
status does not remove regression testing.

## 2026-08-31 — Compact navigation uses a Top bar and full drawer

**Decision:** Keep the shared Mobile, Tablet, and Desktop cutoffs at 48rem and
80rem. Desktop uses the full 238px sidebar. Both Mobile and Tablet use a navy
Top bar whose hamburger opens the complete navigation, support/settings links,
and manager identity in a left drawer.

**Context:** The implemented shell now preserves the full Desktop information
architecture in compact modes. The earlier decision described bottom
navigation on Mobile and an icon sidebar on Tablet, which no longer matched the
shell or the current design guide.

**Consequences:** Do not reintroduce bottom navigation or a Tablet-only icon
sidebar without a new product decision. Responsive route layouts still use the
same two shared cutoffs, with local adaptation through Grid, Flexbox, fluid
sizing, tabs, disclosure, or container-aware composition.

## 2026-08-31 — Gameweek score summaries are persisted

**Decision:** Persist rounded average points and highest points on each Fantasy
Gameweek during score recalculation. Include every scored locked selection that
contains at least one player, including the signed-in manager's team. Exclude
empty selections and store zero when no team qualifies.

**Context:** The Points route needs stable season-wide comparisons without
aggregating every team score on each page request. Highest points describes the
whole playing field rather than only other managers.

**Consequences:** Locking, finalization, and score corrections update team scores
and Gameweek summaries together. Historical rows are backfilled by the forward
migration, and Points reads the persisted values directly.

## 2026-08-30 — Gameweek lifecycle transitions are transactional

**Decision:** Run locking and finalization through a transaction-capable Neon
client. Lock affected rows, settle selections, provision the contiguous next
Gameweek, transition statuses, and recalculate scores in one transaction. Keep
the Neon HTTP client for ordinary reads and fixed batches.

**Context:** Multi-step lifecycle actions could previously fail after only some
teams or statuses were updated. Finalization also marked a Gameweek final before
score recalculation completed.

**Consequences:** A season may have only one open Gameweek. Locking rejects a
missing non-final successor, and any lifecycle or scoring failure rolls the
whole operation back. Transactional scoring accepts the active transaction
client rather than opening an unrelated database session.

## 2026-08-26 — The interface uses three shared responsive modes

**Navigation treatment superseded on 2026-08-31:** The 48rem and 80rem cutoffs
remain. Mobile and Tablet now use the shared Top bar and full left drawer;
Desktop retains the full sidebar.

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

**Superseded on 2026-09-03:** Auto-fill now uses tier targets, likely
first-choice goalkeepers, foreign-player use, and random ties without projected
points or overall rank, as defined by the decision above.

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

**Superseded on 2026-08-31:** Real account teams remain untouched, but all
flagged demo managers, squads, and leagues were deliberately removed when
Classic leagues moved to real provisioned teams only.

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
public Rules page, and automated tests. Do not introduce an upstream FPL rule merely
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

**Operational workflow superseded on 2026-09-02:** Runtime remains
database-only, but reusable import implementations are no longer retained in
the repository. Source-data maintenance now uses reviewed task-scoped tools.

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
so migrations and direct data maintenance require an explicit target check. The
old static `src/lib/fantasy-data.ts` file is not a runtime source of truth.

## 2026-09-02 — The official Thai League roster owns current eligibility

**Decision:** Use tournament `224` from the Thai League official API as the
authority for active 2026/27 player registrations. Use Transfermarkt only to
enrich a reviewed same-club identity with market value, profile facts, and
partial prior-season match performance. Retain unmatched source players as
inactive historical identities rather than adding them to the Fantasy pool.

**Context:** Public squad aggregators can lag registrations and use different
transliterations. The official site now exposes the complete current-season
roster, while current market value and prior foreign-league match facts remain
useful for ranking newcomers.

**Consequences:** Current eligibility is auditable from official row/person
IDs. Cross-source matches use stable-ID exceptions and conservative name
matching within the same club. Ranking records distinguish estimated official
aggregates from partial match-level calculations, record unavailable scoring
components, and keep nationality out of the quality score.

## 2026-09-02 — Source-data maintenance implementations are task-scoped

**Decision:** Keep competition and Fantasy source data in PostgreSQL without
retaining reusable import, normalization, seed, or preseason-ranking scripts in
the repository. Build narrowly scoped temporary maintenance tools when a data
change is requested, verify the target Neon branch and postconditions, then
delete the tool and generated artifacts.

**Context:** The current season data has already been reviewed and persisted.
Keeping one-off pipelines and exports in Git creates noise and risks rerunning a
stale workflow against the wrong environment. The product owner prefers to
request each future data change explicitly.

**Consequences:** The repository cannot populate a blank database or promote
source data to production automatically. Each future update must reconstruct
only the required operation from current database state and cited sources,
preserve stable IDs, history, and audit context, apply to development unless
production is explicitly authorized, and remove temporary files afterward.

## 2026-08-31 — Classic leagues contain only real provisioned teams

**Decision:** Maintain one automatic Overall Classic league per Fantasy season
for every Guest and member team. Private Classic leagues are member-only,
invite-only groups with an owner, an eight-character unambiguous invite code,
and limits of 10 owned leagues, 20 memberships, and 100 teams per league.
Owners cannot leave; deleting a league removes only the league and memberships.

**Context:** Seeded opponents and a demo Private League made standings look
populated but could not support trustworthy membership or management. Guests
still need a useful zero-friction competition while private groups require a
stable authenticated owner and privacy boundary.

**Consequences:** Season data maintenance never creates manager/team/score or
Private League records. Private mutations reauthorize the current member, lock fresh database
rows, validate limits transactionally, and append an audit row. Invite input is
case-insensitive but stored/displayed uppercase from an alphabet that excludes
`I`, `L`, `O`, `0`, and `1`. League detail is available only to members, and
only the owner receives the active invite code.
