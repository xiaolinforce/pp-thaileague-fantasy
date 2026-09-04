# Production operations

## Current deployment

| Concern             | Production configuration                                 |
| ------------------- | -------------------------------------------------------- |
| Public site         | `https://fantasy.ppfootball.net` on Vercel               |
| Source branch       | GitHub `main`                                            |
| Database            | Separate Neon `production` branch                        |
| Member sign-in      | Google OAuth and passwordless Email OTP                  |
| Bot protection      | Cloudflare Turnstile for Email OTP requests              |
| Transactional email | Resend → Mailjet from `no-reply@auth.ppfootball.net`     |
| User support        | `support@ppfootball.net`, forwarded to the product owner |
| Monitoring          | Sentry Developer Free plus Vercel Runtime Logs           |

The `development` Neon branch and Vercel Preview environment remain isolated
from Production. Never copy member, session, team, selection, score, league, or
audit rows between environments.

## Transactional email operations (2026-09-04)

Mailjet sender `*@auth.ppfootball.net` is Active. Vercel DNS hosts its separate
Mailjet ownership TXT, `mailjet._domainkey.auth` DKIM and `auth` SPF records;
Mailjet's DNS check reports SPF/DKIM OK. Existing Resend and support-forwarding
records remain in place. Local, Preview `dev`, and Production are configured
with `AUTH_EMAIL_PROVIDERS=resend,mailjet` and the verified sender above.
Environment changes take effect only on a new deployment.

| Shared account allocation                  | Resend daily/monthly | Mailjet daily/monthly |
| ------------------------------------------ | -------------------- | --------------------- |
| Local + Preview `dev` (one development DB) | 10 / 100             | 20 / 200              |
| Production (separate DB)                   | 90 / 2,900           | 180 / 5,800           |

Warning starts at 80%; a provider is skipped at 90% of either allocation.
Budgets count app-accepted messages in UTC; they do not query provider billing
or reserve capacity atomically. Check provider dashboards for account-wide
usage, rejected messages and sends outside this app before raising limits.
The email option becomes unavailable only when every configured provider is
at its stop threshold or has recently failed. A request-time failure shows
the same temporary message; Google remains an alternative. After a failure,
availability can retry after 60 seconds; quota resets follow UTC boundaries.

Sentry alert `3945024` ("Notify ItsMePP") listens to captured events in this
project across all environments, filtered by `area=transactional_email`.
It notifies the owner's existing Sentry account at `piyawach.p@hotmail.com`,
throttled to once per issue per hour. Events cover near quota, quota stop,
provider failure, fallback, total unavailability, recovery, and audit-write
failure. Notifications use Sentry's mail service, independently of app email
providers. Keep Sentry ingestion/notification quotas and account email enabled.
This is request-driven detection, not a scheduled provider-quota poll.

Local Mailjet OTP delivery was observed in the owner's Gmail inbox. The
synthetic `notification_test` event triggered the Sentry rule on 2026-09-04;
Sentry history confirms the action, while Hotmail inbox receipt was not inspected.

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

**Resolved configuration mismatch:** Following explicit owner authorization,
the two stale production `fantasy_tier_definitions` rows were corrected on
2026-09-04 at 05:06 UTC: Level 3 from 3 to 6 slots and Level 4 from 6 to 3.
The resulting 3/3/6/3 allocation matches the deployed executable rules and the
2026-09-03 decision. Both changes and their `reconcile_tier_slot_metadata`
audit entries committed in one transaction; the pre-change restore timestamp
was 2026-09-04 05:06:18 UTC. Full `db:verify:fantasy` checks then passed on
both production and development, and the production health endpoint remained
healthy. Production retained 158 teams, including the 100 bot participants.

## 2026-09-04 player display-name maintenance

The owner explicitly authorized two Thai player-name corrections on development
and production. Production branch `br-tiny-shape-azrvakql` was confirmed in the
Neon console and with `current_setting('neon.branch_id', true)`; the pre-write
restore timestamp was `2026-09-04 10:27:19.708656 UTC`.

The atomic operation changed only `players.full_name_th` and `updated_at` for
Jude Soonsup-Bell and Hugo Boutsingkham and inserted two
`correct_player_thai_name` audit entries. Stable IDs, English names, Thai short
names, registrations, rankings, and historical Fantasy records were preserved.
See `DATA_SOURCES.md` for the approved names and batch identifier.

Development passed `db:verify:competition` and `db:verify:fantasy`. Production
was updated through the authenticated Neon SQL Editor because the Vercel
production environment pull redacts its sensitive database connection value.
Production verification read back both new names and two audit entries and
confirmed 550 players, 462 active registrations, 240 fixtures, 16 clubs, and
30 Gameweeks. The hash of every player's ID, English full name, Thai full/short
names, and active flag matched the expected roster with exactly the two name
changes. The full npm database verifiers were run on development only.

The owner subsequently approved the review's six character-data corrections
and eight common-name changes. Batch `player-thai-names-20260904-review14`
was applied atomically to each branch with stable-ID and exact old-value
guards, adding fourteen audit entries per environment. Three Thai short names
were also corrected. The production pre-write restore timestamp was
`2026-09-04 10:46:12.33492 UTC`.

Both development database verifiers passed again. Production SQL verification
at `2026-09-04 10:49:05.3662 UTC` read back all fourteen names and audit entries;
the roster fingerprint was `f0d6bdc424ebc1af25e762c17b342bbf`, matching the
expected development result. A separate hash of all player fields except Thai
full/short names and `updated_at` was unchanged before and after the operation.
The counts remained 550 players, 462 active players/registrations, 240 fixtures,
16 clubs, and 30 Gameweeks. The two historical inactive players stayed inactive.

## 2026-09-04 GW1 first-match scoring and GW2 opening

The owner authorized batch `gw1-pattani-bg-20260904` on both Neon branches.
Development `br-green-queen-az934b4e` and production
`br-tiny-shape-azrvakql` were checked before writes. The operation was first
rehearsed in rollback transactions, then committed independently in each
environment. Production used the authenticated Neon SQL Editor. The
pre-write restore timestamp was `2026-09-04 15:15:03.11773 UTC`, within the
then-configured six-hour history window.

Each branch received 46 reviewed match-stat and points records, the 0-0
finished fixture result, Matheus Costa's official registration and Level 3
effective GW2, and 49 import audit entries. Sources and owner decisions are
recorded in `DATA_SOURCES.md`. The authenticated existing admin lock action
then locked GW1, recalculated team scores and Overall standings, opened GW2,
carried squads and transfer entitlements forward, and recorded `lock_gameweek`.
GW1 remains provisional (`score_complete=false`); seven fixtures are scheduled.

Production verification through `2026-09-04 15:26:30.7104 UTC` confirmed:

- 197 locked GW1 selections with 197 provisional scores and Overall standings;
- 113 nonempty squads and 84 empty selections, with 197 GW2 drafts carried over;
- all original GW1 player snapshots unchanged and no carryover mismatch;
- zero player-stat, score-breakdown, team-score, or standing mismatches;
- 413 total team points, a rounded average of 4 among nonempty squads, and a
  highest score of 15; and
- GW2 open with deadline `2026-09-11 16:30 Asia/Bangkok`.

Development had 23 empty squads and therefore 23 zero-point provisional scores.
Its competition and Fantasy database verifiers passed, as did all 97 Fantasy
rule tests. The complete 46-player scoring fingerprint matched both branches:
`916e49e745534ef79a8e04a1bbe1e32a`. Production SQL checks independently verified
team lineup, bench, captain, transfer, and total points against persisted match
results, and standings against team scores. Full npm database verifiers were
run on development only. The production Team page showed GW2, the deadline,
and Costa as Level 3 with one GW1 point. The minimum-appearance convention is
documented in `DOMAIN.md` and the bilingual rule content.

**Opening-transfer correction:** End-to-end verification found that the lock
action had deducted 44 points from one production team despite the existing
GW1 unlimited-transfer rule. `settleTransfers` did not receive the
`openingGameweek` flag already used by draft allowance and validation. The
source fix now passes that flag when saving and locking selections, with a
regression test for 13 transfers against two free transfers. Rule tests, types,
lint, format checks, and the production build passed. These source changes are
in the workspace and have not been deployed by this maintenance task.

Batch `gw1-opening-transfer-settlement-20260904` corrected the affected locked
selection's transfer deduction, its team score, its Overall standing, and the
GW1 average atomically, retaining before/after audit data. Its restore timestamp
was `2026-09-04 15:25:38.713956 UTC`. The team's total changed from -44 to 0;
rank 197 remained correct because all other teams had positive scores or tied
at zero with fewer counted transfers. Net transfer counts, historical
revisions, free-transfer entitlements, player snapshots, and GW2 drafts were
preserved. Development had no affected deductions. Both branches now have zero
GW1 transfer deductions, and the production Points page shows the corrected
team total and average. Subsequent score recalculation reads the corrected
locked selection; this data correction does not depend on deploying the patch.

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
