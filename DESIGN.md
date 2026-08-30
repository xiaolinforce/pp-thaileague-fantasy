# Design guide

## Product character

PP Thai League Fantasy should feel like a credible Thai football product: energetic,
competitive, and warm, while remaining clear enough for repeated squad and
score-management tasks. The interface combines a dark match-night shell with
bright orange actions and clean white working surfaces.

The product is a game interface rather than a generic analytics dashboard.
Prioritize the manager's current Gameweek, deadline, squad state, and next
action over decorative statistics.

## Visual direction

- Orange is the signature color for primary actions, selected states, points
  emphasis, and the brand mark.
- Deep navy anchors the fixed desktop sidebar and dark sports surfaces.
- Warm gray is the page canvas; white cards separate active work areas.
- Green communicates positive or completed states; red is reserved for errors
  and destructive or negative states.
- Cards use generous rounded corners, fine neutral borders, and restrained
  shadows.
- Club identity appears through curated four-color kit patterns. It supplements
  written club identity and must not be the only identifier.
- Player and football visuals should support scanning and squad comprehension,
  not compete with names, positions, points, or controls.

## Tokens and typography

The primary tokens live in `src/app/globals.css`:

| Token                                          | Current role                                |
| ---------------------------------------------- | ------------------------------------------- |
| `--orange` / `--orange-deep` / `--orange-soft` | Brand, actions, focus, and selected states. |
| `--navy`                                       | Sidebar and dark sports surfaces.           |
| `--ink`                                        | Primary text.                               |
| `--muted`                                      | Supporting text.                            |
| `--warm`                                       | Application canvas and secondary surfaces.  |
| `--paper`                                      | Cards, popovers, and inputs.                |
| `--line`                                       | Borders and separators.                     |
| `--green` / `--green-dark`                     | Positive and confirmed states.              |

Use semantic variables and shared component variants instead of adding
mode-specific or feature-specific hard-coded colors. The current product has
one light working canvas with a dark sidebar; dark mode is not implemented.

Mitr is loaded through `next/font` for Thai and Latin text. The root size is
16px with a 1.5 line height. Preserve readable Thai line height and avoid
uppercase-dependent meaning. Small labels may be 12px, supporting text 14px,
and primary reading text 16px or larger. Scores and numeric comparisons should
use stable alignment and tabular numerals where practical.

## Application shell

Desktop uses a fixed 238px navy sidebar and a flexible main canvas. The sidebar
contains the brand, primary Fantasy navigation, support/settings links, and the
current session's team identity. Below the desktop breakpoint, preserve this
same full navigation in a left drawer, opened from a navy Top bar with a
hamburger control. Reuse `AppShell` and `PageHeader` for product routes.

## Account onboarding

The root route presents one compact card with the available actions in this
order: Guest play, Google, then Email. Keep this screen decision-oriented: the
hero uses one headline and one supporting sentence, and the action panel avoids
repeating marketing benefits. Selecting Email replaces the three choices inside
the same card with the passwordless Email OTP form; a Back action restores the
choice list without navigating to another route. Guest is the orange primary
trial action with a person icon and no acknowledgement checkbox. Keep the
compact TH/EN language switch at the top right of the hero and connect it to the
same stored preference as the product shell without letting it compete with the
primary authentication actions. Use an orange-led hero and a warm off-white
action canvas; the hero starts with the prominent product name instead of
repeating the full shell brand lockup. The onboarding page explicitly uses Mitr
for all Thai and Latin copy. A low-contrast football-pitch line pattern may
support the hero, but it remains decorative behind readable text.

Email OTP must visibly expose a labelled email field, Turnstile state, a
separate labelled six-digit field after sending, disabled/pending states, and a
plain failure message. The production UI hides methods whose complete provider
configuration is not enabled. Guest profiles expose an upgrade action; member
profiles expose sign-out and naming controls. Do not make a Guest name field
appear editable.

Below the desktop breakpoint, navigation is initially hidden in the left drawer
and opens from the Top bar hamburger. Keep all primary navigation, support,
settings, and manager identity in the drawer so that mobile and tablet preserve
the desktop information architecture.

The active route must be identified by text treatment and structure, not color
alone. Page headings should state both the section and the immediate purpose of
the screen before cards or tables begin.

Keep Points directly below Team in the main navigation. While Gameweek 1 is
`open`, render Points as a disabled, non-navigable item in both the desktop
sidebar and compact drawer, and redirect direct `/points` requests to Team.
Enable Points when Gameweek 1 leaves `open`.

## Components and interaction

- Use shared primitives under `src/components/ui` for buttons, dialogs, sheets,
  popovers, selects, toggles, tooltips, toasts, skeletons, and alerts.
- Use the shared `product-dialog` shell for product modals and dismissible
  confirmations. Navigation warnings may be closed with their cancel action,
  close button, Escape, or an outside press without discarding local changes.
- Use fantasy components for domain identity such as position badges, kits,
  players, clubs, and Gameweek controls.
- Keep the primary action close to the state it changes. Disable it while a
  mutation is pending and provide a clear success or failure result.
- Confirm transfers and consequential administrative changes before applying
  them. Explain point deductions or irreversible effects in the confirmation.
- Search, filter, view mode, and Gameweek selection must retain visible labels
  or accessible names.
- Preserve previous useful content during transient refreshes where possible;
  do not replace a populated screen with an unexplained blank state.
- Tables should align numeric columns, expose written headers, and support
  horizontal scrolling on narrow screens rather than crushing values.

## Fantasy-specific presentation

- The Team screen always represents the one Gameweek currently open for squad
  changes. Show its number and live deadline without previous/next Gameweek
  controls; historical squads belong on the Points screen.
- Keep lineup management and player transfers visible in one Team workspace. On
  desktop, show the pitch and market side by side. Below the desktop breakpoint,
  provide a two-tab control before the workspace for switching between Squad
  Players and Player Market, preserving each view's state while the other is
  hidden. The body of a vacant squad slot
  is non-interactive and does not move focus or filter the market, while its
  compact swap action can move the vacancy within the lineup. During an active
  swap, a valid vacant target becomes interactive and receives the same visible
  target treatment as a valid player.
  Keep players who are already in the current draft visible in the market,
  identify them accessibly as owned, and expose remove instead of transfer-in.
  A removed player remains eligible to be selected again while the change is
  unsaved.
- Expose swap and remove as compact, icon-only actions on every pitch and bench
  player, with accessible names. Removing a player keeps that lineup slot as a
  visible position-locked vacancy without selecting it or moving focus to the
  market. A vacancy exposes only the swap action outside swap mode. Every player
  and vacancy can initiate a swap with another player or vacancy, including
  across positions when the resulting formation and bench structure remain
  valid. A compatible market
  player fills the first matching vacancy directly; the manager does not need to
  choose a destination slot first. Saving stays disabled until every vacancy is
  filled.
- Show nationality on each pitch and bench player's name frame with 4px
  left-and-right accents only: Thai-flag colors for Thai players and purple for
  foreign players. Place the captain or vice-captain marker above the left swap
  action and the tier badge above the right remove action.
- A newly provisioned team starts with all 15 pitch and bench slots visibly
  vacant without an introductory message. Keep the untouched empty draft from
  triggering an unsaved-change warning, and begin that warning only after the
  first local selection. Partial squads remain local and cannot be saved.
- Place a compact secondary auto-fill action beside the Player Market heading.
  It fills only vacant slots from the full eligible pool, preserves current
  players, assigns missing captaincy, and leaves the result unsaved and fully
  editable. Disable it with written pending feedback while calculating, when
  no vacancy remains, or after the deadline; do not make current market filters
  alter its candidate pool.
- Keep the Player Market filters in task order: club, then position and
  nationality dropdowns, then tier and sort. Nationality offers all players,
  Thai players, or foreign players and filters the visible market only.
- Present the cumulative Level 1–3 limits above the Player Market as one compact
  nine-dot meter grouped into three nominal slots per level. Fill each level's
  nominal group from left to right, then let Level 2 and Level 3 overflow move
  backward into unoccupied higher-level circles. Pair an over-limit meter with written status, and
  keep the cumulative rule available from a keyboard- and touch-accessible
  explanation control.
- Show an infinity symbol instead of the stored free-transfer balance in
  Gameweek 1, with an accessible unlimited-transfer label, because opening
  squad revisions do not count as transfers.
- In Gameweek 1, disable Wildcard and show that it becomes available from
  Gameweek 2. Enforce the same restriction on the server.
- The Points screen uses URL-backed Gameweek selection, exposes only Gameweeks
  whose deadlines have passed, and defaults to the most recent eligible
  Gameweek. Use previous/next arrows around the written Gameweek number without
  repeating score status in the selector. Its pitch is read-only and shows the
  counted lineup after automatic substitutions without an auto-sub summary. On
  desktop, match the Team pitch-and-bench width and place the Gameweek selector
  above average, manager, and highest points in one row to its
  right. Below the desktop breakpoint, keep those three scores in one row above
  the pitch. Open
  each player's per-category breakdown in the shared product dialog from the
  pitch or bench instead of repeating a page-level details table.
- Average and highest points are persisted Gameweek summaries. Both include
  every scored team whose locked selection contains at least one player; the
  signed-in team is not excluded. Show zero for both values before any eligible
  team has a score.
- Always pair a player name with enough identity to distinguish position and
  club. Tier and Thai/foreign status should be visible wherever they affect a
  selection decision.
- Starting eleven, bench order, captain, vice-captain, and active chip must be
  visually distinct and also available as text or accessible labels.
- Deadline and Gameweek status are consequential state. Display their timezone
  and status clearly before allowing squad changes.
- Show an active chip as one prominent written callout directly above the pitch.
  Do not repeat a page-level score calculation above the pitch; show each
  scoring captain's contribution already multiplied by two, or by three when
  Triple Captain is active.
- Point breakdowns should show positive and negative categories individually;
  do not expose only a total when the calculation is under review.
- Administrative correction screens should show the affected fixture/player,
  require a reason where the action supports one, and retain audit context.

## Localization

Thai is the source language and the initial HTML language. English is currently
provided by `LanguageProvider`, which recursively translates Thai text with a
client-side dictionary and stores the choice under `thai-fantasy-language`.
When no preference exists, the browser language selects English only for an
English-language browser; Thai is the fallback.

This implementation is a prototype convenience, not a route-level i18n system:

- there are no locale-prefixed URLs or localized server metadata;
- the first server render is Thai before the client restores a preference;
- dictionary replacement depends on the exact Thai source copy; and
- Profile settings remain the persistent language preference. A temporary
  floating language tester is also available throughout the app shell for
  development: it can be dragged anywhere on screen and remembers its local
  position. It is not a production navigation control and may be removed after
  language testing; mobile users can always reach the persistent setting through
  Profile.

Until the localization architecture changes, add Thai source copy and its
English dictionary entry in the same change. Never rely on automatic partial
replacement for business-critical warnings without testing the rendered result.

## Responsive behavior

- Use one shared three-mode responsive system across every route: Mobile below
  768px, Tablet from 768px through 1279px, and Desktop from 1280px upward. These
  modes have only two viewport cutoffs: 48rem and 80rem.
- Mobile uses a navy Top bar with a left hamburger that opens the full sidebar
  drawer, single-column task flows, compact spacing, and full-width controls
  while preserving readable text and approximately 44px touch targets.
- Tablet uses the same navy Top bar and full sidebar drawer, then stacks dense
  primary regions. Two-column supporting grids are acceptable where their
  content remains readable, but Team, Points, Fixtures, Profile, and
  administration must not depend on desktop-width columns.
- Desktop uses the full 238px sidebar and may place primary and supporting
  regions side by side. The Team pitch and Player Market become side by side
  only in this mode.
- Use fluid sizing, `clamp()`, flexible Grid/Flex tracks, and container-aware
  composition instead of introducing route-specific viewport breakpoints.
- Use horizontal overflow for genuinely tabular or filter-strip content.
- Touch targets should be approximately 44px high where practical.

Test at 360px and on both sides of the shared cutoffs: 767/768px and
1279/1280px.

## Accessibility and motion

- Use semantic headings, landmarks, lists, forms, and tables.
- Every input requires a visible label; placeholders are supplemental.
- Icon-only controls require an accessible name and an understandable focus
  state.
- Preserve visible keyboard focus in both white and navy contexts.
- Never encode lineup role, status, result, or risk solely through color.
- Dialogs, sheets, selects, toggles, and navigation must work with a keyboard.
- Respect `prefers-reduced-motion` and avoid motion that is required to
  understand state changes.
- Loading, empty, error, disabled, pending, success, provisional, and final
  states should be explicitly designed wherever applicable.

## UI verification checklist

Before handing off a visual change, confirm that it:

- reuses the shell, shared primitives, tokens, typography, and domain identity
  components;
- works in Thai and English without clipped or untranslated critical copy;
- remains usable at desktop, tablet, and 360px widths;
- exposes keyboard focus and accessible labels;
- distinguishes draft, pending, locked/provisional, final, success, and error
  states as relevant; and
- does not present prototype-only or simulated values as live production data.
