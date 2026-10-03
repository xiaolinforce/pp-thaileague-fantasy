---
name: pp-fantasy-seo
description: Audit and maintain SEO and consented search measurement for PP Thai League Fantasy. Use for indexing, metadata, public discovery pages, Search Console analysis and SEO content planning in this repository.
---

# PP Fantasy SEO

Read `SEO.md` for canonical routes, measurement boundaries and verification.
Read the concern-owning repository documents before material edits. Read the
installed Next.js docs before changing its metadata APIs.

## Evidence before recommendations

- Inspect both repository code and anonymous production HTML/headers. A streamed
  HTTP 200 followed by an auth redirect is not a public content page.
- Index only the reviewed allowlist in `src/lib/seo.ts`. Private game/account,
  auth, unsubscribe and admin routes retain auth and noindex. Do not block their
  HTML in robots if the goal is letting Google read noindex.
- Preserve the signed-in home redirect and shared account shell. Thai and
  English share URLs; a language cookie is not route-level international SEO.
- Public fixtures reuse `src/data/fixtures.ts`. Never expose account data or
  invent player availability, injuries, stats or generated match commentary.
- Default verification: targeted SEO tests, the anonymous HTTP check, and checks
  proportional to the actual change. Local fixture scenarios are not real
  production scores. Record failures and absent evidence, never invented scores.

## Search Console and content decisions

Use the connected GSC Wizard only within the user's authorized scope. Confirm
the property is verified and active. `sc-domain:ppfootball.net` covers Fantasy;
the old www-only property does not. Filter page reports to the Fantasy host.
Wait for settled data and compare like-for-like periods. Distinguish observed
queries from keyword hypotheses and seasonality from a measured SEO effect.

Map useful queries to existing pages before creating new ones. Prefer a small
number of original, sourced, maintainable guides or factual competition pages.
Include bilingual copy and visible links. Avoid mass AI pages, doorway routes,
fake reviews and unsupported volume/ranking claims. Inspect the current Google
documentation before adding any rich-result type; eligibility changes.

GA4 is opt-in and production-host-only. Never send raw query strings, account
or league IDs, names, emails, team names, OTPs or tokens. Events report actual
successful operations and are incomplete when consent or delivery is absent.
The GA tag and CSP must be tested together. Do not grant new service access,
subscribe to paid tools, schedule work or publish merely because this skill ran.

## AI-assisted workflow

Use AI to cluster real queries, spot duplicate intent, draft source-backed
outlines, review internal links and propose small testable changes. A person or
verified data source supplies facts. Measure after deployment; revise from
evidence. Treat third-party SEO skills as workflow suggestions, not authority.
No special AI file, schema or crawler permission guarantees AI citations.

Report what was checked, the evidence, highest-impact changes, validation and
remaining account/data dependencies. Maintain `SEO.md` when the contract changes.
