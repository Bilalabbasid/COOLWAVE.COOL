import type { CalculatorConfig, ResultStatus } from '@/lib/engine/types';
import { cToF, fToC } from '@/lib/engine/units';

/**
 * NWS heat index algorithm (NOAA Weather Prediction Center, "The Heat Index Equation"):
 * simple Steadman-consistent formula first; if its average with T is >= 80 °F, use the
 * Rothfusz (1990) regression with the two published adjustments.
 */
export function heatIndexF(T: number, RH: number): number {
  const simple = 0.5 * (T + 61.0 + (T - 68.0) * 1.2 + RH * 0.094);
  if ((simple + T) / 2 < 80) return simple;
  let hi =
    -42.379 +
    2.04901523 * T +
    10.14333127 * RH -
    0.22475541 * T * RH -
    0.00683783 * T * T -
    0.05481717 * RH * RH +
    0.00122874 * T * T * RH +
    0.00085282 * T * RH * RH -
    0.00000199 * T * T * RH * RH;
  if (RH < 13 && T >= 80 && T <= 112) hi -= ((13 - RH) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
  else if (RH > 85 && T >= 80 && T <= 87) hi += ((RH - 85) / 10) * ((87 - T) / 5);
  return hi;
}

/** NWS classification (weather.gov/ama/heatindex). */
export function heatCategory(hiF: number): { label: string; status: ResultStatus; effect: string } {
  if (hiF < 80) return { label: 'No heat-index warning level', status: 'info', effect: 'Below 80 °F the heat index is close to the air temperature.' };
  if (hiF < 90) return { label: 'Caution', status: 'caution', effect: 'Fatigue possible with prolonged exposure and/or physical activity.' };
  if (hiF < 103)
    return { label: 'Extreme caution', status: 'warning', effect: 'Heat stroke, heat cramps or heat exhaustion possible with prolonged exposure and/or physical activity.' };
  if (hiF < 125)
    return { label: 'Danger', status: 'danger', effect: 'Heat cramps or heat exhaustion likely; heat stroke possible with prolonged exposure and/or physical activity.' };
  return { label: 'Extreme danger', status: 'danger', effect: 'Heat stroke highly likely.' };
}

export const MAX_CHART_T_F = 110;
export const MAX_CHART_HI_F = 137;

const config: CalculatorConfig = {
  slug: 'heat-index-calculator',
  title: 'Heat Index Calculator',
  h1: 'Heat Index Calculator (“Feels Like” Temperature)',
  metaTitle: 'Heat Index Calculator: NWS Feels-Like Temp | CoolWave',
  metaDescription:
    'Calculate the heat index from temperature and humidity with the exact NWS formula, in °F or °C, plus the NWS danger level. Checked against the NWS chart.',
  category: 'weather-heat',
  shortDescription: 'How hot it feels when humidity is combined with air temperature, using the National Weather Service formula.',
  primaryKeyword: 'heat index calculator',
  secondaryKeywords: ['heat index chart', 'calculate heat index', 'heat index formula', 'feels like temperature', 'heat index converter'],
  defaultUnitSystem: 'imperial',
  inputs: [
    {
      id: 'temp',
      label: 'Air temperature',
      type: 'number',
      unit: 'temperature',
      default: { imperial: 90, metric: 32 },
      min: { imperial: 40, metric: 4.5 },
      max: { imperial: 130, metric: 54 },
      step: { imperial: 1, metric: 0.5 },
      help: 'Shade temperature, as in a weather report.',
    },
    { id: 'rh', label: 'Relative humidity', type: 'number', unitLabel: '%', default: 50, min: 0, max: 100, step: 1 },
  ],
  outputs: [
    { id: 'hi', label: 'Heat index', unit: 'temperature', decimals: 0, primary: true },
    { id: 'level', label: 'NWS level', format: 'text' },
    { id: 'diff', label: 'Feels hotter than the air by', unit: 'tempDelta', decimals: 0 },
  ],
  compute(inputs, system) {
    const t = Number(inputs.temp);
    const rh = Number(inputs.rh);
    const T = system === 'metric' ? cToF(t) : t;
    if (T > MAX_CHART_T_F) {
      return {
        ok: false,
        error:
          'The heat index is only defined up to 110 °F (43 °C) air temperature, the edge of the National Weather Service chart. At these temperatures conditions are already extremely dangerous: get to a cooled space and follow local heat warnings.',
      };
    }
    const hiF = heatIndexF(T, rh);
    if (hiF > MAX_CHART_HI_F) {
      return {
        ok: false,
        error:
          'This combination of heat and humidity is beyond the National Weather Service heat index chart (above about 137 °F / 58 °C), where the formula is no longer valid. It is in the extreme danger zone: heat stroke is highly likely.',
      };
    }
    const cat = heatCategory(hiF);
    const toDisplay = (f: number) => (system === 'metric' ? fToC(f) : f);
    const diffF = Math.max(0, hiF - T);
    return {
      ok: true,
      values: { hi: toDisplay(hiF), level: cat.label, diff: system === 'metric' ? (diffF * 5) / 9 : diffF },
      status: cat.status,
      summary: cat.effect,
      notes: [
        'Values are for shade and light wind. In full sunshine the heat index can be up to 15 °F (8 °C) higher (NWS).',
        'The NWS regression is accurate to about ±1.3 °F.',
      ],
    };
  },
  assumptions: [
    'Uses the National Weather Service algorithm: Steadman’s simple formula for low values, and the Rothfusz (1990) regression when the result is 80 °F or more.',
    'Includes both NWS adjustments: dry air (RH below 13% at 80–112 °F) and very humid air (RH above 85% at 80–87 °F).',
    'Valid for air temperatures from 40 °F to 110 °F (4.5–43 °C) and heat index values up to about 137 °F, the limits of the NWS chart. Outside that range we show a message instead of a number.',
    'Assumes shade and a light breeze. Direct sun can add up to 15 °F.',
    'Celsius inputs are converted to Fahrenheit, calculated, then converted back.',
  ],
  sources: [
    { title: 'The Heat Index Equation', publisher: 'NOAA / National Weather Service, Weather Prediction Center', url: 'https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml' },
    { title: 'Heat Forecast Tools (NWS heat index chart)', publisher: 'National Weather Service', url: 'https://www.weather.gov/safety/heat-index' },
    { title: 'What is the heat index? (classification table)', publisher: 'National Weather Service, Amarillo TX', url: 'https://www.weather.gov/ama/heatindex' },
    { title: 'The Heat Index “Equation” (Technical Attachment SR 90-23)', publisher: 'Lans P. Rothfusz, National Weather Service', url: 'https://www.weather.gov/media/ffc/ta_htindx.PDF' },
  ],
  relatedCalculators: ['dew-point-calculator', 'wet-bulb-calculator', 'relative-humidity-calculator', 'wind-chill-calculator'],
  relatedPosts: [],
  disclaimer:
    'This tool is for information only and is not medical advice. Heat illness can occur below the levels shown, especially for children, older adults and people who are working or exercising. Follow local heat warnings and seek medical help for symptoms of heat stroke.',
  reviewedAgainst: 'the NOAA/NWS heat index equation and the NWS heat index chart',
  updated: '2026-11-08',
  affiliate: ['hygrometer'],
};

export default config;
