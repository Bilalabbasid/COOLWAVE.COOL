# Brief for blog-writing agents (CoolWave, coolwave.cool)

Project root: `C:\Users\bilal.abbasi\Desktop\realcoolwave` (static Next.js 16 site, MDX blog). Calculators are being built in
parallel by other agents in `calculators/<slug>/`. Read `research/AGENT_BRIEF.md` (final calculator slug list + source rules),
`research/keyword-validation.csv`, `components/BlogImage.tsx`, `components/ContentLinks.tsx`, `mdx-components.tsx`,
`app/blog/[slug]/page.tsx` and `scripts/gen-registry.mjs` (it validates your frontmatter) before writing.

## 1. Pick topics with MEASURED demand (required)
For each calculator in your task: one post (required) answering an informational question people search, plus a second post
only where there is a clearly different search intent. Never two posts with the same intent.
- The post's main keyword must have **≥ 300 US searches/month** measured on seodata.dev (Google Ads API data):
  `curl -s "https://www.seodata.dev/keyword/<keyword-with-hyphens>" | sed 's/<[^>]*>/ /g' | tr -s ' \n' ' ' | grep -o 'Monthly searches.\{0,600\}'`
  Check `research/raw/seodata/*.json` first (cached). 404 = unmeasured (do not use). The site rate-limits and other agents share it:
  **wait 10 s between requests; on HTTP 429 wait 90 s and retry.** Never estimate or invent a volume.
- Use WebSearch (load via ToolSearch `select:WebSearch`) to find the real "people also ask" questions and to read the current
  top-ranking result for your keyword. Your post must answer the question better: more precise, sourced, with a worked example.
- The post must not target the calculator page's own keyword (e.g. not "btu calculator"); it answers the question
  (e.g. "what size ac do i need").

## 2. Write the post: `content/blog/<post-slug>.mdx`
Frontmatter (YAML, all required except `related`):
```
---
title: "What Size Air Conditioner Do I Need?"          # ≤ 60 chars, unique, natural
description: "…"                                         # 120–155 chars, unique
date: 2026-11-08
updated: 2026-11-08
category: cooling-ac                                      # cooling-ac | heating-energy | weather-heat | home-climate | sound-waves
calculator: btu-calculator                                # the calculator this post supports
keyword: what size ac do i need                           # measured main keyword
image: /images/blog/<post-slug>.webp
imageAlt: "…"                                             # descriptive alt text, no "image of"
faq:
  - q: "…"
    a: "…"                                                # 3–5 items, plain text, 1–3 sentences
---
```
Body (1,000–1,800 words):
- Open with a direct answer in the first 2–3 sentences, then a link to the calculator with descriptive anchor text:
  `<CalcLink slug="btu-calculator">use our BTU calculator for your room</CalcLink>`.
- Clear H2/H3 structure (the page already renders the H1 from `title`; do NOT write an H1 or a "#" heading).
- At least one table or worked example with real numbers computed from the cited formula/source. If the calculator's
  `calculators/<slug>/config.ts` already exists you may use `<WorkedExample slug="…" inputs={{ … }} />` with its real input ids;
  otherwise write the numbers out yourself (double-check the arithmetic).
- One inline image: `<BlogImage src="/images/blog/<post-slug>-inline.webp" alt="…" caption="…" />` placed where it helps.
- Link to 2–3 other relevant calculators or posts (`<CalcLink>` / `<PostLink slug>`; only link posts YOU wrote, unless the file already exists).
- End with a short conclusion that links the calculator again, then a `## Sources` section: a numbered markdown list of real,
  verified primary sources (`1. [Title](https://…) — Publisher`). Verify every URL returns 200 and says what you cite
  (see AGENT_BRIEF.md "Verification of sources"). No invented statistics, quotes or studies.
- Do NOT write a FAQ section in the body (the page renders `faq` from frontmatter).
- Tone: plain English for a real person with the problem. No filler ("In today's world…"), no keyword stuffing,
  no paragraphs reused from calculator pages or other posts. Health/safety topics: informational, not medical advice.
- MDX gotchas: no `{` `}` in prose; write "less than" instead of a bare `<`.

## 3. Image prompts: `content/image-prompts/<post-slug>.json`
```
{ "featured": { "file": "<post-slug>.webp", "prompt": "…", "alt": "…same as imageAlt" },
  "inline":   { "file": "<post-slug>-inline.webp", "prompt": "…", "alt": "…" } }
```
Prompts: clean, light, cool blue and teal palette, soft daylight, minimal; NO text, letters, numbers, logos, brands or real
people in the image. (Images are generated later; a placeholder pipeline fills them in for now.)

## 4. Keyword log: `research/blog-keywords-parts/<your-group>.csv`
Header: `post slug,title,main keyword,US volume,secondary keywords,calculator slug,category,search intent,angle,data source`
`data source` = `seodata.dev (Google Ads API US) fetched 2026-11-08 <url>`.

## 5. Check your work
- `node scripts/gen-registry.mjs` must succeed (it throws on missing frontmatter).
- `npx vitest run tests/links.test.ts` must pass for your posts (description ≤ 155, unique titles).
- Re-read each post once for accuracy and flow.

## Do NOT
Run `npm run build` / `next dev`, edit code, edit other agents' files, or commit/push. The lead builds and pushes.

## Report (≤ 250 words)
Posts written (slug, keyword, volume, word count), sources verified, anything you could not verify, any calculator for which
no ≥ 300 question exists (and what you tried).
