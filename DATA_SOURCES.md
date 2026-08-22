# Data sources

## Policy

Competition data is imported explicitly and persisted in PostgreSQL. Runtime
pages never depend on live availability of an external football service.
Every imported entity retains a source name, external identifier, and source
URL where the schema supports them.

Do not silently combine or infer source facts in UI code. Normalize them in the
source adapter or seed script, preserve provenance, and verify the resulting
database before building Fantasy state on top of it.

## Current season identifiers

| Item                      | Value                   |
| ------------------------- | ----------------------- |
| Competition               | Thai League 1           |
| Season                    | 2026/27                 |
| Thai League tournament ID | `224`                   |
| Thai League season ID     | `33`                    |
| Fantasy season slug       | `thai-league-1-2026-27` |

These identifiers currently live in `scripts/sources/thai-league-2026-27.ts`,
the competition seed, and the Fantasy seed/action context. Changing a season
requires a deliberate update across the source registry and Fantasy setup; do
not reuse the identifiers for another season.

## Source inventory

| Source                             | Used for                                                                                            | Adapter or registry                                   |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Thai League official API           | Season, tournament, clubs, venues, fixtures, kickoff, status, scores, penalties, and attendance.    | `scripts/sources/thai-league-2026-27.ts`              |
| Thai League 2025/26 API            | Prior-season TL1 (`207`) and TL2 (`208`) player aggregates and club context for preseason ranking.  | `scripts/sources/thai-league-2025-26-player-stats.ts` |
| Transfermarkt public squad pages   | Players, positions, shirt numbers, nationality text, active registration, and current market value. | `scripts/sources/thai-league-2026-27.ts`              |
| Curated kit/club research URLs     | Four-color club visual identity palettes and explanatory notes.                                     | `scripts/sources/club-visual-identities.ts`           |
| Explicit club-name overrides       | Normal English display casing for selected all-cap source names.                                    | `scripts/sources/club-name-normalization.ts`          |
| Explicit club short-name overrides | Curated Thai and English compact club labels for product UI.                                        | `scripts/sources/club-short-name-overrides.ts`        |
| Fantasy administrator              | Reviewed match-stat corrections, Fantasy assists, Thai status, and effective tier changes.          | `/admin/fantasy` and `src/app/fantasy-actions.ts`     |

Club visual palettes are presentation metadata, not official crests or a claim
of trademark ownership. Retain the cited source URL and note when changing a
palette.

## Import flow

```text
Thai League API ---------------------+
                                      |
Transfermarkt squad pages ------------+--> seed-competition-data.ts
                                      |             |
Curated name and color registries ----+             v
                                                competition tables
                                                     |
                                                     v
                                           seed-fantasy-game.ts
                                                     |
                                                     v
                                                fantasy tables
```

Run the workflow in this order:

```bash
npm run db:migrate
npm run db:seed:competition
npm run db:verify:competition
npm run db:seed:fantasy
npm run db:rank:players -- --publish
npm run db:verify:fantasy
```

The Fantasy seed depends on the imported competition season, entries, player
registrations, and fixtures. It must not be run first. A fresh seed assigns a
safe Level 3 fallback; the reviewed ranking publication then derives the
effective 50/100/remaining level distribution.

## Competition normalization

The source adapter fetches the target season/tournament, all fixture pages, and
the configured Transfermarkt squad page for each tournament team. It validates
the combined source data before the seed writes it.

The seed then:

- upserts the competition, season, competition season, clubs, entries, venues,
  players, registrations, fixtures, and visual identities by stable source IDs;
- normalizes empty or `TBC` values into nullable database fields;
- combines source date/time into a timestamp only when a usable time exists;
- maps official match status and cancellation flags to the shared fixture enum;
- stores scores only for finished fixtures;
- marks previous Transfermarkt registrations inactive before upserting the
  currently observed active squad; and
- applies explicit English club-name casing instead of generic title casing.

Player identity is currently derived from Transfermarkt external IDs. Do not
fall back to display-name matching for updates because names are not stable
identifiers.

## Fantasy derivation

The Fantasy seed is idempotent for the configured season. It derives Gameweeks
from the first stored kickoff in each imported matchweek, sets the deadline 90
minutes earlier, creates tier definitions and effective player tiers, builds
valid demo squads, and creates Overall and Private Classic leagues.

The seed recognizes a Thai nationality from normalized source text as an
initial value only. Reviewed Thai-status and tier corrections belong in the
Fantasy classification records and admin audit log; they must not be written
back into the external competition source.

## Preseason player ranking

`npm run db:rank:players` is preview-only. It fetches official 2025/26 TL1 and
TL2 aggregate rows plus current Transfermarkt squad values, matches prior rows
to the current imported player pool, calculates a deterministic projection, and
prints the top ranks and tier/position distribution. Use `--output=path.csv` to
retain the review report.

The prior-season aggregates provide minutes, appearances, starts, goals,
assists, clean sheets, goals conceded, penalties, cards, and own goals. The
projection applies current Fantasy scoring where the facts support it. The
official aggregate does not supply goalkeeper saves or every player visible in
other leaderboards, so those components are not invented. Unmatched players use
market value, position priors, and conservative expected minutes with low
confidence.

Automatic matching accepts unique normalized names and conservative unambiguous
fuzzy matches. Reviewed exceptions belong in
`scripts/sources/fantasy-ranking-overrides.ts`, keyed by stable Transfermarkt
player ID. Each published run stores source facts, match method and score,
confidence, model components, projection, overall/position rank, and tier.

Publishing requires an explicit version and confirmed development database:

```bash
npm run db:rank:players -- --version=preseason-2026-27-v1 --effective-gameweek=1 --l1=50 --l2=100 --output=ranking.csv
npm run db:rank:players -- --publish --version=preseason-2026-27-v1 --effective-gameweek=1 --l1=50 --l2=100
```

Publication refuses a passed deadline, locked selection, score, duplicate
published version, or draft squad that would become invalid. Tier upserts,
current draft snapshots, ranking status, and audit entry are committed in one
database batch. Earlier effective tiers and historical selection snapshots are
preserved.

Do not document a fixed Gameweek count unless the imported fixture schedule is
itself fixed. The current competition verification expects 240 fixtures across
30 matchweeks, eight fixtures per matchweek, and 30 appearances per club.

## Club visual identity updates

`npm run db:seed:club-colors` reapplies the curated registry without reimporting
all competition data. Each registry entry must have:

- the normalized English club name used by the competition entry;
- exactly four valid colors in display order;
- a public research URL; and
- a concise note explaining the interpretation.

If an upstream English club name changes, update or run
`npm run db:normalize:clubs` deliberately and verify that the visual identity
still joins the intended club.

## Verification contract

`npm run db:verify:competition` currently asserts:

- one competition season, 16 clubs and entries, 16 visual identities, 15
  venues, and 240 fixtures;
- at least 200 active unique players and no empty club squad;
- eight fixtures in every matchweek; and
- 30 fixtures for every club.

`npm run db:verify:fantasy` reports row counts and verifies every published
ranking has complete contiguous ranks, exact configured tier totals, and tier
rows consistent with its effective Gameweek. Keep pure rule and ranking
invariants covered by `npm run test:rules`.

## Adding a season

1. Add a season-specific source registry or generalize the existing adapter
   without overwriting the prior season configuration.
2. Record official tournament/season IDs and squad source mappings.
3. Confirm the source schema, status mapping, timezone, matchweek numbering,
   club names, and stable player identifiers.
4. Import into a development database and review every upsert target.
5. Update verification expectations for the competition format.
6. Create the attached Fantasy season, tier definitions, and initial Gameweeks.
7. Verify representative squads, deadlines, fixtures, and historical source
   provenance before production migration.
