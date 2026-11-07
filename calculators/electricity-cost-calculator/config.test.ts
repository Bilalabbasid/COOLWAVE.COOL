import { describe, expect, it } from 'vitest';
import config from './config';
import { defaultValues, validateValues } from '@/lib/engine/values';

const run = (v: Record<string, unknown>) => {
  const r = config.compute({ ...defaultValues(config, 'imperial'), ...v } as never, 'imperial');
  if (!r.ok) throw new Error(r.error);
  return r.values as Record<string, number>;
};

describe('electricity cost', () => {
  it('reproduces the EIA example: a 40 W bulb for 5 hours uses 0.2 kWh', () => {
    const v = run({ mode: 'watts', watts: 40, hours: 5, days: 1, rate: 1 });
    expect(v.kwhMonth).toBeCloseTo(0.2, 10);
  });
  it('costs a 1,500 W heater for 4 h/day, 30 days at $0.18', () => {
    // 1.5 kW × 4 h = 6 kWh/day; ×30 = 180 kWh; ×0.18 = $32.40
    const v = run({ mode: 'watts', watts: 1500, hours: 4, days: 30, rate: 0.18 });
    expect(v.day).toBeCloseTo(1.08, 10);
    expect(v.month).toBeCloseTo(32.4, 10);
    expect(v.year).toBeCloseTo(388.8, 10);
    expect(v.kwhYear).toBeCloseTo(2160, 10);
  });
  it('costs a monthly kWh figure', () => {
    const v = run({ mode: 'kwh', kwhMonth: 875, rate: 0.2 });
    expect(v.month).toBeCloseTo(175, 10);
    expect(v.year).toBeCloseTo(2100, 10);
    expect(v.kwhYear).toBe(10500);
  });
  it('handles zero use', () => {
    expect(run({ mode: 'watts', hours: 0 }).month).toBe(0);
  });
  it('rejects impossible hours and negative prices', () => {
    const base = defaultValues(config, 'imperial');
    expect(validateValues(config, { ...base, hours: 25 }, 'imperial').hours).toBeDefined();
    expect(validateValues(config, { ...base, rate: -1 }, 'imperial').rate).toBeDefined();
  });
  it('ignores hidden watt fields in kWh mode', () => {
    const base = defaultValues(config, 'imperial');
    expect(validateValues(config, { ...base, mode: 'kwh', hours: 99 }, 'imperial')).toEqual({});
  });
  it('is unit-system independent', () => {
    const a = config.compute(defaultValues(config, 'imperial'), 'imperial');
    const b = config.compute(defaultValues(config, 'metric'), 'metric');
    expect(a).toEqual(b);
  });
});
