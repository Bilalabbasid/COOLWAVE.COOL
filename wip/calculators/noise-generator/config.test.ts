import { describe, expect, it } from 'vitest';
import config from './config';
import {
  fillBrown,
  fillNoise,
  fillPink,
  fillWhite,
  formatCountdown,
  generateLoop,
  makeLoop,
  normalize,
  rmsOf,
  seededRandom,
  sleepTimerPlan,
  slopePerDecade,
  slopePerOctave,
  sliderToGain,
  type NoiseColor,
} from './noise';

const FS = 44100;

/** Average power at frequency f (Hz) over many segments, with a Hann window (Goertzel algorithm). */
function bandPower(signal: Float32Array, f: number, segment = 8192): number {
  const coeff = 2 * Math.cos((2 * Math.PI * f) / FS);
  let total = 0;
  let count = 0;
  for (let start = 0; start + segment <= signal.length; start += segment) {
    let s1 = 0;
    let s2 = 0;
    for (let n = 0; n < segment; n++) {
      const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / (segment - 1));
      const s0 = signal[start + n] * w + coeff * s1 - s2;
      s2 = s1;
      s1 = s0;
    }
    total += s1 * s1 + s2 * s2 - coeff * s1 * s2;
    count++;
  }
  return total / count;
}

/** Power (dB) averaged over a few nearby frequencies, to smooth random variation. */
function levelDb(signal: Float32Array, f: number): number {
  const fs = [0.9, 0.95, 1, 1.05, 1.1].map((k) => f * k);
  return 10 * Math.log10(fs.reduce((a, x) => a + bandPower(signal, x), 0) / fs.length);
}

function noise(color: NoiseColor, seconds = 12, seed = 1): Float32Array {
  const out = new Float32Array(FS * seconds);
  fillNoise(color, out, seededRandom(seed));
  return out;
}

describe('spectral slopes (definitions: S(f) ∝ 1/f^γ, Voss & Clarke 1975)', () => {
  it('per octave: white 0, pink −3.01 dB, brown −6.02 dB', () => {
    expect(slopePerOctave('white')).toBeCloseTo(0, 10);
    expect(slopePerOctave('pink')).toBeCloseTo(-3.0103, 4);
    expect(slopePerOctave('brown')).toBeCloseTo(-6.0206, 4);
  });
  it('per decade: 0, −10, −20 dB', () => {
    expect([slopePerDecade('white'), slopePerDecade('pink'), slopePerDecade('brown')]).toEqual([0, -10, -20]);
  });
});

describe('generated noise has the right spectrum', () => {
  // Compare power at 200 Hz and 2,000 Hz (one decade apart).
  const decade = (color: NoiseColor) => {
    const s = noise(color);
    return levelDb(s, 2000) - levelDb(s, 200);
  };
  it('white noise is flat (0 dB/decade ± 1.5 dB)', () => {
    expect(Math.abs(decade('white'))).toBeLessThan(1.5);
  });
  it('pink noise falls about 10 dB per decade (Kellet: −10 dB/decade)', () => {
    expect(decade('pink')).toBeGreaterThan(-11.5);
    expect(decade('pink')).toBeLessThan(-8.5);
  });
  it('brown noise falls about 20 dB per decade', () => {
    expect(decade('brown')).toBeGreaterThan(-21.5);
    expect(decade('brown')).toBeLessThan(-18.5);
  });
  it('pink noise keeps falling at −3 dB/octave from 100 Hz to 10 kHz', () => {
    const s = noise('pink');
    const slope = (levelDb(s, 10000) - levelDb(s, 100)) / Math.log2(100);
    expect(slope).toBeGreaterThan(-3.5);
    expect(slope).toBeLessThan(-2.5);
  });
});

describe('generators', () => {
  it('white samples are uniform in [−1, 1) with RMS ≈ 1/√3', () => {
    const s = new Float32Array(200000);
    fillWhite(s, seededRandom(7));
    expect(Math.min(...s.slice(0, 50000))).toBeGreaterThanOrEqual(-1);
    expect(Math.max(...s.slice(0, 50000))).toBeLessThan(1);
    expect(rmsOf(s)).toBeCloseTo(1 / Math.sqrt(3), 2);
  });
  it('pink filter reproduces Kellet’s first sample exactly', () => {
    const s = new Float32Array(1);
    fillPink(s, () => 0.75); // white = 0.5
    const w = 0.5;
    const expected = w * 0.0555179 + w * 0.0750759 + w * 0.153852 + w * 0.3104856 + w * 0.5329522 - w * 0.016898 + w * 0.5362;
    expect(s[0]).toBeCloseTo(expected, 6);
  });
  it('brown noise stays bounded (leaky integrator does not drift)', () => {
    const s = new Float32Array(FS * 30);
    fillBrown(s, seededRandom(3));
    expect(Math.max(...s.map(Math.abs))).toBeLessThan(200);
  });
  it('is repeatable with the same seed', () => {
    expect(noise('pink', 1, 5)).toEqual(noise('pink', 1, 5));
  });
});

describe('looping and normalisation', () => {
  it('makeLoop joins end to start without a jump', () => {
    const src = new Float32Array(FS + 2048);
    fillBrown(src, seededRandom(9));
    const loop = makeLoop(src, FS, 2048);
    const seam = Math.abs(loop[0] - loop[loop.length - 1]);
    const typicalStep = rmsOf(loop.slice(1).map((v, i) => v - loop[i]));
    expect(seam).toBeLessThan(4 * typicalStep);
  });
  it('normalize removes DC and hits the target RMS without clipping', () => {
    const s = new Float32Array(FS);
    fillBrown(s, seededRandom(2));
    for (let i = 0; i < s.length; i++) s[i] += 50;
    normalize(s, 0.18, 0.98);
    const mean = s.reduce((a, b) => a + b, 0) / s.length;
    expect(Math.abs(mean)).toBeLessThan(1e-4);
    expect(Math.max(...s.map(Math.abs))).toBeLessThanOrEqual(0.98 + 1e-6);
    expect(rmsOf(s)).toBeLessThanOrEqual(0.18 + 1e-6);
  });
  it('all three colours come out at the same level', () => {
    const levels = (['white', 'pink', 'brown'] as const).map((c) => rmsOf(generateLoop(c, FS * 2, seededRandom(4))));
    for (const l of levels) expect(l).toBeGreaterThan(0.12);
    for (const l of levels) expect(l).toBeLessThanOrEqual(0.18 + 1e-6);
  });
});

describe('controls', () => {
  it('slider to gain is 0 at 0, 1 at 100, 0.25 at 50 and clamps', () => {
    expect(sliderToGain(0)).toBe(0);
    expect(sliderToGain(50)).toBe(0.25);
    expect(sliderToGain(100)).toBe(1);
    expect(sliderToGain(150)).toBe(1);
    expect(sliderToGain(-5)).toBe(0);
  });
  it('sleep timer fades over the last 60 s', () => {
    expect(sleepTimerPlan(10, 30)).toEqual({ fadeStart: 10 + 1800 - 60, end: 10 + 1800 });
    expect(sleepTimerPlan(0, 0)).toBeNull();
  });
  it('formats the countdown', () => {
    expect(formatCountdown(59.2)).toBe('1:00');
    expect(formatCountdown(1800)).toBe('30:00');
    expect(formatCountdown(7200)).toBe('2:00:00');
    expect(formatCountdown(-3)).toBe('0:00');
  });
});

describe('config compute', () => {
  const run = (color: string) => {
    const r = config.compute({ color }, 'imperial');
    if (!r.ok) throw new Error(r.error);
    return r.values;
  };
  it('pink: −3.0 dB per octave, −10 dB per decade (worked example on the page)', () => {
    expect(run('pink').octave).toBeCloseTo(-3.0103, 4);
    expect(run('pink').decade).toBe(-10);
  });
  it('white is 0 and brown is −6.0 dB per octave', () => {
    expect(run('white').octave).toBe(0);
    expect(run('brown').octave).toBeCloseTo(-6.02, 2);
  });
  it('rejects unknown colours', () => {
    expect(config.compute({ color: 'green' }, 'metric').ok).toBe(false);
  });
  it('defaults work in both unit systems', () => {
    expect(config.compute({ color: 'pink' }, 'imperial')).toEqual(config.compute({ color: 'pink' }, 'metric'));
  });
});
