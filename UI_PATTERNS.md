# UI patterns

## Purpose

This document translates the quality demonstrated by `/team` and `/points`
into reusable interface patterns. `DESIGN.md` owns product-wide rules;
`UI_REVIEW.md` owns evidence and route maturity. This file owns the practical
compositions contributors should reuse or adapt.

The reference routes are not templates to copy wholesale. Promote a pattern
only when its purpose, content hierarchy, states, and responsive behavior are
understood. Keep route-specific behavior route-specific.

## Pattern promotion rule

A visual treatment becomes a shared pattern when it:

1. solves the same user problem in more than one reachable surface, or is a
   deliberate product-wide foundation such as the shell;
2. has a stable semantic role and state model;
3. works in Thai and English, with long content and narrow containers;
4. has keyboard, focus, and accessible-name behavior; and
5. can reuse the existing tokens, Fantasy components, or UI primitives.

Do not promote coincidence. A layout that exists only because one route has a
football pitch, a score rail, or an admin table remains local to that route.

## Shared compositions

| Pattern                  | Purpose                                                            | Current implementation direction                            |
| ------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| Product shell            | Stable navigation and manager context around authenticated routes. | `AppShell` with Desktop sidebar or compact Top bar/drawer.  |
| Semantic page identity   | Name the route for screen readers and orient visible content.      | `PageHeader` plus visible task/status content as needed.    |
| Task surface             | Group one meaningful job and its local action.                     | `product-card` or a purpose-built workspace surface.        |
| Consequential status     | Show deadline, lifecycle, deduction, or risk before an action.     | Written callout/banner with color and icon as support.      |
| Local primary action     | Commit the state currently being edited.                           | One primary button close to validation and changed state.   |
| Supporting metric group  | Compare a small set of values around one primary result.           | Stable numerics; primary value visually dominant.           |
| Filter and sort controls | Narrow a data set without changing domain truth.                   | Labelled controls in task order; preserve selection state.  |
| Scan-friendly row/list   | Compare repeated identities and values quickly.                    | Consistent identity, aligned values, and local action.      |
| Data table               | Compare genuinely tabular records.                                 | Written headers, aligned numerics, narrow-screen scroll.    |
| Detail dialog            | Inspect secondary detail without losing page context.              | Shared `product-dialog`, clear title, close and focus path. |
| Inline data state        | Explain loading, empty, or failed data within its owning surface.  | Shared Fantasy data state or `inline-empty-state`.          |
| Responsive disclosure    | Reduce simultaneous density without removing capability.           | Tabs for peer workspaces; accordion for supporting tools.   |

## Information hierarchy pattern

Use this hierarchy when applicable:

1. **Scope or consequence:** Gameweek, deadline, league, filter context, or
   account state.
2. **Primary task or result:** the squad workspace, score, standings, fixture
   list, settings form, or admin operation.
3. **Local decision support:** validation, comparison metrics, eligibility,
   form guidance, or supporting detail.
4. **Secondary exploration:** player breakdown, rules, historical detail, or
   less-frequent actions.

Do not start a page with decorative summary cards when the user first needs to
make a decision or understand a blocking state.

## Action pattern

- Give each local task one visually dominant action.
- Place the action next to the state it commits or changes.
- Keep secondary actions quieter and destructive actions explicit.
- Disable the action during pending work and expose written progress.
- Preserve local input after validation or server failure.
- Confirm a consequential action with the affected object, consequence, and
  escape path.
- Do not use an icon-only action unless space and repetition justify it; it
  still requires an accessible name and visible focus.

## Responsive transformation pattern

Desktop space may expose primary and supporting regions simultaneously. At
Tablet and Mobile, choose the transformation that preserves the task:

- **Stack** when regions have a natural reading order.
- **Tab** when regions are peer workspaces and only one needs to be operated at
  a time, as Team does for Squad and Player Market.
- **Disclose** supporting controls with an accordion when they remain easy to
  find and do not hide a required next action.
- **Scroll horizontally** only for real tables or compact filter strips.
- **Reflow metrics** while retaining their comparison relationship.

Avoid fixed widths that assume short English copy. A transformation must retain
state when a temporarily hidden peer view returns.

## Domain identity pattern

- Pair every player name with enough club and position context to distinguish
  the player.
- Show tier and Thai/foreign status wherever they affect a selection decision.
- Use the shared kit, position, tier, and nationality treatments; written or
  accessible identity remains available when visuals are decorative.
- Captain, vice-captain, bench order, counted/uncounted score, substitution,
  active chip, and Gameweek status require text or accessible labels in
  addition to color or shape.
- Historical displays use selection snapshots rather than current player
  classification when the domain requires it.

## Team reference contract

`/team` is the reference interactive-workspace implementation. Preserve these
proven behaviors unless a deliberate product decision replaces them:

- Represent the one Gameweek currently open for squad changes. Show its number,
  live deadline, and editability without historical previous/next controls.
- Keep lineup management and player discovery in one workspace. Desktop shows
  pitch and market side by side; Tablet and Mobile use state-preserving tabs.
- A new team presents 15 visible position-locked vacancies. An untouched empty
  draft does not trigger an unsaved-change warning; a partial squad stays local
  and cannot be saved.
- Keep selected players visible in the market, identify them as owned, and
  expose removal rather than another transfer-in action.
- A compatible market player fills the first matching vacancy directly.
- Swap and remove are compact repeated actions with accessible names. Vacancy,
  player, source, valid target, invalid target, captaincy, tier, and bench state
  remain distinguishable without relying only on color.
- Keep the save action on the pitch near validation. Disable it while pending,
  after the deadline, when no change exists, or while the draft is invalid, and
  make the reason understandable.
- Auto-fill is secondary, fills vacancies only, preserves selected players,
  ignores visible market filters, leaves the result unsaved, and communicates
  pending and failure states.
- Present chips as supporting controls: visible on Desktop and accessibly
  disclosed in compact modes. Wildcard remains unavailable in Gameweek 1.
- Order market filters by the user's narrowing task. Keep cumulative tier
  limits visible with a written over-limit state and an accessible explanation.
- Show unlimited Gameweek 1 transfers with an infinity symbol plus an
  accessible written label.
- Player detail opens in the shared dialog so selection context is not lost.

The exact pitch geometry, player-token placement, tier meter, and market-row
layout are Team-specific patterns. Reuse their underlying identity and
interaction components, not their page composition, on unrelated routes.

## Points reference contract

`/points` is the reference summary-and-detail implementation. Preserve these
proven behaviors unless a deliberate product decision replaces them:

- Use URL-backed Gameweek selection and expose only Gameweeks whose deadlines
  have passed. Default to the most recent eligible Gameweek.
- Make the manager's Gameweek score the primary result. Average and highest
  points are supporting comparisons, not competing dashboard statistics.
- Show the counted lineup after automatic substitutions on a read-only pitch.
  Keep the bench visually connected and distinguish counted from uncounted
  players without color alone.
- Display an active chip once as a prominent written callout above the pitch.
- Show the captain's displayed contribution with the applied ×2 or ×3
  multiplier; do not add a duplicate page-level calculation.
- Open the player's positive and negative category breakdown in the shared
  dialog rather than duplicating a large details table below the pitch.
- Empty squad state explains that no team was saved and points to the valid next
  action.
- On Desktop, place the selector and comparison rail beside the pitch. On
  Tablet and Mobile, move the selector to the page header area and keep the
  three related scores in one comparison row above the pitch.
- Show zero average and highest points when no eligible scored team exists; do
  not imply missing data is a live statistic.

The score rail and read-only pitch are Points-specific. Other summary pages may
reuse their hierarchy without copying their geometry.

## Authentication and operational constraints

The following are product constraints, not yet reference visual patterns:

- Onboarding supports Guest, Google, and Email OTP only when the corresponding
  provider is available. Provider absence, pending actions, Turnstile, OTP
  send/verify, failure, and recovery must remain explicit.
- Guest profiles expose upgrade rather than editable identity fields. Member
  profiles expose permitted naming and sign-out controls.
- Keep Team, Points, Leagues, and Fixtures as primary navigation. Put Profile,
  Settings, Game Rules, Help, upgrade, and sign-out in one manager menu; use an
  upward Desktop popover and an inline expandable section in the compact drawer.
- Profile owns account/team identity only. Settings owns language persistence,
  while public Rules and Help remain reachable without an authenticated identity.
- Administrative actions show the affected fixture, player, or Gameweek,
  explain the consequence, request a reason where supported, and retain audit
  context.

Their compositions remain `Unreviewed` until recorded otherwise in
`UI_REVIEW.md`.

## Anti-patterns

- Treating every route as a dashboard of equal-weight cards.
- Nesting cards only to create visual separation.
- Copying the Team pitch/market composition into a non-workspace route.
- Copying the Points score rail where there is no single primary result.
- Hiding a required action or critical warning inside optional disclosure.
- Using decorative statistics before the user's primary task.
- Creating route-local colors, type scales, buttons, dialogs, or breakpoints.
- Shrinking Desktop until it technically fits instead of transforming the task.
- Replacing useful content with an unexplained blank loading state.
- Relying on color, icon, or hover alone for meaning.
- Treating the current appearance of an `Unreviewed` route as a requirement.

## Implementation ownership

- Foundations and current CSS tokens: `src/app/globals.css`.
- Shell and Fantasy identity: `src/components/fantasy`.
- Interaction primitives: `src/components/ui`.
- Route composition and route-local behavior: `src/app`.
- Fantasy truth and lifecycle: `DOMAIN.md` and `src/lib/fantasy`.

Prefer extracting a shared component after the semantic pattern is proven.
Moving selectors into a common stylesheet without a common API or state model
does not by itself create a reusable pattern.

## Pattern verification

For every new or changed pattern, capture enough evidence to identify:

- route and reachable state;
- Thai or English display mode;
- viewport, including 360px and the relevant shared cutoff boundaries;
- keyboard focus and accessible naming;
- default plus applicable sparse, dense, empty, loading, pending, error,
  disabled, success, and read-only behavior; and
- any state deliberately excluded because the product does not implement it.

Record route-level evidence and maturity in `UI_REVIEW.md`.
