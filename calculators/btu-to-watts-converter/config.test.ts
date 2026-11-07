import { describe, expect, it } from 'vitest';
import config, { readable } from './config';
import { defaultValues, validateValues } from '@/lib/engine/values';

const run = (v: Record<string, unknown>, system: 'imperial' | 'metric' = 'imperial') => {
  const r = config.compute({ ...defaultValues(config, system), ...v } as never, system);
  if (!r.ok) throw new Error(r.error);
  return r.values as Record<string, number | string | null>;
};

describe('NIST SP 811 Appendix B.8 reference factors', () => {
  it('1 BTU/h = 0.2930711 W (listed as 2.930 711 E-01)', () => {
    expect(run({ value: 1, from: 'btuh' }).w as number).toBeCloseTo(0.2930711, 7);
  });
  it('1 ton of refrigeration (12 000 BTU/h) = 3,516.853 W (listed as 3.516 853 E+03)', () => {
    const v = run({ value: 1, from: 'ton' });
    expect(v.w as number).toBeCloseTo(3516.853, 2);
    expect(v.btuh as number).toBeCloseTo(12000, 6);
  });
  it('1 BTU_IT = 1,055.056 J (listed as 1.055 056 E+03), so 1 BTU = 1055.056/3600 Wh', () => {
    expect((run({ value: 1, from: 'btu' }).wh as number) * 3600).toBeCloseTo(1055.056, 2);
  });
  it('1 kWh = 3,412 BTU (EIA, rounded)', () => {
    const btu = run({ value: 1, from: 'kwh' }).btu as number;
    expect(Math.round(btu)).toBe(3412);
    expect(btu).toBeCloseTo(3412.14, 2);
  });
});

describe('two-way power conversion', () => {
  it('12,000 BTU/h -> 3,516.85 W (defaults, used on the page)', () => {
    const v = run({});
    expect(v.w as number).toBeCloseTo(3516.85, 2);
    expect(v.kw as number).toBeCloseTo(3.5169, 4);
    expect(v.tons).toBe(1);
    expect(v.btuh).toBeNull();
    expect(v.main).toBe('3,516.85 W');
  });
  it('1,500 W -> 5,118.2 BTU/h (space heater FAQ)', () => {
    const v = run({ value: 1500, from: 'w' });
    expect(v.btuh as number).toBeCloseTo(5118.2, 1);
    expect(v.w).toBeNull();
  });
  it('round-trips BTU/h -> W -> BTU/h', () => {
    const w = run({ value: 24000, from: 'btuh' }).w as number;
    expect(run({ value: w, from: 'w' }).btuh as number).toBeCloseTo(24000, 6);
  });
  it('3.5 kW -> 11,942 BTU/h', () => {
    expect(Math.round(run({ value: 3.5, from: 'kw' }).btuh as number)).toBe(11942);
  });
  it('conversion table values on the page', () => {
    const table: [number, number][] = [
      [5000, 1465.36], [6000, 1758.43], [8000, 2344.57], [9000, 2637.64], [10000, 2930.71],
      [12000, 3516.85], [18000, 5275.28], [24000, 7033.71], [36000, 10550.56], [48000, 14067.41], [60000, 17584.26],
    ];
    for (const [btuh, w] of table) expect(run({ value: btuh, from: 'btuh' }).w as number).toBeCloseTo(w, 2);
    for (const [w, btuh] of [[100, 341.21], [500, 1706.07], [1000, 3412.14], [1500, 5118.21], [2000, 6824.28]] as const)
      expect(run({ value: w, from: 'w' }).btuh as number).toBeCloseTo(btuh, 2);
  });
});

describe('energy conversion stays separate from power', () => {
  it('100,000 BTU (one therm) -> 29.307 kWh', () => {
    const v = run({ value: 100000, from: 'btu' });
    expect(v.kwh as number).toBeCloseTo(29.307107, 5);
    expect(v.w).toBeNull();
    expect(v.btuh).toBeNull();
    expect(v.main).toBe('29.3071 kWh');
  });
  it('power input leaves energy outputs empty', () => {
    const v = run({ value: 1000, from: 'w' });
    expect(v.kwh).toBeNull();
    expect(v.btu).toBeNull();
  });
});

describe('formatting and ranges', () => {
  it('formats readable numbers', () => {
    expect(readable(3516.85284)).toBe('3,516.85');
    expect(readable(0.000293071)).toBe('0.000293071');
    expect(readable(0)).toBe('0');
  });
  it('same answer in both unit systems (converter is unit-system independent)', () => {
    expect(run({}, 'metric').w).toBe(run({}, 'imperial').w);
  });
  it('defaults valid in both systems', () => {
    for (const s of ['imperial', 'metric'] as const) expect(config.compute(defaultValues(config, s), s).ok).toBe(true);
  });
  it('rejects negative values', () => {
    expect(validateValues(config, { ...defaultValues(config, 'imperial'), value: -1 }, 'imperial').value).toBeDefined();
    expect(config.compute({ value: -1, from: 'w' }, 'imperial').ok).toBe(false);
    expect(config.compute({ value: 1, from: 'furlongs' }, 'imperial').ok).toBe(false);
  });
});
