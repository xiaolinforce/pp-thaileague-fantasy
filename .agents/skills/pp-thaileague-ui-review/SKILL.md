---
name: pp-thaileague-ui-review
description: Audit, harden, and polish UI in the PP Thai League Fantasy repository. Use for any request to create, change, review, test, or visually verify routes, components, responsive layouts, localization, accessibility, loading/error/empty states, Fantasy lifecycle states, or authentication states in this project. Do not use for backend-only, database-only, import-only, or scoring-rule work with no rendered UI impact.
---

# PP Thai League UI review

Preserve the current Thai football product identity. Treat this as refinement of an established system, not permission to replace its visual direction.

## Read before editing

Read `DESIGN.md`, the affected route and shared components, and the project documents named by `AGENTS.md`. Before changing framework behavior, read the relevant guide under `node_modules/next/dist/docs/` for this installed Next.js version.

Use the tokens in `src/app/globals.css`, the shell and Fantasy identity components under `src/components/fantasy`, and the primitives under `src/components/ui`. Do not create a parallel component system.

## Build the state inventory

Derive reachable states from page composition, data readers, actions, conditionals, loading and error boundaries, dialogs, sheets, validation, authentication gates, and the documented Fantasy lifecycle. Cover every current public route plus `/admin/fantasy` when an authorized development state is available.

For each relevant surface, include:

- default, sparse, dense, empty, loading, pending, success, validation error, server error, disabled, and read-only states;
- Thai and English, long Thai/English names, long labels, large numbers, missing optional values, and narrow containers;
- Guest, member, upgrade, Email OTP stages, and unavailable-provider states where implemented;
- planned, open, deadline-passed, provisional, and final Gameweek presentation where implemented;
- incomplete and valid squad states, captain and vice-captain, bench order, active chips, transfers, deductions, no results, and corrected scoring where implemented;
- keyboard focus, zoom/text growth, reduced motion, and color-independent status cues;
- wide desktop, tablet around navigation/layout breakpoints, and a 360px viewport.

Do not invent production behavior for a state the application does not implement. Record exclusions explicitly.

## Simulate safely

Prefer local-only fixtures, component props, browser interception, or an isolated development-only state switch over database writes. Never expose a simulation path in production, weaken authentication, change Fantasy rules, or modify historical database state merely to obtain a screenshot.

Before adding simulation scaffolding, record the exact files and behavior being introduced. Mark it clearly as temporary and ensure production builds cannot reach it. After verification, remove only that scaffolding and confirm with `git diff` and targeted searches that no debug query, mock flag, fixture override, or simulated value remains. Keep genuine UI fixes.

## Review and refine

Inspect the rendered interface before editing. Prioritize:

1. task and information hierarchy;
2. alignment, spacing rhythm, typography, and density;
3. responsive behavior and overflow;
4. interaction feedback and recovery;
5. Thai/English resilience;
6. accessibility and semantics;
7. restrained visual polish consistent with `DESIGN.md`.

Keep one primary action per local task, place it next to the state it changes, and make consequential status and deadlines explicit in text. Avoid nested-card clutter, decorative statistics, color-only meaning, unexplained blank states, and fixed dimensions that assume short English text.

When changing Thai source copy, update the English dictionary in the same change and verify both rendered modes.

## Verification

Use a real browser for visual and interactive checks. Review desktop and mobile together in a bounded pass, apply the complete batch of supported fixes, then perform one confirmation pass. Capture enough evidence to identify the route, state, language, and viewport.

Run the narrowest relevant checks first, followed by:

```text
npm run test:rules
npm run test:email
npm run types
npm run lint
npm run format:check
npm run build
```

Before handoff, confirm that temporary simulation code is gone, the worktree contains only intentional project-local skills and product changes, and remaining limitations are stated precisely.
