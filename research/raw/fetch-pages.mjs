// Fetch seodata.dev public keyword pages (Google Ads API volumes) and save as JSON like the API.
// Usage: node fetch-pages.mjs <kwfile> [country]
import fs from 'node:fs';
const [, , file, country = 'us'] = process.argv;
const kws = fs.readFileSync(file, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
const num = s => Number(String(s).replace(/[$,]/g, ''));
for (const k of kws) {
  const slug = k.replace(/\s+/g, '-');
  const out = `seodata/${country}-${slug}.json`;
  if (fs.existsSync(out)) {
    const prev = JSON.parse(fs.readFileSync(out, 'utf8'));
    if (!prev.error) { console.log(`${k} => cached ${prev.volume}`); continue; }
  }
  const url = country === 'us'
    ? `https://www.seodata.dev/keyword/${slug}`
    : `https://www.seodata.dev/keyword/${slug}?country=${country}`;
  try {
    const res = await fetch(url);
    if (res.status !== 200) { console.log(`${k} => HTTP ${res.status}`); fs.writeFileSync(out, JSON.stringify({ keyword: k, error: 'http_' + res.status })); continue; }
    const html = await res.text();
    const text = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
    const m = text.match(/Monthly searches ([\d,]+) CPC \$([\d.,]+) Competition ([\d.]+)/);
    if (!m) { console.log(`${k} => no data`); fs.writeFileSync(out, JSON.stringify({ keyword: k, error: 'no_data', url })); continue; }
    const similar = [];
    const rel = text.split('Keyword Volume CPC Overlap')[1] || '';
    const re = /([a-z0-9][a-z0-9 '&\-./°]*?) ([\d,]+) \$([\d.,]+) (\d+)\/20/g;
    let r;
    while ((r = re.exec(rel)) && similar.length < 15) similar.push({ keyword: r[1].trim(), volume: num(r[2]), cpc: num(r[3]), overlap: Number(r[4]) });
    const rec = { keyword: k, volume: num(m[1]), cpc: num(m[2]), competition: Number(m[3]), country, source: url, similar };
    fs.writeFileSync(out, JSON.stringify(rec));
    console.log(`${k} => ${rec.volume} | cpc ${rec.cpc} | ${similar.length} similar`);
  } catch (e) {
    console.log(`${k} => ERR ${e.message}`);
  }
  await new Promise(r => setTimeout(r, 6000));
}
