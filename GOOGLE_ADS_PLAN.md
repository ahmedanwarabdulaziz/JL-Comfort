# Google Ads Plan — JL Comfort

The working plan for Google Shopping ads: what is set up, why, and how to run it week to week.
Set up on 2026-10-29. Update this file whenever a setting or decision changes.

## Accounts and IDs

| What | ID / value | Where it lives |
|---|---|---|
| Google Ads account | `AW-18417842011` | ads.google.com |
| Merchant Center | `5883445376` (Canada only) | merchants.google.com |
| GA4 property | `G-YP5V8R2CYX` | analytics.google.com |
| Search Console | Domain property `jlcomfort.com` | search.google.com/search-console |
| Microsoft Clarity | `ykxe05uvc5` | clarity.microsoft.com |
| Product feed | `https://www.jlcomfort.com/feeds/products.xml` (daily fetch, 3 AM Toronto) | `app/feeds/products.xml/route.ts` |

Site env vars (Vercel, team `jls-projects-986efea5`, project `jl-comfort`, Production):
`NEXT_PUBLIC_GA4_ID`, `GA4_API_SECRET`, `NEXT_PUBLIC_CLARITY_PROJECT_ID`, `NEXT_PUBLIC_GOOGLE_ADS_ID`,
`NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL`, `NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL`. `NEXT_PUBLIC_*` values are baked in at
build time, so a change only takes effect after a redeploy.

## Business numbers behind the plan

- **Gross margin:** about 40% → break-even ROAS is **250%** ($2.50 in sales per $1 of ads). Target **350%+**.
- **Budget:** $400–$450 / month → **$14 / day**.
- **Prices:** $49.90–$127.90 per yard, median $82.90.
- **Shipping:** $30 per order + $2/yd (vinyl $4/yd). **Free shipping over $300** (Admin → Shipping). Revisit at the
  week-4 review: lower to $250 if many orders land just under $300.
- **Free samples:** the main lead offer; tracked as the "Sample request" conversion.

## Conversion tracking

| Conversion | Type | Value | Count | Window | Used for bidding |
|---|---|---|---|---|---|
| Purchase | Purchase | Real order total (dynamic) | Every | 90 days | Yes (primary) |
| Sample request | Submit lead form | $5 fixed | One | 90 days | Yes (primary) |

- Fired by `lib/analytics/track.ts` (`trackPurchase`, `trackSampleRequest`) through the Google tag.
- **Enhanced conversions** on (Google tag, code method): the site sends the hashed email on purchase.
- Phone call and Contact goals were set to **secondary** so they don't steer bidding.
- **Do not** import GA4 `purchase` into Ads as well — it would double-count sales.

### Consent (affects what gets measured)

- Outside Quebec: analytics **and** advertising cookies are **on by default**, with a one-click "Essential only"
  opt-out (owner's decision, PR #47).
- Quebec, or location unknown: everything optional stays **off** until the visitor opts in (Law 25).
- The admin panel records every order and its source regardless of consent — treat it as the true sales count.

## Merchant Center

- Target country: **Canada only.** The US was removed — the site doesn't sell or ship there. Re-add only after
  checkout, shipping and the feed support US orders.
- Shipping: "Standard", 3–5 business days handling + 3–7 transit, $32 fallback; the feed carries the exact per-item
  shipping and the $300 free-shipping threshold.
- Returns: no returns accepted (cut to order); defects covered within 14 days — matches `/shipping-returns`.
- Free listings: on. Linked to Google Ads, GA4 and Search Console.
- **Feed custom labels** (keep values stable — renaming one splits its history):

| Label | Meaning | Values |
|---|---|---|
| `custom_label_0` | Price band | `under-80`, `80-100`, `100-plus` |
| `custom_label_1` | Fabric group | `performance`, `velvet`, `boucle`, `linen`, `chenille`, `vinyl`, `other` |
| `custom_label_2` | Pattern | `plain/solid`, `abstract/geometric`, `stripe`, `floral`, … |
| `custom_label_3` | *(free — planned: best-seller)* | |
| `custom_label_4` | *(free — planned: margin tier)* | |

- Known risk: product images are hotlinked from charlottefabrics.com, which runs bot protection (7 images failed
  to process at launch). If failures grow, mirror the images to our own storage (Cloudflare R2).

## Campaign: "Shopping – All Fabrics" (launched 2026-10-29)

| Setting | Value | Why |
|---|---|---|
| Type | Standard Shopping (created "without guidance") | Full control; no history yet for Performance Max |
| Budget | $14 / day | ~$425 / month |
| Bidding | Manual CPC | Per-fabric-group bids |
| Networks | Google Search only (search partners off) | Keep budget on real shoppers |
| Locations | Canada, **Presence: people in or regularly in** | Don't pay for people merely "interested in" Canada |
| Quebec | Included separately, **−30% bid** | English-only site |
| Excluded | Yukon, Northwest Territories, Nunavut | Shipping there can cost more than we charge |
| Priority | Low | Matters only once there are several Shopping campaigns |
| AI Max / final URL expansion | Off | Titles are already search-optimised; keep clicks on the exact fabric |
| Audiences | All Users + Purchasers of JL Comfort, **Observation** | Learn how returning visitors behave without limiting reach |
| Business logo | Not added yet | Needs advertiser verification (D-U-N-S); upload `public/images/square-logo-1024.png` once approved |

### Product groups (ad group "All fabrics", split by `custom_label_1`)

| Group | Max CPC |
|---|---|
| performance | $0.85 |
| velvet | $0.80 |
| boucle | $0.80 |
| linen | $0.70 |
| chenille | $0.70 |
| other | $0.55 |
| Everything else in "All products" | $0.50 |

### Negative keywords (campaign level, 37)

Broad: wholesale, cheap, quilting, quilt, curtain, curtains, drapery, apparel, dress, cosplay, costume, needle,
thread, dye, glue, patch, repair, cleaning, cleaner, shampoo, jobs, careers, hiring, course, class, youtube, ikea,
walmart, amazon.
Phrase: "cotton print", "sewing machine", "fabric paint", "repair kit", "near me", "store hours", "pattern pdf",
"how to".

Deliberately **not** negative: *free* (free-sample searchers are good leads), *diy*, *roll/bolt* (DIYers and
upholstery shops are customers), *sheer* (we sell performance sheers), *fabricland* (competitor — add only if we
decide not to show on their searches).

## Weekly routine (~15 min, e.g. Mondays)

1. **Insights and reports → Search terms:** add irrelevant searches as negatives (and note good ones).
2. **Ad groups → Product groups:** raise bids ~10–15% on groups with sales at a good ROAS; lower bids on groups with
   many clicks and no sales (after ~2× the average order value in spend).
3. **Merchant Center → Products → Needs attention:** fix anything new (disapprovals, image issues).
4. Note anything odd here or in the session notes.

## Milestones

| When | What |
|---|---|
| ~Nov 3, 2026 | Merchant Center initial review finishes → products move from Limited to Approved |
| Day 7 | First check-in: product groups + search terms |
| Week 4 (late Nov 2026) | Review: orders, ROAS, average order value, free-shipping threshold, results by province, device and hour |
| ~30 conversions | Add a **feed-only Performance Max** campaign: Maximize conversion value, then target ROAS 350%; keep Standard Shopping running for comparison |
| Later | Fill `custom_label_3` (best-sellers) and `custom_label_4` (margin); consider AI Max once on automated bidding |

## Change log

| Date | Change |
|---|---|
| 2026-10-29 | Accounts linked, conversions created, consent defaults (PR #47), feed labels + free-shipping threshold (PR #48), campaign launched |
