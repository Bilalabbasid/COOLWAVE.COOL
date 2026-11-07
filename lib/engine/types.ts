import type { UnitKind } from './units';
import type { CategorySlug } from '../categories';
import type { AffiliateKey } from '../affiliates';

export type UnitSystem = 'imperial' | 'metric';

/** A value that may differ between unit systems. */
export type PerSystem<T> = T | { imperial: T; metric: T };

export function bySystem<T>(v: PerSystem<T>, system: UnitSystem): T {
  if (v !== null && typeof v === 'object' && 'imperial' in (v as object) && 'metric' in (v as object)) {
    return (v as { imperial: T; metric: T })[system];
  }
  return v as T;
}

interface BaseInput {
  id: string;
  label: string;
  help?: string;
  /** Only show this input when another input has a given value. */
  showIf?: { input: string; equals: string | boolean | number };
}

export interface NumberInput extends BaseInput {
  type: 'number';
  /** Physical quantity; the engine converts the value when the unit toggle changes. */
  unit?: UnitKind;
  /** Fixed label (e.g. "%", "hours/day", "$/kWh"). Used when `unit` is not set. */
  unitLabel?: PerSystem<string>;
  default: PerSystem<number>;
  min?: PerSystem<number>;
  max?: PerSystem<number>;
  step?: PerSystem<number>;
  /** Defaults to true. */
  required?: boolean;
  /** Extra rule beyond min/max. Return an error message or null. Must be pure. */
  validate?: (value: number, all: InputValues, system: UnitSystem) => string | null;
}

export interface SelectInput extends BaseInput {
  type: 'select';
  options: { value: string; label: string }[];
  default: string;
}

export interface ToggleInput extends BaseInput {
  type: 'toggle';
  default: boolean;
}

export type InputDef = NumberInput | SelectInput | ToggleInput;
export type InputValue = number | string | boolean;
export type InputValues = Record<string, InputValue>;

export type OutputFormat = 'number' | 'currency' | 'text' | 'duration';

export interface OutputDef {
  id: string;
  label: string;
  /** Converted for display only if compute returns values in metric base units and unit is set. */
  unit?: UnitKind;
  unitLabel?: PerSystem<string>;
  decimals?: PerSystem<number>;
  format?: OutputFormat;
  /** The headline result. Exactly one output should be primary. */
  primary?: boolean;
  help?: string;
}

export type ResultStatus = 'info' | 'good' | 'caution' | 'warning' | 'danger';

export type ComputeResult =
  | {
      ok: true;
      /** Values keyed by output id. Numbers are already in the display unit system. */
      values: Record<string, number | string | null>;
      /** Per-output "what this means" text. */
      interpretations?: Record<string, string>;
      /** Headline interpretation shown under the primary result. */
      summary?: string;
      status?: ResultStatus;
      notes?: string[];
    }
  | { ok: false; error: string };

export interface Source {
  title: string;
  publisher: string;
  url: string;
}

export type WidgetKind = 'noise-generator' | 'tone-generator' | 'decibel-meter' | 'snow-day';

export interface CalculatorConfig {
  slug: string;
  /** Short name used in cards and breadcrumbs, e.g. "BTU Calculator". */
  title: string;
  /** Page H1. */
  h1: string;
  /** <title>, max 60 chars (site name is appended by the template only if it fits). */
  metaTitle: string;
  /** Max 155 chars. */
  metaDescription: string;
  category: CategorySlug;
  shortDescription: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  inputs: InputDef[];
  outputs: OutputDef[];
  /** Pure function: no side effects, no Date.now(), no randomness. */
  compute: (inputs: InputValues, unitSystem: UnitSystem) => ComputeResult;
  assumptions: string[];
  sources: Source[];
  relatedCalculators: string[];
  relatedPosts: string[];
  disclaimer?: string;
  /** Marks results as an estimate (no authoritative formula). */
  estimate?: boolean;
  /** Which source the formula was checked against (shown in the review box). */
  reviewedAgainst: string;
  /** ISO date the formula and content were last reviewed. */
  updated: string;
  affiliate?: AffiliateKey[];
  /** Interactive tools that are not form-in/number-out use a built-in widget. */
  widget?: WidgetKind;
  /** Default unit system; most audiences are mixed so imperial is the default. */
  defaultUnitSystem?: UnitSystem;
}

/** The serialisable part of a config, safe to pass to client components. */
export type CalculatorShell = Omit<CalculatorConfig, 'compute' | 'inputs'> & {
  inputs: (Omit<NumberInput, 'validate'> | SelectInput | ToggleInput)[];
};

export function toShell(config: CalculatorConfig): CalculatorShell {
  const { compute: _compute, inputs, ...rest } = config;
  void _compute;
  return {
    ...rest,
    inputs: inputs.map((i) => {
      if (i.type === 'number') {
        const { validate: _v, ...n } = i;
        void _v;
        return n;
      }
      return i;
    }),
  };
}
