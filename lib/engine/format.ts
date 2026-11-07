import { unitLabel } from './units';
import { bySystem, type InputValues, type OutputDef, type UnitSystem } from './types';

export const CURRENCIES = [
  { value: 'USD', label: 'US dollar ($)', symbol: '$' },
  { value: 'GBP', label: 'British pound (£)', symbol: '£' },
  { value: 'CAD', label: 'Canadian dollar (C$)', symbol: 'C$' },
  { value: 'AUD', label: 'Australian dollar (A$)', symbol: 'A$' },
  { value: 'AED', label: 'UAE dirham (AED)', symbol: 'AED ' },
  { value: 'SAR', label: 'Saudi riyal (SAR)', symbol: 'SAR ' },
  { value: 'EUR', label: 'Euro (€)', symbol: '€' },
] as const;

export function currencySymbol(code: unknown): string {
  return CURRENCIES.find((c) => c.value === code)?.symbol ?? '$';
}

export function formatNumber(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return '—';
  const fixed = Number(value.toFixed(decimals));
  return fixed.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Format minutes as "2 h 15 min" / "45 min" / "3 days 4 h". */
export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes)) return '—';
  const m = Math.round(minutes);
  if (m < 60) return `${m} min`;
  const days = Math.floor(m / 1440);
  const hours = Math.floor((m % 1440) / 60);
  const mins = m % 60;
  if (days > 0) return `${days} day${days === 1 ? '' : 's'}${hours ? ` ${hours} h` : ''}`;
  return `${hours} h${mins ? ` ${mins} min` : ''}`;
}

export function outputUnit(output: OutputDef, system: UnitSystem): string {
  if (output.unit) return unitLabel(output.unit, system);
  if (output.unitLabel) return bySystem(output.unitLabel, system);
  return '';
}

export function formatOutput(
  output: OutputDef,
  value: number | string | null | undefined,
  system: UnitSystem,
  inputs: InputValues,
): { value: string; unit: string } {
  if (value === null || value === undefined) return { value: '—', unit: '' };
  if (typeof value === 'string' || output.format === 'text') return { value: String(value), unit: '' };
  const decimals = output.decimals === undefined ? 0 : bySystem(output.decimals, system);
  if (output.format === 'currency') {
    return { value: `${currencySymbol(inputs.currency)}${formatNumber(value, decimals)}`, unit: outputUnit(output, system) };
  }
  if (output.format === 'duration') return { value: formatDuration(value), unit: '' };
  return { value: formatNumber(value, decimals), unit: outputUnit(output, system) };
}
