import { describe, expect, it } from 'vitest';
import config, { dewPointComfort } from './config';
import { MAGNUS_A, MAGNUS_B, MAGNUS_C, dewPoint, dewPointFromVaporPressure, relativeHumidity, saturationVaporPressure, vaporPressure } from './magnus';
import { cToF, fToC } from '@/lib/engine/units';

const tdF = (tF: number, rh: number) => cToF(dewPoint(fToC(tF), rh));

const ok = (temp: number, rh: number, system: 'imperial' | 'metric') => {
  const r = config.compute({ temp, rh }, system);
  if (!r.ok) throw new Error(r.error);
  return r;
};

describe('Magnus formula, Alduchov & Eskridge (1996) coefficients', () => {
  it('uses a = 17.625, b = 243.04 °C, c = 6.1094 hPa', () => {
    expect([MAGNUS_A, MAGNUS_B, MAGNUS_C]).toEqual([17.625, 243.04, 6.1094]);
  });
  it('es(0 °C) equals the coefficient c, 6.1094 hPa', () => {
    expect(saturationVaporPressure(0)).toBeCloseTo(6.1094, 10);
  });
  it('es(20 °C) = 6.1094·exp(17.625·20/263.04) ≈ 23.33 hPa', () => {
    expect(saturationVaporPressure(20)).toBeCloseTo(6.1094 * Math.exp((17.625 * 20) / 263.04), 10);
    expect(saturationVaporPressure(20)).toBeCloseTo(23.33, 2);
  });
});

describe('published NWS examples', () => {
  // NWS La Crosse, "Dew Point vs Humidity": "a temperature of 80 and a dew point of 60 produces a
  // relative humidity of 50%" and "a temperature of 30 and a dew point of 30 will give ... 100%".
  it('80 °F at 50% RH has a dew point of about 60 °F', () => {
    expect(Math.abs(tdF(80, 50) - 60)).toBeLessThanOrEqual(0.5);
  });
  it('30 °F at 100% RH has a dew point of 30 °F', () => {
    expect(tdF(30, 100)).toBeCloseTo(30, 8);
  });
  // NWS Tulsa WBGT page, "Examples" table [Temp °F, Dwpt °F, RH %]. Inputs and RH are printed as
  // whole numbers, so allow 1.5 °F.
  it.each([
    [90, 65, 42],
    [90, 70, 52],
    [100, 70, 39],
  ])('%i °F with %i °F dew point is listed at %i%% RH', (T, Td, RH) => {
    expect(Math.abs(tdF(T, RH) - Td)).toBeLessThanOrEqual(1.5);
  });
});

describe('Lawrence (2005) rule of thumb', () => {
  // Above about 50% RH the dew point drops roughly 1 °C for every 5% drop in RH: Td ≈ T − (100 − RH)/5.
  it.each([60, 70, 80, 90, 100])('25 °C at %i%% RH is within 1 °C of the rule', (rh) => {
    expect(Math.abs(dewPoint(25, rh) - (25 - (100 - rh) / 5))).toBeLessThan(1);
  });
});

describe('inverse function', () => {
  it('relativeHumidity(T, dewPoint(T, RH)) returns RH across the valid range', () => {
    for (let t = -40; t <= 50; t += 10) {
      for (const rh of [5, 20, 50, 80, 100]) {
        const td = dewPoint(t, rh);
        if (td < -40) continue;
        expect(relativeHumidity(t, td)).toBeCloseTo(rh, 8);
      }
    }
  });
  it('dewPointFromVaporPressure inverts vaporPressure', () => {
    expect(dewPointFromVaporPressure(vaporPressure(27, 50))).toBeCloseTo(dewPoint(27, 50), 10);
  });
  it('dew point is never above the air temperature', () => {
    for (const rh of [1, 10, 50, 99, 100]) expect(dewPoint(20, rh)).toBeLessThanOrEqual(20 + 1e-9);
  });
});

describe('comfort scale (NWS La Crosse / Louisville)', () => {
  it.each([
    [50, 'Dry and comfortable'],
    [55, 'Dry and comfortable'],
    [60, 'Becoming sticky'],
    [65, 'Oppressive'],
    [72, 'Very humid, oppressive'],
    [81, 'Extremely oppressive'],
  ])('%i °F -> %s', (td, label) => expect(dewPointComfort(td).label).toBe(label));
});

describe('compute(), units and ranges', () => {
  it('worked example: 80 °F and 50% RH -> 59.7 °F, becoming sticky', () => {
    const r = ok(80, 50, 'imperial');
    if (!r.ok) return;
    expect(Number((r.values.td as number).toFixed(1))).toBe(59.7);
    expect(Number((r.values.spread as number).toFixed(1))).toBe(20.3);
    expect(Number((r.values.e as number).toFixed(1))).toBe(17.4);
    expect(r.values.comfort).toBe('Becoming sticky');
  });
  it('metric and imperial agree', () => {
    const f = ok(86, 65, 'imperial');
    const c = ok(fToC(86), 65, 'metric');
    if (!f.ok || !c.ok) return;
    expect(cToF(c.values.td as number)).toBeCloseTo(f.values.td as number, 8);
    expect(((c.values.spread as number) * 9) / 5).toBeCloseTo(f.values.spread as number, 8);
    expect(c.values.e).toBeCloseTo(f.values.e as number, 8);
  });
  it('defaults are valid in both systems', () => {
    expect(ok(80, 50, 'imperial').ok).toBe(true);
    expect(ok(27, 50, 'metric').ok).toBe(true);
  });
  it('accepts the edges of the fitted range', () => {
    expect(ok(-40, 100, 'imperial').ok).toBe(true);
    expect(ok(50, 10, 'metric').ok).toBe(true);
  });
  it('refuses temperatures outside −40 °C to 50 °C', () => {
    expect(config.compute({ temp: 125, rh: 50 }, 'imperial').ok).toBe(false);
    expect(config.compute({ temp: 51, rh: 50 }, 'metric').ok).toBe(false);
    expect(config.compute({ temp: -41, rh: 50 }, 'metric').ok).toBe(false);
  });
  it('refuses 0% humidity and dew points below −40 °C', () => {
    expect(config.compute({ temp: 20, rh: 0 }, 'metric').ok).toBe(false);
    expect(config.compute({ temp: -30, rh: 5 }, 'metric').ok).toBe(false);
  });
  it('adds a frost-point note below freezing', () => {
    const r = ok(30, 70, 'imperial');
    if (!r.ok) return;
    expect(r.notes?.some((n) => n.includes('frost point'))).toBe(true);
  });
});
