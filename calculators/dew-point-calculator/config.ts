import type { CalculatorConfig, ResultStatus } from '@/lib/engine/types';
import { cToF, fToC } from '@/lib/engine/units';
import { MAGNUS_MAX_C, MAGNUS_MIN_C, dewPoint, vaporPressure } from './magnus';

/**
 * Summer comfort by dew point (°F).
 * Bands: NWS La Crosse, "Dew Point vs Humidity" (≤55 dry and comfortable; 55–65 sticky with muggy
 * evenings; ≥65 lots of moisture, becoming oppressive). The 70s/80s wording is from NWS Louisville,
 * "A Discussion of Water Vapor, Humidity, and Dewpoint" (70s quite uncomfortable; 80+ very oppressive).
 */
export function dewPointComfort(tdF: number): { label: string; status: ResultStatus; effect: string } {
  if (tdF <= 55)
    return { label: 'Dry and comfortable', status: 'good', effect: 'Most people find the air dry and comfortable at this dew point (NWS).' };
  if (tdF < 65)
    return { label: 'Becoming sticky', status: 'caution', effect: 'The air starts to feel sticky, with muggy evenings (NWS).' };
  if (tdF < 70)
    return { label: 'Oppressive', status: 'warning', effect: 'Lots of moisture in the air; it is becoming oppressive (NWS).' };
  if (tdF < 80)
    return {
      label: 'Very humid, oppressive',
      status: 'warning',
      effect: 'Dew points in the 70s feel quite uncomfortable and very humid. Sweat evaporates slowly, so heat stress builds faster (NWS).',
    };
  return {
    label: 'Extremely oppressive',
    status: 'danger',
    effect: 'Dew points of 80 °F or more are very oppressive and rare. Combined with heat, they make it hard for the body to cool itself (NWS).',
  };
}

const config: CalculatorConfig = {
  slug: 'dew-point-calculator',
  title: 'Dew Point Calculator',
  h1: 'Dew Point Calculator',
  metaTitle: 'Dew Point Calculator: From Temperature & RH | CoolWave',
  metaDescription:
    'Calculate the dew point from temperature and relative humidity with the Magnus formula in °F or °C, and see how muggy it feels on the NWS comfort scale.',
  category: 'weather-heat',
  shortDescription: 'The temperature at which air becomes saturated and dew or condensation forms, from air temperature and relative humidity.',
  primaryKeyword: 'dew point calculator',
  secondaryKeywords: [
    'how to calculate dew point',
    'dew point temperature calculator',
    'humidity dew point calculator',
    'relative humidity dew point calculator',
  ],
  defaultUnitSystem: 'imperial',
  inputs: [
    {
      id: 'temp',
      label: 'Air temperature',
      type: 'number',
      unit: 'temperature',
      default: { imperial: 80, metric: 27 },
      min: { imperial: -40, metric: -40 },
      max: { imperial: 122, metric: 50 },
      step: { imperial: 1, metric: 0.5 },
      help: 'Shade temperature from a thermometer or weather report.',
    },
    {
      id: 'rh',
      label: 'Relative humidity',
      type: 'number',
      unitLabel: '%',
      default: 50,
      min: 1,
      max: 100,
      step: 1,
      help: 'From a hygrometer or weather report, e.g. 50 for 50%.',
    },
  ],
  outputs: [
    { id: 'td', label: 'Dew point', unit: 'temperature', decimals: 1, primary: true },
    { id: 'comfort', label: 'Summer comfort (NWS)', format: 'text' },
    { id: 'spread', label: 'Air temperature minus dew point', unit: 'tempDelta', decimals: 1 },
    { id: 'e', label: 'Water vapor pressure', unitLabel: 'hPa', decimals: 1 },
  ],
  compute(inputs, system) {
    const t = Number(inputs.temp);
    const rh = Number(inputs.rh);
    const tC = system === 'metric' ? t : fToC(t);
    if (tC < MAGNUS_MIN_C - 1e-9 || tC > MAGNUS_MAX_C + 1e-9) {
      return {
        ok: false,
        error:
          'The Magnus coefficients used here are fitted for air temperatures from −40 °C to 50 °C (−40 °F to 122 °F). Enter a temperature inside that range.',
      };
    }
    if (!(rh > 0) || rh > 100) {
      return { ok: false, error: 'Relative humidity must be above 0% and no more than 100%.' };
    }
    const tdC = dewPoint(tC, rh);
    if (tdC < MAGNUS_MIN_C) {
      return {
        ok: false,
        error:
          'The dew point for this air is below −40 °C (−40 °F), outside the range the Magnus formula is fitted for. The air is extremely dry; check the humidity reading.',
      };
    }
    const tdF = cToF(tdC);
    const cat = dewPointComfort(tdF);
    const spreadC = tC - tdC;
    const notes: string[] = [];
    if (tdC < 0) {
      notes.push(
        'This is the dew point over liquid water. Below freezing, frost forms on surfaces at the frost point, which is slightly higher than the dew point shown.',
      );
    }
    if (rh >= 100) notes.push('At 100% relative humidity the air is saturated, so the dew point equals the air temperature.');
    notes.push('Surfaces colder than the dew point will collect condensation (or dew outdoors).');
    return {
      ok: true,
      values: {
        td: system === 'metric' ? tdC : tdF,
        comfort: cat.label,
        spread: system === 'metric' ? spreadC : (spreadC * 9) / 5,
        e: vaporPressure(tC, rh),
      },
      status: cat.status,
      summary: cat.effect,
      notes,
    };
  },
  assumptions: [
    'Uses the Magnus formula for saturation vapor pressure over water with the Alduchov and Eskridge (1996) coefficients: a = 17.625, b = 243.04 °C, c = 6.1094 hPa. The dew point is the exact inverse of the same formula.',
    'The coefficients were fitted for −40 °C to +50 °C (−40 °F to 122 °F); temperatures and dew points outside that range return a message instead of a number.',
    'Dew point is calculated over liquid water. Below 0 °C (32 °F) the frost point over ice is slightly higher.',
    'Relative humidity is treated as the fraction of saturation vapor pressure over water, the convention used by weather services.',
    'The comfort label uses the NWS summer dew point scale (°F) and is a general guide; people feel humidity differently.',
    'Fahrenheit inputs are converted to Celsius, calculated, then converted back.',
  ],
  sources: [
    {
      title: 'Improved Magnus Form Approximation of Saturation Vapor Pressure (J. Appl. Meteor. 35, 601–609)',
      publisher: 'O. A. Alduchov and R. E. Eskridge, American Meteorological Society, 1996',
      url: 'https://doi.org/10.1175/1520-0450(1996)035%3C0601:IMFAOS%3E2.0.CO;2',
    },
    {
      title: 'The Relationship between Relative Humidity and the Dewpoint Temperature in Moist Air (BAMS 86, 225–233)',
      publisher: 'M. G. Lawrence, American Meteorological Society, 2005',
      url: 'https://doi.org/10.1175/BAMS-86-2-225',
    },
    { title: 'Dew Point vs Humidity', publisher: 'National Weather Service, La Crosse WI', url: 'https://www.weather.gov/arx/why_dewpoint_vs_humidity' },
    {
      title: 'A Discussion of Water Vapor, Humidity, and Dewpoint',
      publisher: 'National Weather Service, Louisville KY',
      url: 'https://www.weather.gov/lmk/humidity',
    },
  ],
  relatedCalculators: ['relative-humidity-calculator', 'heat-index-calculator', 'wet-bulb-calculator', 'dehumidifier-size-calculator'],
  relatedPosts: [],
  reviewedAgainst: 'the Alduchov and Eskridge (1996) Magnus coefficients and the NWS dew point and humidity examples',
  updated: '2026-11-08',
  affiliate: ['hygrometer', 'dehumidifier'],
};

export default config;
