# Production operations

## Current deployment

| Concern             | Production configuration                                 |
| ------------------- | -------------------------------------------------------- |
| Public site         | `https://fantasy.ppfootball.net` on Vercel               |
| Source branch       | GitHub `main`                                            |
| Database            | Separate Neon `production` branch                        |
| Member sign-in      | Google OAuth and passwordless Email OTP                  |
| Bot protection      | Cloudflare Turnstile for Email OTP requests              |
| Transactional email | Resend from `no-reply@auth.ppfootball.net`               |
| User support        | `support@ppfootball.net`, forwarded to the product owner |
| Monitoring          | Sentry Developer Free plus Vercel Runtime Logs           |

The `development` Neon branch and Vercel Preview environment remain isolated
from Production. Never copy member, session, team, selection, score, league, or
audit rows between environments.

## 2026-09-04 bot participant maintenance

Migration `0015` and batch `opening-2026-27-20260904` were applied to Neon
`production` (`br-tiny-shape-azrvakql`) for open GW1 before its
2026-09-04 17:30 Asia/Bangkok deadline. The batch created 100 bot managers and
teams, 100 distinct valid auto-filled squads, 1,500 selection-player snapshots,
100 initial revisions, 100 Overall memberships, and 100 `create_bot_team` audit
entries. The post-import report counted 158 season teams: 58 human/Guest teams
and 100 bots. These are team counts, not active-user counts.

The development rehearsal verified idempotency, scoring, rankings, and
carryover and rolled back all test participants. Production import verification
passed for the bot records, identities, squads, revisions, and memberships;
the health endpoint remained healthy. No scores or historical selections were
created. GW1 had not been scored, so Overall ranks remain pending under the
existing ranking lifecycle. Bot squads remain unchanged unless separately
requested, apart from the normal Gameweek carryover.

The pre-migration restore timestamp was 2026-09-04 05:00:28 UTC, within the
then-configured six-hour Neon history window. Runtime deployment remained at
`1134cd2821be783301a1d3513373c6b88965c512`; this additive schema/data operation
does not require a UI deployment. Bot support source is recorded in commit
`82108a9`.

**Outstanding pre-existing configuration mismatch:** Production code and the
2026-09-03 decision use nominal tier slots 3/3/6/3, but production
`fantasy_tier_definitions` still stores 3/3/3/6. The full `db:verify:fantasy`
command stops at this mismatch after league integrity passes. The new squads
pass the deployed executable rules. Automatic approval review rejected
reconciling the two metadata rows as outside the bot-import authorization;
no tier definitions were changed. Obtain explicit owner authorization before
that separate audited correction.

## Release checklist

1. Merge and verify the target commit on `dev`.
2. Confirm the intended migration is already committed and tested against the
   Neon `development` branch.
3. Take or identify a Neon restore point before a Production schema or source-data write.
4. Apply each forward migration to the Neon `production` branch before promoting
   code that depends on it. Never rewrite migration history.
5. Fast-forward or merge the reviewed commit to `main` and wait for the Vercel
   Production deployment to become Ready.
6. Check `/`, `/api/health`, `/privacy`, `/terms`, authenticated `/team`, Google
   sign-in, Email OTP, Vercel runtime logs, and Sentry for release/source-map
   errors. Confirm `fantasy.ppfootball.net` points to the new Current deployment.
7. If a release fails, immediately promote the last known-good Vercel deployment.
   If a data write is involved, stop writes, preserve logs, and restore or
   forward-fix Neon only after identifying the exact affected interval.

## Account support and recovery

- Email OTP and Google are the recovery methods; the product stores no passwords.
- Ask the user to retry the same verified email first. Never request an OTP,
  Google password, session cookie, or recovery code through support.
- Confirm only the minimum information needed to locate an account. Do not send
  database IDs, IP addresses, user agents, or provider tokens to the requester.
- For a suspected takeover, preserve auth and audit evidence, revoke active
  sessions for the exact account, and document the reason before making any
  identity change.
- Privacy, deletion, abuse, and access requests go to
  `support@ppfootball.net`. The product owner is the current escalation owner.

## Daily automation and retention

Vercel Cron calls `/api/cron/auth-maintenance` at 02:17 Asia/Bangkok. The route
requires the Production-only `CRON_SECRET` and deletes only:

- expired sessions;
- expired OTP verification rows;
- rate-limit rows whose last request is more than two days old; and
- privacy-safe email delivery metadata older than 90 days.

Accounts and every Fantasy manager, team, selection, score, transfer, league,
and audit row are intentionally preserved. Sentry receives an
`auth-maintenance` check-in for every authorized execution. Review it weekly and
investigate any failed or missing run alongside the Vercel runtime log.

## Monitoring cadence

Sentry monitors `https://fantasy.ppfootball.net/api/health` for application
availability, groups uncaught errors by release, and emails the account owner
for high-priority new issues, regressions, failed/missed Cron runs, and outages.
Production events are isolated with the `production` environment tag. Session
Replay is error-only and masks text, inputs, and media; the SDK does not collect
cookies, request/response bodies, query values, headers, database values, user
details, or local variables.

Daily during an open Gameweek:

- Sentry error/outage issues, auth-maintenance monitor status, and sampled traces;
- Vercel function errors, latency, structured timing logs, and recent 5xx responses;
- successful Google and Email OTP sign-in from a non-admin test session;
- Resend delivery failures, suppressions, and quota consumption; and
- Neon compute/database availability and connection errors.

Before each deadline:

- verify the next Gameweek deadline and fixture coverage in Production;
- run the read-only competition and Fantasy verification commands against the
  confirmed Production branch;
- confirm the published ranking/tier version and player availability changes;
  and
- verify that support email forwarding is operating.

Stop sending OTP email and investigate abuse if request volume, failure rate,
or Turnstile rejection rises unexpectedly. Keep configured provider limits
below the provider plan allowance; add a reviewed fallback provider before
raising the limit.

## Competition-data maintenance

The official Thai League roster and fixtures remain authoritative. Runtime
pages never fetch live source data. The product owner is the current operational
owner and reviews updates before every Gameweek, plus after a postponement,
registration change, or correction.

If the official source is unavailable or structurally changed, do not publish a
partial import. Keep the last verified snapshot, record the freshness date,
delay the update, and tell users when deadlines or scoring may be affected.
Follow the stable-ID, preview, transaction, provenance, and verification
workflow in `DATA_SOURCES.md`; Production writes always require explicit target
confirmation and authorization.

## Admin access and audit retention

- The default role is `member`; no public UI may grant `admin`.
- An existing administrator may promote a specific verified account only after
  confirming its normalized email and recording who approved the change.
- Use a narrowly scoped Production transaction and verify the resulting role.
  Never promote by display name or provider account ID.
- Remove admin access when it is no longer required.
- Preserve Fantasy admin and League audit records for the full season and at
  least one year after the season closes. A future deletion policy must retain
  enough history to reproduce standings and investigate corrections.

## Incident response

1. Classify the impact: availability, authentication/email, data integrity,
   unauthorized access, or source-data correctness.
2. Stop the smallest affected write path. Preserve Sentry issue/event and
   release links, Vercel logs, Neon evidence, deployment IDs, timestamps, and
   the responsible commit.
3. Restore service by promoting a known-good deployment or applying a reviewed
   forward fix. Do not experiment directly on Production.
4. For database incidents, use Neon point-in-time restore to a separate branch
   first, compare the affected rows, and only then decide whether to restore or
   repair Production.
5. Notify affected users through the public site/support channel when impact is
   material. Never include secrets or personal data in status text.
6. Record the root cause, affected interval, recovery, and preventive action.

## Still required before public entries open

- Product-owner acceptance and freeze of the 2026/27 rules, tiers, deadlines,
  chip limits, and season configuration.
- Review of competition/player/club data usage and the published legal text by
  an appropriately qualified reviewer.
- A decision on the production Thai/English URL and SEO model.
- More automated database, Server Action, source-adapter, and end-to-end tests.
- A named backup drill and incident rehearsal before the first live deadline.
