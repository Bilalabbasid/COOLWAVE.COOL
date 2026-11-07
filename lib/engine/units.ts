/**
 * Unit kinds the engine can convert when the imperial/metric toggle changes.
 * Every factor is exact or taken from NIST SP 811 (Guide for the Use of the SI).
 */
import type { UnitSystem } from './types';

interface LinearUnit {
  imperial: string;
  metric: string;
  /** metric = imperial * factor */
  factor: number;
}
interface AffineUnit {
  imperial: string;
  metric: string;
  toMetric: (v: number) => number;
  toImperial: (v: number) => number;
}
type UnitDef = LinearUnit | AffineUnit;

export const FT_TO_M = 0.3048; // exact
export const IN_TO_CM = 2.54; // exact
export const LB_TO_KG = 0.45359237; // exact
export const GAL_TO_L = 3.785411784; // US gallon, exact
export const MPH_TO_KMH = 1.609344; // exact
export const BTUH_TO_W = 0.29307107; // 1 BTU(IT)/h = 0.29307107 W (NIST SP 811)
export const R_TO_RSI = 0.1761102; // 1 ft²·°F·h/BTU = 0.1761102 m²·K/W (NIST SP 811)
export const CFM_TO_M3H = 1.6990108; // 1 ft³/min = 1.6990108 m³/h
export const FPM_TO_MS = 0.00508; // exact

export const fToC = (f: number) => ((f - 32) * 5) / 9;
export const cToF = (c: number) => (c * 9) / 5 + 32;

export const UNITS = {
  length: { imperial: 'ft', metric: 'm', factor: FT_TO_M },
  shortLength: { imperial: 'in', metric: 'cm', factor: IN_TO_CM },
  ductSize: { imperial: 'in', metric: 'mm', factor: 25.4 },
  area: { imperial: 'ft²', metric: 'm²', factor: FT_TO_M * FT_TO_M },
  volume: { imperial: 'ft³', metric: 'm³', factor: FT_TO_M ** 3 },
  liquidVolume: { imperial: 'gal', metric: 'L', factor: GAL_TO_L },
  mass: { imperial: 'lb', metric: 'kg', factor: LB_TO_KG },
  speed: { imperial: 'mph', metric: 'km/h', factor: MPH_TO_KMH },
  airflow: { imperial: 'CFM', metric: 'm³/h', factor: CFM_TO_M3H },
  airVelocity: { imperial: 'ft/min', metric: 'm/s', factor: FPM_TO_MS },
  heatRate: { imperial: 'BTU/h', metric: 'W', factor: BTUH_TO_W },
  rValue: { imperial: 'R (ft²·°F·h/BTU)', metric: 'RSI (m²·K/W)', factor: R_TO_RSI },
  temperature: {
    imperial: '°F',
    metric: '°C',
    toMetric: fToC,
    toImperial: cToF,
  },
  /** A temperature difference (no offset). */
  tempDelta: { imperial: '°F', metric: '°C', factor: 5 / 9 },
} satisfies Record<string, UnitDef>;

export type UnitKind = keyof typeof UNITS;

export function unitLabel(kind: UnitKind, system: UnitSystem): string {
  return UNITS[kind][system];
}

/** Convert a value of the given kind from one system to the other. */
export function convert(kind: UnitKind, value: number, from: UnitSystem, to: UnitSystem): number {
  if (from === to) return value;
  const def: UnitDef = UNITS[kind];
  if ('factor' in def) return to === 'metric' ? value * def.factor : value / def.factor;
  return to === 'metric' ? def.toMetric(value) : def.toImperial(value);
}

export const toMetric = (kind: UnitKind, v: number, system: UnitSystem) => convert(kind, v, system, 'metric');
export const toImperial = (kind: UnitKind, v: number, system: UnitSystem) => convert(kind, v, system, 'imperial');
