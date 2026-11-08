import { describe, expect, it } from 'vitest';
import config, { kwhPerDay } from './config';
import { defaultValues, validateValues } from '@/lib/engine/values';

const run = (v: Record<string, unknown>, system: 'imperial' | 'metric' = 'imperial') => {
  const r = config.compute({ ...defaultValues(config, system), ...v } as never, system);
  if (!r.ok) throw new Error(r.error);
  return r.values as Record<string, number>;
};

describe('watts to kWh', () => {
  it('reproduces the EIA example: a 40 W bulb for 5 hours uses 200 Wh = 0.2 kWh', () => {
    // EIA, "Measuring electricity"
    expect(kwhPerDay(40, 5, 100)).toBeCloseTo(0.2, 12);
    const v = run({ powerUnit: 'W', watts: 40, hours: 5, duty: 100 });
    expect(v.day).toBeCloseTo(0.2, 12);
    expect(v.whDay).toBeCloseTo(200, 9);
  });
  it('treats 1 kW for 1 hour as exactly 1 kWh (EIA definition)', () => {
    expect(run({ powerUnit: 'kW', kw: 1, hours: 1, duty: 100 }).day).toBeCloseTo(1, 12);
    expect(run({ powerUnit: 'W', watts: 1000, hours: 1, duty: 100 }).day).toBeCloseTo(1, 12);
  });
  it('defaults: 100 W for 10 h every day = 1 kWh/day, 365 kWh/year', () => {
    const v = run({});
    expect(v.day).toBeCloseTo(1, 12);
    expect(v.week).toBeCloseTo(7, 12);
    expect(v.year).toBeCloseTo(365, 9);
    expect(v.month).toBeCloseTo(365 / 12, 9);
  });
  it('worked example: 1,500 W heater, 6 h/day, 60% duty, 7 days', () => {
    const v = run({ powerUnit: 'W', watts: 1500, hours: 6, duty: 60, daysPerWeek: 7 });
    expect(v.day).toBeCloseTo(5.4, 10);
    expect(v.week).toBeCloseTo(37.8, 10);
    expect(v.month).toBeCloseTo(164.25, 9);
    expect(v.year).toBeCloseTo(1971, 9);
  });
  it('scales by days used per week', () => {
    const v = run({ watts: 100, hours: 10, duty: 100, daysPerWeek: 5 });
    expect(v.week).toBeCloseTo(5, 12);
    expect(v.year).toBeCloseTo((5 * 365) / 7, 9);
  });
  it('kW and W inputs agree', () => {
    expect(run({ powerUnit: 'kW', kw: 2.2, hours: 3 }).year).toBeCloseTo(run({ powerUnit: 'W', watts: 2200, hours: 3 }).year, 9);
  });
  it('handles zero hours and zero duty', () => {
    expect(run({ hours: 0 }).day).toBe(0);
    expect(run({ duty: 0 }).year).toBe(0);
  });
  it('rejects out-of-range inputs', () => {
    const base = defaultValues(config, 'imperial');
    expect(validateValues(config, { ...base, hours: 25 }, 'imperial').hours).toBeDefined();
    expect(validateValues(config, { ...base, duty: 120 }, 'imperial').duty).toBeDefined();
    expect(validateValues(config, { ...base, watts: -5 }, 'imperial').watts).toBeDefined();
    expect(config.compute({ ...base, hours: 30 }, 'imperial').ok).toBe(false);
    expect(config.compute({ ...base, duty: 150 }, 'imperial').ok).toBe(false);
  });
  it('ignores the hidden kW field in watts mode', () => {
    const base = defaultValues(config, 'imperial');
    expect(validateValues(config, { ...base, kw: -1 }, 'imperial')).toEqual({});
  });
  it('is unit-system independent and defaults are valid in both systems', () => {
    const a = config.compute(defaultValues(config, 'imperial'), 'imperial');
    const b = config.compute(defaultValues(config, 'metric'), 'metric');
    expect(a.ok).toBe(true);
    expect(a).toEqual(b);
  });
});
