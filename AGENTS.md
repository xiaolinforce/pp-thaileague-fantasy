<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# PP Thaileague Fantasy project context

PP Thaileague Fantasy is a Thai-first Thai League 1 Fantasy Football prototype
backed by Neon Postgres. Before making a material change, read the documents
that own the affected concern:

1. `README.md` for product scope, routes, setup, and documentation links.
2. `PRODUCT.md` for users, purpose, positioning, constraints, principles, and brand commitments.
3. `ARCHITECTURE.md` for runtime boundaries, data/write flow, and persistence.
4. `DOMAIN.md` for the implemented Fantasy rules and Gameweek lifecycle.
5. `DATA_SOURCES.md` for provenance, source identifiers, imports, and seed order.
6. `DESIGN.md` for product-wide UI, localization, responsive, and accessibility rules.
7. `UI_PATTERNS.md` for reusable compositions and the Team/Points reference contracts.
8. `UI_REVIEW.md` for route maturity, reachable-state coverage, evidence, and audit priority.
9. `DEVELOPMENT.md` for commands, migrations, verification, and documentation ownership.
10. `ROADMAP.md` to distinguish current prototype scope from production-ready behavior.
11. `DECISIONS.md` before revisiting a durable technical or product choice.

## Non-negotiable rules

- Keep database access, secrets, and external-source fetching server-only. Use
  the shared Drizzle client from `src/db/index.ts`.
- Treat `src/db/schema.ts` as the schema source of truth. Generate and review a
  new forward migration; never rewrite migration history that may be applied.
- Confirm the target Neon branch before migrations, imports, normalization, or
  seeds. Import competition data before seeding dependent Fantasy data.
- Keep deterministic rules and scoring in `src/lib/fantasy`. Update
  `DOMAIN.md`, profile rule copy, and relevant tests when behavior changes.
- Validate mutations against fresh database state. Do not trust client-supplied
  player position, club, tier, Thai status, deadline, transfer, or chip state.
- Preserve selection snapshots, transfer revisions, effective tier history,
  score recalculation, and audit context; historical Fantasy state must not be
  silently rewritten by current player data.
- Keep Thai source copy and English dictionary behavior aligned in the same
  change. Test both display modes; client-side translation is a documented
  prototype boundary, not route-level i18n.
- Reuse the existing application shell, tokens, UI primitives, responsive
  navigation, focus behavior, and loading/error patterns.
- Treat `/team` and `/points` as the current design reference implementations.
  Do not treat an `Unreviewed` route in `UI_REVIEW.md` as design precedent, and
  do not copy Team/Points route-specific geometry into a different page
  archetype.
- Do not use `src/lib/fantasy-data.ts` as a new runtime source. Runtime pages
  read through server-only modules under `src/data`.
- Do not enable production demo writes or expose `/admin/fantasy` as a trusted
  admin surface until server-side authentication and authorization exist.
- Never commit credentials, `.env.local`, database exports, or unreviewed
  third-party source payloads.

## Verification

Run the narrowest relevant checks first, then the appropriate project checks:

```bash
npm run test:rules
npm run types
npm run lint
npm run format:check
npm run build
```

For import or seed changes, also run the relevant database verification against
the intended development branch. Update the owning context document in the same
change whenever scope, architecture, rules, sources, design, UI patterns or
review evidence, workflow, roadmap, or a durable decision changes.
