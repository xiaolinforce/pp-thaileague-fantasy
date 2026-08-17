# Roadmap

## Current prototype

- Thai League 1 2026/27 competition data imported into Neon Postgres.
- Thai-first responsive landing, dashboard, squad, transfers, points, leagues,
  fixtures, profile/rules, and internal Fantasy administration screens.
- Client-side Thai/English display preference.
- One playable demo identity with additional demo managers for league tables.
- Fifteen-player squad, formation, club, nationality, tier, deadline, transfer,
  captaincy, and chip validation.
- Pure player-points and team-score engines with automatic substitutions.
- Provisional and final Gameweek recalculation.
- Effective tier changes, Thai-status corrections, reviewed Fantasy assists,
  stat overrides, transfer revisions, and application-level admin audit entries.
- Overall and Private Classic demo standings.
- Idempotent competition and Fantasy seed workflows with database verification.

## Production readiness blockers

These are required before the prototype can safely become a public, writable
Fantasy service:

1. Add authentication, account lifecycle, and server-side authorization.
2. Replace the hard-coded `PIYA FC` demo context with the authenticated
   manager/team context on every read and mutation.
3. Protect `/admin/fantasy` with explicit roles and permissions, trustworthy
   actor identity, and a reviewed audit policy.
4. Define a controlled import schedule, upstream failure behavior, source terms,
   rate limits, freshness reporting, and operational ownership.
5. Add database backup/recovery, migration promotion, rollback, monitoring,
   alerting, and incident procedures.
6. Expand automated coverage to Server Actions, database invariants, import
   adapters, ranking, and end-to-end critical paths.
7. Decide the production localization and SEO model instead of relying on
   recursive client-side text replacement.
8. Review privacy, terms of play, competition/player data usage, club identity,
   and abuse controls.
9. Run a full rules acceptance review with the product owner and freeze the
   season configuration before opening entries.

`FANTASY_DEMO_WRITE_ENABLED` is only a mutation guard. It does not satisfy any
authentication or authorization blocker above.

## Prepared next steps

- Move season/tournament IDs and Fantasy season selection into a central season
  registry rather than repeating a slug or identifier across scripts/actions.
- Replace or remove the unused static `src/lib/fantasy-data.ts` prototype.
- Strengthen `db:verify:fantasy` from row-count visibility into invariant
  assertions for squads, selections, tiers, leagues, and Gameweeks.
- Add import fixtures and adapter tests so upstream schema drift fails before a
  database write.
- Separate admin correction services from the App Router action file as the
  operational surface grows.
- Make Gameweek transitions explicit, including whether the currently unused
  `locked` status becomes a real phase.
- Reconcile prototype price/form/watchlist presentation with a documented,
  persisted product model.
- Add stable localized routes and server-rendered localized metadata if English
  becomes a first-class public experience.
- Add observability around imports, recalculation, admin correction, and failed
  mutations.

## Later capabilities

- Authenticated manager registration, team naming, and account settings.
- Joining and creating real private leagues.
- Notifications for deadlines, player availability, and reviewed score changes.
- Managed player news, availability, suspension, and injury data.
- Approved live or scheduled match-stat ingestion and score review workflows.
- Historical seasons and season rollover without rewriting prior records.
- Additional Thai competitions through reusable competition and Fantasy season
  configuration.
- Public team, player, fixture, and league share pages where privacy permits.

## Out of scope for now

- Payments, prizes, gambling, or cash competitions.
- Live minute-by-minute match commentary.
- Head-to-head or cup Fantasy formats.
- Automated player price changes without an approved pricing model.
- Native mobile applications.
- Writing corrections back to Thai League or Transfermarkt.
