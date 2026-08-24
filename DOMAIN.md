# Fantasy domain guide

## Purpose

The application models a Thai League 1 Fantasy Football season. A manager owns
a 15-player squad, selects a valid starting eleven and bench for each Gameweek,
uses limited chips, makes transfers before the deadline, and competes in
Classic leagues on total points.

This document describes the current implemented product contract. The pure
rules and scoring functions in `src/lib/fantasy` are the executable source of
truth and must change together with this guide and their tests.

## Core terms

| Term               | Meaning in this application                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Competition season | The imported Thai League competition and fixture season on which Fantasy is based.                                             |
| Fantasy season     | The game configuration attached one-to-one to a competition season.                                                            |
| Gameweek           | A numbered scoring period whose deadline is derived from the first fixture kickoff.                                            |
| Fantasy player     | A registered competition player with a locked Fantasy position, Thai classification, availability, and effective tier history. |
| Manager            | The persistent Fantasy identity owned by an auth account while active; it may outlive a Guest session.                         |
| Selection          | One team's squad, lineup, captaincy, active chip, and transfer settlement for one Gameweek.                                    |
| Selection snapshot | The club, position, tier, and Thai status copied onto a selected player for historical consistency.                            |
| Transfer revision  | An ordered record of confirmed or cancelled pre-deadline squad revisions.                                                      |
| Player match stats | Imported or reviewed match facts used by the points engine.                                                                    |
| Fantasy assist     | An optional reviewed assist value that overrides the source assist count for scoring.                                          |
| Player ranking     | A versioned preseason projection ordered from rank 1 (highest expected points) through the full active player pool.            |
| Classic league     | A season-long ranking by total points with transfer count and team name as tie-breakers.                                       |

## Squad and lineup rules

| Rule                       |             Current value |
| -------------------------- | ------------------------: |
| Squad size                 |                        15 |
| Goalkeepers                |                         2 |
| Defenders                  |                         5 |
| Midfielders                |                         5 |
| Forwards                   |                         3 |
| Starting players           |                        11 |
| Minimum starting formation | 1 GK, 3 DEF, 2 MID, 1 FWD |
| Maximum from one club      |                         3 |
| Maximum foreign players    |                         7 |

The starting eleven may use any formation that meets the minimums and the
fixed squad composition. The bench contains one goalkeeper at order `0` and
three outfield players at orders `1` through `3`. Exactly one starter must be
captain and one different starter must be vice-captain.

When a starter is manually swapped with a bench player before the deadline,
the incoming starter inherits the outgoing starter's captain or vice-captain
role. Swapping players who are both in the starting eleven keeps each role with
its existing player.

A vacant draft slot may swap with a real player but not another vacancy. The
vacancy keeps its required player position while exchanging lineup role and
bench order with the player. Cross-position swaps are allowed only when the
placeholder-complete lineup still satisfies the starting-formation and bench
structure. Captaincy follows the same starter/bench inheritance rule, so a
vacancy may temporarily carry the role until its replacement is added.

An unavailable player cannot be added to a newly validated squad. Existing
selection rows retain their snapshots so later availability or classification
changes do not rewrite history.

## Thai classification

The competition import retains source nationality text, while the Fantasy
player stores an explicit `isThai` decision and its source. The initial seed
recognizes nationality text containing Thai, Thailand, or ไทย. An administrator
may correct the current result with a reason; existing selections retain their
earlier Thai-status snapshot.

Mixed-heritage eligibility is a product decision represented by the explicit
Fantasy classification; it must not be re-inferred in UI code.

## Tier slots

The current season defines:

| Level | Nominal slots |      Cumulative maximum |
| ----: | ------------: | ----------------------: |
|     1 |             3 |              Level 1: 3 |
|     2 |             7 | Levels 1–2 combined: 10 |
|     3 |             5 | Levels 1–3 combined: 15 |

Validation is cumulative. A lower-ranked player may occupy a remaining
higher-level slot, but a Level 1 player cannot overflow into Level 2 or 3. Tier
records are effective from a Gameweek so later changes do not alter earlier
selection snapshots.

## Player ranking and tier derivation

The canonical preseason ranking is a versioned, immutable-after-publication
projection. Rank `1` is the player with the highest projected Fantasy points;
ranks continue without gaps through every active Fantasy player. Position rank
is also stored for review, but the tier boundary uses overall rank only.

For the 2026/27 preseason publication:

| Overall rank | Level |       Players |
| -----------: | ----: | ------------: |
|         1–50 |     1 |            50 |
|       51–150 |     2 |           100 |
|     151–last |     3 | all remaining |

The projection combines prior-season minutes and events, the project scoring
rules, competition strength, club attack/defence context, current market value,
position priors, expected minutes, and a confidence penalty when source history
is unavailable. Stable source IDs and reviewed manual adjustments may resolve
exceptional cases. Display names alone never constitute a manual identity
override.

Changing future tier proportions does not require recalculating player order:
publish a new ranking version or derive new boundaries from the stored overall
ranks. A published run records the model version, cutoff date, sources,
configuration, confidence, and per-player reasons. It cannot be applied to a
Gameweek that already has locked selections or scores.

### Automatic squad completion

Before the deadline, a manager may fill every vacant draft slot automatically.
The suggestion preserves players already in the draft, ignores market display
filters, and uses the current published ranking with fresh availability, club,
position, Thai-status, and effective-tier data. It first attempts to maximize use of the
three Level 1 and seven Level 2 nominal slots when a valid allocation exists,
then favors higher projected points with bounded random variation so repeated
empty drafts need not receive the same squad. Club, foreign-player, cumulative
tier, position, duplicate-player, lineup, and bench constraints remain hard
limits.

The strongest newly selected players occupy vacant starting slots before bench
slots of the same position. Existing valid captaincy is preserved; any missing
captain or vice-captain is assigned from the highest-projected starters. The
suggestion changes only the client draft and has no transfer or persistence
effect until the manager saves through the normal validation path.

## Deadlines and Gameweeks

The deadline is 90 minutes before the first kickoff in that matchweek. Squad,
lineup, transfer, captain, and chip changes are accepted only before the stored
deadline.

The current operational lifecycle is:

1. `planned` — seeded but not the active market.
2. `open` — accepts the current Gameweek's changes.
3. `provisional` — team selections are locked and scores can be recalculated.
4. `final` — the Gameweek is marked complete and derived scores are final.

The database enum also contains `locked`, but no current admin transition uses
it. Do not assume a distinct locked phase without adding and documenting its
behavior.

When the current Gameweek is locked, its settled squad and lineup are copied
into the next Gameweek as the initial draft. A new team that has not saved a
complete squad locks with an empty selection, scores zero, and carries an empty
draft into the next Gameweek.

## Transfers

- Each deadline adds two free transfers, capped at four.
- Net transfers compare player IDs in the previous and next squads.
- Transfers beyond the available free balance cost four points each.
- Pre-deadline revisions can be confirmed or cancelled.
- Wildcard makes that Gameweek's transfers free and preserves the accumulated
  free-transfer balance before adding the normal weekly allowance.
- League tie-breaking counts locked net transfers, excluding Wildcard weeks.

## Chips

The supported chips are Triple Captain, Bench Boost, and Wildcard. Each chip
may be used twice per season. Only one chip may be active in a Gameweek, and
the same chip may be used in consecutive Gameweeks when uses remain.

| Chip           | Effect                                                               |
| -------------- | -------------------------------------------------------------------- |
| Triple Captain | The scoring captain receives three times base points instead of two. |
| Bench Boost    | All 15 players count; automatic substitution is not applied.         |
| Wildcard       | Chargeable transfer points are zero for the Gameweek.                |

## Player scoring

Appearance points are 1 for playing fewer than 60 minutes and 2 for playing at
least 60 minutes. Zero minutes scores zero appearance points.

| Event                                | Goalkeeper | Defender | Midfielder | Forward |
| ------------------------------------ | ---------: | -------: | ---------: | ------: |
| Goal                                 |         10 |        6 |          5 |       4 |
| Assist                               |          3 |        3 |          3 |       3 |
| Clean sheet after 60+ minutes        |          4 |        4 |          1 |       0 |
| Every 3 saves                        |          1 |        0 |          0 |       0 |
| Penalty save                         |          5 |        5 |          5 |       5 |
| Penalty miss                         |         -2 |       -2 |         -2 |      -2 |
| Every 2 goals conceded while playing |         -1 |       -1 |          0 |       0 |
| Yellow card                          |         -1 |       -1 |         -1 |      -1 |
| Red card                             |         -3 |       -3 |         -3 |      -3 |
| Own goal                             |         -2 |       -2 |         -2 |      -2 |

Fantasy assists override source assists when a reviewed value exists. The game
intentionally excludes FPL bonus/BPS and Defensive Contributions.

## Automatic substitutions and captaincy

For a normal Gameweek, a starter with zero minutes may be replaced by the first
eligible bench player who played and leaves a valid formation. A goalkeeper
can only replace a goalkeeper; outfield replacements cannot be goalkeepers.
Each bench player can be used once.

If the captain records zero minutes, the vice-captain receives the captain
multiplier. If neither plays, no captain bonus is awarded. Bench Boost counts
the whole bench directly and therefore skips automatic substitution.

## Match corrections and standings

Fixtures are associated with the original competition matchweek. Corrected or
late player stats can be rescored, and the scoring service upserts player and
team derived totals for that same Fantasy Gameweek.

Classic standings sort by:

1. Total points, highest first.
2. Counted transfers, lowest first.
3. Team name, locale order.

The current application has Overall and Private Classic leagues. Seeded
opponents keep local standings populated during development. Cup
leagues, head-to-head scoring, and live price changes are not implemented.

## Accounts, Guests, and names

- A user may start as a device-bound Guest or authenticate with Email OTP or
  Google. There are no passwords.
- Guest and member sessions expire after 30 days and slide forward when the
  user returns. Losing a Guest session does not delete its manager, selections,
  scores, or standings.
- Every account owns one manager identity. The manager owns at most one team
  per Fantasy season.
- A new team joins every Overall league for that season with an empty opening
  draft. The Team screen presents 15 position-locked slots in a 4-4-2 starting
  shape plus one goalkeeper and three outfield bench slots. No player snapshot
  or transfer revision is stored until the manager saves a valid 15-player
  squad; the opening squad does not count as transfers.
- Guest manager and team names are random and cannot be edited. Member names
  may duplicate, are 3–30 characters, and accept Thai, English, digits, spaces,
  period, underscore, and hyphen after whitespace normalization and abuse/
  impersonation filtering.
- A member may change the manager name once every 30 days and the team name up
  to three times per season.
- Upgrading a Guest to a new member preserves the Guest manager/team. If the
  destination account already owns a team, that account team wins: the Guest
  manager becomes `abandoned`, stays in historical rankings, and is not merged.
