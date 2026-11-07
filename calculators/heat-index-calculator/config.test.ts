import { describe, expect, it } from 'vitest';
import config, { heatCategory, heatIndexF } from './config';
import { cToF, fToC } from '@/lib/engine/units';

/** Cells read from the official NWS heat index chart (weather.gov/safety/heat-index). [T °F, RH %, HI °F] */
const NWS_CHART: [number, number, number][] = [
  [80, 40, 80], [84, 40, 83], [90, 40, 91], [96, 40, 101], [100, 40, 109], [104, 40, 119], [110, 40, 136],
  [86, 45, 87], [92, 45, 96], [98, 45, 109], [106, 45, 130],
  [82, 50, 83], [90, 50, 95], [96, 50, 108], [102, 50, 124], [106, 50, 137],
  [88, 55, 93], [94, 55, 106], [100, 55, 124],
  [80, 60, 82], [86, 60, 91], [92, 60, 105], [98, 60, 123], [102, 60, 137],
  [84, 65, 89], [90, 65, 103], [96, 65, 121], [100, 65, 136],
  [82, 70, 86], [88, 70, 100], [94, 70, 119], [98, 70, 134],
  [86, 75, 97], [92, 75, 116], [96, 75, 132],
  [80, 80, 84], [88, 80, 106], [94, 80, 129],
  [84, 85, 96], [90, 85, 117], [94, 85, 135],
  [80, 90, 86], [86, 90, 105], [92, 90, 131],
  [82, 95, 93], [88, 95, 117], [90, 95, 127],
  [84, 100, 103], [88, 100, 121], [90, 100, 132],
];

/**
 * Known deviation: in the chart's most humid corner the published NWS high-humidity adjustment
 * reads above the printed chart (80 °F/95% -> 87.8 vs 86; 80 °F/100% -> 89.3 vs 87).
 * We implement the published algorithm exactly and document this on the page.
 */
const HUMID_CORNER: [number, number, number][] = [
  [80, 95, 86],
  [80, 100, 87],
];

describe('NWS heat index chart', () => {
  it.each(NWS_CHART)('%i °F at %i%% RH -> %i °F', (T, RH, expected) => {
    // The NWS regression is accurate to ±1.3 °F and chart cells are rounded, so allow 1.5 °F.
    expect(Math.abs(heatIndexF(T, RH) - expected)).toBeLessThanOrEqual(1.5);
  });
  it.each(HUMID_CORNER)('humid corner %i °F at %i%% RH stays within 2.5 °F of %i °F', (T, RH, expected) => {
    expect(Math.abs(heatIndexF(T, RH) - expected)).toBeLessThanOrEqual(2.5);
  });

  it('matches the NWS worked example: 96 °F and 65% RH feels like 121 °F', () => {
    expect(Math.round(heatIndexF(96, 65))).toBe(121);
  });
});

describe('algorithm branches', () => {
  it('uses the simple formula below 80 °F', () => {
    // 0.5 × (70 + 61 + 2.4 + 4.7) = 69.05
    expect(heatIndexF(70, 50)).toBeCloseTo(69.05, 2);
  });
  it('applies the dry-air adjustment (RH < 13%)', () => {
    const raw = -42.379 + 2.04901523 * 100 + 10.14333127 * 5 - 0.22475541 * 100 * 5 - 0.00683783 * 100 * 100 - 0.05481717 * 25 + 0.00122874 * 100 * 100 * 5 + 0.00085282 * 100 * 25 - 0.00000199 * 100 * 100 * 25;
    const adj = ((13 - 5) / 4) * Math.sqrt((17 - 5) / 17);
    expect(heatIndexF(100, 5)).toBeCloseTo(raw - adj, 8);
  });
  it('applies the humid-air adjustment (RH > 85%, 80–87 °F)', () => {
    expect(heatIndexF(82, 95)).toBeGreaterThan(92);
  });
});

describe('categories (NWS)', () => {
  it.each([
    [79, 'No heat-index warning level'], [85, 'Caution'], [95, 'Extreme caution'], [110, 'Danger'], [130, 'Extreme danger'],
  ])('%i °F -> %s', (hi, label) => expect(heatCategory(hi).label).toBe(label));
});

describe('compute(), units and ranges', () => {
  const ok = (temp: number, rh: number, system: 'imperial' | 'metric') => {
    const r = config.compute({ temp, rh }, system);
    if (!r.ok) throw new Error(r.error);
    return r.values as Record<string, number | string>;
  };
  it('metric and imperial agree', () => {
    const f = ok(95, 60, 'imperial').hi as number;
    const c = ok(fToC(95), 60, 'metric').hi as number;
    expect(cToF(c)).toBeCloseTo(f, 8);
  });
  it('labels danger correctly', () => {
    expect(ok(100, 50, 'imperial').level).toBe('Danger');
  });
  it('refuses temperatures above the NWS chart', () => {
    expect(config.compute({ temp: 115, rh: 30 }, 'imperial').ok).toBe(false);
  });
  it('refuses heat index values beyond the chart', () => {
    expect(config.compute({ temp: 100, rh: 90 }, 'imperial').ok).toBe(false);
  });
});
