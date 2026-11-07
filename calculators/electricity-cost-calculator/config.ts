import type { CalculatorConfig } from '@/lib/engine/types';
import { CURRENCIES } from '@/lib/engine/format';

/** EIA: average US household uses about 10,500 kWh per year. */
export const US_AVG_HOUSEHOLD_KWH_YEAR = 10500;

const config: CalculatorConfig = {
  slug: 'electricity-cost-calculator',
  title: 'Electricity Cost Calculator',
  h1: 'Electricity Cost Calculator',
  metaTitle: 'Electricity Cost Calculator: kWh to Cost | CoolWave',
  metaDescription:
    'Find what any appliance or your monthly kWh costs. Enter watts and hours, or kWh, and your price per kWh in any currency. Daily, monthly and yearly cost.',
  category: 'heating-energy',
  shortDescription: 'Turn watts and hours, or kWh from your bill, into a daily, monthly and yearly cost in your currency.',
  primaryKeyword: 'electricity cost calculator',
  secondaryKeywords: ['kwh calculator', 'electric bill calculator', 'energy cost calculator', 'electricity consumption calculator', 'power cost calculator'],
  inputs: [
    {
      id: 'mode',
      label: 'What do you know?',
      type: 'select',
      default: 'watts',
      options: [
        { value: 'watts', label: 'The appliance’s power (watts) and hours used' },
        { value: 'kwh', label: 'My monthly kWh (from a bill or meter)' },
      ],
    },
    { id: 'watts', label: 'Power', type: 'number', unitLabel: 'W', default: 1500, min: 0.1, max: 100000, step: 1, help: 'On the label or in the manual. 1 kW = 1,000 W.', showIf: { input: 'mode', equals: 'watts' } },
    { id: 'hours', label: 'Hours used per day', type: 'number', unitLabel: 'h/day', default: 4, min: 0, max: 24, step: 0.25, showIf: { input: 'mode', equals: 'watts' } },
    { id: 'days', label: 'Days used per month', type: 'number', unitLabel: 'days', default: 30, min: 1, max: 31, step: 1, showIf: { input: 'mode', equals: 'watts' } },
    { id: 'kwhMonth', label: 'Electricity used per month', type: 'number', unitLabel: 'kWh', default: 875, min: 0, max: 1000000, step: 1, showIf: { input: 'mode', equals: 'kwh' } },
    { id: 'rate', label: 'Price per kWh', type: 'number', unitLabel: 'per kWh', default: 0.18, min: 0, max: 10, step: 0.001, help: 'Use the unit rate on your bill, e.g. 0.18 for 18¢ or 0.25 for 25p.' },
    { id: 'currency', label: 'Currency', type: 'select', default: 'USD', options: CURRENCIES.map((c) => ({ value: c.value, label: c.label })) },
  ],
  outputs: [
    { id: 'month', label: 'Cost per month', format: 'currency', decimals: 2, primary: true },
    { id: 'day', label: 'Cost per day of use', format: 'currency', decimals: 2 },
    { id: 'year', label: 'Cost per year', format: 'currency', decimals: 2 },
    { id: 'kwhMonth', label: 'Energy per month', unitLabel: 'kWh', decimals: 1 },
    { id: 'kwhYear', label: 'Energy per year', unitLabel: 'kWh', decimals: 0 },
  ],
  compute(inputs) {
    const rate = Number(inputs.rate);
    let kwhDay: number;
    let kwhMonth: number;
    if (inputs.mode === 'kwh') {
      kwhMonth = Number(inputs.kwhMonth);
      kwhDay = kwhMonth / (365 / 12);
    } else {
      kwhDay = (Number(inputs.watts) * Number(inputs.hours)) / 1000;
      kwhMonth = kwhDay * Number(inputs.days);
    }
    const kwhYear = kwhMonth * 12;
    const share = (kwhYear / US_AVG_HOUSEHOLD_KWH_YEAR) * 100;
    return {
      ok: true,
      values: { month: kwhMonth * rate, day: kwhDay * rate, year: kwhYear * rate, kwhMonth, kwhYear },
      summary:
        inputs.mode === 'kwh'
          ? `That is ${Math.round(share)}% of the average US household’s yearly use (about ${US_AVG_HOUSEHOLD_KWH_YEAR.toLocaleString('en-US')} kWh, EIA).`
          : `This appliance uses ${kwhYear.toFixed(0)} kWh a year, about ${share < 1 ? share.toFixed(1) : Math.round(share)}% of an average US household’s electricity (EIA).`,
      notes:
        inputs.mode === 'kwh'
          ? ['Cost per day is the monthly figure divided by the average month length (30.4 days).']
          : ['The label wattage is usually the maximum. Appliances with thermostats (heaters, fridges, AC) cycle on and off, so real use is often lower. A plug-in energy monitor gives the true figure.'],
    };
  },
  assumptions: [
    'Energy (kWh) = power (W) × hours ÷ 1,000. One kilowatt-hour is 1,000 watts used for one hour (EIA).',
    'Cost = kWh × your price per kWh. Fixed daily standing or service charges, taxes and tiered or time-of-use rates are not included.',
    'Yearly figures are the monthly figure × 12.',
    'The appliance is assumed to draw its full rated power whenever it is on.',
    'The default price, $0.18/kWh, is close to the US residential average of 18.16¢/kWh for August 2026 (EIA, preliminary). Replace it with your own rate.',
  ],
  sources: [
    { title: 'Measuring electricity', publisher: 'U.S. Energy Information Administration (EIA)', url: 'https://www.eia.gov/energyexplained/electricity/measuring-electricity.php' },
    { title: 'Electricity use in homes', publisher: 'U.S. Energy Information Administration (EIA)', url: 'https://www.eia.gov/energyexplained/use-of-energy/electricity-use-in-homes.php' },
    { title: 'Electric Power Monthly, Table 5.6.A: Average Price of Electricity by State', publisher: 'U.S. Energy Information Administration (EIA)', url: 'https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_a' },
    { title: 'Energy price cap', publisher: 'Ofgem (UK energy regulator)', url: 'https://www.ofgem.gov.uk/energy-price-cap' },
  ],
  relatedCalculators: ['watts-to-kwh-calculator', 'space-heater-cost-calculator', 'refrigerator-wattage-calculator', 'solar-panel-calculator', 'generator-size-calculator'],
  relatedPosts: [],
  reviewedAgainst: 'the U.S. Energy Information Administration’s definition of the kilowatt-hour',
  updated: '2026-11-08',
  affiliate: ['energy-monitor', 'thermostat'],
};

export default config;
