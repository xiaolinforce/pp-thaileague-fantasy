# Data sources

## Two-tier interpretation (2026-10-25)

The owner approved keeping former Level 1 as Level 1, combining former Levels
2–4 into Level 2, and increasing the Level 1 squad limit to five from the
currently open Gameweek. Migration `0023` stores the rule version on Gameweeks
and audits adoption; it does not edit any published ranking, effective-tier
row, old revision, locked snapshot, player pool, score or standing. Existing
four-level ranking counts and season tier definitions remain historical source
provenance. New server reads and snapshot writes apply the target Gameweek's
interpretation, with new classifications restricted to that version's levels.

The migration was applied to confirmed development branch
`br-broad-recipe-azz9hbkx`; GW3 is its open test Gameweek and GW1–2 retain
historical rules. The new development migration journal checksum needs an
owner-approved CRLF/LF metadata reconciliation before guarded release checks
can pass. Production rollout remains pending. See `DOMAIN.md` for the
runtime contract and `UI_REVIEW.md` for verification evidence.

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

The current player master intentionally does not retain player-photo URLs, and
current registrations intentionally do not retain shirt numbers. Do not add
either display-oriented field during roster maintenance. Historical source
payloads and audit context may retain source facts, including shirt numbers,
when they are needed to explain a reviewed match or maintenance decision.

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

## Development reminder schema repair

On 2026-10-02, the reviewed, additive migration
`0022_dizzy_quentin_quire` was applied to development
(`br-green-queen-az934b4e`, database `neondb`) after confirming the target
with `npm run db:check`. Sentry issues `PP-THAILEAGUE-FANTASY-10` and
`PP-THAILEAGUE-FANTASY-11` reported the missing
`deadline_reminder_preferences` relation on `/admin/fantasy/reminders`.
The branch previously had 22 applied migrations and none of the five
`deadline_reminder_*` tables.

Post-application verification found all 23 repository migrations applied,
with no pending migrations, and all five reminder tables present. The new
tables have seven foreign keys, three check constraints, five primary keys,
and nine indexes. Applied SQL hashes match the committed LF sources; older
Windows checkout files may contain CRLF without changing the committed SQL.
The local admin reminder page loaded its audience summary, campaign lookup,
and bilingual email preview against this branch without a database error.
Rendering was checked in both Thai and English display modes.
Both Sentry issues were marked resolved after this verification.
Verification did not create campaigns or send emails. Production was not
modified in this operation.

## 2026-10-25 GW6 final four matches and finalization

Owner-approved production-only batch `gw6-oct25-four-matches-final-20261025`
recorded Prachuap 0-0 Bangkok (`37455`), Rasisalai 1-4 Ayutthaya (`37454`),
Lamphun 3-1 Pattani (`37453`) and Uthai Thani 1-2 Sukhothai (`37452`) on
confirmed Neon branch `br-floral-silence-azzesg4n`, database `neondb`. All four
official Thai League reports were approved. Event timing, appearances and cards
follow those reports; assists and individual keeper statistics were checked
against [Prachuap events](https://www.fotmob.com/matches/bangkok-united-vs-prachuap-fc/30hocz3h#1000017761),
[Rasisalai events](https://www.fotmob.com/matches/ayutthaya-united-fc-vs-rasisalai-united/1ttumikk4#1000017762),
[Lamphun events](https://www.fotmob.com/matches/lamphun-warrior-vs-pattani-fc/8qgrqslg#1000017763)
and [Uthai events](https://www.fotmob.com/matches/uthai-thani-fc-vs-sukhothai-fc/8dxklchp#1000017764).
The [AIS PLAY Rasisalai highlight](https://www.youtube.com/watch?v=ba3EpFQ9kzs)
confirms no Fantasy assist for either Ewerton goal: the first follows a keeper
distribution error; the second is his own rebound after his header was saved.

The atomic transaction stored 312 reviewed results and point breakdowns: 124
appearances and 188 explicit zero-minute results covering eligible registrations,
the deadline pool and retained selections. The batch contains 12 goals, 10
assists and 12 yellows, with no reds, own goals, penalty scoring events or
bonus/MOTM points. Per-match player-point totals are 89, 80, 79 and 66,
totaling 314. Existing Fantasy positions and tiers remain unchanged, including
Pablo Dias and Clayton as midfielders and Lucas Grossi as a forward.

Actual individual FotMob keeper statistics report Wattanachai 2 saves,
Patiwat 4, Gabriel Bernard 6, Warut 5, Nont 4, Damyanov 6, Caique 4 and
Kittipun 4. All eight keepers played 90 minutes without a substitution;
saves were not inferred from shots on target. Halftime entrants receive
45 minutes and Nuttee's 90+2 entry receives the one-minute minimum. Only goals
conceded while on the pitch count: Ewerton, Atsadawut and Chanukun retain
clean-sheet points after leaving before Ayutthaya conceded. Ewerton receives
13 points, Suriya 11 and Nathan Palafoz 9.

Canonical `finalizeFantasyGameweek` finalized GW6 and recalculated all 517
locked team scores, including 276 automatic substitutions and 18 captain
fallback cases. All eight fixtures are finished. All 651 deadline-pool players
and three retained unavailable identities have explicit results (654 total).
GW6 is `final`, `score_complete=true`, with average 32, highest manager score
56 and optimal legal team score 104. All 517 Overall standings were refreshed.
GW7 remains open with its unchanged 2026-10-30 17:30 Bangkok deadline and
existing saved drafts.

A complete rollback rehearsal preceded the atomic commit. Independent readback
verified the imported results, every GW6 player-point breakdown and all 517
team scores. Nineteen protected fingerprints preserved registrations,
classifications, tiers, selections, transfer revisions, ownership, deadline
pools, earlier results and all other Gameweeks. Both production dataset
verifiers, the development transaction rollback check and 40 targeted Fantasy
rules/provisional-scoring/carryover tests passed. Four fixture audits, the
canonical finalization audit and the completion audit retain sources, event
timelines, per-player results and recovery reference
`2026-10-25 15:07:03.27138 UTC`, subject to Neon history retention. Finalization
was recorded at `2026-10-25 15:07:08.117 UTC`.

After the existing timed caches refreshed, live Fixtures displayed all eight
results and Points displayed average 32, One More Goal's highest score of 56
and ItsMePP's final 38 points. Temporary credentials, database-read exports
and maintenance scripts were removed after verification. Development received
no persistent data changes.

## 2026-10-24 GW6 opening four matches and GW7 opening

Owner-approved production-only batch `gw6-oct24-four-matches-open-gw7-20261024`
recorded Port 4-1 Rayong (`37459`), Buriram 2-3 Sisaket (`37458`), BG Pathum
2-0 Chiangrai (`37457`) and Ratchaburi 1-2 Chonburi (`37456`) on confirmed Neon
branch `br-floral-silence-azzesg4n`, database `neondb`. All four official Thai
League match reports were approved. Their event minutes, lineup and disciplinary
records were reviewed against FotMob:
[Port events](https://www.fotmob.com/matches/port-fc-vs-rayong-fc/3lacapxk#1000017757),
[Buriram events](https://www.fotmob.com/matches/buriram-united-vs-sisaket-united/3ec8tukf#1000017758),
[BG events](https://www.fotmob.com/matches/bg-pathum-united-vs-chiangrai-united/12bua0za#1000017759),
[Ratchaburi events](https://www.fotmob.com/matches/chonburi-fc-vs-ratchaburi-fc/1sp5bpx8#1000017760).
AIS PLAY highlights for [Buriram](https://www.youtube.com/watch?v=Sut29YuEHL8)
and [BG](https://www.youtube.com/watch?v=oE4Tx44FEys) informed the two source
unassisted-goal reviews. The owner explicitly confirmed no Fantasy assist for
Ratthasat Buaban's fifth-minute goal or Kingsley Schindler's 62nd-minute goal.
No extra assists were added to either event.

The atomic transaction stored 342 reviewed results and point breakdowns: 125
appearances and 217 explicit zero-minute results covering eligible registrations,
the GW6 deadline pool and retained selected players. Unavailable Marc Navarro
receives a zero result without reopening his registration. Existing Fantasy
positions are preserved, including Schindler and Chaiyaphon as forwards. The
batch contains 15 goals, 13 assists, 16 yellows and Ze Ricardo's direct red at
28 minutes, with no own goals, penalties or bonus/MOTM points. Per-match player
point totals are 75, 70, 80 and 67 respectively, totaling 292.

Actual individual FotMob keeper statistics report Falkesgaard 3 saves,
Worawut Srisupha 0, Wichaya 3, Etheridge 2, Steven Van Dijk 2, Saranon 3,
Apirak 2, Kampon 0 and Mendoza 4. Rayong changed keepers at halftime: Worawut
played 45 minutes and conceded three; Wichaya played 45 minutes and conceded
one. All other keepers played 90 minutes. Saves were not inferred from shots
on target. Official halftime labels of 46 count as 45 minutes per half.
The official Stenio goal minute is 62 and Yotsakon's substitution minute is 61;
FotMob orders his credited assist before the substitution, so the reviewed
result retains 61 minutes and one assist. Magno's credited assist confirms he
entered before Fabio's goal at their shared official minute 61.

Canonical `lockFantasyGameweek` captured the 651-player deadline pool, locked
517 GW6 selections, settled free transfers, refreshed ownership and created
517 GW7 drafts with 2,700 copied selection members. Choices, lineup roles,
captaincy and classification snapshots are preserved; only current club
resolution is allowed during carryover. Canonical recalculation then refreshed
all 517 provisional team scores, 517 Overall standings and the optimal legal
team. GW6 remains `provisional`, `score_complete=false`, with four unplayed
fixtures on 2026-10-25 still pending rather than assigned zero results. Its
current average is 18, highest manager score 43 and optimal team score 86.
GW7 is open with the unchanged 2026-10-30 17:30 Bangkok deadline.

A full rollback rehearsal preceded commit. Independent readback verified every
new player result, all 517 team scores and the GW7 carryover. Twenty-five
protected fingerprints preserved historical results, other fixtures, player
classifications, registrations, existing revisions and saved player choices.
Free-transfer settlements were independently recomputed. Both production
dataset verifiers, the development transaction rollback check and 40 Fantasy
rules/provisional-scoring/carryover tests passed. Four fixture audits, the
canonical lock audit and the completion audit retain sources, event timelines,
per-player results and recovery reference `2026-10-24 16:11:24.960740 UTC`, subject
to Neon history retention. Competition/fixture cache tags were invalidated;
live Points displayed average 18, highest 43 and ItsMePP's provisional 22 points,
while Team displayed editable GW7 and its deadline. Temporary credentials,
database exports and maintenance tools were removed after verification. No
runtime code, schema, deployment or push changed; development received no
permanent writes.

## 2026-10-23 production full-season fixture review

Owner-requested batch `fixtures-season-review-20261023` checked all 240
fixtures against the live [Thai League tournament 224 fixture API](https://competition.tl.prod.c0d1um.io/thaileague/api/match-day-match-public/?tournament=224&none_pagination=True)
on production `br-floral-silence-azzesg4n`, database `neondb`. All kickoff
dates/times, home/away entries, match numbers, matchweek assignments and match
statuses already matched. All 30 deadlines remain exactly 90 minutes before
their matchweek's first kickoff; open GW6 remains 2026-10-24 16:30 Bangkok.
The six official `MD ... (ตกค้าง)` labels retain their original GW numbers
and already-correct rescheduled kickoffs.

Seventeen scheduled fixtures had a null venue although the official source
now identifies an existing venue. Only their `venue_id` and `updated_at`
changed:

| Official venue ID | Venue                          | Official fixture IDs                                          |
| ----------------- | ------------------------------ | ------------------------------------------------------------- |
| `64`              | Srinakhonlamduan Stadium       | `37454`, `37629`, `37463`, `37471`, `37497`, `37650`, `37544` |
| `118`             | Tinnasulanon Stadium           | `37633`, `37638`, `37486`, `37501`                            |
| `272`             | Sisaket Stadium (Ko Klang Nam) | `37639`, `37505`, `37538`                                     |
| `110`             | Pattani Stadium                | `37517`, `37524`, `37540`                                     |

The remaining 20 null venues match official venue `208` (`TBC`) and remain
unconfirmed. No venue master records, home-venue defaults, source identifiers,
kickoffs, results or Gameweeks were changed.

An interactive transaction acquired the exclusive Fantasy season lock before
fixture locks, asserted the branch and fresh target state, and passed a complete
rollback rehearsal before commit. Seventeen fixture audits retain full
before/after values; one completion audit records source provenance and
preservation fingerprints. The source SHA-256 is
`4d78e08c9c1c1ce848e88ecb55e10d96baeab2ae484eacd8c5d1b87c9d215723`.
The recovery reference is `2026-10-22 18:03:47.281113 UTC`, subject to the
configured Neon history window.

Fresh post-write comparison passed all 240 fixtures and 30 deadlines, with
220 confirmed venues and 20 official TBC venues. Fingerprints preserved
Gameweeks, selections, selection players, transfer revisions, deadline pools,
match statistics, player/team scores and standings. All 223 unrelated fixtures
retained their venue and update timestamp. Production competition and Fantasy
verification passed; read-only development branch identification and competition
verification also passed. Development data was not modified. No application
deployment or schema migration is required; fixture caches refresh within their
existing five-minute lifetime. The live production Fixtures page was checked
after refresh and exposes Srinakhonlamduan Stadium for GW6 Rasisalai–Ayutthaya,
with its unchanged 2026-10-25 18:00 Bangkok kickoff.

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

## 2026-09-12 production roster reconciliation

The production branch `br-tiny-shape-azrvakql` was reconciled to the complete
[Thai League tournament 224 player roster](https://competition.tl.prod.c0d1um.io/thaileague/api/player-public/all_players_search/?tournament=224).
The paginated source contained 645 unique registration IDs and 645 unique
person IDs; its reviewed SHA-256 fingerprint is
`a449a03a6bc51224263f4e3e081b19bfe6cc388ae29fcd042480030fe5770e8a`.
This was a production-only maintenance operation; development was not changed.

The atomic reconciliation created 154 player-master records, reused 13 exact or
owner-reviewed identities, created 164 official registrations, and normalized
the temporary registration keys for Kakana Khamyok, Arnold Suew, and Rafael
Bilu to official IDs `2026:17086`, `2026:15421`, and `2026:62414`. Chonlachart
Tongjinda is now classified as a midfielder and Shunta Hasegawa as a forward,
matching their current official registrations. Rafael Bilu retains his reviewed
Fantasy forward position while his official registration records midfielder.

Three registrations absent from the new official roster were closed on
2026-09-11 and their Fantasy players made unavailable: Tissanu Khuptanawin at
Chonburi, Soffan Sanron at PT Prachuap, and Jordan Gele at Ratchaburi. Existing
GW3 selection snapshots were not rewritten; Soffan remains in two current GW3
drafts, whose managers can replace him before the deadline. Nine previously
unavailable Fantasy identities were reactivated. The 155 players without an
effective Fantasy classification receive Level 4 from GW3. The open-GW3 player
pool remains unsnapshotted and will be captured by the normal lock lifecycle.

Post-transaction reconciliation found exactly 645 active registrations, all
with Thai League official provenance, with no missing, stale, or non-official
active registration IDs. Competition and Fantasy database verification passed.
Published ranking runs, GW1/GW2 player pools, match statistics, points, team
selections, and standings were not rewritten.

## 2026-09-18 GW3 opening-match review

Owner-approved production-only batch `gw3-ayu-uthai-20260918` recorded
[Ayutthaya United 1-2 Uthai Thani (`37435`)](https://thaileague.co.th/fixtures/224/match/37435?selectedTab=live&optaSeasonId=2026)
on Neon branch `br-tiny-shape-azrvakql`. The atomic import stored 63 reviewed
player results: 32 confirmed appearances and 31 explicit zero-minute results
for active registrants or players already selected in GW3. It also stored 63
deterministic Fantasy point rows and one batch audit entry; development was not
changed.

[LiveSoccerTV's event timeline](https://www.livesoccertv.com/it/match/ayutthaya-united-vs-uthai-thani/58rba8)
records Diogo Brito assisted by Yuki Kusano (59'), Robertinho assisted by
Willian Lira (62'), and Siroch Chatthong assisted by Ben Davis (90+1'). It also
records yellow cards for Willen Mota, Atsadawut Changthong, Charalampos
Charalampous, and Jakkit Wachpirom, with no red cards or goalkeeper changes.
[Bankeela's post-match report](https://www.bankeela.info/thai-league/386783/)
corroborates the Siroch winner and Warut Makemusik's four saves; Caíque's one
save is inferred from the one Ayutthaya shot on target outside its goal.
The disallowed Yuki Kusano goal was excluded. Existing locked Fantasy positions
yield 30 Ayutthaya and 40 Uthai Thani player points, 70 combined. Goal exposure
includes the 90+1' winner for players still on the pitch after regulation time.

The separately owner-approved authenticated admin lock moved all 317 GW3
selections from draft to locked, recalculated provisional team scores, and
opened GW4 for selection. The admin view shows GW3 average 4 and highest 18
after this opening fixture; remaining GW3 matches are still unscored. GW3 was
not finalized.

## 2026-09-12 three-match GW2 review

Owner-approved batch `gw2-sep12-three-matches-20260912` was applied to
production only for official fixtures `37422`–`37424`: BG Pathum United 3-2
Rasisalai United, Uthai Thani 1-2 Pattani, and Sisaket United 0-1 Ayutthaya
United. The atomic import confirmed production branch
`br-tiny-shape-azrvakql`, stored 224 reviewed player results for the six clubs,
and recorded 94 confirmed appearances. Players who were registered for a club
or present in a locked GW2 selection but had no confirmed appearance received
an explicit zero-minute, zero-point result.

The official Thai League match feeds supplied lineups, substitutions, goals,
assists, cards, and player identities. AiScore was used to corroborate match
events and goalkeeper saves. The reviewed save totals are 2-3 in fixture
`37422`, 3-6 in `37423`, and 2-8 in `37424`; no goalkeeper was substituted.
Warut Makemusik receives five penalty-save points for stopping Deyvison
Fernandes, while Deyvison receives minus two penalty-miss points. The official
identities resolve Vitinho Souza to Julio Vitor Souza Ferreira
(`2026:62422`), Gue to Ricardo Gue Rosa Cardoso (`2026:62506`), and the Sisaket
goalkeeper to Steven Van Dijk (`2026:62667`).

Fantasy points use each player's locked Fantasy position. Fixture totals are
`37422`=64, `37423`=67, and `37424`=75, for 206 player points. No MOTM, bonus,
or BPS points were added. After the import, the authenticated admin scoring
action recalculated all 279 locked GW2 team selections. Production verification
found no selected player from the six clubs without a stored match result.

## 2026-09-13 two-match GW2 review

Owner-approved batch `gw2-sep13-two-matches-20260913` was applied to
production only for [Chonburi 2-3 Rayong (`37420`)](https://thaileague.co.th/fixtures/224/match/37420?selectedTab=live&optaSeasonId=2026)
and [PT Prachuap 1-0 Sukhothai (`37421`)](https://thaileague.co.th/fixtures/224/match/37421?selectedTab=live&optaSeasonId=2026).
The official Thai League match feeds supplied lineups, substitutions, goals,
assists, cards, player identities, and goalkeeper saves. FotMob corroborated
the event sequence and player-level save totals. No goalkeeper was substituted.

The goal sequence in `37420` is Renan Gorne assisted by Joao Felipe, Anon
Amornlerdsak assisted by Bruno Leite, Stenio Junior assisted by Jorge Fellipe,
an unassisted Dennis Murillo goal, and an unassisted Hong-Gyu Yeo goal. Renan
also received a straight red card. In `37421`, Edgar Mendez scored the only
goal from a penalty with no assist; the earlier VAR penalty review for Taua was
cancelled and produces no Fantasy event. The reviewed goalkeeper saves are
Kevin Ray Mendoza 1, Wichaya Ganthong 2, Wattanachai Srathongjan 1, and
Kittipun Saensuk 3.

The import stored 184 player results and 63 appearances. Players registered
for a participating club or present in a locked GW2 selection but without a
confirmed appearance received an explicit zero-minute, zero-point result.
Fantasy points use the existing locked Fantasy positions; no player position
was changed. Official registration `2026:3627` remains the approved site
identity `เวโรจน์ ป้อมบุบผา` and receives one point for seven minutes as a
Fantasy forward.

Fixture point totals are `37420`=63 and `37421`=69, for 132 player points. No
MOTM, bonus, or BPS points were added. The authenticated admin finalization
action recalculated all 279 locked GW2 team selections and marked every score
row final. Production verification found no missing result among the selected
player/fixture combinations from the four clubs. GW3 remains open and
development was not changed.

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

Migration `0017` reconstructs the Production GW1 eligible-player pool from the
immutable published ranking `preseason-2026-27-v5-manual-tiers`, the registration
active at the Bangkok deadline, and the earliest audited post-deadline Thai-status
change when one exists. Future Gameweeks capture the same eligibility fields at
lock time. This pool is the provenance boundary for the admin best-possible-team
view; current roster fields must not silently change a historical result.

Migration `0018` adds the persisted optimal-team read model. Run
`npm run db:backfill:optimal-teams` once after applying it to materialize every
existing scored Gameweek, including Production GW1. Later scoring and score
corrections update the saved result transactionally.

## 2026-09-05 four-match review

Owner-approved batch `gw1-sep5-four-matches-20260905` was applied to development
and production for official fixtures `37415`–`37418`: Rayong 1-0 PT Prachuap,
Rasisalai 1-2 Port, True Bangkok United 3-1 Sisaket United, and Singha
Chiangrai United 1-0 Chonburi. The batch records 179 reviewed player-stat rows,
including 126 appearances and 53 unused substitutes. The four fixture point
totals are 77, 66, 70, and 76 respectively, for 289 player points in total.

Evidence was reviewed on the official Thai League match pages and the matching
AiScore event and lineup pages. Stored source payloads retain both URLs, lineup
status, player interval, shirt number, and owner decisions. Douglas Souza is
recorded at the owner-confirmed 60-minute threshold: two appearance points,
five goal points, one midfielder clean-sheet point, and minus one for a yellow
card, totaling seven. Patrick Valverde's event is a penalty goal followed by a
straight red card, totaling three points. No MOTM, bonus, or BPS points were
added.

AiScore listed three Rasisalai shirts that did not resolve to an active Fantasy
registration: C. Mueanta (4, unused), Piyawat Petra (93, appeared and booked),
and P. Wongsa (97, unused). These source entries are preserved in the batch
audit instead of assigning them to an unverified player identity. Piyawat
Petra's appearance and yellow-card effects net to zero, so the unresolved row
does not change a team or player point total. The complete reviewed scoring
fingerprint is
`c7ac83fafadd179a022e90816dd8d3c1a7f99cce83f59adf258e87c2a1861444`.
See `PRODUCTION.md` for branch-level verification.

The 2026-09-07 official roster reconciliation subsequently resolved all three
identities. Production now also stores reviewed `37416` rows for Chotika
Mueanta and Paripan Wongsa as unused substitutes, and for Piyawat Petra at 22
minutes with one yellow card. Each row totals zero points. None of the three
players appeared in a GW1 Fantasy selection, so this completeness backfill did
not change team scores, substitutions, captaincy, or standings. The fingerprint
above remains the historical fingerprint of the original 179-row batch.

A final production completeness pass found 20 players who appeared in at least
one locked GW1 Fantasy selection but did not appear in the reviewed match stats
for their club's finished fixture. They are stored as reviewed zero-minute,
zero-point results. This records the final “did not play” outcome without adding
an event or changing any team score, automatic substitution, captain fallback,
or standing.

## 2026-09-06 final three-match review and roster sync

The owner authorized a production-only review for the final three GW1
fixtures: [Sukhothai 1-3 Buriram (`37412`)](https://thaileague.co.th/fixtures/224/match/37412?selectedTab=match-stat&optaSeasonId=2026),
[Lamphun 1-4 Uthai Thani (`37413`)](https://thaileague.co.th/fixtures/224/match/37413?selectedTab=match-stat&optaSeasonId=2026),
and [Ayutthaya 2-1 Ratchaburi (`37414`)](https://thaileague.co.th/fixtures/224/match/37414?selectedTab=match-stat&optaSeasonId=2026).
The official Thai League Opta feed supplied lineups, substitutions, goals,
assists, cards, minutes, goals conceded while playing, and goalkeeper saves.
The review added 135 player-stat and points records: 95 appearances and 40
unused substitutes. Fixture point totals are `37412`=77, `37413`=64, and
`37414`=65, for 206 player points.

The recorded goal sequence is Bissoli penalty, Bissoli assisted by Robert Zulj,
Bissoli assisted by Sasalak, and Nathan Palafoz assisted by Rhuan in `37412`;
Nuttee Noiwilai own goal, Willian Lira assisted by Benjamin Davis, Benjamin
Davis assisted by Trent Buhagiar, Rodrigo assisted by Surat Suriyachai, and an
unassisted Willian Lira goal in `37413`; and Hyun-Soo Hwang assisted by Hirotaka
Mita, followed by unassisted goals from Thanawat Suengchitthawon and Ewerton in
`37414`. The feed records nine yellow cards and Atikhun Meethoum's straight red.
No MOTM, bonus, or BPS points were added.

No goalkeeper was substituted in these fixtures. The reviewed save counts are
Kittipun Saensuk 6, Neil Etheridge 4, Nont Muangngam 2, Caíque 8, Warut
Makemusik 5, and Kampon Phatomakkakul 5. Owner-reviewed edge cases are retained:
Nuttee has 29 minutes and an own goal for -1 point; Sanrawat Dechmitr has zero
minutes but a yellow card for -1; Bhumchanok Kamkla has five minutes for one
point; and Atikhun has five minutes and a red card for -2. A confirmed
appearance still receives at least one Fantasy minute.

The current official tournament roster was reconciled at the same time. The
production branch now has 481 active registrations, matching the reviewed
official count. Eighteen official registrations were activated or added, eight
previously missing official identities were added to the player master, and
eight shirt numbers were updated with exact old-value guards. Bhumchanok is now
registered to Ayutthaya and retains Level 3. Seven existing unavailable Fantasy
players retain Level 4 and become selectable. The following ten newly available
Fantasy players receive Level 4 effective from GW2: Apison Wanchlam, Ashiravit
Nutsuntia, Chanasorn Kaewyos, Erik Sviatchenko, Napat Sakunchan, Napat
Suemanotham, Phattharapong Rawangpai, Phonphithak Rungrueang, Sawich Klaithin,
and Supanat Mahawai. Published preseason ranking rows and historical selection
snapshots were not rewritten. See `PRODUCTION.md` for finalization and
verification results.

## 2026-10-18 GW5 final four matches and finalization

Owner-approved production-only batch `gw5-oct18-four-matches-final-20261018`
recorded Sisaket 1-1 BG Pathum (`37447`), Bangkok United 0-2 Port (`37446`),
Chiangrai 1-2 Ratchaburi (`37445`) and Pattani 0-1 Buriram (`37444`) on confirmed
Neon branch `br-floral-silence-azzesg4n`, database `neondb`. All four official
Thai League reports were approved. Their event timing takes precedence over
FotMob, with halftime substitutions counting 45 minutes per half and confirmed
stoppage-time entrants receiving at least one minute. Sources are retained in
each reviewed stat payload and the fixture audits:
[Sisaket events](https://www.fotmob.com/matches/bg-pathum-united-vs-sisaket-united/3ecbvcfj#1000017753),
[Bangkok events](https://www.fotmob.com/matches/bangkok-united-vs-port-fc/gfnbj20#1000017754),
[Chiangrai events](https://www.fotmob.com/matches/chiangrai-united-vs-ratchaburi-fc/2tgag4e5#1000017755),
[Pattani events](https://www.fotmob.com/matches/buriram-united-vs-pattani-fc/3lbtgf88#1000017756),
and AIS PLAY highlights for
[Sisaket](https://www.youtube.com/watch?v=Ha7RLFIjRVo),
[Bangkok](https://www.youtube.com/watch?v=c2Y4asWGAWk) and
[Chiangrai](https://www.youtube.com/watch?v=HERyExNtuM8).

The transaction stored 317 reviewed results and point breakdowns: 124
appearances and 193 explicit zero-minute results covering current registrants,
deadline-pool players and retained selections. The four matches contain seven
credited goals, one Pattarapon Suksakit own goal, five assists, 13 yellows and
no reds. The owner explicitly confirmed no Fantasy assist for Lucas Andersen
on Joao Magno's goal or Ekanit Panya on Pattarapon's own goal; both assist
values are stored as zero and both players receive three points. Teerasak's
unassisted goal also remains unassisted after highlight review. Existing Fantasy
positions remain unchanged: a fresh database read confirmed Kingsley Schindler
is a forward, correcting the earlier UI-based preview from three to two points.

Individual FotMob goalkeeper statistics report Steven Van Dijk 2 saves,
Saranon 4, Patiwat 4, Falkesgaard 5, Apirak 5, Kampon 4, Damyanov 6 and
Etheridge 0. All played 90 minutes without a goalkeeper substitution; saves
were not inferred from shots on target. The respective match player-point
totals are 60, 78, 63 and 74, totaling 275. No bonus or MOTM points were added.

Canonical `finalizeFantasyGameweek` finalized GW5 and recalculated all 471
locked team scores, including 312 automatic substitutions and 26 captain
fallback cases. All eight fixtures are finished, and all 651 deadline-pool
players plus three retained unavailable identities have explicit results
(654 total). GW5 is `final`, `score_complete=true`, with average 32, highest
manager score 55 and optimal legal team score 95. All 473 Overall standings
were refreshed. GW6 remains open with its unchanged 2026-10-24 16:30 Bangkok
deadline and existing drafts.

A complete rollback rehearsal preceded the atomic commit. Independent readback
verified every new player result and recomputed all 471 team scores. Twenty-two
protected fingerprints preserved registrations, classifications, snapshots,
transfer revisions, ownership, earlier results and all other Gameweeks.
Production competition and Fantasy verifiers, the development rollback check
and 36 Fantasy rules/provisional-scoring tests passed. Four fixture audits,
the canonical finalization audit and one completion audit retain the evidence
and pre-write recovery reference `2026-10-18 15:40:34.207021 UTC`, subject to
Neon history retention. Finalization was recorded at `2026-10-18 15:40:38.409 UTC`.
Production competition/fixture cache tags were invalidated; the live Points
page displayed average 32, highest 55 and ItsMePP's 35 points. Temporary
credentials and maintenance tools were removed after verification. No runtime
code, schema, deployment or push changed; development received no permanent writes.

## 2026-10-17 GW5 three-match import

Owner-approved production-only batch `gw5-oct17-three-matches-20261017`
recorded Sukhothai 5-1 Rasisalai (`37450`), Chonburi 1-2 PT Prachuap (`37449`)
and Rayong 1-1 Uthai Thani (`37448`) on confirmed Neon branch
`br-floral-silence-azzesg4n`, database `neondb`. The official Sukhothai report
was approved; the owner explicitly accepted the reviewed FotMob events and
AIS PLAY highlights for the other two matches before their official reports
were approved. This acceptance does not claim official approval of those reports.
Sources are retained in the database audit and each reviewed stat payload:
[Sukhothai events](https://www.fotmob.com/matches/sukhothai-fc-vs-rasisalai-united/1a22eeb9g#1000017750),
[Chonburi events](https://www.fotmob.com/matches/chonburi-fc-vs-prachuap-fc/32rbxs07#1000017751),
[Rayong events](https://www.fotmob.com/matches/uthai-thani-fc-vs-rayong-fc/8dyckvvz#1000017752),
and highlights
[Sukhothai](https://www.youtube.com/watch?v=_p2DIpN-qWM),
[Chonburi](https://www.youtube.com/watch?v=Lp-QVhVevwk),
[Rayong](https://www.youtube.com/watch?v=93Sk1KvQpK8).

The atomic transaction stored 277 reviewed results and point breakdowns: 94
confirmed appearances and 183 explicit zero-minute results covering current
registrants, deadline-pool players and retained GW5 selections. The latter
include unavailable Chirasak Srisopa and Soffan Sanron without reopening their
registrations. Existing Fantasy positions remain unchanged. The batch records
10 credited goals, one Lara own goal, six assists, 13 yellows, no reds and 22
actual goalkeeper saves. Individual FotMob keeper panels report Kittipun 0,
Sakkongpop 2, Mendoza 4, Wattanachai 10, Wichaya 2 and Caique 4; all played 90
minutes. Saves were not inferred from shots on target. The owner explicitly
confirmed no Fantasy assist for Lara's own goal. Stenio's self-rebound has no
assist, and Yotsakon's VAR-disallowed goal is excluded.

The player-point totals are Sukhothai 57, Rasisalai 24, Chonburi 24,
PT Prachuap 38, Rayong 27 and Uthai Thani 25, totaling 195. Canonical
`recalculateGameweek` refreshed all 471 locked GW5 team scores, the optimal
team and 473 Overall standings. GW5 remains `provisional` with
`score_complete=false`, average 8 and highest manager score 23; the optimal
legal team has 90 points. Four GW5 fixtures remain unscored. GW6 remains open
with its unchanged 2026-10-24 16:30 Bangkok deadline.

A full rollback rehearsal preceded commit. Independent readback checked all
277 results and recomputed all 471 team scores. Twenty-five protected
fingerprints preserved prior results, selections, revisions, deadline pools,
classifications, ownership, registrations and Gameweek lifecycle fields. Both
production dataset verifiers, the development transaction rollback check and
36 Fantasy rules/provisional-scoring tests passed. Three fixture audits and
one completion audit retain the sources, owner decisions, per-player results
and pre-write recovery reference `2026-10-17 16:36:43.827098 UTC`, subject to
Neon history retention. Production competition/fixture cache tags were
invalidated; Points displays highest score 23 and Lara zero. No runtime code,
schema, deployment or push changed; development received no permanent writes.

## 2026-10-16 GW5 provisional lock and GW6 opening

The owner explicitly authorized locking GW5 as `provisional` and opening GW6,
without finalization. The canonical `lockFantasyGameweek` service ran in one
transaction against confirmed production branch `br-floral-silence-azzesg4n`,
database `neondb`, after a complete rollback rehearsal. Its pre-write recovery
reference is `2026-10-16 15:50:20.442113 UTC`, subject to Neon history retention.

All 471 GW5 selections are locked with 471 provisional team scores and refreshed
Overall standings. The 2,640 selection members retain their existing snapshots;
the same player choices, lineup roles, captaincy and classifications carry into
471 GW6 drafts. The deadline player pool contains 651 eligible players. GW5 has
an average of 1 and a highest manager score of 9; its persisted optimal legal
team has 32 points. These are partial results from one finished fixture, with
seven fixtures remaining. GW5 retains `score_complete=false` and no finalization
timestamp. GW6 is open with its unchanged deadline of 2026-10-24 16:30 Bangkok.

Independent readback recomputed all 471 scores and checked carryover. Fourteen
protected fingerprints preserved match events/statistics, player points,
registrations, classifications, GW5 members, prior Gameweeks and their scores,
pools, optimal teams, selections and revisions. Both production dataset
verifiers, the development transaction rollback check, and 36 Fantasy rules and
provisional-scoring tests passed. The canonical lock audit and batch
`gw5-lock-open-gw6-20261016` retain operation context and recovery evidence.
Production ownership, competition and fixture cache tags were invalidated;
the Points page displays GW5 highest score 9. Development received no permanent
data changes. No application code, schema, deployment or push was required.

## 2026-10-16 GW5 Ayutthaya-Lamphun match import

Owner-approved production-only batch `gw5-ayutthaya-lamphun-20261016` recorded
[Ayutthaya United 0-2 Lamphun Warriors (`37451`)](https://thaileague.co.th/results/224/match/37451?selectedTab=live&optaSeasonId=2026)
on the current independent production root `br-floral-silence-azzesg4n`,
database `neondb`. The official fixture API confirms the finished match and
approved report. The pre-write recovery reference is
`2026-10-16 15:34:49.239960 UTC`, subject to the branch's configured restore
window. Development received no persistent changes.

The official match report supplies the starting lists, substitutions, Anderson
Chaves's 62nd-minute goal, Passakorn Biaothungnoi's 75th-minute own goal, and
yellow cards for Osarenren Okungbowa (13') and Kerim Palic (54'). No red cards,
penalty events, or goalkeeper substitutions were recorded. FotMob's individual
goalkeeper match panels directly report Warut Makemusik two saves and Nont
Muangngam three; saves were not inferred from shots on target.
The [AIS PLAY highlight](https://www.youtube.com/watch?v=7C6GC562gFQ) shows a
defensive clearance before Anderson scores and Luis Felipe's cross before
Passakorn's own goal. Both goals receive no assist. The owner explicitly
confirmed no Fantasy assist for Luis, who retains two appearance points.

The atomic import stored 60 reviewed player-stat rows and 60 deterministic
point breakdowns: 32 appearances and 28 explicit zero-minute results covering
all 31 Ayutthaya and 29 Lamphun active registrants. Every GW5 selection member
whose club snapshot belongs to these clubs is covered. Recorded halftime
substitutions at 46' use 45 minutes per regulation half; the original event
timestamps remain in source payloads. Confirmed appearances retain the minimum
one-minute convention. Goal exposure follows the actual on-pitch intervals.

Points use the existing Fantasy positions, including Passakorn as a midfielder
(two appearance points minus two for the own goal, total zero) and Athit Berg
as a forward. Nont earns seven points and Anderson five. Club player-point
totals are Ayutthaya 18 and Lamphun 54, 72 combined, with no MOTM or bonus.
The batch totals one credited goal, one own goal, zero assists, five saves,
two yellows, and zero reds. The fixture is finished with attendance 3,228.

The owner withdrew the request to close GW5. All 471 GW5 selections were
still draft, so the operation did not lock or finalize a Gameweek, open GW6,
or calculate team scores from drafts. GW5 remains `open` with
`score_complete=false`; GW6 remains `planned`. The normal later lock will
calculate team scores from the stored player results. Selection snapshots,
transfers, ownership, historical scores, standings, optimal teams, classifications,
registrations, rankings, and deadline pools remain unchanged.

The transaction took the exclusive Fantasy season lock before Gameweek and
fixture locks and stored one batch audit containing source references, the
reviewed timeline, the owner's assist/lifecycle decisions, per-player results,
and protected fingerprints. A full rollback rehearsal, independent post-commit
readback of all stats and breakdowns, 25 protected data-group fingerprints,
production competition/Fantasy verification, development rollback verification,
and 36 targeted Fantasy rules/provisional-scoring tests passed. Production
`competition-dataset` and `fixtures-dataset` cache tags were invalidated through
Vercel. No runtime code or schema changed.

## 2026-10-12 GW5 Anderson and Rui registration activation

Owner-approved production-only batch `gw5-anderson-rui-registration-20261012`
confirmed Neon branch `br-tiny-shape-azrvakql`, database `neondb`, and the live
[official tournament 224 roster](https://competition.tl.prod.c0d1um.io/thaileague/api/player-public/all_players_search/?tournament=224).
It added active official registrations `2026:62840` for Sisaket defender
Anderson do Nascimento Carneiro (person `95567`) and `2026:62411` for Port
forward Rui Costa (person `94702`), using their existing player/Fantasy
identities. Both registrations begin on the owner-authorized activation date,
2026-10-12; this is the Fantasy maintenance boundary, not an inferred historic
signing date. Both Fantasy players are now available, and Rui's player master
is active. Rui's old inactive Transfermarkt registration remains unchanged.

Anderson receives Level 4 effective from GW5. Rui retains his existing Level 2
effective-tier history from GW1 without adding or changing a tier row. Their
locked defender/forward positions and foreign-player classifications remain
unchanged. The open GW5 deadline pool remains uncaptured; the normal lock
lifecycle will capture the newly eligible players. GW4 remains final and both
players retain their one-point match results.

The atomic operation records one administrative audit containing before/after
state, official roster evidence, the activation-date decision, and protected
fingerprints. A rolled-back rehearsal verified current purchase eligibility
through the canonical club resolver and a savepoint verified both players'
clubs and Level 4/2 tiers in the canonical GW5 deadline snapshot. The snapshot
rehearsal was undone before committing, leaving the open pool untouched.
Independent post-commit readback and production competition/Fantasy checks
passed; active official registrations increased from 647 to 649. Fingerprints
verified unchanged Gameweeks, fixtures, all match/player/team scores, standings,
optimal teams, historical pools, selections, transfer revisions, rankings,
Rui's tiers, and unrelated registrations/player data. Development's transaction
rollback check passed without persistent data changes. The production
`competition-dataset` cache tag was invalidated through Vercel for the next
request to refresh the Player Market.

## 2026-10-12 production roster reconciliation for GW5

Owner-approved batch `roster-reconciliation-20261012-gw5` reconciled production
branch `br-tiny-shape-azrvakql`, database `neondb`, against all 17 pages of the
[official tournament 224 roster](https://competition.tl.prod.c0d1um.io/thaileague/api/player-public/all_players_search/?tournament=224).
The source contains 651 unique registration IDs and 651 unique person IDs;
its reviewed SHA-256 fingerprint is
`047df5404c6a8e8ffdbb43c42383301514ce90ee89d33cc2892daea990948e79`.
The pre-write recovery reference is `2026-10-11 19:24:18.441489 UTC`, subject
to the branch's configured restore window. Development was not modified.

Five missing player masters, official registrations, Fantasy identities, and
Level 4 tier rows were created, with tiers effective from GW5:

| Player           | Club      | Official registration | Person  | Position   |
| ---------------- | --------- | --------------------- | ------- | ---------- |
| จตุรพัช สัทธรรม  | Chonburi  | `2026:4104`           | `5638`  | Defender   |
| ธนกฤต อ่ำพายัพ   | Chonburi  | `2026:62838`          | `95557` | Goalkeeper |
| กฤตภัค แสงสวัสดิ | BG Pathum | `2026:24946`          | `46452` | Midfielder |
| วรวรรณ วรธรรม    | Rayong    | `2026:47552`          | `73887` | Defender   |
| พัชรพล ชาญดี     | Rayong    | `2026:35711`          | `58484` | Defender   |

Their registrations begin on the observed maintenance date, 2026-10-12.
Three registrations absent from the complete official roster were made inactive
with `registered_until=2026-10-12`, and their Fantasy identities made unavailable:
Thanawat Rodjan at Rayong (`2026:59432`), Wongsakorn Saenruecha at Sisaket
(`2026:15160`), and Ruan Ribeiro at Port (`2026:62409`). These dates record
administrative eligibility boundaries, not asserted signing or deregistration
dates. No destination club was inferred. None of the three unavailable players
has a persisted team selection; their identities and history remain retained.

Official birth dates filled four previously unknown values: Kingsley Schindler
`1993-07-12`, Stefan Schimmer `1994-04-28`, Matheus Costa `1999-08-14`, and
Rui Costa `1996-02-20`. Matheus Lins's birth date changed from `1997-05-01`
to `2001-03-24`; the official date is also corroborated by a matching full-name
entry in the [Sao Paulo football federation roster](https://futebolpaulista.com.br/Repositorio/Noticia/22914/5983_1.pdf).
Costa's current plausible official birth date supersedes the implausible
`2026-08-14` value rejected during the opening-match review. Schindler's
nationality changed from Ghana to Germany to follow current official authority,
and his nationality provenance now names that source. His foreign-player
classification and Fantasy forward position remain unchanged.

The atomic transaction took the exclusive Fantasy season lock and stored one
administrative audit with before/after state, source identities, date decisions,
and verification fingerprints. A full rollback rehearsal and independent
post-commit readback verified all 651 active registrations and their clubs.
The canonical current-club resolver confirms all five additions purchasable
and the three closures unavailable. A savepoint rehearsal of the canonical
GW5 deadline pool contained 651 players, including all five additions at Level 4;
the rehearsal snapshot was rolled back, leaving the open GW5 pool uncaptured.

Fingerprints verified 24 protected data groups and unchanged existing player
fields outside the approved corrections, including reviewed names and Fantasy
positions, effective tier history, selections, transfer revisions, match/player/
team scores, standings, optimal teams, published rankings, and historical pools.
Anderson retains Level 4 and Rui Level 2. Production competition and Fantasy
verification and the club audit passed; the latter has no ambiguous active
clubs, draft club mismatches, or missing whole deadline pools. Development's
transaction rollback check passed without persistent changes. The production
`competition-dataset` cache tag was invalidated through Vercel. No player photos,
shirt-number fields, match results, or ranking projections were imported.

## 2026-10-11 GW4 final-match import and finalization

Owner-approved production-only batch `gw4-final-four-matches-20261011`,
executed on October 12, recorded Port 3-2 Pattani (`37436`), Sisaket United
2-1 Chonburi (`37437`), Lamphun Warriors 0-2 Bangkok United (`37438`), and
PT Prachuap 2-1 Chiangrai United (`37439`). These are the latest completed
matches, played on October 11. The shared transaction client confirmed Neon
branch `br-tiny-shape-azrvakql`, database `neondb`, before importing 325 reviewed
results and point breakdowns: 126 appearances and 199 explicit zero-minute
results, including players covered by historical selection club snapshots.

The [official Thai League results](https://thaileague.co.th/results/224) and
the four official match reports govern goals, cards, substitution times, and
goal exposure. FotMob supplies source assists and directly reported individual
goalkeeper saves. The eight goalkeepers played the full match without a
goalkeeper substitution: Michael Falkesgaard 3, Damyan Damyanov 2, Steven Van
Dijk 3, Kevin Ray Mendoza 3, Nont Muangngam 4, Patiwat Khammai 6, Wattanachai
Srathongjan 1, and Apirak Worawong 3 saves. Saves were not inferred from shots
on target. Every confirmed appearance receives at least one Fantasy minute;
official 60th-minute substitutions retain the full 60 minutes.

The reviewed [Port highlight](https://www.youtube.com/watch?v=UdrekrDY41A)
at 2:23-2:49 shows Igor Neves's shot being parried before Jean-Pierre Da Sylva
scores. Igor receives one Fantasy assist under the owner's first-shooter
rebound rule, while his source assist remains zero. The
[Sisaket highlight](https://www.youtube.com/watch?v=TG5leZJekpM) confirms
Mendoza's own goal from Patrick Valverde's free kick hitting the post and
goalkeeper, and Dennis Murillo's direct free kick; neither receives an assist.
The [Prachuap highlight](https://www.youtube.com/watch?v=M_YuXPx9iJo), including
the VAR replay at 3:28-3:54, shows Edgar Mendez himself being fouled for his
penalty, so that goal also has no assist. Noboru Shimura receives one direct
red at 28 minutes. Additional Chaiyaphon Otton and Marlon yellows appearing
on AiScore were not imported because neither the official report nor FotMob
records them. Source payloads and the batch audit retain the reviewed event
timeline, report URLs, FotMob references, highlights, and these decisions.

The current official roster confirms Sisaket defender Anderson do Nascimento
Carneiro, official player `62840` / person `95567`. A missing player master and
unavailable Fantasy identity were created solely to attach his one-minute,
one-point result. No tier, registration start date, or purchasing eligibility
was inferred, and the captured GW4/GW5 pools were not changed. An identity
creation audit records this boundary. Port's Rui Costa, official player
`62411` / person `94702`, was matched to his existing unavailable Fantasy
identity and receives one point for 30 minutes. His existing Level 2 history,
registration, and availability remain unchanged. Both identities require
separate registration/availability maintenance before becoming purchasable;
Anderson also requires a tier decision.

The batch contains 12 credited goals plus one own goal, nine source assists,
ten Fantasy assists, 25 saves, 18 yellows, and one red. Its player points total
273 (Port-Pattani 71, Sisaket-Chonburi 53, Lamphun-Bangkok 85, and
Prachuap-Chiangrai 64). All eight GW4 fixtures are now finished. Finalization
through the canonical admin service in the same transaction sets GW4 to
`final` with `score_complete=true`, recalculates all 388 locked teams including
automatic substitutes, captain fallback, and chips, and refreshes 390 Overall
standings. There are 238 automatic substitution entries. GW4 average/highest
points are 32/56 and its persisted final optimal team totals 116 points. The
complete Gameweek has 653 stats/point rows, 251 appearances, and 573 player
points. The previous four fixtures retain their 328 rows and 300 points.

A full transaction rehearsal rolled back before the real commit. Independent
post-commit readback verified all 325 player breakdowns, all 388 team results
against the canonical scoring engine, event totals, complete selected-player
result coverage, and the batch, identity, and finalization audits. Protected
hashes confirm unchanged prior-fixture results, existing player classification,
selection/member snapshots, transfer revisions, GW4/GW5 pools, and the GW5
row; GW5 remains `open`. Production competition and Fantasy verification
passed, as did the development transaction rollback check and 31 targeted
Fantasy rules tests. No persistent match data was written to development.

## 2026-10-10 GW4 three-match import

Owner-approved production-only batch `gw4-three-matches-20261010` recorded
Uthai Thani 4-2 Rasisalai United (`37440`), Buriram United 3-2 Rayong (`37442`),
and BG Pathum United 1-1 Ayutthaya United (`37443`). The shared transaction
client confirmed Neon branch `br-tiny-shape-azrvakql` before the atomic import.
It stored 268 reviewed results and point breakdowns: 93 appearances and 175
explicit zero-minute results, including selected players whose locked club
snapshot belongs to a finished fixture. Locked positions and the GW4/GW5
selection and member snapshots were preserved; their hashes were checked
inside the transaction. The batch audit and each source payload retain the
official reports, FotMob references, reviewed event timeline, and owner decisions.

The owner independently reviewed and confirmed no assister for Stefan
Schimmer's 45th-minute goal, Patrik Gustavsson's 54th-minute goal, and Trent
Buhagiar's 53rd-minute goal. Ratthanakorn Maikami receives one Fantasy assist
for Willian Lira's 17th-minute rebound goal: the Uthai highlight at 1:01-1:06
shows his initial shot being parried before Lira scores. This follows the
owner's first-shooter rebound rule; his source assist count remains zero.
João Felipe has two yellows and one red, matching the previously implemented
second-yellow scoring convention, and totals five points. Official Thai League
event times govern substitutions and goal exposure, with halftime normalized
to 45 minutes and a minimum one minute for every confirmed appearance.

FotMob's individual goalkeeper panels directly reported Neil Etheridge 1,
Wichaya Ganthong 6, Saranon Anuin 1, Warut Makemusik 1, Caíque 13, and Gabriel
Bernard 7 saves. No goalkeeper was substituted. Saves were not inferred from
shots on target. The import contains 13 goals, nine source assists, ten Fantasy
assists, 29 saves, 16 yellows, and two reds. Player points total 199: Buriram 37,
Rayong 30, BG 25, Ayutthaya 23, Uthai 51, and Rasisalai 33.

Recalculation in the same transaction scored all 388 locked GW4 teams and
refreshed 390 Overall standings, including the newer teams without a GW4
selection. GW4 average/highest points are 15/41; its persisted optimal team
totals 95. Independent post-commit reads verified all 268 player breakdowns,
the event totals, one batch audit, and all 388 team-score arithmetic checks.
Production competition and Fantasy verification passed. Four GW4 fixtures are
finished and four remain scheduled, so GW4 remains `provisional` with
`score_complete=false`; GW5 remains `open`. The October 9 result still has 60
rows totaling 101 points. No match data was written to development. Its
transaction rollback check passed; its separate Fantasy verification found
pre-existing optimal-team coverage/status gaps, which this production task
did not change. The targeted Fantasy rules tests passed (31 tests).

## 2026-10-09 GW4 opening-match import

Owner-approved production-only batch `gw4-ratchaburi-sukhothai-20261009`
recorded Ratchaburi 6-0 Sukhothai (official fixture `37441`). A transaction
rehearsal rolled back before the production commit. The import retained the
official event timeline and FotMob references in each reviewed source payload
and one batch audit entry. It stored 60 player results and point breakdowns:
32 appearances and 28 explicit zero-minute results, covering active registrants
and every GW4 selection member whose club snapshot belongs to this fixture.
Existing locked Fantasy positions were preserved. Player points total 101
(Ratchaburi 90, Sukhothai 11), matching the owner-approved preview.

The official Thai League report supplies goals, cards and substitution times;
FotMob supplies the six assists and direct individual goalkeeper save totals.
Kampol Pathomakkakul and Kittipun Saensuk each made four saves and played the
full match. Adisorn Promrak received a direct red at 27 minutes, and Thiti
Thumporn received a yellow at 45+2. The final Njiva goal uses the official
89th minute rather than FotMob's 88th; this does not affect points. Regulation
minutes are derived from reviewed event minutes with halftime treated as 45
and a one-minute minimum for confirmed appearances; Murilo Souza's directly
reported 60 minutes is retained. Goal exposure follows substitution timing.

Post-commit reads verified 60 stats/point rows, six goals, six assists, eight
saves, one yellow, one red, and no point mismatches. After the owner's explicit
follow-up approval, the authenticated admin lock moved GW4 to `provisional`,
locked and scored all 388 team selections, refreshed 388 Overall standings,
and carried 388 drafts into the newly opened GW5. GW4 average/highest points
are 6/32; all team scores are provisional with no arithmetic mismatches.
Player results remained unchanged. GW4 is not final, and development was not
changed.

## 2026-10-09 production GW4 schedule correction

Owner-requested production-only batch `fixtures-gw4-schedule-20261009`
checked all eight GW4 fixtures and all eight GW5 fixtures against the live
[Thai League tournament 224 fixture API](https://competition.tl.prod.c0d1um.io/thaileague/api/match-day-match-public/?tournament=224&none_pagination=True).
Official fixture `37441`, Ratchaburi–Sukhothai, now kicks off on
2026-10-09 at **18:00 Asia/Bangkok**, replacing the previously reviewed 19:00.
The other seven GW4 fixtures and all eight GW5 fixtures already agreed with
the official dates and times, including Uthai Thani–Rasisalai at 19:00 on
2026-10-10.

The unchanged 90-minute rule moves the open GW4 deadline from 17:30 to
**16:30 on 2026-10-09 Asia/Bangkok**. The correction was applied before the
new deadline with no locked GW4 selections or captured GW4 player pool.
GW5 retains its 2026-10-16 17:30 deadline. Original fixture source identifiers,
source URLs, venues, matchweek assignments, and match statuses remain intact.

The transaction on production `br-tiny-shape-azrvakql`, database `neondb`,
records three audit entries containing the before/after values, live source
URL, recovery timestamp, and hashes proving preservation of unrelated fixtures,
Gameweeks, selections, selection players, transfer revisions, player pools,
match statistics, player points, team scores, standings, and reminder snapshots.
Development was not changed. See `PRODUCTION.md` for verification evidence.

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

| Official fixture ID | Match                   | New kickoff      |
| ------------------- | ----------------------- | ---------------- |
| `37441`             | Ratchaburi – Sukhothai  | 2026-10-09 19:00 |
| `37440`             | Uthai Thani – Rasisalai | 2026-10-10 19:00 |
| `37473`             | Buriram – BG Pathum     | 2026-12-30 18:00 |
| `37471`             | Sisaket – Port          | 2026-12-09 19:00 |
| `37479`             | PT Prachuap – BG Pathum | 2026-12-07 19:00 |

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

## 2026-10-11 player club corrections

Owner-approved production maintenance targeted Neon `br-tiny-shape-azrvakql`,
database `neondb`. Batch `player-club-corrections-20261011` corrected 22 Zulj
GW5 draft club snapshots from Buriram to Ratchaburi. His active Ratchaburi
registration begins 2026-09-17; the GW3/GW4 deadline pools already contain that
club. The 44 older selection snapshots remain intact and display through those
pools. GW1/GW2 retain Buriram.

Anucha Sakaekum's GW1 backfill pool incorrectly recorded Ayutthaya. Official
Rasisalai registration `2026:24691` starts 2026-07-01 and was stored on
2026-09-02, before the 2026-09-04 deadline; the live official roster corroborates
it. Only that pool row's club was corrected to Rasisalai, preserving its source
and capture timestamp. Recomputing both canonical 462-player optimizer inputs
produced identical 15-player choices, roles and 110 total points.

The atomic transaction recorded 23 before/after audits and asserted unchanged
scores, standings, transfer revisions, locked selections and other pool rows.
Independent readback found zero draft club mismatches, ambiguous active clubs
or missing complete deadline pools. Its 48 missing individual references are
retained unavailable Chirasak Srisopa, Marc Navarro and Soffan Sanron selections
across GW3–GW5; preserve them for historical display and manager replacement.
See `PRODUCTION.md` for execution and recovery references.
