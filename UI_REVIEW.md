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

| Route            | Archetype             | Status      | Current basis and next review focus                                                                                               |
| ---------------- | --------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `/team`          | Interactive workspace | Reference   | Refined baseline for hierarchy, responsive transformation, and local state.                                                       |
| `/points`        | Summary and detail    | Reference   | Refined baseline for primary result, comparison, detail, and empty state.                                                         |
| `/`              | Authentication flow   | Unreviewed  | Audit Guest, provider availability, Email OTP stages, errors, and compact flow.                                                   |
| `/upgrade`       | Authentication flow   | Unreviewed  | Audit preservation messaging, provider states, cancellation, and recovery.                                                        |
| `/fixtures`      | Data browser          | In progress | Local Gameweek browsing and URL-backed stat/filter states implemented; populated-season evidence remains pending upstream data.   |
| `/leagues`       | Ranking/community     | In progress | Overall/Guest and responsive language modes reviewed; authenticated Private operations still need rendered owner/member evidence. |
| `/profile`       | Account identity      | In progress | Guest/read-only and responsive states reviewed; member mutation evidence remains pending.                                         |
| `/settings`      | Settings              | In progress | Guest device persistence and responsive language control reviewed; member reload evidence remains pending.                        |
| `/rules`         | Long-form reading     | Reviewed    | Public Thai/English content is derived from executable rules and reviewed on Desktop/Mobile.                                      |
| `/help`          | Long-form reading     | Reviewed    | Public bilingual FAQ, rules path, and real Facebook support destination reviewed.                                                 |
| `/admin/fantasy` | Operational tool      | Unreviewed  | Audit authorized workflows, lifecycle safety, corrections, and dense data.                                                        |
| `/auth/complete` | System transition     | Unreviewed  | Audit waiting, failure/retry, redirect clarity, and assistive announcements.                                                      |

The Reference labels for Team and Points reflect the product owner's accepted
baseline and their use as the source for `UI_PATTERNS.md`. This documentation
change does not claim that every state has fresh screenshot evidence.

## Recommended audit order

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
- editable and deadline-passed/read-only Gameweek;
- no change, unsaved change, invalid squad, pending save, success, and failure;
- auto-fill available, pending, complete, unavailable, and failed;
- swap source, valid target, invalid target, player removal, and vacancy;
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

- Guest read-only names and upgrade action;
- member editable names, unchanged form, validation error, pending save,
  success, server error, and rename limits;
- member language setting and post-reload database persistence;
- public long rules content, section navigation, FAQ, and support link; and
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
  Overall dialog now limits its table to rank, team/manager, and total, plus
  paginated navigation. The Private section retains a concise bilingual empty
  message without adding a second empty-state action. Create/Join dialogs use a
  clean footer, orange labels, and field-level errors; invalid league names can
  be submitted for validation without disabling the primary action. The empty
  Private League message is a full-width centered surface, while member Join
  and Create actions form equal-width touch targets beneath the section heading
  on Mobile and Tablet. Product dialogs and confirmation dialogs become
  edge-to-edge, safe-area-aware full-screen surfaces on Mobile; Tablet and
  Desktop retain the constrained modal layout.
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
  stacked mobile fixtures were rechecked in the in-app Browser.

### 2026-08-31 — Manager account surfaces and public guidance

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
