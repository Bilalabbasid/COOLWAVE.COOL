import { describe, expect, it } from 'vitest';
import config, { chartCapacity } from './config';
import { defaultValues } from '@/lib/engine/values';
import { validateValues } from '@/lib/engine/values';

const run = (v: Record<string, unknown>, system: 'imperial' | 'metric' = 'imperial') => {
  const r = config.compute({ ...defaultValues(config, system), ...v } as never, system);
  if (!r.ok) throw new Error(r.error);
  return r.values as Record<string, number>;
};

describe('ENERGY STAR chart lookup', () => {
  it.each([
    [100, 5000], [149, 5000], [150, 6000], [249, 6000], [250, 7000], [300, 8000], [350, 9000], [400, 10000],
    [450, 12000], [549, 12000], [550, 14000], [700, 18000], [999, 18000], [1000, 21000], [1200, 23000],
    [1400, 24000], [1500, 30000], [2000, 34000], [2500, 34000],
  ])('%i sq ft -> %i BTU/h', (sqft, btu) => {
    expect(chartCapacity(sqft)).toBe(btu);
  });
  it('uses 5,000 BTU/h below the chart and nothing above it', () => {
    expect(chartCapacity(60)).toBe(5000);
    expect(chartCapacity(2501)).toBeNull();
  });
});

describe('ENERGY STAR adjustments', () => {
  it('matches the chart with no adjustments', () => {
    expect(run({ area: 300, sun: 'normal', people: 2, kitchen: false }).btu).toBe(8000);
  });
  it('applies −10% shade and +10% sun', () => {
    expect(run({ area: 300, sun: 'shaded' }).btu).toBe(7200);
    expect(run({ area: 300, sun: 'sunny' }).btu).toBe(8800);
  });
  it('adds 600 BTU/h per person above two', () => {
    expect(run({ area: 300, people: 4 }).btu).toBe(9200);
    expect(run({ area: 300, people: 1 }).btu).toBe(8000);
  });
  it('adds 4,000 BTU/h for a kitchen', () => {
    expect(run({ area: 300, kitchen: true }).btu).toBe(12000);
  });
  it('combines sun, people and kitchen (worked example on the page)', () => {
    // 400 sq ft -> 10,000; sunny +10% = 11,000; 3 people +600; kitchen +4,000 = 15,600
    const v = run({ area: 400, sun: 'sunny', people: 3, kitchen: true });
    expect(v.btu).toBe(15600);
    expect(v.tons).toBeCloseTo(1.3, 10);
    expect(v.kw).toBeCloseTo(4.572, 3);
  });
});

describe('units', () => {
  it('gives the same answer in metric and imperial', () => {
    // 37.16 m² ≈ 400 sq ft
    expect(run({ area: 37.17 }, 'metric').btu).toBe(run({ area: 400 }).btu);
    expect(run({ area: 28 }, 'metric').btu).toBe(run({ area: 301.4 }).btu);
  });
  it('reports 1 ton = 12,000 BTU/h', () => {
    expect(run({ area: 500 }).tons).toBe(1);
  });
});

describe('ranges', () => {
  it('refuses areas beyond the room chart with a clear message', () => {
    const r = config.compute({ ...defaultValues(config, 'imperial'), area: 3000 }, 'imperial');
    expect(r.ok).toBe(false);
  });
  it('flags invalid inputs', () => {
    expect(validateValues(config, { ...defaultValues(config, 'imperial'), area: -5 }, 'imperial').area).toBeDefined();
    expect(validateValues(config, { ...defaultValues(config, 'imperial'), people: 0 }, 'imperial').people).toBeDefined();
  });
});
