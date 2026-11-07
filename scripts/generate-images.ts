// Blog image pipeline.
//
// Reads every content/image-prompts/<post-slug>.json, writes the merged list to
// content/image-prompts.json and renders public/images/blog/<file> as 1200x630 WebP.
//
// Provider (first key found wins; keys are read from the environment, .env.local or .env):
//   GEMINI_API_KEY       Google Gemini API, Interactions endpoint, Nano Banana image model
//   OPENAI_API_KEY       OpenAI Image API
//   REPLICATE_API_TOKEN  FLUX.1 [schnell] on Replicate
//   (none)               local placeholder graphics (soft gradient + waves, no text)
//
// Usage:
//   npm run images                       generate missing images with the first available provider
//   npm run images -- --force            regenerate images that already exist
//   npm run images -- --only <post-slug> only this post's images
//   npm run images:placeholders          placeholder graphics, no API calls
//
// Optional model overrides: GEMINI_IMAGE_MODEL, OPENAI_IMAGE_MODEL, REPLICATE_IMAGE_MODEL.
// Paths are relative to the current working directory (the project root when run via npm).
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { parseEnv } from 'node:util';
import sharp from 'sharp';

const WIDTH = 1200;
const HEIGHT = 630;
const WEBP_QUALITY = 80;
const REQUEST_TIMEOUT_MS = 180_000;

const ROOT = process.cwd();
const PROMPTS_DIR = path.join(ROOT, 'content', 'image-prompts');
const MERGED_FILE = path.join(ROOT, 'content', 'image-prompts.json');
const OUT_DIR = path.join(ROOT, 'public', 'images', 'blog');

// Appended to every API prompt so the house style and the no-text rule always apply.
const STYLE_SUFFIX =
  'Wide landscape composition. Clean, light, minimal; cool blue and teal palette; soft daylight. ' +
  'No text, letters, numbers, logos, brands, watermarks or real people.';

type Kind = 'featured' | 'inline';
interface ImageEntry {
  post: string;
  kind: Kind;
  file: string;
  prompt: string;
  alt: string;
}
type ProviderName = 'gemini' | 'openai' | 'replicate' | 'placeholder';
interface Provider {
  name: ProviderName;
  label: string;
  /** Returns raw image bytes in any format sharp can read. */
  generate: (entry: ImageEntry) => Promise<Buffer>;
}

// ---------------------------------------------------------------- env + args

/** Loads .env.local then .env without overriding variables that are already set. */
function loadEnvFiles(): void {
  for (const name of ['.env.local', '.env']) {
    const file = path.join(ROOT, name);
    if (!fs.existsSync(file)) continue;
    try {
      const vars = parseEnv(fs.readFileSync(file, 'utf8'));
      for (const [k, v] of Object.entries(vars)) if (process.env[k] === undefined && v !== undefined) process.env[k] = v;
    } catch (err) {
      console.warn(`! Could not read ${name}: ${errMessage(err)}`);
    }
  }
}

interface Args {
  force: boolean;
  placeholders: boolean;
  only: string | null;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { force: false, placeholders: false, only: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--force') args.force = true;
    else if (a === '--placeholders') args.placeholders = true;
    else if (a === '--only') {
      const v = argv[++i];
      if (!v || v.startsWith('--')) fail('--only needs a post slug, e.g. --only what-size-ac-do-i-need');
      args.only = v;
    } else if (a.startsWith('--only=')) args.only = a.slice('--only='.length);
    else if (a === '--help' || a === '-h') {
      console.log('Usage: tsx scripts/generate-images.ts [--placeholders] [--force] [--only <post-slug>]');
      process.exit(0);
    } else fail(`Unknown argument "${a}". Use --placeholders, --force or --only <post-slug>.`);
  }
  return args;
}

function fail(msg: string): never {
  console.error(`x ${msg}`);
  process.exit(1);
}

// Values of these variables are scrubbed from any message we print.
const SECRET_VARS = ['GEMINI_API_KEY', 'OPENAI_API_KEY', 'REPLICATE_API_TOKEN'];
function redact(text: string): string {
  let out = text;
  for (const v of SECRET_VARS) {
    const secret = process.env[v];
    if (secret && secret.length >= 6) out = out.split(secret).join('[redacted]');
  }
  // Providers sometimes echo a partly masked key (e.g. "sk-abc***1234"); hide those too.
  return out.replace(/\b(?:sk|r8|AIza)[-_A-Za-z0-9]*\*+[-_A-Za-z0-9*]*/g, '[redacted]');
}
function errMessage(err: unknown): string {
  return redact(err instanceof Error ? err.message : String(err));
}

// ---------------------------------------------------------------- prompts

function readPrompts(): ImageEntry[] {
  if (!fs.existsSync(PROMPTS_DIR)) return [];
  const files = fs
    .readdirSync(PROMPTS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();
  const entries: ImageEntry[] = [];
  const problems: string[] = [];
  for (const f of files) {
    const post = f.slice(0, -'.json'.length);
    let data: unknown;
    try {
      data = JSON.parse(fs.readFileSync(path.join(PROMPTS_DIR, f), 'utf8'));
    } catch (err) {
      problems.push(`${f}: invalid JSON (${errMessage(err)})`);
      continue;
    }
    if (!isRecord(data)) {
      problems.push(`${f}: expected an object with "featured" and "inline"`);
      continue;
    }
    for (const kind of ['featured', 'inline'] as const) {
      const item = data[kind];
      if (item === undefined) continue;
      if (!isRecord(item)) {
        problems.push(`${f}: "${kind}" must be an object`);
        continue;
      }
      const { file, prompt, alt } = item;
      if (typeof file !== 'string' || !/^[a-z0-9][a-z0-9._-]*\.webp$/i.test(file)) {
        problems.push(`${f}: "${kind}.file" must be a plain file name ending in .webp`);
        continue;
      }
      if (typeof prompt !== 'string' || !prompt.trim()) {
        problems.push(`${f}: "${kind}.prompt" is missing`);
        continue;
      }
      entries.push({ post, kind, file, prompt: prompt.trim(), alt: typeof alt === 'string' ? alt.trim() : '' });
    }
  }
  const seen = new Map<string, string>();
  for (const e of entries) {
    const prev = seen.get(e.file);
    if (prev) problems.push(`"${e.file}" is used by both ${prev} and ${e.post}`);
    seen.set(e.file, e.post);
  }
  if (problems.length) {
    console.error('x Problems in content/image-prompts:');
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  return entries;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function writeMerged(entries: ImageEntry[]): void {
  const text = JSON.stringify(entries, null, 2) + '\n';
  if (fs.existsSync(MERGED_FILE) && fs.readFileSync(MERGED_FILE, 'utf8') === text) return;
  fs.writeFileSync(MERGED_FILE, text);
}

// ---------------------------------------------------------------- HTTP helpers

async function fetchWithRetry(url: string, init: RequestInit, label: string): Promise<Response> {
  const attempts = 3;
  for (let i = 1; ; i++) {
    let res: Response;
    try {
      res = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch (err) {
      if (i >= attempts) throw new Error(`${label}: request failed (${errMessage(err)})`);
      await sleep(2000 * i);
      continue;
    }
    if (res.ok) return res;
    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && i < attempts) {
      const wait = Number(res.headers.get('retry-after')) * 1000 || 5000 * i;
      console.log(`    ${label} returned HTTP ${res.status}, retrying in ${Math.round(wait / 1000)} s`);
      await sleep(wait);
      continue;
    }
    const body = redact(apiErrorText(await res.text().catch(() => '')));
    throw new Error(`${label}: HTTP ${res.status} ${res.statusText}${body ? ` - ${body}` : ''}`);
  }
}

/** Pulls the human-readable message out of a JSON error body (Google, OpenAI and Replicate shapes). */
function apiErrorText(body: string): string {
  try {
    let json: unknown = JSON.parse(body);
    if (Array.isArray(json)) json = json[0];
    if (isRecord(json)) {
      const err = json.error;
      if (isRecord(err) && typeof err.message === 'string') return err.message;
      if (typeof err === 'string') return err;
      if (typeof json.detail === 'string') return json.detail;
      if (typeof json.message === 'string') return json.message;
    }
  } catch {
    // not JSON
  }
  return body.replace(/\s+/g, ' ').trim().slice(0, 300);
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function download(url: string): Promise<Buffer> {
  const res = await fetchWithRetry(url, {}, 'image download');
  return Buffer.from(await res.arrayBuffer());
}

const fullPrompt = (e: ImageEntry) => `${e.prompt}\n\n${STYLE_SUFFIX}`;

// ---------------------------------------------------------------- providers

// Gemini API, Interactions endpoint (https://aistudio.google.com/docs/image-generation):
// POST https://generativelanguage.googleapis.com/v1beta/interactions, key in x-goog-api-key,
// response_format { type: "image", aspect_ratio, image_size }. Images come back in
// steps[type=model_output].content[type=image].data (base64). Imagen is shut down.
function geminiProvider(key: string): Provider {
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-nano-banana-2.1';
  return {
    name: 'gemini',
    label: `Google Gemini (${model})`,
    async generate(entry) {
      const res = await fetchWithRetry(
        'https://generativelanguage.googleapis.com/v1beta/interactions',
        {
          method: 'POST',
          headers: {
            'x-goog-api-key': key,
            'Content-Type': 'application/json',
            'Api-Revision': '2026-05-20',
          },
          body: JSON.stringify({
            model,
            input: fullPrompt(entry),
            response_format: { type: 'image', aspect_ratio: '16:9', image_size: '1K' },
            store: false,
          }),
        },
        'Gemini',
      );
      const json: unknown = await res.json();
      if (!isRecord(json)) throw new Error('Gemini: unexpected response');
      const steps = Array.isArray(json.steps) ? json.steps : [];
      for (const step of [...steps].reverse()) {
        if (!isRecord(step) || step.type !== 'model_output' || !Array.isArray(step.content)) continue;
        for (const block of step.content) {
          if (!isRecord(block) || block.type !== 'image') continue;
          if (typeof block.data === 'string' && block.data) return Buffer.from(block.data, 'base64');
          if (typeof block.uri === 'string' && block.uri) return download(block.uri);
        }
      }
      const status = typeof json.status === 'string' ? json.status : 'unknown';
      const errors = json.errors ? ` ${redact(JSON.stringify(json.errors)).slice(0, 300)}` : '';
      const text = steps
        .flatMap((s) => (isRecord(s) && Array.isArray(s.content) ? s.content : []))
        .map((b) => (isRecord(b) && typeof b.text === 'string' ? b.text : ''))
        .join(' ')
        .trim()
        .slice(0, 200);
      throw new Error(`Gemini returned no image (status ${status}).${errors}${text ? ` Model said: ${text}` : ''}`);
    },
  };
}

// OpenAI Image API (https://developers.openai.com/api/docs/guides/image-generation):
// POST https://api.openai.com/v1/images/generations, base64 result in data[0].b64_json.
function openaiProvider(key: string): Provider {
  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-flare';
  return {
    name: 'openai',
    label: `OpenAI (${model})`,
    async generate(entry) {
      const res = await fetchWithRetry(
        'https://api.openai.com/v1/images/generations',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt: fullPrompt(entry),
            n: 1,
            size: '1536x1024',
            quality: 'medium',
            output_format: 'webp',
            output_compression: 90,
          }),
        },
        'OpenAI',
      );
      const json: unknown = await res.json();
      const first = isRecord(json) && Array.isArray(json.data) ? json.data[0] : undefined;
      if (isRecord(first) && typeof first.b64_json === 'string') return Buffer.from(first.b64_json, 'base64');
      if (isRecord(first) && typeof first.url === 'string') return download(first.url);
      throw new Error('OpenAI returned no image');
    },
  };
}

// Replicate (https://replicate.com/black-forest-labs/flux-schnell/api):
// POST /v1/models/{owner}/{name}/predictions with "Prefer: wait"; output is an array of file URLs.
function replicateProvider(token: string): Provider {
  const model = process.env.REPLICATE_IMAGE_MODEL || 'black-forest-labs/flux-schnell';
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  return {
    name: 'replicate',
    label: `Replicate (${model})`,
    async generate(entry) {
      const res = await fetchWithRetry(
        `https://api.replicate.com/v1/models/${model}/predictions`,
        {
          method: 'POST',
          headers: { ...headers, Prefer: 'wait=60' },
          body: JSON.stringify({
            input: { prompt: fullPrompt(entry), aspect_ratio: '16:9', num_outputs: 1, output_format: 'png' },
          }),
        },
        'Replicate',
      );
      let pred: unknown = await res.json();
      // If the model did not finish within the wait window, poll until it does.
      const deadline = Date.now() + REQUEST_TIMEOUT_MS;
      while (isRecord(pred) && (pred.status === 'starting' || pred.status === 'processing')) {
        if (Date.now() > deadline) throw new Error('Replicate: timed out waiting for the prediction');
        const urls = isRecord(pred.urls) ? pred.urls : {};
        if (typeof urls.get !== 'string') throw new Error('Replicate: no polling URL in response');
        await sleep(2000);
        pred = await (await fetchWithRetry(urls.get, { headers }, 'Replicate')).json();
      }
      if (!isRecord(pred)) throw new Error('Replicate: unexpected response');
      if (pred.status !== 'succeeded') {
        throw new Error(`Replicate prediction ${String(pred.status)}: ${redact(String(pred.error ?? '')).slice(0, 300)}`);
      }
      const out = Array.isArray(pred.output) ? pred.output[0] : pred.output;
      if (typeof out !== 'string') throw new Error('Replicate returned no image URL');
      return download(out);
    },
  };
}

// ---------------------------------------------------------------- placeholders

/** FNV-1a hash, so every file gets its own stable colours and wave phase. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Small deterministic PRNG (mulberry32). */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function wavePath(baseY: number, amp: number, wavelength: number, phase: number, amp2: number): string {
  const pts: string[] = [];
  for (let x = -20; x <= WIDTH + 20; x += 10) {
    const y =
      baseY + amp * Math.sin((2 * Math.PI * x) / wavelength + phase) + amp2 * Math.sin((2 * Math.PI * x) / (wavelength * 0.47) + phase * 1.7);
    pts.push(`${x},${y.toFixed(1)}`);
  }
  return `M-20,${HEIGHT + 20} L${pts.join(' L')} L${WIDTH + 20},${HEIGHT + 20} Z`;
}

function placeholderSvg(file: string): string {
  const r = rng(hash(file));
  const hue = 180 + r() * 28; // teal (180) to sky blue (208)
  const hue2 = hue + 4 + r() * 10;
  const tilt = Math.round(r() * 40 - 20);
  const sunX = Math.round(150 + r() * 900);
  const sunY = Math.round(90 + r() * 120);
  const layers = 4;
  let waves = '';
  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1);
    const baseY = HEIGHT * (0.42 + t * 0.4) + (r() - 0.5) * 30;
    const amp = 14 + r() * 26 - t * 4;
    const wavelength = 420 + r() * 520;
    const phase = r() * Math.PI * 2;
    const amp2 = 4 + r() * 10;
    const light = Math.round(80 - t * 34);
    const sat = Math.round(45 + t * 20);
    const opacity = (0.55 + t * 0.35).toFixed(2);
    const h = Math.round(hue + (hue2 - hue) * t);
    waves += `<path d="${wavePath(baseY, amp, wavelength, phase, amp2)}" fill="hsl(${h} ${sat}% ${light}%)" fill-opacity="${opacity}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>
  <linearGradient id="sky" gradientTransform="rotate(${90 + tilt} 0.5 0.5)">
    <stop offset="0" stop-color="hsl(${Math.round(hue2)} 70% 95%)"/>
    <stop offset="1" stop-color="hsl(${Math.round(hue)} 60% 84%)"/>
  </linearGradient>
  <radialGradient id="glow" cx="${sunX}" cy="${sunY}" r="360" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#ffffff" stop-opacity="0.85"/>
    <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#sky)"/>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
${waves}
</svg>`;
}

const placeholderProvider: Provider = {
  name: 'placeholder',
  label: 'local placeholders (no API key used)',
  async generate(entry) {
    return Buffer.from(placeholderSvg(entry.file));
  },
};

// ---------------------------------------------------------------- main

function pickProvider(args: Args): Provider {
  if (args.placeholders) return placeholderProvider;
  const gemini = process.env.GEMINI_API_KEY?.trim();
  if (gemini) return geminiProvider(gemini);
  const openai = process.env.OPENAI_API_KEY?.trim();
  if (openai) return openaiProvider(openai);
  const replicate = process.env.REPLICATE_API_TOKEN?.trim();
  if (replicate) return replicateProvider(replicate);
  console.log('i No GEMINI_API_KEY, OPENAI_API_KEY or REPLICATE_API_TOKEN found: using placeholders.');
  return placeholderProvider;
}

async function toWebp(input: Buffer, out: string): Promise<void> {
  const tmp = `${out}.tmp-${process.pid}`;
  try {
    await sharp(input)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'attention' })
      .webp({ quality: WEBP_QUALITY })
      .toFile(tmp);
    await fsp.rename(tmp, out);
  } finally {
    await fsp.rm(tmp, { force: true });
  }
}

async function main(): Promise<void> {
  loadEnvFiles();
  const args = parseArgs(process.argv.slice(2));

  const all = readPrompts();
  writeMerged(all);
  console.log(`- ${all.length} image prompt(s) from ${new Set(all.map((e) => e.post)).size} post(s); wrote content/image-prompts.json`);

  const entries = args.only ? all.filter((e) => e.post === args.only) : all;
  if (args.only && entries.length === 0) fail(`No prompts found for post "${args.only}" (expected content/image-prompts/${args.only}.json).`);
  if (entries.length === 0) {
    console.log('- Nothing to generate.');
    return;
  }

  const provider = pickProvider(args);
  console.log(`- Provider: ${provider.label}`);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let made = 0;
  let skipped = 0;
  const failed: string[] = [];
  for (const [i, entry] of entries.entries()) {
    const out = path.join(OUT_DIR, entry.file);
    const tag = `[${i + 1}/${entries.length}] ${entry.file}`;
    if (!args.force && fs.existsSync(out)) {
      skipped++;
      console.log(`  skip  ${tag} (exists; use --force to redo)`);
      continue;
    }
    const started = Date.now();
    try {
      const raw = await provider.generate(entry);
      await toWebp(raw, out);
      made++;
      const kb = Math.round(fs.statSync(out).size / 1024);
      console.log(`  ok    ${tag} (${kb} KB, ${((Date.now() - started) / 1000).toFixed(1)} s)`);
    } catch (err) {
      failed.push(entry.file);
      console.error(`  FAIL  ${tag}: ${errMessage(err)}`);
    }
  }

  console.log(`\nDone: ${made} created, ${skipped} skipped, ${failed.length} failed.`);
  if (failed.length) {
    console.error(`Failed: ${failed.join(', ')}`);
    process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  console.error(`x ${errMessage(err)}`);
  process.exit(1);
});
