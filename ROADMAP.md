# Roadmap

## Current prototype

- Thai League 1 2026/27 competition data imported into Neon Postgres.
- Thai-first responsive landing, squad, transfers, points, leagues, fixtures,
  profile, settings, public rules/help, and internal Fantasy administration screens.
- Client-side Thai/English display preference persisted per member manager and
  stored on the current device for Guests.
- Email OTP, Google, and device-bound Guest identities with 30-day sliding sessions.
- Account-owned managers and season teams; new teams begin with an empty opening draft and choose all 15 players.
- Fifteen-player squad, formation, club, nationality, tier, deadline, transfer,
  captaincy, and chip validation.
- Published-ranking-weighted, randomized auto-fill for vacant squad slots.
- Internally marked bot teams with one-time owner-requested auto-fill, normal
  Overall/scoring participation, permanent history, and separate internal counts.
  Later bot team changes require explicit owner instructions; no scheduler is enabled.
- Pure player-points and team-score engines with automatic substitutions.
- Provisional and final Gameweek recalculation.
- Effective tier changes, Thai-status corrections, reviewed Fantasy assists,
  stat overrides, transfer revisions, and application-level admin audit entries.
- Versioned preseason player ranking with contiguous overall/position ranks,
  source confidence, reviewed tier edits, and preserved publication history.
- Persisted latest Overall ranks with a Top 100 read model, plus invite-only
  Private Classic standings with transactional owner/member limits, owner
  controls, and audit history.
- Verified database-backed competition and Fantasy data with source provenance.

## Production readiness blockers

These are required before the prototype can safely become a public, writable
Fantasy service:

1. Completed 2026-09-03: verified the Production and sending domains, published
   privacy/terms pages, configured Google OAuth, and approved
   `AUTH_PRODUCTION_READY`.
2. Account recovery/support, abuse response, retention, and daily expired-auth
   cleanup are documented and implemented. Sentry now provides external error,
   Cron, and uptime notifications; provider quota alerts and broader auth/email
   business-event observability remain.
3. Review the admin role assignment process and audit retention policy.
4. The maintenance schedule, upstream failure behavior, and current operational
   owner are documented. Source terms review, automated freshness reporting,
   and external alerting remain.
5. Backup/recovery, migration promotion, rollback, monitoring, and incident
   procedures are documented, and Sentry supplies application alerts. A named
   recovery drill remains.
6. Expand automated coverage to Server Actions, database invariants,
   source-data maintenance, and end-to-end critical paths.
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
- Extend database-backed integration coverage for concurrent Private League
  create/join/remove/delete workflows.
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
