import { describe, expect, it } from 'vitest';
import { convert, fToC, cToF } from './units';
import { convertValues, decodeState, defaultValues, encodeState, validateValues } from './values';
import { formatDuration, formatNumber } from './format';
import type { CalculatorConfig } from './types';

describe('units', () => {
  it('converts temperatures exactly', () => {
    expect(fToC(32)).toBe(0);
    expect(fToC(212)).toBe(100);
    expect(cToF(-40)).toBe(-40);
    expect(convert('temperature', 98.6, 'imperial', 'metric')).toBeCloseTo(37, 10);
  });
  it('converts linear units both ways', () => {
    expect(convert('area', 100, 'imperial', 'metric')).toBeCloseTo(9.290304, 6);
    expect(convert('area', 9.290304, 'metric', 'imperial')).toBeCloseTo(100, 6);
    expect(convert('heatRate', 12000, 'imperial', 'metric')).toBeCloseTo(3516.85, 1);
    expect(convert('tempDelta', 18, 'imperial', 'metric')).toBeCloseTo(10, 10);
  });
});

describe('formatting', () => {
  it('formats numbers with separators', () => {
    expect(formatNumber(12345.678, 1)).toBe('12,345.7');
    expect(formatNumber(NaN)).toBe('—');
  });
  it('formats durations', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(135)).toBe('2 h 15 min');
    expect(formatDuration(1440 * 2 + 60)).toBe('2 days 1 h');
  });
});

const demo: Pick<CalculatorConfig, 'inputs'> = {
  inputs: [
    { id: 'area', label: 'Area', type: 'number', unit: 'area', default: { imperial: 300, metric: 28 }, min: 1, max: { imperial: 5000, metric: 465 }, step: 1 },
    { id: 'sun', label: 'Sun', type: 'select', options: [{ value: 'shade', label: 'Shade' }, { value: 'sunny', label: 'Sunny' }], default: 'shade' },
    { id: 'kitchen', label: 'Kitchen', type: 'toggle', default: false },
  ],
};

describe('values', () => {
  it('builds defaults per system', () => {
    expect(defaultValues(demo, 'imperial')).toEqual({ area: 300, sun: 'shade', kitchen: false });
    expect(defaultValues(demo, 'metric').area).toBe(28);
  });
  it('converts inputs on unit toggle', () => {
    const v = convertValues(demo, { area: 300, sun: 'sunny', kitchen: true }, 'imperial', 'metric');
    expect(v.area).toBeCloseTo(27.87, 1);
    expect(v.sun).toBe('sunny');
  });
  it('validates ranges and types', () => {
    expect(validateValues(demo, { area: 0, sun: 'shade', kitchen: false }, 'imperial').area).toMatch(/at least/);
    expect(validateValues(demo, { area: NaN, sun: 'shade', kitchen: false }, 'imperial').area).toMatch(/number/);
    expect(validateValues(demo, { area: 300, sun: 'nope', kitchen: false }, 'imperial').sun).toBeDefined();
    expect(validateValues(demo, { area: 300, sun: 'shade', kitchen: false }, 'imperial')).toEqual({});
  });
  it('round-trips URL state', () => {
    const qs = encodeState(demo, { area: 450, sun: 'sunny', kitchen: true }, 'metric');
    expect(decodeState(demo, qs, 'imperial')).toEqual({ system: 'metric', values: { area: 450, sun: 'sunny', kitchen: true } });
    expect(decodeState(demo, '', 'imperial')).toBeNull();
    expect(decodeState(demo, 'utm_source=x', 'imperial')).toBeNull();
  });
});
