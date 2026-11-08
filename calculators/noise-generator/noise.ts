/**
 * Pure noise-generation maths for the noise generator widget. No Web Audio here, so it can be unit-tested.
 * Every generator takes a random source (() => number in [0, 1)) so tests can use a seeded generator.
 */

export type NoiseColor = 'white' | 'pink' | 'brown';
export type Random = () => number;

/** Power-spectrum exponent γ in S(f) ∝ 1/f^γ: white 0, pink 1, brown (Brownian / red) 2. */
export const SPECTRAL_EXPONENT: Record<NoiseColor, number> = { white: 0, pink: 1, brown: 2 };

/** Change in power per doubling of frequency, in dB: −10·γ·log10(2). Pink ≈ −3.01 dB, brown ≈ −6.02 dB. */
export function slopePerOctave(color: NoiseColor): number {
  const s = -10 * SPECTRAL_EXPONENT[color] * Math.log10(2);
  return Object.is(s, -0) ? 0 : s;
}

/** Change in power per tenfold increase in frequency, in dB: −10·γ. */
export function slopePerDecade(color: NoiseColor): number {
  const s = -10 * SPECTRAL_EXPONENT[color];
  return Object.is(s, -0) ? 0 : s;
}

/** Small, fast seeded PRNG (mulberry32) for repeatable tests. */
export function seededRandom(seed: number): Random {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** White noise: independent uniform samples in [−1, 1), equal power at every frequency. */
export function fillWhite(out: Float32Array, random: Random): void {
  for (let i = 0; i < out.length; i++) out[i] = random() * 2 - 1;
}

/**
 * Pink noise with Paul Kellet's refined filter (musicdsp.org, "Filter to make pink noise from white",
 * March 2000): a weighted sum of first-order filters approximating −10 dB/decade (−3 dB/octave),
 * accurate to ±0.05 dB above 9.2 Hz at 44.1 kHz. Coefficients copied exactly from the source.
 */
export function fillPink(out: Float32Array, random: Random): void {
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < out.length; i++) {
    const white = random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    out[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
  }
}

/**
 * Pole of the leaky integrator used for brown noise. A pure integrator (random walk) drifts without
 * limit; a pole just under 1 keeps it bounded. Its corner frequency is about −ln(LEAK)·fs/(2π),
 * roughly 14 Hz at 44.1 kHz, so the spectrum falls at 1/f² (−6 dB/octave) across the audible range.
 */
export const BROWN_LEAK = 0.998;

/** Brown (Brownian, "red") noise: leaky integration of white noise. */
export function fillBrown(out: Float32Array, random: Random): void {
  let last = 0;
  for (let i = 0; i < out.length; i++) {
    const white = random() * 2 - 1;
    last = BROWN_LEAK * last + white;
    out[i] = last;
  }
}

export function fillNoise(color: NoiseColor, out: Float32Array, random: Random): void {
  if (color === 'white') fillWhite(out, random);
  else if (color === 'pink') fillPink(out, random);
  else fillBrown(out, random);
}

export function rmsOf(data: ArrayLike<number>): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
  return data.length ? Math.sqrt(sum / data.length) : 0;
}

/**
 * Remove any DC offset, scale to a common RMS so the three colours sound similarly loud,
 * then scale down further if a peak would clip.
 */
export function normalize(data: Float32Array, targetRms = 0.18, maxPeak = 0.98): void {
  let mean = 0;
  for (let i = 0; i < data.length; i++) mean += data[i];
  mean /= data.length || 1;
  let peak = 0;
  for (let i = 0; i < data.length; i++) {
    data[i] -= mean;
    peak = Math.max(peak, Math.abs(data[i]));
  }
  const rms = rmsOf(data);
  if (rms === 0) return;
  let k = targetRms / rms;
  if (peak * k > maxPeak) k = maxPeak / peak;
  for (let i = 0; i < data.length; i++) data[i] *= k;
}

/**
 * Make a seamless loop of `length` samples from `source` (which must hold length + fade samples):
 * the first `fade` samples cross-fade from the tail into the head, so the last output sample flows
 * straight into the first one when the buffer repeats. Without this, brown noise clicks at the seam.
 */
export function makeLoop(source: Float32Array, length: number, fade: number): Float32Array {
  if (source.length < length + fade) throw new Error('makeLoop: source too short');
  const out = source.slice(0, length);
  for (let i = 0; i < fade; i++) {
    const t = (i + 0.5) / fade;
    out[i] = source[i] * t + source[length + i] * (1 - t);
  }
  return out;
}

/** One channel of loopable, normalised noise. */
export function generateLoop(color: NoiseColor, length: number, random: Random, fade = 2048): Float32Array {
  const raw = new Float32Array(length + fade);
  fillNoise(color, raw, random);
  const loop = makeLoop(raw, length, fade);
  normalize(loop);
  return loop;
}

/** Volume slider (0–100) to linear gain. Squaring gives a more even-feeling loudness control. */
export function sliderToGain(slider: number): number {
  const s = Math.min(100, Math.max(0, slider)) / 100;
  return s * s;
}

export const SLEEP_TIMER_MINUTES = [0, 15, 30, 60, 120] as const;
export const FADE_SECONDS = 60;

/**
 * When to start fading and when to stop, in the same clock as `now` (seconds).
 * `minutes` 0 means no timer. The fade is the last minute (or the last quarter of a very short timer).
 */
export function sleepTimerPlan(now: number, minutes: number): { fadeStart: number; end: number } | null {
  if (!(minutes > 0)) return null;
  const total = minutes * 60;
  const fade = Math.min(FADE_SECONDS, total / 4);
  return { fadeStart: now + total - fade, end: now + total };
}

/** Format seconds as m:ss or h:mm:ss for the countdown. */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}
