import type { CalculatorConfig } from '@/lib/engine/types';
import { BTUH_TO_W } from '@/lib/engine/units';

/**
 * NIST SP 811, Appendix B.8:
 *   1 Btu_IT/h = 2.930 711 E-01 W
 *   1 ton of refrigeration (12 000 Btu_IT/h) = 3.516 853 E+03 W
 *   1 kW·h = 3.6 E+06 J (exact)
 * Because 1 BTU/h sustained for 1 hour is 1 BTU, 1 BTU = 0.29307107 Wh.
 */
export const BTU_TO_WH = BTUH_TO_W;
export const BTUH_PER_TON = 12000;

type Unit = 'btuh' | 'w' | 'kw' | 'ton' | 'btu' | 'wh' | 'kwh';

const UNIT_NAMES: Record<Unit, string> = {
  btuh: 'BTU/h',
  w: 'W',
  kw: 'kW',
  ton: 'tons',
  btu: 'BTU',
  wh: 'Wh',
  kwh: 'kWh',
};

/** Readable number for the headline: up to 2 decimals for big values, 6 significant figures for small ones. */
export function readable(n: number): string {
  if (n === 0) return '0';
  if (Math.abs(n) >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return Number(n.toPrecision(6)).toLocaleString('en-US', { maximumFractionDigits: 10 });
}

/** Convert any supported power to watts, or any supported energy to watt-hours. */
export function toBase(value: number, from: Unit): number {
  switch (from) {
    case 'btuh':
      return value * BTUH_TO_W;
    case 'w':
      return value;
    case 'kw':
      return value * 1000;
    case 'ton':
      return value * BTUH_PER_TON * BTUH_TO_W;
    case 'btu':
      return value * BTU_TO_WH;
    case 'wh':
      return value;
    case 'kwh':
      return value * 1000;
  }
}

const config: CalculatorConfig = {
  slug: 'btu-to-watts-converter',
  title: 'BTU to Watts Converter',
  h1: 'BTU to Watts Converter (BTU/h to W, kW and Tons)',
  metaTitle: 'BTU to Watts Converter: BTU/h to W & kW | CoolWave',
  metaDescription:
    'Convert BTU to watts and back: BTU/h to W, kW and tons, or BTU to kWh. Uses NIST factors (1 BTU/h = 0.293071 W) with a quick conversion table.',
  category: 'cooling-ac',
  shortDescription: 'Convert BTU per hour to watts, kilowatts and tons, or BTU to kWh, in either direction.',
  primaryKeyword: 'btu to watts',
  secondaryKeywords: ['british thermal unit to watts', 'btu to kw', 'watts to btu', 'btu/h to watts', 'btu to kwh'],
  inputs: [
    {
      id: 'value',
      label: 'Value to convert',
      type: 'number',
      default: 12000,
      min: 0,
      max: 1000000000,
      help: 'Type the number from the label or spec sheet.',
    },
    {
      id: 'from',
      label: 'Unit of that value',
      type: 'select',
      default: 'btuh',
      options: [
        { value: 'btuh', label: 'BTU per hour (BTU/h), the AC or heater rating' },
        { value: 'w', label: 'Watts (W)' },
        { value: 'kw', label: 'Kilowatts (kW)' },
        { value: 'ton', label: 'Tons of cooling' },
        { value: 'btu', label: 'BTU (an amount of energy)' },
        { value: 'wh', label: 'Watt-hours (Wh)' },
        { value: 'kwh', label: 'Kilowatt-hours (kWh)' },
      ],
    },
  ],
  outputs: [
    { id: 'main', label: 'Result', format: 'text', primary: true },
    { id: 'w', label: 'Watts', unitLabel: 'W', decimals: 2 },
    { id: 'kw', label: 'Kilowatts', unitLabel: 'kW', decimals: 4 },
    { id: 'btuh', label: 'BTU per hour', unitLabel: 'BTU/h', decimals: 2 },
    { id: 'tons', label: 'Tons of cooling', unitLabel: 'tons', decimals: 4 },
    { id: 'btu', label: 'BTU', unitLabel: 'BTU', decimals: 2 },
    { id: 'wh', label: 'Watt-hours', unitLabel: 'Wh', decimals: 4 },
    { id: 'kwh', label: 'Kilowatt-hours', unitLabel: 'kWh', decimals: 6 },
  ],
  compute(inputs) {
    const value = Number(inputs.value);
    const from = String(inputs.from) as Unit;
    if (!(from in UNIT_NAMES)) return { ok: false, error: 'Choose the unit of the value you entered.' };
    if (!Number.isFinite(value) || value < 0) return { ok: false, error: 'Enter a number of zero or more.' };
    const isPower = from === 'btuh' || from === 'w' || from === 'kw' || from === 'ton';
    const base = toBase(value, from);
    const empty = { w: null, kw: null, btuh: null, tons: null, btu: null, wh: null, kwh: null };

    if (isPower) {
      const w = base;
      const btuh = w / BTUH_TO_W;
      const values: Record<string, number | string | null> = { ...empty, w, kw: w / 1000, btuh, tons: btuh / BTUH_PER_TON };
      if (from === 'btuh') values.btuh = null;
      if (from === 'w') values.w = null;
      if (from === 'kw') values.kw = null;
      if (from === 'ton') values.tons = null;
      let main: string;
      if (from === 'btuh') main = `${readable(w)} W`;
      else if (from === 'ton') main = `${readable(w / 1000)} kW`;
      else main = `${readable(btuh)} BTU/h`;
      values.main = main;
      return {
        ok: true,
        values,
        summary: `${readable(value)} ${UNIT_NAMES[from]} = ${main}. This is a rate of heat flow (power). For an air conditioner it is the cooling output, not the electricity it draws.`,
        notes: [
          'An AC’s electrical input is much lower than its cooling output: divide the BTU/h rating by the unit’s EER (BTU/h of cooling per watt) to estimate input watts.',
        ],
      };
    }

    const wh = base;
    const btu = wh / BTU_TO_WH;
    const values: Record<string, number | string | null> = { ...empty, btu, wh, kwh: wh / 1000 };
    if (from === 'btu') values.btu = null;
    if (from === 'wh') values.wh = null;
    if (from === 'kwh') values.kwh = null;
    const main = from === 'btu' ? `${readable(wh / 1000)} kWh` : `${readable(btu)} BTU`;
    values.main = main;
    return {
      ok: true,
      values,
      summary: `${readable(value)} ${UNIT_NAMES[from]} = ${main}. This is an amount of energy. If you are converting an AC or heater rating, you almost certainly want BTU/h to watts instead.`,
    };
  },
  assumptions: [
    'BTU means the International Table British thermal unit (BTU_IT), the one used on US HVAC equipment.',
    '1 BTU/h = 0.29307107 W, from NIST SP 811 (listed there as 2.930 711 E-01 W).',
    '1 ton of cooling = 12,000 BTU/h = 3,516.85 W (NIST SP 811 lists 3.516 853 E+03 W).',
    '1 BTU = 0.29307107 Wh, because 1 BTU/h running for one hour delivers 1 BTU. So 1 kWh = 3,412.14 BTU (EIA rounds this to 3,412).',
    'BTU/h, W, kW and tons are rates (power). BTU, Wh and kWh are amounts (energy). The converter never mixes the two.',
  ],
  sources: [
    {
      title: 'NIST Guide to the SI, Appendix B.8: Factors for Units Listed Alphabetically (SP 811)',
      publisher: 'NIST',
      url: 'https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8',
    },
    {
      title: 'British thermal units (Btu)',
      publisher: 'U.S. Energy Information Administration (EIA)',
      url: 'https://www.eia.gov/energyexplained/units-and-calculators/british-thermal-units.php',
    },
  ],
  relatedCalculators: ['btu-calculator', 'ac-tonnage-calculator', 'watts-to-kwh-calculator', 'mini-split-size-calculator', 'electricity-cost-calculator'],
  relatedPosts: [],
  reviewedAgainst: 'NIST SP 811 Appendix B.8 conversion factors',
  updated: '2026-11-08',
  affiliate: ['energy-monitor'],
};

export default config;
