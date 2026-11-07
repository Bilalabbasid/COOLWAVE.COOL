import type { CalculatorConfig } from '@/lib/engine/types';
import { BTUH_TO_W, FT_TO_M } from '@/lib/engine/units';

/** ENERGY STAR room air conditioner sizing chart (8 ft ceilings): [min sq ft (inclusive), max sq ft (exclusive), BTU/h]. */
export const ENERGY_STAR_CHART: [number, number, number][] = [
  [100, 150, 5000],
  [150, 250, 6000],
  [250, 300, 7000],
  [300, 350, 8000],
  [350, 400, 9000],
  [400, 450, 10000],
  [450, 550, 12000],
  [550, 700, 14000],
  [700, 1000, 18000],
  [1000, 1200, 21000],
  [1200, 1400, 23000],
  [1400, 1500, 24000],
  [1500, 2000, 30000],
  [2000, 2500, 34000],
];

export function chartCapacity(sqft: number): number | null {
  if (sqft < 100) return 5000;
  const row = ENERGY_STAR_CHART.find(([lo, hi]) => sqft >= lo && sqft < hi);
  if (row) return row[2];
  return sqft === 2500 ? 34000 : null;
}

const config: CalculatorConfig = {
  slug: 'btu-calculator',
  title: 'BTU Calculator',
  h1: 'BTU Calculator: What Size Air Conditioner Do I Need?',
  metaTitle: 'BTU Calculator: What Size AC Do I Need? | CoolWave',
  metaDescription:
    'Free BTU calculator for room air conditioners. Enter room size, sun and occupants to get the BTU/h you need, in kW and tons too. Based on ENERGY STAR.',
  category: 'cooling-ac',
  shortDescription: 'Find the air conditioner size (BTU/h) for a room from its floor area, sun exposure and use.',
  primaryKeyword: 'btu calculator',
  secondaryKeywords: ['ac btu calculator', 'air conditioner btu calculator', 'what size ac do i need', 'room size to btu', 'british thermal unit calculator'],
  inputs: [
    {
      id: 'area',
      label: 'Room floor area',
      type: 'number',
      unit: 'area',
      default: { imperial: 300, metric: 28 },
      min: { imperial: 20, metric: 2 },
      max: { imperial: 20000, metric: 1850 },
      step: 1,
      help: 'Length × width. For L-shaped rooms add the rectangles together.',
    },
    {
      id: 'sun',
      label: 'Sun exposure',
      type: 'select',
      default: 'normal',
      options: [
        { value: 'normal', label: 'Average' },
        { value: 'shaded', label: 'Heavily shaded (−10%)' },
        { value: 'sunny', label: 'Very sunny (+10%)' },
      ],
    },
    {
      id: 'people',
      label: 'People usually in the room',
      type: 'number',
      unitLabel: 'people',
      default: 2,
      min: 1,
      max: 30,
      step: 1,
    },
    {
      id: 'kitchen',
      label: 'This room is a kitchen',
      type: 'toggle',
      default: false,
      help: 'Cooking adds heat, so ENERGY STAR adds 4,000 BTU/h.',
    },
  ],
  outputs: [
    { id: 'btu', label: 'Recommended cooling capacity', unitLabel: 'BTU/h', decimals: 0, primary: true },
    { id: 'kw', label: 'Same capacity in kilowatts', unitLabel: 'kW', decimals: 2 },
    { id: 'tons', label: 'Same capacity in tons', unitLabel: 'tons', decimals: 2 },
    { id: 'base', label: 'Chart value before adjustments', unitLabel: 'BTU/h', decimals: 0 },
  ],
  compute(inputs, system) {
    const area = Number(inputs.area);
    const sqft = system === 'metric' ? area / (FT_TO_M * FT_TO_M) : area;
    const base = chartCapacity(sqft);
    if (base === null) {
      return {
        ok: false,
        error:
          'ENERGY STAR’s room chart stops at 2,500 sq ft (232 m²). For a larger space or a whole house, a single room unit is the wrong tool: use a professional load calculation (ACCA Manual J) or our AC tonnage calculator as a first estimate.',
      };
    }
    const sunFactor = inputs.sun === 'shaded' ? 0.9 : inputs.sun === 'sunny' ? 1.1 : 1;
    const people = Math.max(0, Math.round(Number(inputs.people)) - 2) * 600;
    const kitchen = inputs.kitchen ? 4000 : 0;
    const btu = Math.round(base * sunFactor + people + kitchen);
    const notes: string[] = [];
    if (sqft < 100) notes.push('Rooms under 100 sq ft are below the smallest band on the ENERGY STAR chart, so the smallest listed size (5,000 BTU/h) is used.');
    notes.push('ENERGY STAR’s chart assumes 8 ft (2.4 m) ceilings. With higher ceilings, look at the next size up.');
    return {
      ok: true,
      values: { btu, kw: (btu * BTUH_TO_W) / 1000, tons: btu / 12000, base },
      summary: `Choose a unit rated at about ${btu.toLocaleString('en-US')} BTU/h. A much bigger unit cools in short bursts and leaves the room damp and clammy.`,
      notes,
    };
  },
  assumptions: [
    'Cooling capacity comes from the ENERGY STAR room air conditioner sizing chart, which assumes 8 ft (2.4 m) ceilings.',
    'Sun adjustment: −10% for a heavily shaded room, +10% for a very sunny room, applied to the chart value.',
    'Occupancy: +600 BTU/h for each person above two who regularly uses the room.',
    'Kitchen: +4,000 BTU/h.',
    'The percentage adjustment is applied first, then the fixed additions (ENERGY STAR does not specify an order; this is the conventional reading).',
    '1 ton of cooling = 12,000 BTU/h; 1 BTU/h = 0.29307107 W (NIST SP 811).',
    'This sizes a single room. It is not a substitute for a whole-house Manual J load calculation.',
  ],
  sources: [
    { title: 'Room Air Conditioners: Properly Sized Room Air Conditioners', publisher: 'ENERGY STAR (US EPA)', url: 'https://www.energystar.gov/products/room_air_conditioners' },
    { title: 'Manual J Residential Load Calculation', publisher: 'Air Conditioning Contractors of America (ACCA)', url: 'https://www.acca.org/standards/manual-j' },
    { title: 'Guide for the Use of the International System of Units (SI), SP 811', publisher: 'NIST', url: 'https://www.nist.gov/pml/special-publication-811' },
  ],
  relatedCalculators: ['ac-tonnage-calculator', 'mini-split-size-calculator', 'btu-to-watts-converter', 'seer-savings-calculator', 'ceiling-fan-size-calculator'],
  relatedPosts: [],
  reviewedAgainst: 'the ENERGY STAR room air conditioner sizing chart',
  updated: '2026-11-08',
  affiliate: ['window-ac', 'portable-ac', 'mini-split'],
};

export default config;
