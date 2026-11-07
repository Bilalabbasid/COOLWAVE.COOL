// Merges per-agent CSV parts into research/keywords.csv and research/blog-keywords.csv.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

function merge(dir, out) {
  const d = path.join(root, dir);
  if (!fs.existsSync(d)) return console.log(`skip ${dir} (missing)`);
  const files = fs.readdirSync(d).filter((f) => f.endsWith('.csv')).sort();
  let header = null;
  const rows = [];
  for (const f of files) {
    const lines = fs.readFileSync(path.join(d, f), 'utf8').replace(/\r/g, '').split('\n').filter((l) => l.trim());
    if (!lines.length) continue;
    header ??= lines[0];
    rows.push(...lines.slice(1));
  }
  fs.writeFileSync(path.join(root, out), [header, ...rows].join('\n') + '\n');
  console.log(`${out}: ${rows.length} rows from ${files.length} files`);
}

merge('research/keywords-parts', 'research/keywords.csv');
merge('research/blog-keywords-parts', 'research/blog-keywords.csv');
