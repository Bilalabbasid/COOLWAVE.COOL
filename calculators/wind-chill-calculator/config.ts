import type { CalculatorConfig, ResultStatus } from '@/lib/engine/types';
import { cToF, fToC, MPH_TO_KMH } from '@/lib/engine/units';

/**
 * Wind chill temperature index (NWS and Environment Canada, in use since November 2001).
 * Imperial form from the NWS wind chill chart; metric form from the ECCC wind chill calculator
 * (weather.gc.ca/windchill/js/wind_chill.js). The two are the same model to within 0.1 °F.
 */
export function windChillF(T: number, mph: number): number {
  const v = Math.pow(mph, 0.16);
  return 35.74 + 0.6215 * T - 35.75 * v + 0.4275 * T * v;
}

export function windChillC(T: number, kmh: number): number {
  const v = Math.pow(kmh, 0.16);
  return 13.12 + 0.6215 * T - 11.37 * v + 0.3965 * T * v;
}

/** NWS: wind chill is defined only at or below 50 °F (10 °C). */
export const MAX_T_F = 50;
export const MAX_T_C = 10;
/** NWS: defined for winds above 3 mph. ECCC applies the main formula from 5 km/h. */
export const MIN_WIND_MPH = 3;
export const MIN_WIND_KMH = 5;
/** Edges of the published charts: NWS to 60 mph, ECCC calculator below 100 km/h. */
export const MAX_WIND_MPH = 60;
export const MAX_WIND_KMH = 100;

export interface FrostbiteRisk {
  level: string;
  time: string;
  status: ResultStatus;
  advice: string;
}

/**
 * Frostbite risk from the ECCC Wind Chill Index table (wind chill in °C, rounded to a whole degree
 * as ECCC reports it). NWS: frostbite needs an air temperature below freezing.
 */
export function frostbiteRisk(windChillCelsius: number, airTempC: number): FrostbiteRisk {
  if (airTempC > 0) {
    return {
      level: 'None (air above freezing)',
      time: 'Skin cannot freeze',
      status: 'info',
      advice:
        'The air is above freezing, so exposed skin cannot get frostbite (NWS). Wind still speeds up heat loss, and wet clothing can lead to hypothermia.',
    };
  }
  const wc = Math.round(windChillCelsius);
  if (wc > -10)
    return { level: 'Low', time: 'Not expected', status: 'info', advice: 'Low risk: a slight increase in discomfort. Dress warmly and stay dry.' };
  if (wc > -28)
    return {
      level: 'Moderate',
      time: 'Possible with long exposure',
      status: 'caution',
      advice: 'Moderate risk: hypothermia and frostbite are possible if you stay outside for a long time without enough protection. Cover exposed skin and wear layers.',
    };
  if (wc > -40)
    return {
      level: 'High',
      time: '10 to 30 minutes',
      status: 'warning',
      advice: 'High risk: exposed skin can freeze in 10 to 30 minutes. Cover all skin, wear a windproof outer layer, and check face, fingers and toes for numbness or whitening.',
    };
  if (wc > -48)
    return {
      level: 'Very high',
      time: '5 to 10 minutes',
      status: 'danger',
      advice: 'Very high risk: exposed skin can freeze in 5 to 10 minutes. Keep outdoor time short and cover every bit of skin.',
    };
  if (wc > -55)
    return {
      level: 'Severe',
      time: '2 to 5 minutes',
      status: 'danger',
      advice: 'Severe risk: exposed skin can freeze in 2 to 5 minutes. Stay indoors if you can.',
    };
  return {
    level: 'Extreme',
    time: 'Under 2 minutes',
    status: 'danger',
    advice: 'Extreme risk: exposed skin can freeze in less than 2 minutes. Outdoor conditions are hazardous: stay indoors.',
  };
}

const config: CalculatorConfig = {
  slug: 'wind-chill-calculator',
  title: 'Wind Chill Calculator',
  h1: 'Wind Chill Calculator (Feels-Like Temperature in the Cold)',
  metaTitle: 'Wind Chill Calculator: NWS Formula + Frostbite | CoolWave',
  metaDescription:
    'Find the wind chill from air temperature and wind speed with the official NWS and Environment Canada formula, in °F or °C, plus the time to frostbite.',
  category: 'weather-heat',
  shortDescription: 'How cold it feels on exposed skin when wind is added to cold air, with the frostbite risk for that wind chill.',
  primaryKeyword: 'wind chill calculator',
  secondaryKeywords: ['wind chill temperature calculator', 'chill factor calculator', 'wind chill formula', 'wind chill chart', 'frostbite time'],
  defaultUnitSystem: 'imperial',
  inputs: [
    {
      id: 'temp',
      label: 'Air temperature',
      type: 'number',
      unit: 'temperature',
      default: { imperial: 0, metric: -15 },
      min: { imperial: -58, metric: -50 },
      max: { imperial: 50, metric: 10 },
      step: { imperial: 1, metric: 0.5 },
      help: 'Wind chill is only defined at or below 50 °F (10 °C).',
    },
    {
      id: 'wind',
      label: 'Wind speed',
      type: 'number',
      unit: 'speed',
      default: { imperial: 15, metric: 20 },
      min: 0,
      max: { imperial: MAX_WIND_MPH, metric: MAX_WIND_KMH },
      step: 1,
      help: 'Sustained wind from a forecast or weather station (measured at 10 m / 33 ft), not gusts.',
    },
  ],
  outputs: [
    { id: 'wc', label: 'Wind chill', unit: 'temperature', decimals: 0, primary: true },
    { id: 'risk', label: 'Frostbite risk (ECCC)', format: 'text' },
    { id: 'time', label: 'Time for exposed skin to freeze', format: 'text' },
    { id: 'diff', label: 'Feels colder than the air by', unit: 'tempDelta', decimals: 0 },
  ],
  compute(inputs, system) {
    const t = Number(inputs.temp);
    const w = Number(inputs.wind);
    const metric = system === 'metric';
    if (metric ? t > MAX_T_C : t > MAX_T_F) {
      return {
        ok: false,
        error:
          'Wind chill is only defined for air temperatures at or below 50 °F (10 °C). In milder weather wind does not create a meaningful chill; use the air temperature, or the heat index when it is hot and humid.',
      };
    }
    if (metric ? w < MIN_WIND_KMH : w <= MIN_WIND_MPH) {
      return {
        ok: false,
        error: metric
          ? 'Environment Canada applies the wind chill formula from 5 km/h of wind. In calmer air the wind chill is essentially the air temperature, so enter at least 5 km/h.'
          : 'The NWS defines wind chill only for winds above 3 mph. In calmer air the wind chill is essentially the air temperature, so enter a wind speed above 3 mph.',
      };
    }
    if (metric ? w > MAX_WIND_KMH : w > MAX_WIND_MPH) {
      return {
        ok: false,
        error: 'This wind speed is beyond the official wind chill charts (60 mph for the NWS, 100 km/h for Environment Canada). Conditions like these are extremely dangerous: stay indoors.',
      };
    }
    const wc = metric ? windChillC(t, w) : windChillF(t, w);
    const wcC = metric ? wc : fToC(wc);
    const tC = metric ? t : fToC(t);
    const risk = frostbiteRisk(wcC, tC);
    const wcF = metric ? cToF(wc) : wc;
    const kmh = metric ? w : w * MPH_TO_KMH;
    const notes: string[] = [];
    if (kmh > 50) notes.push('In sustained winds over 50 km/h (31 mph), frostbite can occur faster than the times shown (Environment Canada).');
    if (wcF <= -25)
      notes.push('At or below −25 °F (−32 °C) the NWS typically issues an Extreme Cold Warning, though criteria are set by each local office.');
    else if (wcF <= -15)
      notes.push('A wind chill of −15 to −24 °F (−26 to −31 °C) is the usual NWS Cold Weather Advisory range, though criteria are set by each local office.');
    notes.push('The wind chill assumes a clear night with no sun. Bright sunshine can make it feel 10 to 18 °F (6 to 10 °C) warmer (NWS).');
    return {
      ok: true,
      values: { wc, risk: risk.level, time: risk.time, diff: Math.max(0, t - wc) },
      status: risk.status,
      summary: risk.advice,
      notes,
    };
  },
  assumptions: [
    'Uses the 2001 wind chill temperature index shared by the US National Weather Service and Environment and Climate Change Canada (ECCC): the NWS equation in °F and mph, and the ECCC equation in °C and km/h.',
    'Valid for air temperatures at or below 50 °F (10 °C) and winds above 3 mph (from 5 km/h in metric). Outside that range we show a message instead of a number.',
    'Wind speed is the standard forecast wind measured at 10 m (33 ft); the formula adjusts it to face height (about 5 ft).',
    'Frostbite risk and freezing times come from the ECCC Wind Chill Index table and apply to healthy adults with exposed skin. Frostbite needs an air temperature below freezing (NWS).',
    'Assumes no sunshine (a clear night). Sun can raise the wind chill by 10 to 18 °F.',
  ],
  sources: [
    { title: 'Wind Chill Chart', publisher: 'National Weather Service', url: 'https://www.weather.gov/safety/cold-wind-chill-chart' },
    { title: 'Wind Chill Chart (printable PDF, effective 11/01/01)', publisher: 'NOAA / National Weather Service', url: 'https://www.weather.gov/media/safety/windchillchart3.pdf' },
    { title: 'Wind Chill Calculator', publisher: 'National Weather Service, El Paso TX', url: 'https://www.weather.gov/epz/wxcalc_windchill' },
    { title: 'Wind chill and the Wind Chill Index', publisher: 'Environment and Climate Change Canada', url: 'https://www.canada.ca/en/services/environment/weather/severeweather/wind-chill-index.html' },
    { title: 'Wind Chill and Humidex Calculators', publisher: 'Environment and Climate Change Canada', url: 'https://weather.gc.ca/windchill/wind_chill_e.html' },
  ],
  relatedCalculators: ['heat-index-calculator', 'dew-point-calculator', 'snow-day-calculator', 'heating-degree-days-calculator'],
  relatedPosts: [],
  disclaimer:
    'This tool is for information only and is not medical advice. Frostbite and hypothermia can happen at milder values, especially for children, older adults and people with poor circulation or wet clothing. Follow local cold weather warnings and seek medical help for signs of frostbite or hypothermia.',
  reviewedAgainst: 'the official NWS wind chill chart (all 216 cells) and the Environment Canada wind chill table',
  updated: '2026-11-08',
};

export default config;
