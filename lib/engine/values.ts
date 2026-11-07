import { convert } from './units';
import {
  bySystem,
  type CalculatorConfig,
  type CalculatorShell,
  type InputDef,
  type InputValues,
  type UnitSystem,
} from './types';

type AnyConfig = Pick<CalculatorConfig, 'inputs'> | Pick<CalculatorShell, 'inputs'>;
type AnyInput = AnyConfig['inputs'][number];

export function defaultValues(config: AnyConfig, system: UnitSystem): InputValues {
  const v: InputValues = {};
  for (const input of config.inputs) {
    v[input.id] = input.type === 'number' ? bySystem(input.default, system) : input.default;
  }
  return v;
}

function roundToStep(value: number, step: number | undefined): number {
  if (!step || step <= 0) return Number(value.toPrecision(6));
  const decimals = Math.max(0, -Math.floor(Math.log10(step)));
  return Number(value.toFixed(Math.min(decimals + 1, 6)));
}

/** Convert all unit-bearing number inputs when the unit toggle changes. */
export function convertValues(config: AnyConfig, values: InputValues, from: UnitSystem, to: UnitSystem): InputValues {
  if (from === to) return values;
  const out: InputValues = { ...values };
  for (const input of config.inputs) {
    if (input.type !== 'number') continue;
    const v = values[input.id];
    if (typeof v !== 'number' || !Number.isFinite(v)) continue;
    if (input.unit) {
      out[input.id] = roundToStep(convert(input.unit, v, from, to), bySystem(input.step ?? 0, to));
    } else if (input.unitLabel && typeof input.unitLabel === 'object') {
      // Different fixed labels per system without a known conversion: keep the system default.
      out[input.id] = bySystem(input.default, to);
    }
  }
  return out;
}

export function isVisible(input: AnyInput, values: InputValues): boolean {
  if (!input.showIf) return true;
  return values[input.showIf.input] === input.showIf.equals;
}

/** Field-level validation. Returns a map of input id -> message. */
export function validateValues(config: AnyConfig, values: InputValues, system: UnitSystem): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const input of config.inputs as InputDef[]) {
    if (!isVisible(input, values)) continue;
    const v = values[input.id];
    if (input.type === 'number') {
      if (typeof v !== 'number' || !Number.isFinite(v)) {
        if (input.required !== false) errors[input.id] = 'Enter a number.';
        continue;
      }
      const min = input.min === undefined ? undefined : bySystem(input.min, system);
      const max = input.max === undefined ? undefined : bySystem(input.max, system);
      if (min !== undefined && v < min) errors[input.id] = `Must be at least ${min}.`;
      else if (max !== undefined && v > max) errors[input.id] = `Must be at most ${max}.`;
      else if (typeof input.validate === 'function') {
        const msg = input.validate(v, values, system);
        if (msg) errors[input.id] = msg;
      }
    } else if (input.type === 'select') {
      if (!input.options.some((o) => o.value === v)) errors[input.id] = 'Choose an option.';
    }
  }
  return errors;
}

// ---------- shareable URL state ----------

export function encodeState(config: AnyConfig, values: InputValues, system: UnitSystem): string {
  const p = new URLSearchParams();
  p.set('u', system === 'metric' ? 'm' : 'i');
  for (const input of config.inputs) {
    const v = values[input.id];
    if (v === undefined || v === '' || (typeof v === 'number' && !Number.isFinite(v))) continue;
    p.set(input.id, typeof v === 'boolean' ? (v ? '1' : '0') : String(v));
  }
  return p.toString();
}

export function decodeState(
  config: AnyConfig,
  search: string,
  fallbackSystem: UnitSystem,
): { values: InputValues; system: UnitSystem } | null {
  const p = new URLSearchParams(search);
  if (![...p.keys()].length) return null;
  const system: UnitSystem = p.get('u') === 'm' ? 'metric' : p.get('u') === 'i' ? 'imperial' : fallbackSystem;
  const values = defaultValues(config, system);
  let matched = false;
  for (const input of config.inputs) {
    const raw = p.get(input.id);
    if (raw === null) continue;
    if (input.type === 'number') {
      const n = Number(raw);
      if (Number.isFinite(n)) {
        values[input.id] = n;
        matched = true;
      }
    } else if (input.type === 'toggle') {
      values[input.id] = raw === '1' || raw === 'true';
      matched = true;
    } else if (input.options.some((o) => o.value === raw)) {
      values[input.id] = raw;
      matched = true;
    }
  }
  if (!matched && !p.has('u')) return null;
  return { values, system };
}
