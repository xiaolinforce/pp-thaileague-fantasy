# Roadmap

## Current prototype

- Thai League 1 2026/27 competition data imported into Neon Postgres.
- Thai-first responsive landing, squad, transfers, points, leagues,
  fixtures, profile/rules, and internal Fantasy administration screens.
- Client-side Thai/English display preference.
- Email OTP, Google, and device-bound Guest identities with 30-day sliding sessions.
- Account-owned managers and season teams; new teams begin with an empty opening draft and choose all 15 players.
- Fifteen-player squad, formation, club, nationality, tier, deadline, transfer,
  captaincy, and chip validation.
- Published-ranking-weighted, randomized auto-fill for vacant squad slots.
- Pure player-points and team-score engines with automatic substitutions.
- Provisional and final Gameweek recalculation.
- Effective tier changes, Thai-status corrections, reviewed Fantasy assists,
  stat overrides, transfer revisions, and application-level admin audit entries.
- Versioned preseason player ranking with contiguous overall/position ranks,
  source confidence, review CSV, and deterministic 5%/15%/20%/remaining tiers.
- Overall and Private Classic demo standings.
- Idempotent competition and Fantasy seed workflows with database verification.

## Production readiness blockers

These are required before the prototype can safely become a public, writable
Fantasy service:

1. Verify a production domain and sending domain; publish reviewed privacy and
   terms pages; complete Google OAuth verification; then approve
   `AUTH_PRODUCTION_READY`.
2. Add account recovery/support procedures, auth/email observability, provider
   quota alerts, abuse review, and periodic cleanup of expired auth artifacts.
3. Review the admin role assignment process and audit retention policy.
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

Better Auth session checks and the admin role boundary are implemented. The
production-readiness environment gate is an intentional launch control, not a
substitute for those authorization checks.

## Prepared next steps

- Move season/tournament IDs and Fantasy season selection into a central season
  registry rather than repeating a slug or identifier across scripts/actions.
- Replace or remove the unused static `src/lib/fantasy-data.ts` prototype.
- Extend `db:verify:fantasy` beyond published-ranking assertions to cover every
  squad, selection, league, and Gameweek invariant.
- Review low-confidence preseason projections and add stable-ID source matches
  or approved manual adjustments before production entry opens.
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
