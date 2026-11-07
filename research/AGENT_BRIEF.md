# Brief for calculator-building agents (CoolWave, coolwave.cool)

You are building calculators for a static Next.js 16 site. Project root: `C:\Users\bilal.abbasi\Desktop\realcoolwave`.
The engine, layout and three reference calculators already exist and are verified. Copy their patterns exactly.

## Read these first (the reference implementation)
- `lib/engine/types.ts` — `CalculatorConfig`, inputs/outputs, `ComputeResult`.
- `lib/engine/units.ts` — unit kinds the toggle converts (area, temperature, tempDelta, airflow, heatRate, rValue, …) and exact factors.
- `lib/engine/format.ts` — `CURRENCIES` (use for any money input; the input id must be `currency`).
- `calculators/btu-calculator/` — config.ts, config.test.ts, content.mdx (sizing chart + adjustments).
- `calculators/heat-index-calculator/` — valid-range enforcement, status levels, disclaimer, metric↔imperial.
- `calculators/electricity-cost-calculator/` — select-driven `showIf` inputs, currency outputs.
- `mdx-components.tsx` — components usable in MDX: `<Formula>`, `<Callout>`, `<WorkedExample slug inputs system?>`, `<CalcLink slug>`.
- `tests/links.test.ts` — the integrity rules every calculator must pass.
- `research/keyword-validation.csv` — measured keyword data (primary keyword, family, SERP notes) for your calculators.

## What to create for EACH calculator (slug given in your task)
`calculators/<slug>/config.ts`, `calculators/<slug>/config.test.ts`, `calculators/<slug>/content.mdx`, and
`research/keywords-parts/<slug>.csv` (one header + one row, see below). Adding these files is all it takes; the registry is generated.

### config.ts rules
- `compute(inputs, system)` must be pure: no Date, no randomness, no I/O. Return values already in the display unit system.
- Every number input that is a physical quantity uses `unit:` (so the toggle converts it) or `unitLabel: {imperial, metric}`.
  Need a unit kind that is missing? Add it to `UNITS` in `lib/engine/units.ts` with the **Edit** tool only (never rewrite the file),
  with an exact or NIST SP 811 factor and a comment.
- Defaults must produce a valid result in BOTH systems (tests check this). Set sensible `min`/`max`; enforce formula validity ranges
  inside `compute` by returning `{ ok: false, error: '<plain-English reason and what to do instead>' }`.
- Exactly one output has `primary: true`. Use `status` (`good|caution|warning|danger|info`) and `summary` for "what this means".
- `metaTitle` ≤ 60 chars, unique, keyword first, end with ` | CoolWave` only if it fits. `metaDescription` 70–155 chars, unique.
- `h1` reads naturally around the highest-volume variant. `shortDescription` one sentence.
- `primaryKeyword` + 3–5 `secondaryKeywords` taken from the keyword family in keyword-validation.csv.
- `relatedCalculators`: 3–5 slugs from the final list below (not itself). `relatedPosts: []` (blog is added later).
- `sources`: real primary sources only (NOAA/NWS, DOE, EIA, ENERGY STAR, ASHRAE, NIOSH, OSHA, CDC, AHAM, Environment and Climate
  Change Canada, NIST, EPA, peer-reviewed papers, standards bodies). **Every URL must be opened and checked** (see Verification).
  Never invent a URL, coefficient or statistic. If you cannot verify something, leave it out and say so in your report.
- `reviewedAgainst`: the source the formula was checked against. `updated: '2026-11-08'`.
- `estimate: true` for rules of thumb without an authoritative formula; say so in `assumptions`.
- `disclaimer` for anything safety/health related.
- `affiliate`: keys from `lib/affiliates.ts` where relevant (you may append a new key with Edit if genuinely needed).
- `category`: one of `cooling-ac`, `heating-energy`, `weather-heat`, `home-climate`, `sound-waves`.

### config.test.ts rules
- Test against reference values **published by the source itself** (tables, worked examples, charts). Cite which in a comment.
- Edge cases, out-of-range inputs (expect `ok: false`), imperial vs metric giving the same physical answer, defaults valid.
- Run: `npx vitest run calculators/<slug>` — all must pass. Then `node scripts/gen-registry.mjs && npx vitest run tests/links.test.ts`.

### content.mdx rules (600–1,000 words of prose, unique, written for a real person)
- Exports first: `export const howTo = [3–5 short steps]` and `export const faq = [{ q, a }, … 4–6 items]`.
  FAQ questions should be the real "People also ask" style questions for the topic (use WebSearch to see what people ask).
  Answers are plain text (no markdown), 1–3 sentences, specific numbers where the source gives them.
- Then: a short intro (what it calculates, who it is for; no H2 before it), and H2 sections:
  the formula explained simply with variables defined (use `<Formula>`), a worked example using
  `<WorkedExample slug="<slug>" inputs={{ … }} />` whose surrounding prose quotes the same numbers (and a test asserts them),
  how to interpret the result incl. typical/good values, common mistakes. Tables welcome.
- Do NOT render "How to use", "Assumptions", "FAQ" or "Sources" headings in MDX — the page template renders those from config/exports.
- No filler ("In today's world…"), no keyword stuffing, no paragraph copied from another page. Plain, confident, accurate English.
- Internal links: `<CalcLink slug="…">descriptive anchor</CalcLink>` to 2–4 related calculators (final list below).
- MDX gotcha: curly braces in prose start JS expressions — avoid `{` `}` in text and in `<Formula>` (use parentheses).
  `<` must be written as `&lt;` or rephrased ("less than").

### research/keywords-parts/<slug>.csv
Header and one row:
`calculator,primary keyword,secondary keywords,intent,notes on top-ranking competitors,planned title,planned H1`
Secondary keywords separated by `; `. Intent is usually `calculate now`. Competitor notes from the SERP notes in keyword-validation.csv.

## Verification of sources
- Check status: `curl -s -o /dev/null -L -A "Mozilla/5.0" -w "%{http_code}" "<url>"` must be 200.
- Read the page to confirm it says what you cite: `curl -sL -A "Mozilla/5.0" "<url>" | sed 's/<[^>]*>/ /g' | tr -s ' \n' | grep -i -o ".\{0,200\}<phrase>.\{0,200\}"`
  (PDFs: download to a temp folder outside the repo and use `pdftotext` if available, otherwise confirm via WebSearch result text).
- WebSearch is available (load it with ToolSearch `select:WebSearch`). The Firecrawl search tool may also work.
- Some .gov sites block curl (403); if so, confirm via WebSearch snippets and say "confirmed via search" in your report.

## Do NOT
- Do not run `npm run build`, `next build` or `next dev` (other agents share the folder; the lead runs the build).
- Do not edit files outside your calculators' folders except: append-only Edits to `lib/engine/units.ts` or `lib/affiliates.ts`.
- Do not touch `calculators/_*.generated.ts` by hand, other agents' folders, `app/`, or `components/` (unless your task says so).
- Do not commit or push. The lead verifies, builds and pushes.

## Final slug list (use for links)
Cooling & AC: btu-calculator, ac-tonnage-calculator, seer-savings-calculator, ceiling-fan-size-calculator, mini-split-size-calculator, duct-size-calculator, btu-to-watts-converter
Heating & Energy: electricity-cost-calculator, space-heater-cost-calculator, heat-pump-vs-gas-furnace-calculator, furnace-size-calculator, watts-to-kwh-calculator, refrigerator-wattage-calculator, heating-degree-days-calculator, generator-size-calculator, solar-panel-calculator
Weather & Heat: heat-index-calculator, dew-point-calculator, wind-chill-calculator, relative-humidity-calculator, wet-bulb-calculator, snow-day-calculator
Home Climate: r-value-calculator, cfm-calculator, air-changes-per-hour-calculator, dehumidifier-size-calculator
Sound & Waves: noise-generator, tone-generator, decibel-meter, wavelength-calculator

## Your final report (keep it under 300 words)
For each calculator: tests passed (count), sources verified (URL + how), any formula/coefficient/source you could NOT fully verify,
any shared file you edited and why, anything the lead must fix.
