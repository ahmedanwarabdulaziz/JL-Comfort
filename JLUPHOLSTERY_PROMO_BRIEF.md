# Brief: promote JL Comfort on jlupholstery.com

For the Claude Code agent working in the **JL-Website** repo (`D:\Res\JL-Website`, www.jlupholstery.com).
Written by the JL Comfort session on 2026-10-29. Read all of it before starting.

## Goal

Turn jlupholstery.com's existing visitors into **JL Comfort** fabric customers, and **measure exactly how many
come from each page and each placement**, all the way to sample requests and orders.

JL Comfort (https://www.jlcomfort.com) is the online fabric shop of JL Upholstery: 6,000+ Charlotte Fabrics
upholstery fabrics by the yard, shipped across Canada.

## Facts you may use in copy (nothing else; don't invent claims or prices)

- JL Comfort is the online fabric shop of **JL Upholstery** (Milton, ON).
- **6,000+ Charlotte Fabrics** upholstery fabrics, sold by the yard, prices in CAD.
- **Free fabric samples.**
- **Free shipping on orders over $300**, shipped across Canada.
- **Charlotte Lifetime Warranty** against manufacturing defects — JL handles the claim.
- **Offer for JL Upholstery visitors: $25 off a first fabric order of $200+ with code `JLU25`** (valid to Dec 31, 2026,
  once per customer). The link applies the code automatically, so the visitor never types it.

## What to build

Work on a new branch off `main`, open a PR, **do not merge** (the owner reviews and merges).

1. **Slide-in card** (not a blocking modal), bottom corner.
   - Shows **once per visitor** (remember "dismissed" or "clicked" in `localStorage`, wrapped in try/catch; show again after 30 days).
   - Appears after **~20 s** on the page, or on **exit intent** (mouse leaving through the top of the window, desktop only).
   - Not on `/admin`, `/login`, or while the quotation form/modal is open.
   - Copy: **"Choosing fabric?"** — "Browse 6,000+ Charlotte upholstery fabrics at JL Comfort. **$25 off your first
     order of $200+**, free samples, free shipping over $300." Buttons: **Shop fabrics** (primary) and **Order free
     samples** (secondary). Close (×) button with `aria-label`, keyboard-focusable; fits a 375 px-wide phone.
2. **Inline callout** on the fabric page (`src/app/fabric`) and next to the quotation form (`QuotationFormInline` /
   `QuotationModal`): "Want to pick your own fabric? **Order free samples** from JL Comfort — and get $25 off your
   first order."
3. **Footer link**: "Shop fabric online: JL Comfort".
4. Match the site's existing look (read its layout, theme and footer first) and its comment style.

## Link format: required on every link (this is how we measure)

Every link to JL Comfort must be built by **one shared helper** (e.g. `src/lib/jlcomfortLink.ts`) so the format
can't drift:

```
https://www.jlcomfort.com<DEST>?code=JLU25
  &utm_source=jlupholstery
  &utm_medium=referral
  &utm_campaign=<PLACEMENT>
  &utm_content=<PAGE>
```

| Parameter | Value | Meaning |
|---|---|---|
| `DEST` | `/fabrics` (Shop fabrics) or `/free-fabric-samples` (samples) | Where the visitor lands |
| `code` | `JLU25` | Applies the $25 discount automatically (JL Comfort saves it for checkout) |
| `utm_source` | `jlupholstery` | Always exactly this |
| `utm_medium` | `referral` | Always exactly this |
| `utm_campaign` | **placement**: `slide_in`, `fabric_page`, `quote_form`, `footer` | Which promo was clicked |
| `utm_content` | **the jlupholstery.com page the click happened on**: the pathname without the leading slash, `/` → `home`, other `/` → `_`, lowercase, max 100 chars (e.g. `/services/sofa-reupholstery` → `services_sofa-reupholstery`) | Which page sent the visitor |

Example — clicking "Order free samples" in the slide-in on `/projects`:

```
https://www.jlcomfort.com/free-fabric-samples?code=JLU25&utm_source=jlupholstery&utm_medium=referral&utm_campaign=slide_in&utm_content=projects
```

Compute `utm_content` at click time from the current pathname (`usePathname()`), not at build time.
Open links in the same tab; if you use `target="_blank"`, add `rel="noopener"`.

## Analytics events on jlupholstery.com (its own GA4 + Clarity)

The site already loads GA4 and Clarity (`src/components/AnalyticsScripts.tsx`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`,
`NEXT_PUBLIC_MICROSOFT_CLARITY_ID`). Send these through whatever helper it uses (respect its existing consent
handling; if `gtag` isn't loaded, do nothing):

| Event | When | Parameters |
|---|---|---|
| `jlcomfort_promo_view` | The slide-in appears (once per show) | `placement: 'slide_in'`, `page: <utm_content value>` |
| `jlcomfort_promo_click` | Any JL Comfort link is clicked | `placement`, `page`, `destination` (`fabrics` / `samples`) |
| `jlcomfort_promo_dismiss` | The slide-in is closed with × | `placement: 'slide_in'`, `page` |

If Clarity is present, also call `clarity('event', 'jlcomfort_promo_click')` on click, so recordings can be
filtered to those visitors.

That gives jlupholstery's side of the funnel: **views → clicks**, per page and placement. JL Comfort records the
rest (below).

## What JL Comfort does with it (already built or being built — not your job)

- `?code=JLU25` is saved and pre-filled at checkout (live).
- Every **order** stores the `utm_*` values of the visit that brought the shopper (live).
- Being added in the JL Comfort repo: a count of **arrivals and unique visitors** from each source / placement / page,
  the same source on **sample requests**, and an admin **"Referrals" report**: arrivals → unique visitors → sample
  requests → orders → revenue, by page and placement.

## Testing (required before you open the PR)

- `npm run build` (and lint, if the repo has it) pass.
- In the dev server, at **desktop** and **375 px** width, with screenshots in the PR:
  - the slide-in appears after the delay, closes with ×, and stays closed on reload;
  - the fabric-page and quote-form callouts and the footer link render;
  - **hover/inspect each link** and confirm the full URL matches the format above, including the right
    `utm_campaign` and the current page in `utm_content` (check at least `home`, one service page, and the fabric page).
- Confirm in the browser console (or GA4 DebugView) that the three events fire with the right parameters.

## Done means

PR open on JL-Website with: a summary, the screenshots, a table of the exact URLs generated on 3+ pages, and
confirmation the events fire. Report the PR link back.
