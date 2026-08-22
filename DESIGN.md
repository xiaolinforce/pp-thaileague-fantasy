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
current session's team identity. Reuse `AppShell` and `PageHeader` for product routes.

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

At 900px and below, the sidebar gives way to the bottom mobile navigation. The
four highest-frequency destinations remain visible; Fixtures, Profile,
Settings, and Help move into the More sheet. Do not create a second unrelated
navigation model for a new route.

The active route must be identified by text treatment and structure, not color
alone. Page headings should state both the section and the immediate purpose of
the screen before cards or tables begin.

## Components and interaction

- Use shared primitives under `src/components/ui` for buttons, dialogs, sheets,
  popovers, selects, toggles, tooltips, toasts, skeletons, and alerts.
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
- Keep lineup management and player transfers visible in one Team workspace,
  without mode tabs. On desktop, show the pitch and market side by side; stack
  the market after the pitch on narrow screens. Selecting a squad player should
  filter the market to compatible replacements without leaving the page.
- The Points screen uses URL-backed Gameweek selection and defaults to the most
  recent Gameweek with provisional or final scoring. Its pitch is read-only and
  shows the counted lineup after automatic substitutions, while preserving a
  detailed player-points view for review.
- Always pair a player name with enough identity to distinguish position and
  club. Tier and Thai/foreign status should be visible wherever they affect a
  selection decision.
- Starting eleven, bench order, captain, vice-captain, and active chip must be
  visually distinct and also available as text or accessible labels.
- Deadline and Gameweek status are consequential state. Display their timezone
  and status clearly before allowing squad changes.
- Provisional and final points must never look identical without a written
  status label.
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
- the persistent language control is available at the top right of the desktop
  sidebar and in Profile settings; mobile users reach it through Profile.

Until the localization architecture changes, add Thai source copy and its
English dictionary entry in the same change. Never rely on automatic partial
replacement for business-critical warnings without testing the rendered result.

## Responsive behavior

- Wide desktop supports sidebar plus multi-column working layouts.
- At 1120px, dense grids and wide supporting panels begin to collapse.
- At 900px, use mobile bottom navigation and stack primary page regions.
- At 640px and below, reduce decorative spacing before reducing readable text,
  stack controls, and keep actions within the viewport.
- Administrative layouts also collapse around 980px and 620px.
- Use horizontal overflow for genuinely tabular or filter-strip content.
- Touch targets should be approximately 44px high where practical.

Test at a narrow 360px viewport in addition to the defined CSS breakpoints.

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
