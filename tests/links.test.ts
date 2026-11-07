/**
 * Site-wide integrity checks: no broken internal links, unique SEO metadata, sane configs.
 * Set STRICT_LINKS=1 to require every referenced calculator/post to exist (Phase 5 / CI).
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CALCULATOR_ENTRIES } from '@/calculators/_registry.generated';
import { POSTS } from '@/content/blog/_posts.generated';
import { CATEGORIES } from '@/lib/categories';
import { AFFILIATES } from '@/lib/affiliates';
import { defaultValues } from '@/lib/engine/values';

const strict = process.env.STRICT_LINKS === '1';
const calcSlugs = new Set(CALCULATOR_ENTRIES.map((e) => e.config.slug));
const postSlugs = new Set(POSTS.map((p) => p.slug));
const root = path.resolve(import.meta.dirname, '..');

function mdxFiles(): string[] {
  const out: string[] = [];
  for (const dir of ['calculators', 'content/blog']) {
    const walk = (d: string) => {
      for (const f of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, f.name);
        if (f.isDirectory()) walk(p);
        else if (f.name.endsWith('.mdx')) out.push(p);
      }
    };
    walk(path.join(root, dir));
  }
  return out;
}

describe('internal links in MDX', () => {
  for (const file of mdxFiles()) {
    const text = fs.readFileSync(file, 'utf8');
    const rel = path.relative(root, file);
    it(`${rel}: CalcLink / PostLink / WorkedExample / markdown links resolve`, () => {
      const missing: string[] = [];
      for (const m of text.matchAll(/<(?:CalcLink|WorkedExample)\s+slug="([^"]+)"/g)) if (!calcSlugs.has(m[1])) missing.push(`calculator:${m[1]}`);
      for (const m of text.matchAll(/<PostLink\s+slug="([^"]+)"/g)) if (!postSlugs.has(m[1])) missing.push(`post:${m[1]}`);
      for (const m of text.matchAll(/\]\(\/calculators\/([a-z0-9-]+)\)/g)) if (!calcSlugs.has(m[1])) missing.push(`calculator:${m[1]}`);
      for (const m of text.matchAll(/\]\(\/blog\/([a-z0-9-]+)\)/g)) if (!postSlugs.has(m[1])) missing.push(`post:${m[1]}`);
      // WorkedExample must always resolve, even before strict mode.
      const hard = missing.filter((x) => text.includes(`<WorkedExample slug="${x.split(':')[1]}"`));
      expect(hard).toEqual([]);
      if (strict) expect(missing).toEqual([]);
    });
  }
});

describe('calculator configs', () => {
  const titles = new Set<string>();
  const descs = new Set<string>();
  for (const { config: c, content } of CALCULATOR_ENTRIES) {
    it(`${c.slug}: metadata, references and defaults are valid`, () => {
      expect(c.slug).toMatch(/^[a-z0-9-]+$/);
      expect(fs.existsSync(path.join(root, 'calculators', c.slug, 'config.ts'))).toBe(true);
      expect(c.metaTitle.length, 'title ≤ 60').toBeLessThanOrEqual(60);
      expect(c.metaDescription.length, 'description ≤ 155').toBeLessThanOrEqual(155);
      expect(c.metaDescription.length).toBeGreaterThan(70);
      expect(titles.has(c.metaTitle), 'unique title').toBe(false);
      expect(descs.has(c.metaDescription), 'unique description').toBe(false);
      titles.add(c.metaTitle);
      descs.add(c.metaDescription);
      expect(CATEGORIES.some((k) => k.slug === c.category)).toBe(true);
      expect(c.sources.length).toBeGreaterThan(0);
      for (const s of c.sources) expect(s.url).toMatch(/^https:\/\//);
      expect(c.relatedCalculators.length).toBeGreaterThanOrEqual(3);
      expect(c.relatedCalculators.length).toBeLessThanOrEqual(5);
      expect(c.relatedCalculators).not.toContain(c.slug);
      if (strict) for (const r of c.relatedCalculators) expect(calcSlugs.has(r), `related ${r}`).toBe(true);
      if (strict) for (const r of c.relatedPosts) expect(postSlugs.has(r), `post ${r}`).toBe(true);
      for (const a of c.affiliate ?? []) expect(a in AFFILIATES).toBe(true);
      expect(c.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(c.outputs.filter((o) => o.primary).length).toBe(1);
      expect(content, 'content.mdx exists').not.toBeNull();
      expect(content!.faq.length).toBeGreaterThanOrEqual(4);
      expect(content!.faq.length).toBeLessThanOrEqual(6);
      expect(content!.howTo.length).toBeGreaterThanOrEqual(3);
      expect(content!.howTo.length).toBeLessThanOrEqual(5);
      if (!c.widget) {
        for (const sys of ['imperial', 'metric'] as const) {
          const r = c.compute(defaultValues(c, sys), sys);
          expect(r.ok, `defaults compute in ${sys}`).toBe(true);
        }
      }
    });
  }
});

describe('blog posts', () => {
  const titles = new Set<string>();
  it('registry loads', () => expect(Array.isArray(POSTS)).toBe(true));
  for (const p of POSTS) {
    it(`${p.slug}: frontmatter is valid`, () => {
      expect(p.description.length).toBeLessThanOrEqual(155);
      expect(titles.has(p.title)).toBe(false);
      titles.add(p.title);
      expect(CATEGORIES.some((k) => k.slug === p.category)).toBe(true);
      if (strict) expect(calcSlugs.has(p.calculator), `calculator ${p.calculator}`).toBe(true);
    });
  }
});
