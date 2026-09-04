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

## Bot squad provenance

Bot squads are generated from the persisted, published Fantasy candidate pool
using the existing auto-fill solver. They are not sourced people, external
competition facts, or historical scores. Operational provenance belongs in
`fantasy_managers.bot_key`, `bot_batch_key`, and `create_bot_team` admin audit
entries with the target Gameweek, random seed, and candidate-pool hash. This
does not authorize roster, fixture, tier, or historical-score changes.

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

## Reviewed Thai display names

Thai player names should use reviewed spelling and recognizable football names.
The official registration name is identity evidence, but can contain middle
names, spelling inconsistencies, duplicate spaces, or invisible characters.
Resolve display-name corrections by stable player/source IDs, preserve the
original values in the admin audit log, and do not overwrite an approved
correction with a subsequent unreviewed roster import. A name-only correction
does not change eligibility, English names, classifications, or selection history.

On 2026-09-04, the owner-requested `players.full_name_th` corrections were
applied to both `development` (`br-green-queen-az934b4e`) and `production`
(`br-tiny-shape-azrvakql`):

- Transfermarkt `670857`, Jude Soonsup-Bell: `จู๊ด เจคอบ ซุ่นทรัพย์` to
  `จู๊ด เบลล์`.
- Transfermarkt `620319`, Hugo Boutsingkham: `อูโก้ เทียร์รี่ บง บุดสิงห์คำ` to
  `อูโก้ บุตรสิงห์คำ`.

Each branch has two `correct_player_thai_name` audit entries for batch
`player-thai-names-20260904`. Thai short names remain `จู๊ด` and `อูโก้`.
The review covered all 550 master records: 328 had Thai names, including 308
active players and 20 inactive identities. All 462 active registrations matched
the live official roster by registration ID, and all 308 stored active Thai
names matched that source before these two overrides. Matching the registration
source is not independent proof of spelling correctness. Further normalization
and common-name recommendations were reviewed but not applied in this batch.

Following explicit owner approval later on 2026-09-04, both branches received
the additional batch `player-thai-names-20260904-review14`: six character-data
corrections and eight common display-name changes, with fourteen
`correct_player_thai_name` audit entries per branch. The six corrections remove
the duplicated vowel in Nuttasit Choosai, duplicate spaces in Kongpop Sroirak
and Phongsakon Sangkasopha, zero-width spaces in Supanut Sudathip, doubled
`เ` in Piphob Saengjan, and decomposed sara am in Adisak Lambelsah.
The eight approved display names are `เบนจามิน เดวิส`, `เอเลียส ดอเลาะ`,
`เคนเน็ต ดูกอล`, `ลีออน เจมส์`, `วิลเลี่ยม เวเดอร์เฌอ`, `อาทิตย์ เบิร์ก`,
`อับดุลเราะห์มาน เอสซาดี`, and `โยนัส ชวาเบ`.

Thai short names were corrected for Nuttasit (`ณัฐสิทธิ์`), Supanut (`ศุภณัฐ`),
and Elias (`เอเลียส`). Piphob and Adisak remain inactive. All other player
fields, including English names and source identities, were verified unchanged.
The review's unresolved-name group was not part of the approved change set.

## Opening-match review (2026-09-04)

Owner-approved batch `gw1-pattani-bg-20260904` was applied to development and
production for official fixture `37419`, Pattani FC 0-0 BG Pathum United.
The fixture is finished; GW1 remains provisional with seven fixtures unplayed.
The batch records 46 reviewed player-stat rows: 31 appearances and 15 unused
substitutes. Stored source payloads and admin audit entries retain source URLs,
official registration IDs, substitution events, and the owner's decisions.

Evidence was reviewed on [AiScore](https://www.aiscore.com/th/match-pattani-bg-pathum-united/69759igpv4gigk2),
[FotMob](https://www.fotmob.com/matches/bg-pathum-united-vs-pattani-fc/3lbwl03y#1000017717),
and the [official match statistics](https://thaileague.co.th/fixtures/224/match/37419?selectedTab=match-stat&optaSeasonId=2026).
The official API report was not yet approved at review time; this import does
not assert official report approval. AiScore and FotMob both reported two
Pattani goalkeeper saves and one BG save. Damyan Damyanov earns six points.
Marlon and Kirati Kaewnongdang entered at 90+5 and each receive the
owner-approved minimum one Fantasy minute and one appearance point, as defined
in `DOMAIN.md`. No MOTM, bonus, or BPS points were added.

Matheus Costa's existing Transfermarkt identity `1114322` was matched to
official registration `2026:62606` / person `94997`, BG shirt 22, Brazilian
forward. The batch activates that identity and adds his registration and
Fantasy record with Level 3 effective from GW2. The registration's start date
records the first verified appearance, not an asserted contract start. The
official roster's implausible birth date `2026-08-14` was ignored; the existing
unknown birth date remains unchanged. There are now 463 active registrations.
The published 462-player preseason ranking remains immutable. Costa is
available for manual GW2 selection; auto-fill will not consider him until a
future ranking publication includes him. No projection or rank was fabricated.

The existing authenticated Gameweek lock action calculated team scores and
Overall standings, preserved GW1 player snapshots, and carried squads into open
GW2. Its deadline is 2026-09-11 16:30 Asia/Bangkok, 90 minutes before that
Gameweek's first fixture. See `PRODUCTION.md` for execution and verification.

## Fixture schedule review (2026-09-04)

Owner-approved batch `fixtures-acl-schedule-20260904` updated development
(`br-green-queen-az934b4e`) and production (`br-tiny-shape-azrvakql`) from the
reviewed [Jay Worapath post](https://www.facebook.com/permalink.php?story_fbid=pfbid02rsPMKv2eEBJZxvh7dZxQRTExJDGUn1DFBSXy3LXKiGcwcjVUwFa1GFcV8DHK9cw6l&id=61568845133252)
and its [five-match schedule graphic](https://www.facebook.com/photo/?fbid=122198734820628171&set=a.122096751608628171).
This is an owner-approved schedule override from that announcement; it does
not assert an independent official API refresh. Original fixture source IDs,
source URLs, venues, and matchweek assignments remain intact. Audit rows retain
the reviewed announcement URLs and complete before/after fixture values.

The batch supplied kickoff times for all 24 previously `time_tbc` fixtures in
matchweeks 7, 10, and 17 (official IDs `37628`–`37651`) and rescheduled five
previously announced fixtures. Dates and times below use Asia/Bangkok:

| Official fixture ID | Match | New kickoff |
| --- | --- | --- |
| `37441` | Ratchaburi – Sukhothai | 2026-10-09 19:00 |
| `37440` | Uthai Thani – Rasisalai | 2026-10-10 19:00 |
| `37473` | Buriram – BG Pathum | 2026-12-30 18:00 |
| `37471` | Sisaket – Port | 2026-12-09 19:00 |
| `37479` | PT Prachuap – BG Pathum | 2026-12-07 19:00 |

Matchweek 7 spans 2026-10-30 through 2026-11-02, except Chiangrai–Port on
2026-12-30 at 19:00 and Buriram–PT Prachuap on 2027-01-03 at 18:00.
Matchweek 10 spans 2026-11-27 through 2026-11-29, except BG Pathum–Ratchaburi
on 2027-01-03 at 19:00. Matchweek 17 runs 2027-02-12 through 2027-02-14.
Deferred matches retain their original scoring Gameweek; this operation does
not introduce blank/double Gameweek reassignment or change scoring rules.

The existing 90-minute rule moves planned deadlines to 17:30 on 2026-10-09
(GW4), 2026-10-30 (GW7), 2026-11-27 (GW10), and 2027-02-12 (GW17).
GW9 and GW11 deadlines are unchanged. Both databases now have known kickoff
times for all 240 fixtures. Each branch has 34 batch audit entries: 29 fixture
changes, four deadline changes, and one completion record. See `PRODUCTION.md`
for execution and verification evidence.

## Preseason development snapshot

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

## Admin reporting provenance

Admin counts read persisted season teams and manager status/bot markers.
Activity reads selection confirmation timestamps rather than visits, session
refreshes or transfer-revision creation timestamps. Audit history exposes only
recorded operations and allowlisted before/after fields; operations before audit
collection are not reconstructed. No external source is fetched by admin pages.
