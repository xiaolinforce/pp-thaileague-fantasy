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

| Route            | Archetype             | Status     | Current basis and next review focus                                             |
| ---------------- | --------------------- | ---------- | ------------------------------------------------------------------------------- |
| `/team`          | Interactive workspace | Reference  | Refined baseline for hierarchy, responsive transformation, and local state.     |
| `/points`        | Summary and detail    | Reference  | Refined baseline for primary result, comparison, detail, and empty state.       |
| `/`              | Authentication flow   | Unreviewed | Audit Guest, provider availability, Email OTP stages, errors, and compact flow. |
| `/upgrade`       | Authentication flow   | Unreviewed | Audit preservation messaging, provider states, cancellation, and recovery.      |
| `/fixtures`      | Data browser          | Unreviewed | Audit browsing, list density, statistics, filters, and empty results.           |
| `/leagues`       | Ranking/community     | Unreviewed | Audit league context, hierarchy, large values, and narrow standings.            |
| `/profile`       | Settings and reading  | Unreviewed | Audit navigation, Guest/member variants, forms, feedback, and long rules.       |
| `/admin/fantasy` | Operational tool      | Unreviewed | Audit authorized workflows, lifecycle safety, corrections, and dense data.      |
| `/auth/complete` | System transition     | Unreviewed | Audit waiting, failure/retry, redirect clarity, and assistive announcements.    |

The Reference labels for Team and Points reflect the product owner's accepted
baseline and their use as the source for `UI_PATTERNS.md`. This documentation
change does not claim that every state has fresh screenshot evidence.

## Recommended audit order

1. **Fixtures and Leagues:** establish data-browser and ranking patterns shared
   by the remaining competition surfaces.
2. **Profile:** establish settings, long-form rules, Guest/member variants, and
   form-feedback patterns.
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

### Profile

- Guest read-only names and upgrade action;
- member editable names, unchanged form, validation error, pending save,
  success, server error, and rename limits;
- language setting and post-reload persistence;
- long rules content and section navigation; and
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
