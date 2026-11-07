export const CATEGORIES = [
  {
    slug: 'cooling-ac',
    name: 'Cooling & AC',
    short: 'Size an air conditioner, compare efficiency and plan airflow.',
    intro:
      'Pick the right air conditioner size, compare SEER ratings, plan ductwork and size a ceiling fan. Every calculator here works in BTU and tons as well as watts and kilowatts, so it fits the way equipment is sold in the US, UK, Canada, Australia and the Gulf.',
  },
  {
    slug: 'heating-energy',
    name: 'Heating & Energy',
    short: 'Running costs, furnace sizing, kWh and solar.',
    intro:
      'Work out what an appliance costs to run, size a furnace or generator, compare a heat pump with a gas furnace and estimate how much solar you need. Enter your own tariff in your own currency; nothing assumes a single country.',
  },
  {
    slug: 'weather-heat',
    name: 'Weather & Heat',
    short: 'Dew point, wind chill, heat index, wet bulb and humidity.',
    intro:
      'The same formulas national weather services use, with their valid ranges enforced. When a formula does not apply to your inputs, the calculator says so instead of showing a misleading number.',
  },
  {
    slug: 'home-climate',
    name: 'Home Climate',
    short: 'Ventilation, insulation and humidity control at home.',
    intro:
      'Calculate airflow and air changes per hour, see how much heat your walls and windows lose, and size a dehumidifier for a damp room or basement.',
  },
  {
    slug: 'sound-waves',
    name: 'Sound & Waves',
    short: 'Noise and tone generators, a decibel meter and wavelength maths.',
    intro:
      'Play white, pink or brown noise, generate a pure test tone, measure how loud a room is and convert frequency to wavelength. Everything runs in your browser; no audio is uploaded anywhere.',
  },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export function getCategory(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}
