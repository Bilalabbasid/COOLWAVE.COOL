import { describe, expect, it } from 'vitest';
import config from './config';
import { defaultValues, validateValues } from '@/lib/engine/values';

const run = (v: Record<string, unknown>, system: 'imperial' | 'metric' = 'imperial') => {
  const r = config.compute({ ...defaultValues(config, system), ...v } as never, system);
  if (!r.ok) throw new Error(r.error);
  return r;
};
const vals = (v: Record<string, unknown>) => run(v).values as Record<string, number>;

describe('space heater running cost', () => {
  it('follows the EIA kWh definition (40 W for 5 h = 0.2 kWh)', () => {
    // EIA "Measuring electricity": a 40 W bulb used for five hours uses 0.2 kWh.
    const v = vals({ setting: 'custom', watts: 40, hours: 5, days: 1, duty: 100, rate: 1 });
    expect(v.kwhDay).toBeCloseTo(0.2, 10);
    expect(v.day).toBeCloseTo(0.2, 10);
  });

  it('costs a 1,500 W heater for 8 h a day, 30 days at $0.18 (worked example on the page)', () => {
    // 1.5 kWh per hour × $0.18 = $0.27/h; × 8 h = $2.16; × 30 = $64.80; 360 kWh
    const v = vals({ setting: 'high', hours: 8, days: 30, duty: 100, rate: 0.18 });
    expect(v.hour).toBeCloseTo(0.27, 10);
    expect(v.day).toBeCloseTo(2.16, 10);
    expect(v.month).toBeCloseTo(64.8, 10);
    expect(v.kwhMonth).toBeCloseTo(360, 10);
    expect(v.avgW).toBe(1500);
  });

  it('halves the cost on the 750 W low setting', () => {
    const hi = vals({ setting: 'high' });
    const lo = vals({ setting: 'low' });
    expect(lo.month).toBeCloseTo(hi.month / 2, 10);
    expect(lo.hour).toBeCloseTo(0.135, 10);
  });

  it('scales with thermostat cycling (worked example: 50% of the time)', () => {
    const v = vals({ setting: 'high', hours: 8, days: 30, duty: 50, rate: 0.18 });
    expect(v.avgW).toBe(750);
    expect(v.hour).toBeCloseTo(0.135, 10);
    expect(v.month).toBeCloseTo(32.4, 10);
  });

  it('uses the custom wattage only when chosen', () => {
    expect(vals({ setting: 'custom', watts: 1000, rate: 0.2 }).hour).toBeCloseTo(0.2, 10);
    expect(vals({ setting: 'high', watts: 1000 }).avgW).toBe(1500);
  });

  it('warns about wattages above the usual 1,500 W plug-in maximum', () => {
    const r = run({ setting: 'custom', watts: 2000 });
    expect(r.ok && r.status).toBe('caution');
    const ok = run({ setting: 'high' });
    expect(ok.ok && ok.status).toBe('info');
  });

  it('handles zero hours', () => {
    expect(vals({ hours: 0 }).month).toBe(0);
  });

  it('rejects impossible inputs', () => {
    const base = defaultValues(config, 'imperial');
    expect(validateValues(config, { ...base, hours: 25 }, 'imperial').hours).toBeDefined();
    expect(validateValues(config, { ...base, duty: 0 }, 'imperial').duty).toBeDefined();
    expect(validateValues(config, { ...base, duty: 120 }, 'imperial').duty).toBeDefined();
    expect(validateValues(config, { ...base, rate: -1 }, 'imperial').rate).toBeDefined();
    expect(validateValues(config, { ...base, setting: 'custom', watts: 0 }, 'imperial').watts).toBeDefined();
    // hidden wattage field is ignored for presets
    expect(validateValues(config, { ...base, watts: -5 }, 'imperial')).toEqual({});
  });

  it('gives the same answer in both unit systems', () => {
    const a = config.compute(defaultValues(config, 'imperial'), 'imperial');
    const b = config.compute(defaultValues(config, 'metric'), 'metric');
    expect(a).toEqual(b);
  });
});
