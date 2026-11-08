import type { CalculatorConfig } from '@/lib/engine/types';
import { CFM_TO_M3H, FPM_TO_MS } from '@/lib/engine/units';

/**
 * Residential duct velocities in ft/min, as reproduced from ACCA Manual D Table 3-1
 * ("Recommended Velocity (FPM)") in ACCA's "Verifying ACCA Manual D Procedures" checklist.
 * [recommended, maximum]
 */
export const MANUAL_D_VELOCITIES = {
  'supply-trunk-rigid': { label: 'Supply trunk, rigid metal', rec: 700, max: 900 },
  'supply-trunk-flex': { label: 'Supply trunk, flex duct', rec: 600, max: 700 },
  'supply-branch-rigid': { label: 'Supply branch, rigid metal', rec: 600, max: 900 },
  'supply-branch-flex': { label: 'Supply branch, flex duct', rec: 600, max: 700 },
  'return-trunk-rigid': { label: 'Return trunk, rigid metal', rec: 600, max: 700 },
  'return-trunk-flex': { label: 'Return trunk, flex duct', rec: 600, max: 700 },
  'return-branch-rigid': { label: 'Return branch, rigid metal', rec: 400, max: 700 },
  'return-branch-flex': { label: 'Return branch, flex duct', rec: 400, max: 700 },
} as const;
export type DuctType = keyof typeof MANUAL_D_VELOCITIES;

/** Highest residential duct velocity in the Manual D table (rigid supply ducts). */
export const MAX_RESIDENTIAL_FPM = 900;

/** Round duct diameter in inches from airflow (CFM) and velocity (ft/min): D = √(4Q / (πV)). */
export function roundDiameterIn(cfm: number, fpm: number): number {
  const areaFt2 = cfm / fpm;
  return Math.sqrt((4 * areaFt2) / Math.PI) * 12;
}

/** Velocity (ft/min) of a given airflow in a round duct of the given diameter (inches). */
export function velocityInRound(cfm: number, diameterIn: number): number {
  const d = diameterIn / 12;
  return cfm / ((Math.PI * d * d) / 4);
}

const ceil = (x: number) => Math.ceil(x - 1e-9);
const fpmLabel = (f: number) => `${f} ft/min, ${(f * FPM_TO_MS).toFixed(1)} m/s`;

const config: CalculatorConfig = {
  slug: 'duct-size-calculator',
  title: 'Duct Size Calculator',
  h1: 'Duct Size Calculator: Round Duct Diameter From CFM',
  metaTitle: 'Duct Size Calculator: CFM to Round Duct Size | CoolWave',
  metaDescription:
    'Size a round duct from airflow in CFM or m³/h using the velocity method and ACCA Manual D velocities for supply and return trunks and branches.',
  category: 'cooling-ac',
  shortDescription: 'Find the round duct diameter for an airflow (CFM or m³/h) at the recommended residential air velocity.',
  primaryKeyword: 'duct size calculator',
  secondaryKeywords: ['duct calculator', 'ductwork calculator', 'duct design calculator', 'cfm to duct size', 'duct sizing calculator'],
  inputs: [
    {
      id: 'airflow',
      label: 'Airflow through the duct',
      type: 'number',
      unit: 'airflow',
      default: { imperial: 400, metric: 680 },
      min: { imperial: 10, metric: 17 },
      max: { imperial: 20000, metric: 34000 },
      step: 1,
      help: 'For a branch, the airflow to that room. For a trunk, the total of the branches it feeds.',
    },
    {
      id: 'ductType',
      label: 'Duct type',
      type: 'select',
      default: 'supply-trunk-rigid',
      options: [
        ...(Object.entries(MANUAL_D_VELOCITIES) as [DuctType, (typeof MANUAL_D_VELOCITIES)[DuctType]][]).map(([value, d]) => ({
          value,
          label: `${d.label} (${fpmLabel(d.rec)})`,
        })),
        { value: 'custom', label: 'Custom velocity' },
      ],
    },
    {
      id: 'velocity',
      label: 'Design air velocity',
      type: 'number',
      unit: 'airVelocity',
      default: { imperial: 700, metric: 3.5 },
      min: { imperial: 100, metric: 0.5 },
      max: { imperial: 6000, metric: 30 },
      step: { imperial: 10, metric: 0.1 },
      showIf: { input: 'ductType', equals: 'custom' },
    },
    {
      id: 'rectDepth',
      label: 'Rectangular duct height (for comparison)',
      type: 'number',
      unit: 'ductSize',
      default: { imperial: 8, metric: 200 },
      min: { imperial: 2, metric: 50 },
      max: { imperial: 60, metric: 1500 },
      step: { imperial: 1, metric: 10 },
      help: 'Shows how wide a rectangular duct of this height must be to have the same open area.',
    },
  ],
  outputs: [
    { id: 'diameter', label: 'Round duct diameter', unit: 'ductSize', decimals: { imperial: 1, metric: 0 }, primary: true },
    { id: 'rounded', label: 'Rounded up (next inch / next 10 mm)', unit: 'ductSize', decimals: 0 },
    { id: 'velocityRounded', label: 'Air speed in the rounded-up duct', unit: 'airVelocity', decimals: { imperial: 0, metric: 2 } },
    { id: 'minDiameter', label: 'Smallest diameter at Manual D maximum velocity', unit: 'ductSize', decimals: { imperial: 1, metric: 0 } },
    { id: 'area', label: 'Open area needed', unitLabel: { imperial: 'in²', metric: 'cm²' }, decimals: { imperial: 1, metric: 0 } },
    { id: 'rectWidth', label: 'Equal-area rectangular duct width', unit: 'ductSize', decimals: { imperial: 1, metric: 0 } },
    { id: 'velocityUsed', label: 'Design velocity used', unit: 'airVelocity', decimals: { imperial: 0, metric: 2 } },
  ],
  compute(inputs, system) {
    const metric = system === 'metric';
    const q = Number(inputs.airflow);
    const cfm = metric ? q / CFM_TO_M3H : q;
    const type = String(inputs.ductType);
    const preset = type in MANUAL_D_VELOCITIES ? MANUAL_D_VELOCITIES[type as DuctType] : null;
    if (!preset && type !== 'custom') return { ok: false, error: 'Choose a duct type.' };
    const fpm = preset ? preset.rec : metric ? Number(inputs.velocity) / FPM_TO_MS : Number(inputs.velocity);
    if (!(cfm > 0) || !(fpm > 0)) return { ok: false, error: 'Airflow and velocity must both be greater than zero.' };

    const dIn = roundDiameterIn(cfm, fpm);
    const minIn = preset ? roundDiameterIn(cfm, preset.max) : null;
    const areaIn2 = (cfm / fpm) * 144;
    const depthIn = metric ? Number(inputs.rectDepth) / 25.4 : Number(inputs.rectDepth);
    const widthIn = areaIn2 / depthIn;

    const roundedIn = metric ? null : ceil(dIn);
    const roundedMm = metric ? ceil((dIn * 25.4) / 10) * 10 : null;
    const roundedAsIn = metric ? (roundedMm as number) / 25.4 : (roundedIn as number);
    const vRounded = velocityInRound(cfm, roundedAsIn);

    const toLen = (inches: number) => (metric ? inches * 25.4 : inches);
    const toVel = (f: number) => (metric ? f * FPM_TO_MS : f);
    const fmtLen = (inches: number) => (metric ? `${Math.round(inches * 25.4)} mm` : `${inches.toFixed(1)} in`);

    let status: 'good' | 'caution' | 'warning' = 'good';
    const notes: string[] = [];
    if (!preset) {
      if (fpm > MAX_RESIDENTIAL_FPM) {
        status = 'warning';
        notes.push(
          `This velocity is above ${fpmLabel(MAX_RESIDENTIAL_FPM)}, the highest residential duct velocity in ACCA Manual D’s table (rigid supply ducts). Expect noise and high pressure loss.`,
        );
      } else if (fpm < 300) {
        status = 'caution';
        notes.push('Very low velocities make large, expensive ducts. Check that this is intended.');
      }
    }
    notes.push(
      'A rectangular duct with the same open area has more wall surface, so more friction, than the round duct. Go a size up on the rectangular duct or check it with Manual D.',
    );
    notes.push(
      'This is the velocity method. ACCA Manual D sizes each run from the friction rate available to the fan, which can call for a bigger duct on long runs with many fittings.',
    );

    const summary = preset
      ? `At ${preset.rec} ft/min (${(preset.rec * FPM_TO_MS).toFixed(2)} m/s), the Manual D recommended speed for a ${preset.label.toLowerCase()}, you need a round duct of about ${fmtLen(dIn)}. Use the next size up; anything down to ${fmtLen(minIn as number)} stays under the ${preset.max} ft/min maximum.`
      : `At your chosen velocity you need a round duct of about ${fmtLen(dIn)}. Use the next size up.`;

    return {
      ok: true,
      values: {
        diameter: toLen(dIn),
        rounded: metric ? roundedMm : roundedIn,
        velocityRounded: toVel(vRounded),
        minDiameter: minIn === null ? null : toLen(minIn),
        area: metric ? areaIn2 * 6.4516 : areaIn2,
        rectWidth: toLen(widthIn),
        velocityUsed: toVel(fpm),
      },
      summary,
      status,
      notes,
    };
  },
  assumptions: [
    'Velocity method: airflow = velocity × cross-sectional area, so a round duct’s diameter D = √(4Q ÷ (πV)).',
    'Recommended and maximum velocities are ACCA Manual D Table 3-1 values as reproduced in ACCA’s “Verifying ACCA Manual D Procedures” checklist: supply trunk 700 (rigid) / 600 (flex) ft/min recommended, 900 / 700 maximum; supply branch 600 / 600 recommended, 900 / 700 maximum; return trunk 600 / 600 recommended, 700 / 700 maximum; return branch 400 / 400 recommended, 700 / 700 maximum. These are rules of thumb; the current Manual D edition may present them differently.',
    'The rounded-up size is the next whole inch (imperial) or next 10 mm (metric). Check which sizes your supplier stocks.',
    'The rectangular width gives the same open area as the exact round size. It does not account for the extra friction of a rectangular shape.',
    'Friction losses, fittings, duct length and fan pressure are not included. A full design uses ACCA Manual D.',
    '1 CFM = 1.6990108 m³/h and 1 ft/min = 0.00508 m/s.',
  ],
  sources: [
    {
      title: 'Verifying ACCA Manual D Procedures (residential duct design checklist, with Manual D Table 3-1 velocities)',
      publisher: 'Air Conditioning Contractors of America (ACCA), hosted by AHRI',
      url: 'https://www.ahrinet.org/sites/default/files/2022-10/manual%20D%20calculation.pdf',
    },
    { title: 'Manual D Residential Duct Design', publisher: 'Air Conditioning Contractors of America (ACCA)', url: 'https://www.acca.org/standards/manual-d' },
    {
      title: 'Advanced Strategy Guideline: Air Distribution Basics and Duct Design (Building America)',
      publisher: 'U.S. Department of Energy, Building America Solution Center',
      url: 'https://basc.pnnl.gov/library/advanced-strategy-guideline-air-distribution-basics-and-duct-design',
    },
  ],
  relatedCalculators: ['cfm-calculator', 'ac-tonnage-calculator', 'air-changes-per-hour-calculator', 'btu-calculator', 'furnace-size-calculator'],
  relatedPosts: [],
  estimate: true,
  reviewedAgainst: 'ACCA Manual D Table 3-1 velocities as reproduced in ACCA’s “Verifying ACCA Manual D Procedures” checklist',
  updated: '2026-11-08',
};

export default config;
