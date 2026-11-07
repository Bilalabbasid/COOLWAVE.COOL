# CoolWave — Handoff (state as of 2026-11-08)

Repo: https://github.com/Bilalabbasid/COOLWAVE.COOL (branch `main`). Local: `C:\Users\bilal.abbasi\Desktop\realcoolwave`.
The original spec is the long "Build CoolWave (coolwave.cool)" brief; everything below is what is done and what is left.

---

## Paste this into a new Claude Code session to continue

> You are continuing the CoolWave build in `C:\Users\bilal.abbasi\Desktop\realcoolwave` (GitHub: Bilalabbasid/COOLWAVE.COOL, push to `main` after each phase).
> Read `HANDOFF.md`, `research/AGENT_BRIEF.md` (calculator rules) and `research/BLOG_BRIEF.md` (blog rules) first. The engine, layout, SEO plumbing
> and 5 calculators are done and tested; do not redesign them.
> Your job, in order:
> 1. Finish the 5 parked calculators in `wip/calculators/` (dew-point, duct-size, noise-generator, watts-to-kwh, wind-chill): add the missing
>    `content.mdx` / `config.test.ts` / keyword rows per AGENT_BRIEF.md, move each folder back to `calculators/`, and make `npm test` pass.
> 2. Build the 20 calculators that do not exist yet (list in HANDOFF.md), following AGENT_BRIEF.md exactly. You may run up to ~8 parallel
>    subagents, one or two calculators each, giving each the brief; they must not run `next build`.
> 3. Write the blog: ~40–45 posts per BLOG_BRIEF.md (measured keyword ≥300/mo on seodata.dev, pace requests 10 s), including finishing
>    `wip/blog/what-is-dew-point.mdx`, and restore the two `TODO-LINK` links in `content/blog/what-is-heat-index.mdx`.
> 4. Phase 5 audit: `npm test` (also `STRICT_LINKS=1 npx vitest run tests/links.test.ts`), `npm run build`, `node scripts/audit-site.mjs`
>    (0 issues), `node scripts/check-sources.mjs` (all 200), Lighthouse mobile ≥95 on 5 pages, hand-check 5 random calculators vs sources.
> 5. Commit + push after each phase. Then ask the owner before deploying to Vercel production.

---

## 1. What is DONE (pushed)

| Phase | Status |
|---|---|
| 0 Keyword validation | Done. `research/keyword-validation.csv` (volumes from seodata.dev = Google Ads API US data; KD is our SERP-based estimate). Owner approved the recommended 30 (27 pass + 3 near-misses: heat index, electricity cost, dehumidifier). No Food & Drink category (nothing passed). |
| 1 Setup | Done. Next.js 16.4 (App Router, `cacheComponents` OFF on purpose so every page is static and unknown slugs 404), TS strict, Tailwind v4, MDX, Vitest. |
| 2 Engine proof | Done: `btu-calculator`, `heat-index-calculator`, `electricity-cost-calculator` (tests vs ENERGY STAR chart, 52 NWS heat-index chart cells, EIA example). |
| 3 Calculators | **5 of 30 live**: the 3 above + `btu-to-watts-converter`, `space-heater-cost-calculator`. 5 more parked in `wip/` (see §2). |
| 4 Blog | **1 post live**: `what-is-heat-index` (+ placeholder images). Image pipeline done (`scripts/generate-images.ts`, `docs/IMAGES.md`). |
| 5 Audit | Tooling written (`scripts/audit-site.mjs`, `scripts/check-sources.mjs`, `tests/links.test.ts`), Lighthouse installed. Not yet run at full scale. |
| 6 Deploy | Not started. |

Tests: **146 passing**. `npm run build`: **succeeds**.

### How the project works (read before changing anything)
- **Add a calculator** = create `calculators/<slug>/config.ts` + `config.test.ts` + `content.mdx`. `scripts/gen-registry.mjs` (runs before dev/build/test)
  generates `calculators/_registry.generated.ts` and `_loaders.generated.ts`. No UI code needed.
- Engine: `lib/engine/types.ts` (config shape), `units.ts` (unit kinds + exact factors), `values.ts` (defaults, unit toggle conversion,
  validation, share-URL encode/decode), `format.ts`. UI: `components/calculator/CalculatorWidget.tsx` (client; lazy-loads only its own config).
- Interactive tools (noise/tone generator, decibel meter) use `widget:` in config → `components/widgets/*` (loaded via `WidgetHost.tsx`).
  `NoiseGenerator.tsx`, `ToneGenerator.tsx`, `DecibelMeter.tsx`, `SnowDay.tsx` are still **placeholders**. Snow day should NOT be a widget
  (build it as a normal compute config; then delete `SnowDay.tsx` and the `snow-day` entry in `WidgetHost.tsx`/`WidgetKind`).
- MDX components: `<Formula>`, `<Callout>`, `<WorkedExample slug inputs>` (runs the real compute at build time), `<CalcLink>`, `<PostLink>`, `<BlogImage>`.
- Blog: `content/blog/<slug>.mdx` with YAML frontmatter (validated by gen-registry). Images: `content/image-prompts/<slug>.json` →
  `npm run images:placeholders` (or with `GEMINI_API_KEY` for real images).
- Page template renders How-to (from `howTo` export), Assumptions, FAQ (+FAQPage JSON-LD), Sources, affiliate box, related, review box,
  max 3 ad slots (never above the tool; render nothing until `NEXT_PUBLIC_ADSENSE_CLIENT` is set).

## 2. Parked work in `wip/` (excluded from build/tests via tsconfig + vitest config)

| Item | Has | Missing |
|---|---|---|
| `wip/calculators/dew-point-calculator` | config.ts, config.test.ts, `magnus.ts` (shared psychrometrics for RH + dew point) | content.mdx, keyword row |
| `wip/calculators/duct-size-calculator` | config.ts | config.test.ts, content.mdx, keyword row |
| `wip/calculators/noise-generator` | config.ts, config.test.ts, `noise.ts` (pure maths) | content.mdx, keyword row, the real `components/widgets/NoiseGenerator.tsx` |
| `wip/calculators/watts-to-kwh-calculator` | config.ts, config.test.ts | content.mdx, keyword row |
| `wip/calculators/wind-chill-calculator` | config.ts, config.test.ts (uses new `airPressure` unit? check) | content.mdx, keyword row |
| `wip/blog/what-is-dew-point.mdx` | full post | needs dew-point calculator live + image prompts file |

These were written by agents that were stopped mid-task: **re-check every formula, test and source URL** before moving them back.
To restore one: `git mv wip/calculators/<slug> calculators/<slug>` then `npm test`.

## 3. Calculators NOT started (20)

Use the exact slugs (other pages already link to them). Notes on method/sources are in the agent prompts summarised here:

- Cooling: `ac-tonnage-calculator` (whole-house tons, estimate, cite Manual J), `seer-savings-calculator` (kWh = BTU/h × hours ÷ (SEER×1000); SEER2 note),
  `ceiling-fan-size-calculator` (DOE/ENERGY STAR blade-size table), `mini-split-size-calculator` (reuse `chartCapacity` from btu-calculator).
- Heating & Energy: `heat-pump-vs-gas-furnace-calculator` (COP/HSPF vs AFUE, EIA units), `furnace-size-calculator` (estimate by climate zone),
  `refrigerator-wattage-calculator` (EnergyGuide kWh/yr), `generator-size-calculator` (running + largest surge; CPSC CO disclaimer),
  `solar-panel-calculator` (kWh ÷ (365 × sun hours × (1−losses)); PVWatts), `heating-degree-days-calculator` (base 65 °F/18 °C).
- Weather: `relative-humidity-calculator` (inverse Magnus — import from dew-point `magnus.ts`), `wet-bulb-calculator` (Stull 2011, enforce its range),
  `snow-day-calculator` (transparent ESTIMATE scoring model, no API, normal config).
- Home Climate: `r-value-calculator` (R sum, U=1/R, Q=U·A·ΔT), `cfm-calculator` (volume×ACH/60 + ASHRAE 62.2), `air-changes-per-hour-calculator`
  (CFM×60/volume; CDC 5 ACH), `dehumidifier-size-calculator` (AHAM/ENERGY STAR pints table + 2019 DOE test change).
- Sound: `tone-generator` (widget), `decibel-meter` (widget + dB addition + NIOSH 85 dBA/3 dB exchange, estimate), `wavelength-calculator` (λ = v/f).

## 4. Known issues / TODO list

1. **Broken internal links until the calculators above exist** (related-calculator cards and CalcLinks). `node scripts/audit-site.mjs` lists them;
   final gate: `STRICT_LINKS=1 npx vitest run tests/links.test.ts` must pass.
2. `content/blog/what-is-heat-index.mdx`: two links were turned into plain text with `{/* TODO-LINK:dew-point-calculator */}` and
   `{/* TODO-LINK:wet-bulb-calculator */}` markers. Restore them as `<CalcLink>` once those calculators are live.
3. `app/category/[slug]/page.tsx` metadata: switch to `pageMeta()` from `lib/meta.ts` (audit reports missing og:url on the 5 category pages).
4. Heat index: in the most humid corner of the NWS chart (80 °F at 95–100% RH) the official NWS adjustment reads up to 2.3 °F above the printed chart.
   We follow the published algorithm exactly; this is documented on the page and in the test. Mention it in the final report.
5. The US DOE "Estimating Appliance and Home Electronic Energy Use" page now returns 404; electricity pages cite EIA instead. Don't use the DOE URL.
6. `research/keywords.csv` and `research/blog-keywords.csv`: generate with `node scripts/merge-research.mjs` once all part files exist.
7. Image API: owner will use Gemini later. The script's Gemini call (Interactions API, model `gemini-nano-banana-2.1`) was only tested with a fake key.
8. `public/images/blog/*.webp` are placeholders. Every new post needs a `content/image-prompts/<slug>.json` and `npm run images:placeholders`.
9. Lighthouse not yet run: `npm run build && npx next start -p 3100`, then
   `npx lighthouse http://localhost:3100/calculators/btu-calculator --form-factor=mobile --only-categories=performance,seo,accessibility,best-practices --quiet --chrome-flags="--headless"`.

## 5. What the OWNER needs to do (plain steps)

**A. Vercel (deploy)**
1. Go to vercel.com → sign up/log in with GitHub.
2. Click **Add New → Project**, pick **COOLWAVE.COOL**, keep defaults (Next.js), click **Deploy**. You get a preview URL.
3. To connect the domain: Project → **Settings → Domains** → type `coolwave.cool` → **Add**. Vercel shows DNS records
   (usually an **A record `@` → 76.76.21.21** and a **CNAME `www` → cname.vercel-dns.com**; use exactly what Vercel shows).
4. At your domain registrar, open DNS settings for coolwave.cool, add those records, save. Wait until Vercel shows "Valid Configuration".

**B. Google Search Console**
1. search.google.com/search-console → **Add property** → **URL prefix** → `https://coolwave.cool`.
2. Choose **HTML tag**, copy only the code inside `content="…"`.
3. In Vercel: Project → Settings → **Environment Variables** → add `NEXT_PUBLIC_GSC_VERIFICATION` = that code → Save → **Redeploy**.
4. Back in Search Console click **Verify**. Then **Sitemaps** → enter `sitemap.xml` → **Submit**.

**C. AdSense (after the site has its content)**
1. adsense.google.com → sign up with `https://coolwave.cool`.
2. Copy your publisher ID (`ca-pub-…`). In Vercel add `NEXT_PUBLIC_ADSENSE_CLIENT` = that ID → Redeploy.
3. In AdSense → **Privacy & messaging**, set up Google's consent message for EEA/UK (required for EU ads).

**D. Amazon affiliate tag**
1. affiliate-program.amazon.com → sign up → get your tracking ID (e.g. `yourname-20`).
2. Vercel → Environment Variables → `NEXT_PUBLIC_AMAZON_TAG` = your ID → Redeploy.

**E. Image key (Gemini)**
Follow `docs/IMAGES.md` (add `GEMINI_API_KEY` locally, run `npm run images -- --force`, commit the new images).

**F. Email**
The site lists `hello@coolwave.cool`. Create that mailbox (or forwarding) at your domain/email provider, or change `SITE.email` in `lib/site.ts`.

## 6. Commands
```
npm install                 # once
npm test                    # all unit + integrity tests
npm run build               # production build (also regenerates registries)
node scripts/audit-site.mjs # SEO audit of the build (H1, titles, canonical, JSON-LD, links, orphans)
node scripts/check-sources.mjs  # every cited URL returns 200
npm run images:placeholders # placeholder images for posts
```
