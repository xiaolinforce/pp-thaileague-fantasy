# UI review status

## Purpose

This is the working inventory for rendered UI review. It prevents an existing
but unreviewed screen from becoming design precedent merely because it is in
the repository.

`DESIGN.md` owns stable rules. `UI_PATTERNS.md` owns proven reusable patterns.
This file owns route maturity, state coverage, evidence, exclusions, and audit
priority.

## Maturity labels

| Status      | Meaning                                                                      |
| ----------- | ---------------------------------------------------------------------------- |
| Reference   | Product owner accepts it as a current quality bar; regressions still tested. |
| Reviewed    | Core tasks, states, languages, and responsive modes have rendered evidence.  |
| In progress | A bounded audit or supported refinement is underway.                         |
| Unreviewed  | Implemented, but its current composition is not design precedent.            |
| Blocked     | Review needs a real state, authority, or product decision not yet available. |

Reference and Reviewed describe evidence, not permanence. Change the status
when new behavior invalidates prior coverage.

## Current route inventory

| Route            | Archetype             | Status      | Current basis and next review focus                                                                                                                                   |
| ---------------- | --------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/team`          | Interactive workspace | Reference   | Refined baseline for hierarchy, responsive transformation, and local state.                                                                                           |
| `/points`        | Summary and detail    | Reference   | Refined baseline for primary result, comparison, detail, and empty state.                                                                                             |
| `/`              | Authentication flow   | Unreviewed  | Audit Guest, provider availability, Email OTP stages, errors, and compact flow.                                                                                       |
| `/upgrade`       | Authentication flow   | Unreviewed  | Audit preservation messaging, provider states, cancellation, and recovery.                                                                                            |
| `/fixtures`      | Data browser          | In progress | Focused Gameweek browsing implemented; empty, bilingual, and responsive states remain the next review focus.                                                          |
| `/leagues`       | Ranking/community     | In progress | Persisted Overall waiting/Top 100 states and responsive language modes reviewed; populated Top 100 and authenticated Private operations still need rendered evidence. |
| `/profile`       | Account identity      | In progress | Guest/read-only team identity and responsive states reviewed; member rename evidence remains pending.                                                                 |
| `/settings`      | Settings              | In progress | Guest device persistence and responsive language control reviewed; member reload evidence remains pending.                                                            |
| `/rules`         | Long-form reading     | Reviewed    | Public Thai/English content is derived from executable rules and reviewed on Desktop/Mobile.                                                                          |
| `/help`          | Long-form reading     | In progress | Simplified public support contacts and legal links; refreshed rendered evidence is pending.                                                                           |
| `/privacy`       | Long-form reading     | In progress | Public bilingual policy implemented from the shared reading pattern; operator identity and final legal review remain pending.                                         |
| `/terms`         | Long-form reading     | In progress | Public bilingual service terms implemented from the shared reading pattern; operator identity and final legal review remain pending.                                  |
| `/admin/fantasy` | Operational tool      | Unreviewed  | Audit authorized workflows, lifecycle safety, corrections, and dense data.                                                                                            |
| `/auth/complete` | System transition     | Unreviewed  | Audit waiting, failure/retry, redirect clarity, and assistive announcements.                                                                                          |

The Reference labels for Team and Points reflect the product owner's accepted
baseline and their use as the source for `UI_PATTERNS.md`. This documentation
change does not claim that every state has fresh screenshot evidence.

## Recommended audit order

### 2026-09-04 Sentry hydration follow-up

- `/team`, local development Guest with an empty GW1 squad: checked Chrome at
  1280px and 360px, Thai and English, hard reload, language persistence, and the
  expanded mobile Gameweek accordion. Both server-provided deadline labels
  displayed correctly; no application console errors or horizontal overflow
  were observed. Restored the original Thai preference and viewport afterward.
- Confirmed `format-detection` disables telephone, date, email and address
  rewriting. Team deadline formatting now runs on the server rather than
  independently during browser hydration. Countdown behavior is unchanged.
- This is a mitigation for Sentry `PP-THAILEAGUE-FANTASY-7`, not a confirmed
  reproduction of its six Production events. Physical iOS Safari/Facebook
  browsers, member language hydration, populated squads and other routes were
  not re-audited in this focused pass. Keep the issue open until the deployed
  release has been checked in the affected browsers.

### Remaining audit priorities

1. **Fixtures and Leagues:** establish data-browser and ranking patterns shared
   by the remaining competition surfaces.
2. **Account surfaces:** complete member-state evidence for Profile and
   Settings, then retain Rules and Help as the reviewed reading pattern.
3. **Onboarding, Upgrade, and auth completion:** establish the complete
   authentication journey and provider-unavailable behavior.
4. **Fantasy Admin:** review last because it is role-protected, state-dense, and
   requires safe operational fixtures.

Audit one archetype at a time. Apply a complete supported batch, then run one
confirmation pass before promoting a pattern or changing a route's status.

## Shared review matrix

Every route review covers the applicable cells below. Record an exclusion when
a state is not implemented rather than inventing it.

### Content and data

- default, sparse, dense, and empty content;
- long Thai and English names and labels;
- large ranks, points, counts, and negative values;
- missing optional club, player, fixture, or supporting values; and
- narrow containers without document-level horizontal overflow.

### Feedback and availability

- loading boundary;
- local pending state;
- success feedback;
- validation error with preserved input;
- server error and retry/recovery;
- disabled reason; and
- read-only or deadline-passed behavior.

### Language and viewport

- Thai and English after reload;
- Mobile at 360px and 767px;
- Tablet at 768px and 1279px;
- Desktop at 1280px and a representative wider viewport; and
- zoom/text growth where critical content or controls could clip.

### Interaction and accessibility

- keyboard reading and focus order;
- visible focus in white and navy contexts;
- accessible names for icons and compact controls;
- dialog, sheet, popover, select, toggle, tab, and accordion behavior;
- reduced motion; and
- color-independent status and risk cues.

## Route-specific state inventory

### Team

- untouched empty draft, partial local draft, and valid saved squad;
- chargeable-transfer boundary at -12 points and blocked-save warning beyond
  the limit while the local draft remains editable;
- live free-transfer balance, transfer deduction, opening unlimited transfers,
  and an active Wildcard that preserves the banked balance;
- editable and deadline-passed/read-only Gameweek;
- no change, unsaved change, invalid squad, pending save, success, and failure;
- auto-fill available, pending, complete, unavailable, and failed;
- swap source, valid target, invalid target, player removal, per-vacancy Undo,
  replacement-cleared Undo, and vacancy;
- captain, vice-captain, bench order, chip selection, Gameweek 1 Wildcard lock;
- market empty results, owned player, reselectable removed player, and tier
  over-limit explanation; and
- unsaved-navigation warning and recovery.

### Points

- canonical and corrected URL-backed Gameweek selection;
- no saved squad, scored squad, zero summary, and large/negative totals;
- provisional and final presentation where exposed by the read model;
- normal captain, vice-captain fallback, Triple Captain, and Bench Boost;
- automatic substitution in/out and counted/uncounted bench players;
- populated and empty per-category detail; and
- selector pending, first/last disabled arrows, loading, and server error.

### Onboarding and upgrade

- Guest start and Guest-to-member upgrade;
- Email and Google enabled/disabled combinations;
- Email choice, OTP request, Turnstile unavailable/incomplete, OTP sent,
  six-digit validation, verify pending, resend/back, and failure;
- Google redirect pending and provider failure; and
- existing destination account behavior where the implemented flow exposes it.

### Fixtures and leagues

- Gameweek with fixtures and no fixtures;
- long club names, missing kickoff or venue values where supported, finished
  and future fixtures;
- populated and empty player-stat filters;
- league absent, single league, multiple leagues, dense standings, ties, large
  totals, and provisional/final labels; and
- narrow table navigation without losing row identity.

### Profile, settings, rules, and help

- Guest read-only team name and upgrade action;
- member editable team name, unchanged form, duplicate/format validation,
  pending save, success, server error, and seasonal rename limit;
- member language setting and post-reload database persistence;
- public long rules content, section navigation, and support/legal links; and
- sign-out pending/failure behavior.

### Fantasy Admin

- authorized access only; never weaken the role boundary for review;
- planned, open, provisional, and final Gameweeks;
- lock/finalize unavailable, pending, success, and failure;
- match-stat entry and correction, Fantasy assists, classification changes,
  required reason, and audit context;
- sparse and dense player/fixture data; and
- destructive or consequential confirmation with affected-record identity.

## Safe evidence collection

Prefer existing local data, local-only fixtures, component props, browser
interception, or an isolated development-only state switch. Do not mutate
historical selections, weaken authentication, change Fantasy rules, or expose a
simulation path in production to obtain a screenshot.

Before adding temporary simulation scaffolding, record the exact files and
behavior. Remove it after verification and confirm with `git diff` and targeted
searches that no mock flag, fixture override, debug query, or simulated value
remains.

## Review record template

Add a dated entry under the route when a rendered pass is completed:

```text
Date:
Route and task:
Status before -> after:
Data/auth/Gameweek state:
Language:
Viewports:
Keyboard/accessibility coverage:
Issues fixed:
Known exclusions:
Evidence location:
Verification commands:
```

Do not promote a route to Reviewed or Reference without stating the exclusions.

## Current documentation and implementation debt

### 2026-09-02 — Completed-season resilience and shared UI hardening

- **Route and task:** `/team`, `/points`, `/fixtures`, and `/leagues`; keep the
  Fantasy product readable when no Gameweek remains open or planned, preserve
  production-like data while switching League QA overlays, remove compact Team
  overflow, and localize the shared dialog close control.
- **Status:** Team and Points remain Reference; Fixtures and Leagues remain In
  progress.
- **Data/auth/Gameweek state:** real signed-in QA team on the confirmed
  development Neon branch. Gameweek 30 was rendered once as provisional and
  once as final, with no open or planned Gameweek. League populated and empty
  overlays were applied transactionally and the original Gameweek 2 final
  baseline was restored. Verification retained 200 managers, 200 teams, 600
  selections, 9,000 selection players, 400 team scores, and 200 Overall
  standings.
- **Language:** Thai completed-season and deadline-passed states were rendered.
  The generated close control in an Overall dialog exposed `ปิด` in Thai and
  `Close` in English; the Guest display preference was restored to Thai.
- **Viewports/accessibility:** Team was measured at 360px, 767px, 768px,
  1279px, and 1280px with no document-level horizontal overflow. The compact
  Gameweek trigger exposes the written completed or closed state without
  requiring expansion. Every Team mutation control was disabled in the final
  Gameweek, and the shared icon-only dialog close control retained a localized
  accessible name.
- **Issues fixed:** a missing open/planned Gameweek no longer sends Team,
  Points, Fixtures, or Leagues to the error boundary; the latest provisional or
  final Gameweek is available read-only. New post-season identities do not
  receive retroactive selections. League QA overlays no longer delete managers
  or cascade through historical teams, selections, scores, or Overall
  standings. The compact Team card no longer uses viewport-width geometry that
  exceeded its document, and generated dialog close labels are supplied by the
  active language.
- **Known exclusions:** a brand-new post-season account with no historical
  selection was not created in the browser because that would require mutating
  authentication data; nullable-selection reads and lifecycle selection are
  covered by types and pure resolver tests. Accessibility evidence used the
  browser accessibility tree and DOM state rather than a separate screen
  reader session.
- **Evidence:** bounded in-app Browser inspection against the real local routes
  and development database. QA lifecycle and League overlays were removed by
  restoring `gw2-final`; no production debug or simulation route was added.
- **Verification:** Fantasy rules, Email, Auth, TypeScript, ESLint, production
  build, Fantasy database invariants, targeted Prettier checks for every changed
  file, and responsive Browser DOM measurements passed. The repo-wide Prettier
  check still reports the pre-existing `rules/page.tsx` and `rule-content.ts`
  formatting debt outside this change.

### 2026-09-02 — Compact Team workspace scroll restoration

- **Route and task:** `/team`; preserve a manager's separate document scroll
  positions while switching between Squad and Player Market on Mobile and
  Tablet.
- **Status:** remains Reference.
- **Data/auth/Gameweek state:** real signed-in Gameweek 3 squad. Both workspace
  views were switched and scrolled locally; no squad, transfer, chip, account,
  or database state was saved.
- **Language:** Thai source labels were rendered. No user-facing copy or
  localization behavior changed.
- **Viewports/accessibility:** exercised at 360px and 768px with the visible tab
  controls. Pointer activation restored two distinct saved positions exactly
  in each viewport. At 1280px the tabs remain hidden, the two-column workspace
  remains intact, and the document has no horizontal overflow.
- **Issues fixed:** each compact workspace now records its latest window scroll
  position and restores it after the selected workspace has laid out. Compact
  workspace scroll anchoring is disabled so browser anchoring cannot offset the
  requested restoration when the two views have different heights.
- **Known exclusions:** positions live only for the mounted `/team` page and
  intentionally reset after navigation or reload. English was not toggled on
  the signed-in account because the change introduces no copy.
- **Evidence:** bounded in-app Browser interaction and DOM measurements against
  the real local `/team` route; no fixture override, simulation path, or
  database write was introduced.
- **Verification:** `npm run test:rules`, `npm run test:email`, `npm run types`,
  `npm run lint`, `npm run format:check`, and `npm run build`.

### 2026-09-01 — Sticky compact Team workspace tabs

- **Route and task:** `/team`; keep the Squad and Player Market workspace
  controls reachable after a manager scrolls past their original position on
  Mobile and Tablet.
- **Status:** remains Reference.
- **Data/auth/Gameweek state:** real signed-in Gameweek 2 squad. The Squad and
  Player Market views were switched locally; no squad, transfer, chip, account,
  or database state was saved.
- **Language:** Thai source labels were rendered. The existing English
  translations and localization path are unchanged; no new user-facing copy
  was introduced.
- **Viewports/accessibility:** rendered at 360px and 768px, with DOM checks at
  767px, 1279px, and 1280px. In compact modes the tabs remain exactly below the
  66px Top bar while scrolling, retain their selected state, and keep a visible
  keyboard focus outline. At 1280px the tabs remain hidden and the Desktop
  workspace is unchanged.
- **Issues fixed:** the compact workspace tabs now use their Tabs root as the
  sticky containing element, avoiding the self-bounded behavior of applying
  sticky positioning to the nested tab list. The sticky surface uses the page
  canvas color so scrolled content does not show through behind it.
- **Known exclusions:** no deadline-passed state was manufactured because the
  navigation control is independent of editability. English was not toggled on
  the signed-in account to avoid changing its persisted preference for a
  copy-neutral layout change.
- **Evidence:** bounded in-app Browser screenshots and DOM measurements against
  the real local `/team` route; no fixture override, simulation path, or
  database write was introduced.
- **Verification:** `npm run test:rules`, `npm run test:email`, `npm run
test:auth`, `npm run types`, `npm run lint`, `npm run format:check`, and `npm
run build`.

### 2026-09-01 — Per-vacancy player-removal Undo

- **Route and task:** `/team`; let a manager reverse an accidental player
  removal from an individual vacant squad slot.
- **Status:** remains Reference.
- **Data/auth/Gameweek state:** real Guest session with an editable, saved
  Gameweek 2 squad. Removal was exercised from the pitch, Player Market, and
  player-detail dialog. Two simultaneous vacancies retained independent Undo
  actions. Undo restored an immediately removed captain, followed a vacancy
  moved from the starting lineup to the bench, and disappeared when the
  vacancy was filled by a replacement. No selection was saved.
- **Language:** Thai and English accessible names and tooltips were rendered.
  The Guest display preference was restored to Thai after review.
- **Viewports/accessibility:** default 1280px Desktop and 360px Mobile. The
  icon-only Undo control has a player-specific accessible name and sits to the
  right of Swap on the same horizontal line. On Mobile the action bounds shared
  the same top coordinate, and the 352px document fit within the 360px viewport
  without horizontal overflow.
- **Issues fixed:** removal history is local and keyed by vacancy. It survives
  lineup swaps, preserves later lineup and captaincy edits, restores captain or
  vice-captain only when the role remains free, and is pruned when a replacement
  fills the vacancy or the removed player returns elsewhere.
- **Known exclusions:** deadline-passed/read-only rendering was not manufactured
  in the real session; the existing disabled-action contract applies to Undo.
  Restoration and pruning edge cases are covered by pure draft tests.
- **Evidence:** bounded in-app Browser DOM inspection against the real Guest
  session; no mock, fixture override, debug path, or database write was used.
- **Verification:** `npm run test:rules`, `npm run test:email`, `npm run types`,
  `npm run lint`, `npm run format:check`, and `npm run build`.

### 2026-09-01 — Chargeable-transfer confirmation cap

- **Route and task:** `/team`; cap a manager at three transfers beyond the free
  allowance, while preserving an editable over-limit draft and its actual
  hypothetical deduction.
- **Status:** remains Reference.
- **Data/auth/Gameweek state:** real Guest session with a valid saved Gameweek
  2 squad and four free transfers. Eight valid local replacements progressed
  through 4, 3, 2, 1, and 0 free transfers, then -4, -8, -12, and -16 points.
  At -12 the warning was absent and Save Team remained enabled. At -16 the
  standard squad-validation alert appeared and Save Team was disabled. Enabling
  Wildcard removed the warning, showed the unlimited state, and re-enabled Save
  Team. No selection was saved.
- **Language:** the boundary, badge, warning, and disabled control were rendered
  in Thai and English. The Guest display preference was restored to Thai after
  review.
- **Viewports/accessibility:** default 1280px Desktop and 360px Mobile. The
  warning remained a visible `role="alert"`, the disabled Save Team state was
  exposed semantically, and the Mobile document measured 352px wide within a
  360px viewport without horizontal overflow. The red -16 badge retained
  11px, weight 400 text, so the deduction is not bold.
- **Issues fixed:** client and server now share the same transfer baseline and
  paid-transfer calculation. The first complete saved squad establishes the
  baseline for later revisions, while direct Server Action and Gameweek-lock
  paths enforce the cap independently of client state.
- **Known exclusions:** the real session was Gameweek 2 with an existing complete
  baseline. Gameweek 1 and first-complete-squad exemptions are covered by pure
  rules tests rather than manufactured live data.
- **Evidence:** bounded in-app Browser DOM and screenshot inspection against the
  real Guest session; all over-limit changes remained local and no selection
  write, mock, fixture override, or debug path was used.
- **Verification:** `npm run test:rules`, `npm run types`, `npm run lint`,
  `npm run format:check`, and `npm run build`.

### 2026-09-01 — Live transfer preview

- **Route and task:** `/team`; make the Player Market's free-transfer figure
  reflect the current net squad change before a manager saves.
- **Status:** remains Reference.
- **Data/auth/Gameweek state:** real Guest session with a valid saved Gameweek
  2 squad and four available transfers. Removing one goalkeeper in the local
  draft immediately changed the displayed balance from 4 to 3 and showed one
  net transfer with no deduction. Selecting Wildcard locally showed unlimited
  transfers and its written preservation/deduction explanation. No selection
  was saved or otherwise mutated during review.
- **Language:** Thai source copy was rendered. The matching English dictionary
  entries cover the remaining balance, opening unlimited state, Wildcard, and
  deduction preview; the Guest display preference was restored to Thai after
  the bounded settings check.
- **Viewports/accessibility:** default Desktop and 360px Mobile market views;
  the Mobile document width and scroll width both measured 345px. The preview
  is a written `status` update, so its meaning does not depend on color.
- **Issues fixed:** the label now means the actual remaining free transfers,
  counts net differences from the Gameweek baseline across saved revisions,
  and states the prospective deduction before confirmation.
- **Known exclusions:** the Gameweek 1 opening state was not manufactured in the
  real session; rules tests cover the opening Gameweek behavior. The later
  chargeable-transfer-cap review above supplies rendered overage evidence.
- **Evidence:** bounded in-app Browser DOM and screenshot inspection; no mock,
  fixture override, debug path, or database write was introduced.
- **Verification:** `npm run test:rules`, `npm run types`, `npm run lint`,
  `npm run format:check`, and `npm run build`.

### 2026-09-01 — Persisted Overall Top 100

- **Route and task:** `/leagues`; replace request-time Overall aggregation and
  pagination with persisted current ranks and a single Top 100 dialog.
- **Status:** remains In progress.
- **Data/auth/Gameweek state:** confirmed development Neon branch, 22 Overall
  members, open Gameweek 1, and no provisional/final scoring state. The backfill
  correctly produced no rank rows, so the real reachable state is “รออัปเดตอันดับ”.
- **Language:** Thai source copy and English dictionary cover the waiting card,
  Top 100 title, and no-updated-rank dialog state; both modes were rendered and
  the Guest device preference was restored to Thai after review.
- **Viewports/accessibility:** default Desktop and 360×800 Mobile; the dialog
  remains constrained on Desktop, becomes a full-height Mobile surface, keeps a
  named close control and status message, and produces no document overflow.
- **Issues fixed:** Overall overview/detail reads no longer aggregate or sort all
  season scores. The card reads the current team's stored row, the dialog reads
  only indexed ranks 1–100, pagination is removed from Overall, and the own-rank
  badge/callout remains outside the dialog. Private League pagination is unchanged.
- **Known exclusions:** a populated Top 100, a current team below rank 100, and
  provisional/final rank refresh were not rendered because Gameweek 1 is still
  open and no scoring or account data was manufactured.
- **Evidence:** bounded in-app Browser DOM and screenshot inspection of the real
  waiting card and empty Top 100 dialog in Thai/English; the URL remained
  `/leagues` while opening the dialog and no page-level pagination was present.
- **Verification:** rule tests, schema generation/migration, League backfill,
  Fantasy database invariants, and responsive Browser measurements.

### 2026-09-01 — Team name as the sole public identity

- **Route and task:** shared shell, `/profile`, and `/leagues`; remove the
  redundant manager display name and use the season team name everywhere the
  Fantasy identity is public.
- **Status:** Profile and Leagues remain In progress; this pass adds complete
  Guest/read-only identity evidence without claiming member mutation coverage.
- **Data/auth/Gameweek state:** real Guest session on the confirmed Neon branch,
  22 preserved manager/team histories, 22 unique seasonal team names, automatic
  Overall membership, and an open Gameweek 1. No account, selection, or score
  fixture was manufactured.
- **Language:** Thai and English after changing the real Guest device
  preference, restored to Thai after review. User-provided team names remain
  outside dictionary replacement.
- **Viewports:** 1440px Desktop, 768px Tablet, and 360px Mobile; Profile, shell,
  drawer, account popover, and Overall standings had no document-level overflow.
- **Keyboard/accessibility:** semantic Profile regions, read-only Guest state,
  named shell/drawer controls, team-only row headers, written current-team badge,
  and translated standings-dialog labels reviewed.
- **Issues fixed:** duplicate public manager/team names, manager cooldown state,
  repeated Guest identity in the account popover, manager names in standings,
  and a portal localization gap that left the standings dialog in Thai while
  the rest of the route displayed English.
- **Known exclusions:** member rename success, duplicate-name rejection,
  exhausted three-change limit, and server/network error UI were not rendered
  because the available Browser identity is a Guest and no production mock or
  database mutation was introduced for visual evidence. Server validation, the
  case-insensitive unique database index, transaction locking, and database
  verification cover these paths pending member evidence.
- **Evidence:** bounded in-app Browser inspection during the 2026-09-01
  implementation task; no mock, fixture override, or simulation route was added.
- **Verification:** migration `0012_thick_silver_fox` on the confirmed Neon
  branch, `npm run db:verify:fantasy`, Thai/English DOM snapshots, responsive
  overflow measurements, and the complete project checks listed in the final
  implementation handoff.

### 2026-09-01 — Fixtures-only data browser

- **Route and task:** `/fixtures`; remove the player-statistics workspace and
  make fixtures the route's only task, with the shared navigation label reduced
  to Fixtures/โปรแกรม.
- **Status:** In progress → In progress.
- **Data/auth/Gameweek state:** real Guest session and imported development
  fixtures; Gameweek 2 rendered eight fixtures with no simulated state.
- **Language:** Thai and English after changing and restoring the persisted
  Guest preference.
- **Viewports:** default Desktop and 360px Mobile rendered without
  document-level horizontal overflow.
- **Keyboard/accessibility:** the semantic page heading, shared Gameweek
  selector, named navigation links, fixture articles, and club-colour labels
  remain present; the removed tab interface leaves no unreachable controls.
- **Issues fixed:** the Stats route-within-a-route, player filters, rankings,
  source panels, and Stats unlock state were removed. `/fixtures` now sends only
  fixture, matchweek, and current-Gameweek fields into its Client Component.
  Desktop sidebar and compact drawer both use the single Fixtures/โปรแกรม label.
- **Known exclusions:** the existing no-fixture empty state was not manufactured
  for evidence; it remains implemented for naturally empty Gameweeks.
- **Evidence:** bounded in-app Browser inspection against the real development
  database; DOM checks found no Stats text or tab roles, both inspected widths
  matched their document widths, and the console reported no warnings or errors.
- **Verification:** `npm run test:rules`, `npm run test:email`, `npm run types`,
  `npm run lint`, `npm run format:check`, and `npm run build`.

### 2026-09-01 — Fixtures current-Gameweek browsing

- **Route and task:** `/fixtures`; start fixture browsing at the current
  Gameweek and keep previous/next selection local to the page instead of
  navigating with a `week` query parameter.
- **Status:** In progress → In progress.
- **Data/auth/Gameweek state:** real Guest session and imported development
  fixtures; the open current Gameweek was GW1, with eight fixtures rendered in
  each inspected Gameweek.
- **Language:** English rendered in the persisted Guest preference. No source
  copy or translation entry changed; the existing Thai coverage remains
  applicable to the unchanged selector labels and fixture content.
- **Viewports:** default Desktop and 360px Mobile rendered. The selector and
  fixture list retained their existing responsive composition, and the Mobile
  document width matched its client width without horizontal overflow.
- **Keyboard/accessibility:** the shared selector retained named previous/next
  buttons, its disabled first-Gameweek state, and the written current Gameweek.
- **Issues fixed:** `/fixtures` now defaults to `currentGameweek`, falls back to
  the first imported matchweek when necessary, and changes Gameweeks entirely
  in Client Component state. Repeated previous/next interactions left the URL
  at `/fixtures`, updated the fixture rows immediately, and produced no new
  request in the development server log.
- **Known exclusions:** a missing current Gameweek and a Gameweek with no
  fixtures were not manufactured for rendered evidence; the implemented
  fallback and existing empty state cover those paths pending natural data.
- **Evidence:** bounded in-app Browser inspection against an isolated clean
  development copy using the real development database; no mock, simulation
  route, or production behavior was added.
- **Verification:** `npm run test:rules`, `npm run test:email`, `npm run types`,
  `npm run lint`, production build, targeted Prettier check, Desktop/Mobile DOM
  inspection, URL observation, and development-server request logs.

### 2026-08-31 — Fixtures and player statistics

- **Route and task:** `/fixtures`; remove simulated statistics and kickoff
  values, separate official football facts from Fantasy-derived points, and
  harden the responsive data browser.
- **Status:** Unreviewed → In progress.
- **Data/auth/Gameweek state:** real Guest session, 240 imported fixtures, 24
  official TBC kickoffs, 494 registered players, and the real preseason state
  of zero official/Fantasy player-stat rows.
- **Language:** Thai and English after changing the persisted Profile setting.
- **Viewports:** default desktop and 360px mobile rendered; URL-backed Fantasy
  and match-stat tabs and the current-season empty states were verified.
- **Keyboard/accessibility:** semantic tabs, source note, status message,
  headings, named controls, and language selection by radio control reviewed.
- **Issues fixed:** hard-coded leader values, zero-value pseudo-ranking,
  incorrect form denominator, local-only filter state, mobile horizontal stats
  rows, missing source/provenance copy, simulated TBC kickoff overrides,
  duplicated page framing/season label, and a prematurely reachable Stats tab.
  The Stats tab now stays disabled until the actual current Gameweek is beyond
  Gameweek 1; mobile fixture rows put the kickoff time beside two stacked team
  names. The Fixtures/Stats tabs are centered and separated from the Gameweek
  panel at every supported width instead of overlapping its border. On compact
  screens, a kickoff is vertically centered beside the two clubs and each club
  retains its color marker; the Tablet fixture list now fits without a
  horizontal scrollbar.
- **Known exclusions:** populated official and Fantasy tables, ties, dense
  filters, and large values were not rendered because neither live dataset has
  begun and no production mock path was added. Pure rules cover form, DNP,
  source identity matching, and transferred-player aggregation pending live
  populated evidence.
- **Evidence:** bounded in-app Browser inspection in the 2026-08-31
  implementation task; no mock or simulation route was added.
- **Verification:** `npm run test:rules`, `npm run types`,
  `npm run db:verify:competition`, `npm run db:verify:player-stats`, official
  importer preview, Thai/English DOM snapshots, and desktop/mobile screenshots.

### 2026-08-31 — League overview and Overall detail

- **Route and task:** `/leagues` and `/leagues/[leagueId]`; replace demo
  standings with real Overall/Private League UI and owner/member controls.
- **Status:** Unreviewed → In progress.
- **Data/auth/Gameweek state:** real Guest session, automatic Overall membership,
  22 real/historical Guest teams, provisional Gameweek 1, and no Private League.
- **Language:** Thai and English after changing the persisted Profile setting.
- **Viewports:** 360, 767, 768, 1279, 1280, and 1440px; no document or standings
  overflow after the responsive table correction.
- **Keyboard/accessibility:** semantic headings/table/row headers, skip link,
  mobile drawer keyboard/pointer operation, written status, named compact
  controls, dialog primitives, and reduced-motion rule reviewed.
- **Issues fixed:** guest/private hierarchy, real empty state, English coverage
  inside Client Components, user-name localization escape, 768/1280 table
  clipping, mobile metric visibility, and provisional-score explanation.
  The overview now leads with a rank-only Overall card labelled “อันดับทั้งหมด”
  / “Overall ranking” with a 32px rank; both Overall and Private League list
  entries open a focused standings dialog instead of navigating away. The
  Overall dialog now limits its table to rank, team identity, and total, plus
  a later persisted Top 100 contract without pagination. The Private section
  retains a concise bilingual empty
  message without adding a second empty-state action. Create/Join dialogs use a
  clean footer, orange labels, and field-level errors; invalid league names can
  be submitted for validation without disabling the primary action. The empty
  Private League message is a full-width centered surface, while member Join
  and Create actions form equal-width touch targets beneath the section heading
  on Mobile and Tablet. Product dialogs and confirmation dialogs become
  edge-to-edge, safe-area-aware full-screen surfaces on Mobile; Tablet and
  Desktop retain the constrained modal layout. The Mobile flow keeps form
  controls at their intrinsic touch height with actions anchored below the
  task, while standings reserve every remaining viewport row for the scrollable
  table. Create, Join, Overall, and player-detail dialogs were rechecked after
  the shared layout correction.
- **Known exclusions:** successful create, preview/join, rename, invite rotate,
  remove, leave, delete, 100-member pagination, server mutation errors, and
  final-score UI were not rendered to avoid mutating the signed-in development
  account or manufacturing data. Server authorization, transaction limits,
  database invariants, TypeScript, lint, and rule tests cover the implementation
  pending that evidence.
- **Evidence:** bounded in-app Browser captures for Guest/responsive states and
  signed-in Chrome captures for the non-mutating create-validation state in the
  2026-08-31 implementation task; no mock or simulation route was added.
- **Verification:** `npm run test:rules`, `npm run types`, `npm run lint`,
  `npm run db:verify:fantasy`, responsive Browser measurements, Thai/English
  rendered snapshots. The rank dialog, disabled-first-Gameweek Stats tab, and
  stacked mobile fixtures were rechecked in the in-app Browser. Mobile dialog
  evidence covers 320px and 767px, with constrained modal regression checks at
  768px and 1280px.

### 2026-08-31 — Account surfaces and public guidance

- **Route and task:** `/profile`, `/settings`, `/rules`, and `/help`; separate
  identity, preference, rules, and support tasks behind one manager menu and
  remove the floating development language control.
- **Status:** Profile/Settings Unreviewed → In progress; Rules/Help Unreviewed →
  Reviewed.
- **Data/auth/Gameweek state:** real Guest session and persisted Guest manager,
  team, and Overall membership; member actions were reviewed against fresh
  locked database state without manufacturing a member UI fixture.
- **Language:** Thai and English, including Guest device persistence and return
  to Thai after review. Member preference is database-backed by a forward
  migration and Server Action.
- **Viewports:** 1440px Desktop, 768px Tablet, and 360px Mobile rendered; no
  document-level horizontal overflow on Profile, Settings, or Rules.
- **Keyboard/accessibility:** one semantic manager-menu trigger, Desktop
  popover shared by Desktop, Tablet, and Mobile, native language radios,
  headings, regions, contents navigation, accordion FAQ, focus treatment, and
  written persistence status reviewed.
- **Issues fixed:** unrelated hash-linked Profile sections, duplicate language
  controls, simulated notification/crest controls, duplicated rule constants,
  missing public help path, Guest edit affordances, non-atomic name writes, and
  the visually inconsistent inline manager menu at Tablet/Mobile widths. The
  compact drawer now keeps the manager trigger at full width so its Desktop
  popover has a stable, readable anchor at every compact breakpoint.
- **Known exclusions:** member rename success/error/rate-limit UI, member
  language reload, and sign-out failure were not rendered because the available
  Browser identity is a Guest and no production mock path was added.
- **Evidence:** Desktop and Mobile in-app Browser captures under the task's
  `profile-build` evidence directory; no mock, fixture override, or demo route
  was added.
- **Verification:** `npm run test:auth`, `npm run test:rules`, `npm run
test:email`, `npm run types`, `npm run lint`, `npm run format:check`, `npm run
build`, migration on the confirmed Neon development branch, responsive DOM
  and overflow inspection.

### 2026-09-01 — Simplified account surfaces and manager trigger

- **Route and task:** shared shell, `/profile`, `/settings`, `/upgrade`, and
  `/rules`; simplify account tasks into focused cards, reduce page-header copy,
  and pair the team name with a person icon in the manager trigger.
- **Status:** Profile and Settings remain In progress, Rules remains Reviewed,
  and Upgrade remains Unreviewed pending a rendered Guest/provider pass.
- **Data/auth state:** the available development session resolved as a member.
  Client-side invalid-name feedback was exercised without submitting a rename;
  the language preference was changed for bilingual review and restored to Thai.
- **Language:** Thai and English rendered on Profile, Settings, the manager
  drawer, and Rules. Team names and private email values remained outside
  dictionary replacement.
- **Viewports/accessibility:** 1440px Desktop, 1279px and 768px Tablet, and
  360px Mobile; no document-level horizontal overflow. Headings, labelled
  regions/forms, native language radios, invalid-field association, live
  feedback, disabled actions, keyboard focus, and the person icon in both the
  sidebar and drawer were inspected.
- **Issues fixed:** redundant page descriptions and account badges, nested
  Profile groupings, pre-submit-only browser validation, stale rename-count
  context after save, the avatar/manager-label treatment, the Upgrade split
  hero, and the visible Rules contents label. A legacy compact selector that
  hid the new person icon in the drawer was found and corrected during the
  bounded review.
- **Known exclusions:** the Guest-only Profile upgrade card and Upgrade provider
  choices could not be rendered because `/upgrade` redirects the available
  member session to Profile. Successful/duplicate/exhausted rename states were
  not submitted to avoid consuming or mutating real team-name state. Provider
  availability and Server Action behavior remain covered by implementation,
  types, and production build pending natural Guest evidence.
- **Evidence:** bounded in-app Browser DOM, responsive measurement, interaction,
  and screenshot inspection; no mock route, fixture override, debug flag, or
  simulation code was introduced.
- **Verification:** complete project checks: `npm run test:rules`,
  `npm run test:email`, `npm run test:auth`, `npm run types`, `npm run lint`,
  `npm run format:check`, and `npm run build`.

### 2026-09-02 — Rules reading-density refinement

- **Route and task:** `/rules`; remove the doubled top spacing before the first
  Rules section while preserving the card's reading inset and every subsequent
  section rhythm.
- **Evidence:** in-app Browser computed-style inspection at 1440px and 360px.
  The first heading now starts 28px from the card edge on Desktop and 20px on
  Mobile, with no document-level horizontal overflow.
- **Verification:** layout detector returned no findings; formatting, lint,
  types, and production build checks follow this refinement.

### 2026-09-02 — Rules scope refinement

- **Route and task:** `/rules`; remove the Postponed Matches & Rankings topic
  from both the contents navigation and the rendered reading flow without
  changing the shared executable rules.
- **Evidence:** in-app Browser rendered Thai and English at 1440px, plus Thai
  at 360px. Both the contents list and article now contain five matching
  sections, with no document-level horizontal overflow. The persisted language
  preference was restored to Thai after review.
- **Verification:** formatting, lint, types, and production build checks follow
  this refinement.

### 2026-09-02 — Account copy and Guest league refinement

- **Route and task:** `/profile`, `/settings`, `/leagues`, and `/rules`; make
  account cards consistent in width, simplify language labels, refine rename
  guidance, and reduce Guest and rules surfaces to their essential actions.
- **Data/auth state:** the available development session resolved as a member.
  No fixture, mock route, or account-state override was introduced.
- **Language and responsive evidence:** Thai and English were rendered and the
  persisted setting was restored to Thai. At 360px, the language labels remain
  readable and Profile has no document-level horizontal overflow. Desktop
  computed widths confirm both Profile and Settings cards are 760px; the rename
  helper is 12px with the same 12px inset as the text input.
- **Accessibility:** native labelled language radios remain intact; Settings
  removes only the redundant persistence copy. Profile retains labelled regions
  and the team-name help association.
- **Issues fixed:** language labels now show only `ไทย` and `English`; the
  redundant Settings persistence copy and Rules source card are removed. Guest
  messaging now explains account benefits, and the Guest Private League state
  no longer presents a duplicate sign-up button.
- **Known exclusions:** Guest-only Profile and Private League states could not
  be rendered with the available member session; their conditional copy and
  action removal were source-reviewed. Name-save success, duplicate, and limit
  states were not submitted to avoid mutating the real team-name state.
- **Verification:** in-app Browser DOM and computed-style inspection at Desktop
  and 360px; Thai/English rendered checks; followed by project type, lint,
  formatting, and production-build checks.

### 2026-09-03 — Auto-fill rule explanation

- **Route and task:** `/rules`; document the tier-first auto-fill behavior,
  likely first-choice goalkeeper preference, foreign-player target, and removal
  of projected points and overall rank from selection.
- **Language and responsive evidence:** Thai and English rendered in the in-app
  Browser at the normal Desktop viewport and 360px Mobile. The additional list
  item wraps within the existing reading card without clipping; measured
  document width equals client width at both sizes. The Guest preference was
  restored to Thai after review.
- **Accessibility:** the explanation remains a semantic list item under Squad
  selection with no new control, focus target, or color-dependent meaning.
- **Known exclusions:** no authenticated member preference or altered Fantasy
  lifecycle state was required because the rule content is shared and static.
- **Verification:** targeted responsive rendered inspection in Thai and
  English, followed by Fantasy tests, types, lint, formatting, and production
  build checks.

### 2026-09-03 — Auto-fill captaincy priority explanation

- **Route and task:** `/rules`; document that auto-fill preserves valid
  captaincy, fills only a missing role, and orders candidates by tier before
  forward, midfielder, defender, and goalkeeper preference.
- **Language and responsive evidence:** Thai and English rendered in the in-app
  Browser at the normal Desktop viewport and 360px Mobile. The additional
  sentence wraps inside the existing Squad selection card without clipping;
  Mobile document and client widths both measured 345px. The Guest preference
  and viewport were restored to Thai and Desktop after review.
- **Accessibility:** the explanation remains a semantic list item with no new
  control, focus target, or color-dependent meaning.
- **Known exclusions:** no authenticated member preference or Fantasy data
  mutation was required because the rule content is shared and static.
- **Verification:** targeted Thai/English responsive inspection, Fantasy and
  auth/email tests, types, lint, and production build passed. Repository-wide
  formatting remains blocked by pre-existing style drift outside this change;
  every file changed for this task passes targeted Prettier checks.

### 2026-09-03 — Auto-fill strongest-lineup explanation

- **Route and task:** `/rules`; explain that auto-fill rebuilds a valid starting
  eleven from all 15 selected players with better tiers first and orders the
  three outfield substitutes by the same rule.
- **Language and responsive evidence:** Thai and English rendered in the in-app
  Browser at the normal Desktop viewport and 360px Mobile. The expanded
  auto-fill list item remains contained in the Squad selection card; Mobile
  document and client widths both measured 345px. The Guest preference and
  viewport were restored to Thai and Desktop after review.
- **Accessibility:** the updated explanation remains one semantic list item
  with no new control, focus target, or color-dependent meaning.
- **Known exclusions:** the Auto-fill action was not submitted in the browser
  because that would replace the current unsaved draft; its complete-squad
  lineup behavior is covered by deterministic rule tests instead.
- **Verification:** responsive Thai/English rendered inspection, all Fantasy
  tests, auth/email tests, types, lint, and production build passed. The seven
  files changed for this task pass targeted Prettier checks; repository-wide
  formatting still reports the existing 168-file baseline drift.

### 2026-09-03 — Auto-fill vacancy-only explanation

- **Route and task:** `/rules`; replace the superseded strongest-lineup copy
  with the rule that Auto-fill preserves the current formation, starter and
  substitute roles, and bench order while filling only vacant slots.
- **Language and responsive evidence:** Thai and English rendered in the in-app
  Browser at the normal Desktop viewport and 360px Mobile. Both versions remain
  contained in the Squad selection card; Mobile document and client widths
  both measured 345px. The Guest preference and viewport were restored to Thai
  and Desktop after review.
- **Accessibility:** the formation guarantee is a separate semantic list item,
  with no new control, focus target, or color-dependent meaning.
- **Known exclusions:** the Auto-fill action was not submitted in the browser
  because that would modify the current unsaved draft. Deterministic Fantasy
  tests verify that every slot retains its lineup role and bench order.
- **Verification:** responsive Thai/English rendered inspection, all Fantasy,
  auth, and email tests, types, and production build passed. Targeted Prettier
  checks pass for every changed file. Repository-wide lint is blocked by the
  pre-existing `react-hooks/set-state-in-effect` error in
  `src/app/team/transfers-client.tsx`; repository-wide formatting reports the
  existing baseline drift outside this change.

### 2026-09-03 — Auto-fill quality-band explanation

- **Route and task:** `/rules`; explain that projected points and overall rank
  apply only after tier balance, likely first-choice goalkeeper, and foreign
  player priorities tie, restricting randomness to the best feasible quality
  band within the same position and Level.
- **Language and responsive evidence:** Thai and English rendered in the in-app
  Browser at 1280px Desktop and 360px Mobile. The longer explanation remains
  contained in the Squad selection card; document and client widths both
  measured 1265px on Desktop and 345px on Mobile. The Guest preference was
  restored to Thai after review.
- **Accessibility:** the quality-band rule is a separate semantic list item and
  preserves the existing heading, list, reading, and focus structure without
  introducing color-dependent meaning or a new control.
- **Known exclusions:** the Auto-fill action was not submitted because it would
  modify the current unsaved draft. Deterministic rule tests cover quality-band
  selection, fallback, foreign-player precedence, captaincy, and repeatable
  randomness without database or simulation writes.
- **Verification:** targeted Thai/English responsive rendered inspection, all
  92 Fantasy tests, auth/email tests, types, and production build passed.
  Targeted Prettier checks pass for every changed file. Repository-wide lint
  remains blocked by the pre-existing `react-hooks/set-state-in-effect` error
  in `src/app/team/transfers-client.tsx`; repository-wide formatting reports
  the existing 177-file baseline drift outside this change.

### 2026-09-03 — Twelve-player cumulative tier quota

- **Route and task:** `/team` and `/rules`; change the 2026/27 nominal tier
  allocation to 3/3/6/3, let Levels 1–3 total twelve players, align Auto-fill,
  and expand the Team quota meter from nine to twelve dots.
- **Language and responsive evidence:** Thai and English rule copy rendered
  with nominal limits 3/3/6/3 and cumulative limits 3/6/12/15. The Team quota
  meter and popover rendered in both languages at 360px Mobile and 1280px
  Desktop. DOM measurements at 360, 767/768, and 1279/1280px showed twelve
  dots with document width equal to client width and no horizontal overflow.
  The Guest preference and viewport were restored to Thai and the default
  viewport after review.
- **Accessibility:** the twelve-dot meter remains decorative behind the
  existing written live-region summary. The focusable help control retains its
  accessible name, and the popover states the 3, 6, and 12 cumulative limits
  without relying on color.
- **Known exclusions:** Auto-fill and a thirteen-player over-limit draft were
  not submitted in the browser because either action would modify the current
  draft. Deterministic Fantasy tests cover the exact 3/3/6/3 Auto-fill result,
  acceptance at twelve players, and rejection at thirteen.
- **Verification:** all 94 Fantasy tests, Email tests, types, targeted Prettier,
  production build, and development Fantasy database verification passed. No
  browser console error or Next.js error overlay appeared. Repository-wide
  lint remains blocked by the pre-existing `react-hooks/set-state-in-effect`
  error in `src/app/team/transfers-client.tsx` outside this task's diff.
  Repository-wide formatting reports the existing 175-file baseline drift;
  every file changed for this task passes targeted Prettier checks.

### 2026-09-03 — Six-dot Level 3 quota group

- **Route and task:** `/team`; retain the 3/3/6 quota structure visually by
  separating the first two three-dot groups and presenting the final six dots
  as one uninterrupted group.
- **Language and responsive evidence:** verified the complete twelve-dot meter
  in Thai at 360px Mobile and 1280px Desktop, plus English at 360px Mobile. The
  final six dots use the standard 5px spacing throughout, while the larger
  13px visual separation remains only after dots 3 and 6. Neither viewport
  introduced horizontal overflow.
- **Accessibility:** the change is presentation-only. The existing written
  live-region summary and focusable quota explanation remain unchanged.
- **Verification:** all 94 Fantasy tests, Email tests, types, targeted Prettier,
  and the production build passed with no browser console error. Repository-wide
  lint retains the pre-existing `react-hooks/set-state-in-effect` error in
  `src/app/team/transfers-client.tsx`; repository-wide formatting retains its
  existing baseline drift outside this change.

- `src/app/globals.css` currently contains foundations, shared multi-page
  styles, route-local sections, responsive rules, legacy selectors, and final
  cascade overrides in one file. Do not perform a speculative bulk split.
  Extract styles only alongside a proven component or route-pattern boundary.
- Existing shared classes on an Unreviewed route prove code reuse, not design
  quality.
- `PageHeader` currently provides semantic page identity and optional actions;
  visible hierarchy must be assessed within each route rather than assumed from
  the component name.
- The current localization system is recursive client-side replacement. Every
  review must verify the rendered English result instead of assuming dictionary
  coverage.

## Initial exclusions

This documentation baseline does not include a fresh rendered audit of the
Unreviewed routes, new screenshots, database mutations, or UI code changes. It
establishes the contract and inventory required for those bounded audits.
