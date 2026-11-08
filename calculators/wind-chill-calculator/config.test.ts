import { describe, expect, it } from 'vitest';
import config, { frostbiteRisk, windChillC, windChillF } from './config';
import { defaultValues, validateValues } from '@/lib/engine/values';
import { cToF, fToC, MPH_TO_KMH } from '@/lib/engine/units';

const run = (v: Record<string, unknown>, system: 'imperial' | 'metric' = 'imperial') => {
  const r = config.compute({ ...defaultValues(config, system), ...v } as never, system);
  if (!r.ok) throw new Error(r.error);
  return r;
};

/**
 * Every cell of the official NWS Wind Chill Chart (weather.gov/media/safety/windchillchart3.pdf,
 * effective 11/01/01). Rows are wind speed (mph); columns are air temperature (°F).
 */
const TEMPS_F = [40, 35, 30, 25, 20, 15, 10, 5, 0, -5, -10, -15, -20, -25, -30, -35, -40, -45];
const NWS_CHART: Record<number, number[]> = {
  5: [36, 31, 25, 19, 13, 7, 1, -5, -11, -16, -22, -28, -34, -40, -46, -52, -57, -63],
  10: [34, 27, 21, 15, 9, 3, -4, -10, -16, -22, -28, -35, -41, -47, -53, -59, -66, -72],
  15: [32, 25, 19, 13, 6, 0, -7, -13, -19, -26, -32, -39, -45, -51, -58, -64, -71, -77],
  20: [30, 24, 17, 11, 4, -2, -9, -15, -22, -29, -35, -42, -48, -55, -61, -68, -74, -81],
  25: [29, 23, 16, 9, 3, -4, -11, -17, -24, -31, -37, -44, -51, -58, -64, -71, -78, -84],
  30: [28, 22, 15, 8, 1, -5, -12, -19, -26, -33, -39, -46, -53, -60, -67, -73, -80, -87],
  35: [28, 21, 14, 7, 0, -7, -14, -21, -27, -34, -41, -48, -55, -62, -69, -76, -82, -89],
  40: [27, 20, 13, 6, -1, -8, -15, -22, -29, -36, -43, -50, -57, -64, -71, -78, -84, -91],
  45: [26, 19, 12, 5, -2, -9, -16, -23, -30, -37, -44, -51, -58, -65, -72, -79, -86, -93],
  50: [26, 19, 12, 4, -3, -10, -17, -24, -31, -38, -45, -52, -60, -67, -74, -81, -88, -95],
  55: [25, 18, 11, 4, -3, -11, -18, -25, -32, -39, -46, -54, -61, -68, -75, -82, -89, -97],
  60: [25, 17, 10, 3, -4, -11, -19, -26, -33, -40, -48, -55, -62, -69, -76, -84, -91, -98],
};
const CELLS: [number, number, number][] = Object.entries(NWS_CHART).flatMap(([v, row]) =>
  row.map((wc, i) => [Number(v), TEMPS_F[i], wc] as [number, number, number]),
);

describe('NWS wind chill chart (all 216 cells)', () => {
  it.each(CELLS)('%i mph at %i °F -> %i °F', (v, t, expected) => {
    expect(Math.round(windChillF(t, v)) + 0).toBe(expected);
  });
  it('matches the NWS example: 0 °F and 15 mph gives −19 °F', () => {
    expect(Math.round(windChillF(0, 15))).toBe(-19);
  });
});

/** Environment Canada Wind Chill Index table and worked examples (canada.ca wind-chill-index page). */
describe('ECCC wind chill table', () => {
  const ECCC_ROWS: Record<number, number[]> = {
    10: [-3, -9, -15, -21, -27, -33, -39, -45, -51, -57, -63],
    30: [-6, -13, -20, -26, -33, -39, -45, -52, -59, -65, -72],
    60: [-9, -16, -23, -30, -36, -43, -50, -57, -64, -71, -78],
  };
  const temps = [0, -5, -10, -15, -20, -25, -30, -35, -40, -45, -50];
  for (const [kmh, row] of Object.entries(ECCC_ROWS)) {
    it.each(row.map((wc, i) => [temps[i], wc]))(`${kmh} km/h at %i °C -> %i °C`, (t, wc) => {
      // ECCC prints whole degrees. One cell (−30 °C at 30 km/h) computes to −45.6 but is printed as −45,
      // so allow up to 0.65 °C; every other cell is within 0.5 °C.
      expect(Math.abs(windChillC(t, Number(kmh)) - wc)).toBeLessThanOrEqual(0.65);
    });
  }
  it.each([
    [-15, 20, -24],
    [-20, 30, -33],
    [-30, 40, -48],
  ])('ECCC example: %i °C at %i km/h -> %i', (t, v, wc) => {
    expect(Math.round(windChillC(t, v))).toBe(wc);
  });
});

describe('frostbite risk (ECCC table)', () => {
  it.each([
    [-5, 'Low'], [-9, 'Low'], [-10, 'Moderate'], [-27, 'Moderate'], [-28, 'High'], [-39, 'High'],
    [-40, 'Very high'], [-47, 'Very high'], [-48, 'Severe'], [-54, 'Severe'], [-55, 'Extreme'], [-70, 'Extreme'],
  ])('wind chill %i °C -> %s', (wc, level) => {
    expect(frostbiteRisk(wc, -20).level).toBe(level);
  });
  it('reports no frostbite when the air is above freezing (NWS)', () => {
    expect(frostbiteRisk(-5, 2).level).toMatch(/^None/);
  });
  it('agrees with the NWS chart 30-minute frostbite boundary', () => {
    // Chart cells just outside the shaded 30-minute zone, and just inside it.
    for (const [v, t] of [[5, -5], [10, 0], [25, 5], [50, 10]]) expect(frostbiteRisk(fToC(windChillF(t, v)), fToC(t)).level).toBe('Moderate');
    for (const [v, t] of [[5, -10], [15, 0], [30, 5], [55, 10], [60, 10]]) expect(frostbiteRisk(fToC(windChillF(t, v)), fToC(t)).level).toBe('High');
  });
});

describe('compute(), units and ranges', () => {
  it('defaults: 0 °F and 15 mph', () => {
    const r = run({});
    if (!r.ok) throw new Error();
    expect(Math.round(r.values.wc as number)).toBe(-19);
    // −19 °F is −28 °C: inside the NWS chart's 30-minute frostbite zone and ECCC's High band.
    expect(r.values.risk).toBe('High');
    expect(Math.round(r.values.diff as number)).toBe(19);
  });
  it('worked example on the page: 10 °F and 25 mph', () => {
    const r = run({ temp: 10, wind: 25 });
    if (!r.ok) throw new Error();
    expect(Math.round(r.values.wc as number)).toBe(-11);
    expect(r.values.risk).toBe('Moderate');
    expect(Math.round(r.values.diff as number)).toBe(21);
  });
  it('page example: −10 °F and 20 mph is High risk (10 to 30 minutes)', () => {
    const r = run({ temp: -10, wind: 20 });
    if (!r.ok) throw new Error();
    expect(Math.round(r.values.wc as number)).toBe(-35);
    expect(r.values.time).toBe('10 to 30 minutes');
  });
  it('metric and imperial agree within 0.1 °F', () => {
    for (const [t, v] of [[0, 15], [-20, 40], [30, 10], [-40, 5]]) {
      const f = run({ temp: t, wind: v }).ok ? (run({ temp: t, wind: v }) as { values: Record<string, number> }).values.wc : NaN;
      const c = (run({ temp: fToC(t), wind: v * MPH_TO_KMH }, 'metric') as { values: Record<string, number> }).values.wc;
      expect(Math.abs(cToF(c) - f)).toBeLessThan(0.1);
    }
  });
  it('defaults are valid in both systems', () => {
    expect(run({}, 'metric').ok).toBe(true);
    expect(Math.round((run({}, 'metric') as { values: Record<string, number> }).values.wc)).toBe(-24);
  });
  it('refuses temperatures above 50 °F / 10 °C', () => {
    expect(config.compute({ temp: 51, wind: 10 }, 'imperial').ok).toBe(false);
    expect(config.compute({ temp: 50, wind: 10 }, 'imperial').ok).toBe(true);
    expect(config.compute({ temp: 10.5, wind: 10 }, 'metric').ok).toBe(false);
  });
  it('refuses calm wind (3 mph or less / under 5 km/h)', () => {
    expect(config.compute({ temp: 0, wind: 3 }, 'imperial').ok).toBe(false);
    expect(config.compute({ temp: 0, wind: 3.5 }, 'imperial').ok).toBe(true);
    expect(config.compute({ temp: -10, wind: 4 }, 'metric').ok).toBe(false);
    expect(config.compute({ temp: -10, wind: 5 }, 'metric').ok).toBe(true);
  });
  it('refuses winds beyond the charts', () => {
    expect(config.compute({ temp: 0, wind: 61 }, 'imperial').ok).toBe(false);
    expect(config.compute({ temp: -10, wind: 101 }, 'metric').ok).toBe(false);
  });
  it('field validation flags out-of-range inputs', () => {
    expect(validateValues(config, { temp: 60, wind: 10 }, 'imperial').temp).toBeDefined();
    expect(validateValues(config, { temp: 0, wind: -1 }, 'imperial').wind).toBeDefined();
  });
  it('adds the strong-wind note above 50 km/h', () => {
    const r = run({ temp: -10, wind: 35 });
    if (!r.ok) throw new Error();
    expect(r.notes!.some((n) => n.includes('50 km/h'))).toBe(true);
  });
});
