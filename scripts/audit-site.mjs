// Post-build SEO audit over the prerendered HTML in .next/server/app.
// Checks: exactly one H1, unique <title> (≤ 60) and meta description (≤ 155), canonical on coolwave.cool,
// OG/Twitter tags, JSON-LD parses and has required fields, internal links resolve, images have alt text,
// and every built page is reachable from the home page (no orphans).
// Usage: npm run build && node scripts/audit-site.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const appDir = path.join(root, '.next', 'server', 'app');
const SITE = 'https://coolwave.cool';

const pages = new Map(); // route -> html
const walk = (d) => {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (f.name.endsWith('.html')) {
      let route = '/' + path.relative(appDir, p).replace(/\\/g, '/').replace(/\.html$/, '');
      if (route === '/index') route = '/';
      if (route.startsWith('/_') || route.includes('/_none')) continue;
      pages.set(route, fs.readFileSync(p, 'utf8'));
    }
  }
};
walk(appDir);

const issues = [];
const add = (route, msg) => issues.push(`${route}: ${msg}`);
const titles = new Map();
const descs = new Map();
const links = new Map();
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const REQUIRED_LD = {
  WebApplication: ['name', 'url', 'applicationCategory', 'offers'],
  BlogPosting: ['headline', 'datePublished', 'dateModified', 'author', 'publisher', 'image', 'mainEntityOfPage'],
  BreadcrumbList: ['itemListElement'],
  FAQPage: ['mainEntity'],
  Organization: ['name', 'url', 'logo'],
  WebSite: ['name', 'url'],
};

for (const [route, html] of pages) {
  const isNotFound = route === '/404' || route === '/_not-found';
  const h1s = html.match(/<h1[\s>]/g) ?? [];
  if (h1s.length !== 1) add(route, `${h1s.length} <h1> elements`);
  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '');
  if (!title) add(route, 'missing <title>');
  else {
    if (title.length > 60) add(route, `title ${title.length} chars: "${title}"`);
    if (!isNotFound) titles.set(title, [...(titles.get(title) ?? []), route]);
  }
  const desc = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '');
  if (!isNotFound) {
    if (!desc) add(route, 'missing meta description');
    else {
      if (desc.length > 155) add(route, `description ${desc.length} chars`);
      descs.set(desc, [...(descs.get(desc) ?? []), route]);
    }
    const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
    const expected = route === '/' ? SITE : `${SITE}${route}`;
    if (canonical !== expected) add(route, `canonical "${canonical}" ≠ "${expected}"`);
    for (const tag of ['og:title', 'og:description', 'og:url', 'og:image', 'twitter:card']) {
      if (!html.includes(`property="${tag}"`) && !html.includes(`name="${tag}"`)) add(route, `missing ${tag}`);
    }
  }
  const types = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]);
      for (const item of Array.isArray(data) ? data : [data]) {
        types.push(item['@type']);
        if (item['@context'] !== 'https://schema.org') add(route, `JSON-LD ${item['@type']} bad @context`);
        for (const k of REQUIRED_LD[item['@type']] ?? []) if (item[k] === undefined) add(route, `JSON-LD ${item['@type']} missing ${k}`);
        if (item['@type'] === 'FAQPage' && !item.mainEntity.length) add(route, 'empty FAQPage');
      }
    } catch {
      add(route, 'JSON-LD does not parse');
    }
  }
  if (!isNotFound && route !== '/' && !types.includes('BreadcrumbList')) add(route, 'no BreadcrumbList');
  if (route.startsWith('/calculators/') && !types.includes('WebApplication')) add(route, 'no WebApplication JSON-LD');
  if (/^\/blog\/(?!category)[^/]+$/.test(route) && !types.includes('BlogPosting')) add(route, 'no BlogPosting JSON-LD');
  if (route === '/' && !types.includes('Organization')) add(route, 'no Organization JSON-LD');
  for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\balt="/.test(m[0])) add(route, 'img without alt');
  const out = new Set();
  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const href = m[1].replace(/\/$/, '') || '/';
    if (/\.(png|svg|ico|webp|xml|txt|css|js)$/.test(href) || href.startsWith('/_next')) continue;
    out.add(href);
  }
  links.set(route, out);
}

const routes = new Set(pages.keys());
for (const [route, out] of links) for (const href of out) if (!routes.has(href)) add(route, `broken internal link ${href}`);
for (const [t, r] of titles) if (r.length > 1) issues.push(`duplicate title "${t}": ${r.join(', ')}`);
for (const [d, r] of descs) if (r.length > 1) issues.push(`duplicate description: ${r.join(', ')}`);

// Orphans: BFS from home
const seen = new Set(['/']);
const queue = ['/'];
while (queue.length) for (const h of links.get(queue.shift()) ?? []) if (routes.has(h) && !seen.has(h)) (seen.add(h), queue.push(h));
for (const r of routes) if (!seen.has(r) && !['/404', '/_not-found'].includes(r)) issues.push(`orphan page (not reachable from /): ${r}`);

console.log(`Audited ${pages.size} pages.`);
if (issues.length) {
  console.log(`${issues.length} issue(s):`);
  for (const i of issues) console.log(' - ' + i);
  process.exitCode = 1;
} else console.log('No issues found.');
