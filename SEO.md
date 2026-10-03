# Search and measurement

## Public search surfaces

The canonical origin is `https://fantasy.ppfootball.net`. `src/lib/seo.ts`
owns the public URL allowlist and bilingual metadata; `seo-server.ts` resolves
the existing language preference. English is a display mode on the same URL,
not a separate locale route. Do not publish `/en` hreflang until real English
routes and their canonical policy exist.

Indexable routes: `/`, `/how-to-play`, `/rules`, `/help`, `/privacy`, `/terms`,
and `/thai-league/2026-27/fixtures`. Each has its own title, description,
canonical, Open Graph and Twitter metadata. The home page includes a WebSite
schema with the real PP Football publisher. No invented ratings, FAQ rich-result
promises, injury news or automatic mass-generated player pages.

The shared root defaults to noindex; public pages opt in. Private/auth/admin/API
route families also receive `X-Robots-Tag: noindex, nofollow`, including redirects.
Robots allows private HTML to be crawled so noindex can be read. Authentication
remains the access control. Vercel Preview emits an empty sitemap and disallows
crawling; keep deployment protection enabled too.

`/robots.txt` advertises `/sitemap.xml`. The sitemap lists only the public
canonical URLs, without invented last-modified timestamps. Query parameters
do not enter canonicals. Internal public links are visible in the rendered
HTML. The signed-in home redirect and shared account shell are retained.

Public fixtures reuse the server-only, five-minute cached fixture read model;
no manager, account or private league data is passed to the page. Fixture status
and times reflect the selected environment's database, not a live source feed.
Development scenarios are not evidence of production match results.

## Search Console

`sc-domain:ppfootball.net` was verified through a Vercel DNS TXT record on
2026-10-03 and registered/activated in GSC Wizard. Keep that TXT record. The
older `https://www.ppfootball.net/` property alone does not cover Fantasy.
Filter domain-property reports by pages beginning with
`https://fantasy.ppfootball.net/`. Submit the Fantasy sitemap after publishing
and verify Google's fetch result; submission is not an indexing guarantee.

## Analytics

GA4 web stream: **Fantasy production web**, measurement ID **G-BRD4T65GNK**,
stream ID **16010183369**, property ID **557241764**, under the existing PPTL Games account. Reporting
timezone is Thailand and currency is THB. Enhanced measurement is off: page
views are explicit to avoid duplicate SPA events, form contents and URL secrets.

`NEXT_PUBLIC_GA4_MEASUREMENT_ID` optionally overrides the public ID. The tag
loads only on `fantasy.ppfootball.net`, after explicit analytics consent, and
not for an administrator. Local and preview visits do not pollute production.
Decline leaves gameplay available. Privacy/Settings expose a choice editor.
Withdrawal removes host-only GA cookies and reloads to unload the library.

Only approved route labels, origin-only referrers and event names are sent.
Query strings, hashes, account IDs, team names and emails are not sent. League
detail paths are grouped. Auth, unsubscribe and admin routes are excluded.
Google Signals and advertising personalisation are disabled. Cookies expire
after 90 days and may renew on activity. GA4's own retention settings govern
received data; withdrawing consent does not delete historical measurements.

| Event               | Trigger                                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page_view`         | A permitted route after consent; one per route transition.                                                                                                                      |
| `guest_start`       | Anonymous authentication and Fantasy profile provisioning succeed.                                                                                                              |
| `sign_up`           | Better Auth creates a non-anonymous user while consent is granted; a short-lived receipt is consumed after a member identity is present. Existing-member login is not a signup. |
| `first_squad_saved` | The existing save transaction succeeds and finds no prior team revision, including cancelled revisions. No new database table or rule change.                                   |

These are consented browser measurements, not an exact accounting ledger.
Ad blockers, navigation loss and withdrawn consent can omit events. Gameplay
must never depend on Analytics being available. No historical events are backfilled.

## Verification and operating cadence

- `node --experimental-strip-types --test scripts/tests/seo.test.ts`
- `node scripts/check-seo.mjs http://127.0.0.1:3016` against a production build.
- The same HTTP check can target production after release. It makes read-only
  no-session requests and verifies public metadata, redirects, private headers,
  robots and the sitemap.
- Before release, check desktop/mobile, Thai/English, public navigation and
  anonymous fixtures, plus analytics consent/withdrawal on the deployed host.
- After release, inspect representative URLs in Search Console, confirm the
  sitemap was fetched, and confirm GA4 receipt without creating fake signups.
- After sufficient data accumulates, compare 28-day windows for Fantasy page
  impressions, clicks, CTR and consented activation events. Review actual search
  queries before expanding content. Do not infer keyword volume from guesses.
- Use PageSpeed Insights/CrUX when available; record measured values and dates.
  A quota error or insufficient traffic is not a performance score.

This is a workflow recommendation, not an automatically scheduled job.

## Reference policies

- [Google SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- [GA4 manual page views](https://developers.google.com/analytics/devguides/collection/ga4/views)
- [GA4 enhanced measurement](https://support.google.com/analytics/answer/9216061)

Re-check current official guidance before changing structured-data or AI-search
strategy. Community skills are prompts, not evidence that a ranking tactic works.

A separate URL-prefix property `https://fantasy.ppfootball.net/` was also created
and auto-verified under the domain property, then activated in GSC Wizard. Prefer
it for Fantasy-only reports without a hostname filter. It is linked to the GA4
Fantasy production web stream. `sign_up` and `first_squad_saved` are marked as key
events, once per event, with no invented monetary value.

## Release evidence (2026-10-04, Bangkok)

The foundation shipped in `4c66600` through Production release #106. Production
HTTP verification passed all seven public routes, seven representative private
routes, robots and sitemap. Google accepted the sitemap at 00:02 Bangkok; its
initial status was pending. Initial inspection of `/how-to-play` returned
"URL is unknown to Google", with no crawl yet. Neither result means indexed.

The owner's consented Incognito visit appeared in GA4 Realtime as one active
user, with `/how-to-play`, `/rules` and public fixture page views. The administrator
session loads no GA script. Signup and squad key events still await actual
consented activity; no fake member or team was created for measurement testing.

PageSpeed Insights at 00:05 Bangkok on production measured mobile lab scores
75 Performance, 96 Accessibility, 100 Best Practices and 100 SEO; LCP 4.5s,
TBT 310ms and CLS 0. CrUX returned No Data. The report identified the homepage
CSS pitch background as LCP and the Guest button's white-on-orange contrast.
The follow-up preloads that existing image at high priority and uses the existing
accessible orange action tokens. These lab values are a dated baseline, not a
ranking guarantee or a real-user Core Web Vitals result.
