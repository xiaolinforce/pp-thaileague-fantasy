# Data sources

## Policy

Competition and Fantasy source data is persisted in PostgreSQL before runtime.
Pages never depend on live availability of an external football service. Every
stored entity retains a source name, stable external identifier, and source URL
where the schema supports them.

The repository intentionally does not retain data-import, normalization, seed,
or preseason-ranking scripts. Data changes are performed through reviewed,
task-scoped operations against an explicitly confirmed Neon branch. Temporary
tools, source payloads, CSV files, spreadsheets, screenshots, and database
exports must not be committed.

Do not silently combine or infer source facts in UI code. Resolve them during
the maintenance task, preserve provenance and audit context in PostgreSQL, and
run the relevant database verification before handoff.

## Current season identifiers

| Item                      | Value                   |
| ------------------------- | ----------------------- |
| Competition               | Thai League 1           |
| Season                    | 2026/27                 |
| Thai League tournament ID | `224`                   |
| Thai League season ID     | `33`                    |
| Fantasy season slug       | `thai-league-1-2026-27` |

These stable identifiers are persisted in the competition and Fantasy tables.
Changing a season requires a deliberate database maintenance task; do not reuse
the identifiers for another season.

## Source authority

| Source                               | Authority or use                                                                                           |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Thai League official API and website | Competition, season, clubs, current player eligibility, registration, position, nationality, and fixtures. |
| Thai League 2025/26 data             | Prior-season Thai League player performance used in preseason evaluation.                                  |
| Transfermarkt public data            | Identity enrichment, profile facts, market value, and partial prior-season facts for newcomers.            |
| Reviewed player spreadsheet          | Human-reviewed bilingual names, short names, Thai/foreign grouping, position, club, and tier corrections.  |
| Fantasy administrator                | Match-stat corrections, Fantasy assists, Thai status, and effective tier changes after setup.              |

The Thai League tournament roster owns current eligibility. Transfermarkt and
other public aggregators are enrichment only and must not activate a player who
is absent from the official roster. Cross-source identity matching must use
stable identifiers and same-club evidence; display names alone are insufficient.

Nationality determines the implemented Thai-player eligibility decision. It is
not a quality proxy in player ranking. Individual performance, expected
minutes, market evidence, position, and club context take precedence.

## Current development snapshot

As of 2026-09-02, the Neon `development` branch contains:

- 16 current clubs and 240 fixtures across 30 Gameweeks;
- 462 official active player registrations;
- 550 player master records, including inactive historical identities;
- published ranking version `preseason-2026-27-v5-manual-tiers` for Gameweek 1;
- 462 ranked players distributed as L1=20, L2=84, L3=159, and L4=199; and
- no locked selections or player scores for the opening Gameweek at the time of
  publication.

Published ranking runs are immutable. A correction creates a new version,
supersedes the previous published version, updates the effective tier rows,
refreshes only current draft snapshots when safe, and records an administrative
audit entry. Historical locked selections and effective tier history must not
be rewritten.

## Maintenance workflow

Use this sequence for a roster, fixture, player-stat, classification, or ranking
change:

1. Confirm that `DATABASE_URL` points to the intended Neon branch and read
   `current_setting('neon.branch_id', true)` before any write.
2. Inspect fresh database state and resolve every target by stable ID.
3. Fetch or inspect only the sources needed for the requested change.
4. Preview and validate the complete change set without writing.
5. Apply the update in one transaction when supported, preserving history and
   audit context.
6. Run `npm run db:verify:competition` and/or
   `npm run db:verify:fantasy` as appropriate.
7. Remove the temporary tool and all generated artifacts after verification.

Production is a separate environment. A development data change does not
authorize or imply the same production write.

## Verification contract

`npm run db:verify:competition` asserts the current competition shape, active
registration uniqueness and provenance, fixture completeness, and club
coverage. `npm run db:verify:fantasy` verifies season/Gameweek continuity,
published ranking completeness, exact tier totals, effective tier consistency,
selection snapshots, and League integrity.

`npm run db:verify:player-stats` remains read-only and checks persisted official
current-season aggregate rows. The application-level rule tests cover squad,
lineup, transfer, chip, scoring, substitution, and auto-fill behavior.

## Adding a season

1. Confirm the new official competition, tournament, season, club, and fixture
   identifiers.
2. Design a task-scoped import with stable-ID matching, provenance, preview,
   transaction boundaries, and rollback behavior.
3. Apply schema migrations separately from source-data writes.
4. Populate and verify the development branch before any production decision.
5. Review representative rosters, deadlines, fixtures, rankings, and historical
   snapshots.
6. Delete the temporary import implementation and generated artifacts after
   the verified data is persisted.
