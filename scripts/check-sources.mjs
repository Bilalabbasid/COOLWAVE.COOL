// Checks every external URL cited in calculator configs and blog posts. Usage: node scripts/check-sources.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const files = [];
const walk = (d) => {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (/(config\.ts|\.mdx)$/.test(f.name) && !f.name.endsWith('.test.ts')) files.push(p);
  }
};
walk(path.join(root, 'calculators'));
walk(path.join(root, 'content', 'blog'));

const urls = new Map();
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  for (const m of text.matchAll(/https?:\/\/[^\s"'`)<>\]]+/g)) {
    const u = m[0].replace(/[.,;]+$/, '');
    if (/amazon\.com\/s\?/.test(u)) continue;
    if (!urls.has(u)) urls.set(u, new Set());
    urls.get(u).add(path.relative(root, f));
  }
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
async function check(u) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(u, { method, redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,application/pdf,*/*' }, signal: AbortSignal.timeout(20000) });
      if (res.ok) return { status: res.status };
      if (method === 'GET') return { status: res.status };
    } catch (e) {
      if (method === 'GET') return { status: 0, error: String(e.cause?.code ?? e.message) };
    }
  }
}

const list = [...urls.keys()];
const results = [];
for (let i = 0; i < list.length; i += 8) {
  const batch = await Promise.all(list.slice(i, i + 8).map(async (u) => ({ u, ...(await check(u)) })));
  results.push(...batch);
}
const bad = results.filter((r) => r.status !== 200);
console.log(`checked ${results.length} URLs from ${files.length} files; ${bad.length} not 200`);
for (const r of bad) console.log(`${r.status}${r.error ? ` ${r.error}` : ''}  ${r.u}\n    in ${[...urls.get(r.u)].join(', ')}`);
fs.writeFileSync(path.join(root, 'research', 'source-check.json'), JSON.stringify(results, null, 2));
