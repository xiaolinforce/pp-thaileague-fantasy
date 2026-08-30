# Design guide

## Purpose and ownership

This document is the stable product-wide contract for PP Thai League Fantasy
interface work. It owns product character, visual foundations, information
hierarchy, responsive behavior, localization, accessibility, and shared
interaction rules.

Use the supporting documents for different levels of detail:

- `UI_PATTERNS.md` records reusable interface patterns and the route-specific
  contracts proven by the current reference implementations.
- `UI_REVIEW.md` records route maturity, reachable-state coverage, review
  evidence, and the remaining UI audit backlog.
- `DOMAIN.md` owns Fantasy rules and lifecycle behavior. Design work must
  represent those rules accurately rather than reinterpret them.

Do not promote the incidental layout or styling of an unreviewed route into a
product rule. Update this document only when a rule should apply across the
product or across a defined page archetype.

## Reference maturity

`/team` and `/points` are the current reference implementations. They have been
iteratively refined and establish the quality bar for hierarchy, density,
responsive transformation, Fantasy identity, and state communication.

They are evidence, not universal page templates:

- Team is an interactive Fantasy workspace.
- Points is a read-only Gameweek summary and detail surface.
- Other routes have different tasks and may require different compositions.
- A route marked `Unreviewed` in `UI_REVIEW.md` is not a source of design truth,
  even when it already uses shared classes or components.

Reference status does not exempt Team or Points from regression checks. New
states, languages, or viewport behavior must still be verified.

## Product character

PP Thai League Fantasy should feel like a credible Thai football product:
energetic, competitive, warm, and dependable during repeated squad and score
management.

The product is a game interface rather than a generic analytics dashboard.
Prioritize the manager's current task, consequential Gameweek state, and next
action over decorative statistics. Football visuals should improve scanning
and comprehension without competing with names, positions, points, deadlines,
or controls.

## Experience principles

1. **Lead with the task.** Make the immediate purpose and consequential state
   clear before supporting content.
2. **Create one reading path.** Use hierarchy, spacing, and grouping so the user
   can tell what to inspect, decide, and do next.
3. **Keep actions local.** Place the primary action next to the state it changes
   and avoid competing primary actions inside one local task.
4. **Expose consequences.** Deadlines, transfer deductions, lifecycle status,
   destructive actions, and irreversible effects require written explanation.
5. **Transform responsively.** Recompose, stack, tab, disclose, or scroll a
   surface when space changes; do not merely shrink the desktop layout.
6. **Design every reachable state.** Empty, loading, pending, disabled, error,
   success, and read-only states are part of the experience, not exceptions.
7. **Use domain identity consistently.** Kits, positions, tiers, nationality,
   captaincy, chips, and Gameweek status should mean the same thing everywhere.
8. **Prefer evidence over imitation.** Extract reusable principles from the
   reference routes instead of copying their route-specific composition.

## Visual foundations

### Color and surfaces

- Orange is the signature color for primary actions, selected states, points
  emphasis, focus, and the brand mark.
- Deep navy anchors the application shell and dark match-night surfaces.
- Warm gray is the page canvas; white surfaces separate active work areas.
- Green communicates positive or completed states. Red is reserved for errors,
  destructive actions, and negative states.
- Cards use generous rounded corners, fine neutral borders, and restrained
  shadows. A card must express a meaningful task or grouping; do not wrap every
  subsection in another card.
- Club identity appears through curated four-color kit patterns. It supplements
  written club identity and must never be the only identifier.

The primary semantic tokens live in `src/app/globals.css`:

| Token                                          | Current role                                |
| ---------------------------------------------- | ------------------------------------------- |
| `--orange` / `--orange-deep` / `--orange-soft` | Brand, actions, focus, and selected states. |
| `--navy`                                       | Shell and dark sports surfaces.             |
| `--ink`                                        | Primary text.                               |
| `--muted`                                      | Supporting text.                            |
| `--warm`                                       | Application canvas and secondary surfaces.  |
| `--paper`                                      | Cards, popovers, and inputs.                |
| `--line`                                       | Borders and separators.                     |
| `--green` / `--green-dark`                     | Positive and confirmed states.              |

Use semantic variables and shared variants instead of feature-specific
hard-coded colors. The current product has a light working canvas with a dark
shell; dark mode is not implemented.

### Typography and data

Mitr is loaded through `next/font` for Thai and Latin text. Preserve readable
Thai line height and never rely on uppercase styling to communicate meaning.
The root reading size is 16px with a 1.5 line height. Compact metadata may use
12–14px only when it remains legible and is not the sole carrier of a critical
message.

Names and labels must tolerate Thai and English expansion. Numeric comparisons
should use stable alignment and tabular numerals where practical. Truncation is
acceptable only when the full value remains available through context such as
a title, accessible name, or detail view.

## Application shell and navigation

Reuse `AppShell` and `PageHeader` for authenticated product routes.

- Desktop uses a fixed 238px navy sidebar and a flexible main canvas.
- Mobile and Tablet use a navy Top bar with a hamburger that opens the same full
  navigation in a left drawer.
- The drawer preserves primary navigation, support/settings destinations, and
  the current manager identity. Compact modes must not remove information that
  Desktop users can reach.
- The active route is identified structurally and in text treatment, not by
  color alone.
- Points remains directly below Team. While Gameweek 1 is `open`, Points is a
  disabled, non-navigable item and direct `/points` requests return to Team.
- Preserve visible keyboard focus in both white and navy contexts and provide a
  skip link to the main content.

## Page anatomy and archetypes

Every page should establish, in this order when applicable:

1. semantic page identity and immediate purpose;
2. consequential status, deadline, or scope selector;
3. the primary task or primary result;
4. supporting comparison, explanation, or secondary actions;
5. a clear recovery path for empty or failed states.

Choose a composition for the route's task rather than defaulting to a dashboard
grid:

| Archetype             | Current route    | Composition priority                                                  |
| --------------------- | ---------------- | --------------------------------------------------------------------- |
| Authentication flow   | `/`, `/upgrade`  | One decision at a time, provider availability, recovery, reassurance. |
| Interactive workspace | `/team`          | State and deadline, primary work area, local actions, validation.     |
| Summary and detail    | `/points`        | Scope selector, primary result, comparisons, inspectable breakdown.   |
| Data browser          | `/fixtures`      | Filters, chronological grouping, scan-friendly rows, empty results.   |
| Ranking/community     | `/leagues`       | League context, rank, identity, sortable/comparable standings.        |
| Settings and reading  | `/profile`       | Clear sections, form ownership, save feedback, readable rules.        |
| Operational tool      | `/admin/fantasy` | Safe task grouping, affected records, consequences, audit context.    |

Only Team and Points currently have reference status. The other archetypes are
working hypotheses until their routes receive rendered review and the status is
updated in `UI_REVIEW.md`.

## Components and interaction

- Use primitives under `src/components/ui` for buttons, dialogs, sheets,
  popovers, selects, toggles, tooltips, toasts, skeletons, and alerts.
- Use components under `src/components/fantasy` for shell, data states, kits,
  player and club identity, position, tier, nationality, and Gameweek controls.
- Do not create a parallel component or token system for an individual route.
- Use the shared `product-dialog` treatment for product modals and dismissible
  confirmations. Dialogs need a title, an understandable close path, keyboard
  behavior, and a layout that survives narrow viewports.
- Disable a control while its mutation is pending and communicate progress in
  text. Preserve useful content during transient refreshes where possible.
- Confirm transfers and consequential administrative changes before applying
  them. Explain deductions or irreversible effects inside the confirmation.
- Search, filter, sort, view mode, and Gameweek controls require visible labels
  or accessible names and a clear selected state.
- Tables use written headers, align numeric columns, and may scroll
  horizontally when the data is genuinely tabular. Do not crush values into an
  unreadable pseudo-table.
- Progressive disclosure is appropriate for supporting controls or detail, not
  for hiding a required next action or a consequential warning.

See `UI_PATTERNS.md` before introducing or changing a reusable composition.

## State communication

Derive reachable states from real data readers, actions, validation,
authentication gates, and the lifecycle in `DOMAIN.md`. Do not invent
production behavior merely to fill a design matrix.

Design the applicable default, sparse, dense, empty, loading, pending, success,
validation-error, server-error, disabled, and read-only states. Fantasy
surfaces must also distinguish implemented `planned`, `open`, `provisional`,
and `final` Gameweek behavior, incomplete and valid squads, captaincy, bench
order, active chips, transfer deductions, no results, and corrected scoring.

- State needs a written label or explanation; color and iconography are
  supporting signals.
- Empty states explain what is absent and, when possible, the next valid action.
- Validation appears close to the affected task and preserves the user's work.
- Server errors explain recovery without exposing secrets or implementation
  details.
- Disabled controls remain understandable; use adjacent copy, a title, or an
  accessible description when the reason is not already obvious.
- Prototype or simulated values must never be presented as live production
  facts.

## Localization

Thai is the source language and initial HTML language. English is currently a
client-side display preference provided by `LanguageProvider` and stored under
`thai-fantasy-language`.

This is a prototype boundary:

- URLs and server metadata are not locale-prefixed;
- the first server render is Thai before a client preference is restored;
- dictionary replacement depends on exact Thai source copy; and
- Profile remains the persistent language setting. The floating language
  tester is a temporary development aid, not production navigation.

Add Thai source copy and its English dictionary entry in the same change. Test
business-critical warnings and actions in both languages; do not rely on
partial automatic replacement. Layouts must tolerate long Thai and English
names, labels, numbers, and narrow containers.

## Responsive behavior

Use one shared three-mode system with two viewport cutoffs:

| Mode    | Width                    | Product behavior                                                    |
| ------- | ------------------------ | ------------------------------------------------------------------- |
| Mobile  | below 48rem / 768px      | Top bar and drawer, single-column tasks, compact disclosure.        |
| Tablet  | 48rem–79.999rem          | Top bar and drawer, stacked dense regions, selective support grids. |
| Desktop | 80rem / 1280px and above | Full sidebar, wide comparison and workspace compositions.           |

- Use fluid sizing, `clamp()`, flexible Grid/Flex tracks, and container-aware
  composition instead of route-specific viewport breakpoints.
- Mobile controls may become full-width; dense parallel workspaces may become
  tabs; supporting controls may use an accessible accordion.
- Use horizontal overflow only for genuinely tabular or filter-strip content.
- Keep practical touch targets near 44px and avoid document-level horizontal
  overflow.
- Verify 360px and both sides of the shared cutoffs: 767/768px and
  1279/1280px.

## Accessibility and motion

- Use semantic headings, landmarks, lists, forms, and tables.
- Every input has a visible label; placeholders are supplemental.
- Icon-only controls require an accessible name and visible focus.
- Never encode role, status, result, nationality, or risk solely through color.
- Dialogs, sheets, selects, toggles, filters, and navigation work with a
  keyboard and preserve a sensible focus path.
- Keep reading and control order logical at every responsive composition.
- Support zoom and text growth without clipping critical content or actions.
- Respect `prefers-reduced-motion`; motion must not be necessary to understand a
  state change.
- Status updates use appropriate live regions or focus management without
  producing duplicate or noisy announcements.

## Verification contract

Before handing off a visual change:

1. inspect the rendered route before editing;
2. identify the route, state, language, and viewport represented by the review;
3. verify Desktop and Mobile together, plus Tablet when composition changes;
4. cover applicable empty, loading, pending, error, disabled, success, and
   read-only states;
5. verify Thai and English, long content, keyboard focus, and accessible names;
6. confirm the route uses the shared shell, tokens, primitives, and domain
   identity rather than a parallel system;
7. record the result and remaining exclusions in `UI_REVIEW.md`; and
8. remove any development-only simulation scaffolding before handoff.

Passing automated checks does not replace rendered review. A route becomes a
reference only after its core states and responsive compositions have evidence,
not merely because its implementation is complete.
