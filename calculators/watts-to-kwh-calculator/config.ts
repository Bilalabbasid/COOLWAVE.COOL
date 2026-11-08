import type { CalculatorConfig } from '@/lib/engine/types';

/** EIA, "Electricity use in homes": the average US household uses about 10,500 kWh per year. */
export const US_AVG_HOUSEHOLD_KWH_YEAR = 10500;

/**
 * Energy (kWh) = power (kW) × hours. EIA, "Measuring electricity":
 * "One kWh is one kilowatt generated for one hour" (a 40 W bulb for 5 hours uses 0.2 kWh).
 * The duty cycle scales the hours for appliances that switch on and off under a thermostat.
 */
export function kwhPerDay(watts: number, hoursPerDay: number, dutyPercent: number): number {
  return (watts * hoursPerDay * (dutyPercent / 100)) / 1000;
}

const config: CalculatorConfig = {
  slug: 'watts-to-kwh-calculator',
  title: 'Watts to kWh Calculator',
  h1: 'Watts to kWh Calculator',
  metaTitle: 'Watts to kWh Calculator: Daily to Yearly Use | CoolWave',
  metaDescription:
    'Convert watts (or kW) and hours of use into kWh per day, week, month and year. Add a duty cycle for fridges, heaters and AC that switch on and off.',
  category: 'heating-energy',
  shortDescription: 'Turn an appliance’s watts and hours of use into kilowatt-hours per day, week, month and year.',
  primaryKeyword: 'watts to kwh',
  secondaryKeywords: ['w to kwh', 'watts to kwh calculator', 'appliance energy calculator', 'convert watts to kwh'],
  inputs: [
    {
      id: 'powerUnit',
      label: 'Power is given in',
      type: 'select',
      default: 'W',
      options: [
        { value: 'W', label: 'Watts (W)' },
        { value: 'kW', label: 'Kilowatts (kW)' },
      ],
    },
    { id: 'watts', label: 'Power', type: 'number', unitLabel: 'W', default: 100, min: 0, max: 1000000, step: 1, help: 'From the label, the manual or a plug-in energy monitor.', showIf: { input: 'powerUnit', equals: 'W' } },
    { id: 'kw', label: 'Power', type: 'number', unitLabel: 'kW', default: 1.5, min: 0, max: 1000, step: 0.01, help: '1 kW = 1,000 W.', showIf: { input: 'powerUnit', equals: 'kW' } },
    { id: 'hours', label: 'Hours switched on per day', type: 'number', unitLabel: 'h/day', default: 10, min: 0, max: 24, step: 0.25 },
    {
      id: 'duty',
      label: 'Duty cycle',
      type: 'number',
      unitLabel: '%',
      default: 100,
      min: 0,
      max: 100,
      step: 1,
      help: 'Share of the “on” time it actually draws full power. Use 100% for lights, TVs and chargers; lower for appliances with a thermostat that cycle on and off.',
    },
    { id: 'daysPerWeek', label: 'Days used per week', type: 'number', unitLabel: 'days', default: 7, min: 0, max: 7, step: 1 },
  ],
  outputs: [
    { id: 'day', label: 'Energy per day of use', unitLabel: 'kWh', decimals: 3, primary: true },
    { id: 'week', label: 'Energy per week', unitLabel: 'kWh', decimals: 2 },
    { id: 'month', label: 'Energy per month (average)', unitLabel: 'kWh', decimals: 1 },
    { id: 'year', label: 'Energy per year', unitLabel: 'kWh', decimals: 0 },
    { id: 'whDay', label: 'Watt-hours per day of use', unitLabel: 'Wh', decimals: 0 },
  ],
  compute(inputs) {
    const watts = inputs.powerUnit === 'kW' ? Number(inputs.kw) * 1000 : Number(inputs.watts);
    const hours = Number(inputs.hours);
    const duty = Number(inputs.duty);
    const daysPerWeek = Number(inputs.daysPerWeek);
    if (!Number.isFinite(watts) || watts < 0) return { ok: false, error: 'Enter the power as a positive number of watts or kilowatts.' };
    if (hours > 24) return { ok: false, error: 'A day only has 24 hours. Enter the hours the appliance is switched on in one day.' };
    if (duty > 100) return { ok: false, error: 'The duty cycle cannot be more than 100%. Use 100% if the appliance draws full power the whole time it is on.' };
    const day = kwhPerDay(watts, hours, duty);
    const week = day * daysPerWeek;
    const year = (week * 365) / 7;
    const month = year / 12;
    const share = (year / US_AVG_HOUSEHOLD_KWH_YEAR) * 100;
    const notes = [
      'Month is the yearly total divided by 12 (an average month of about 30.4 days).',
      'The label wattage is usually the maximum. A plug-in energy monitor shows the real draw and the real kWh.',
    ];
    if (duty < 100) notes.unshift(`With a ${duty}% duty cycle the appliance is effectively at full power for ${((hours * duty) / 100).toFixed(2)} hours a day.`);
    return {
      ok: true,
      values: { day, week, month, year, whDay: day * 1000 },
      status: 'info',
      summary: `${watts.toLocaleString('en-US')} W for ${hours} h a day uses ${day.toFixed(3)} kWh a day, about ${Math.round(year).toLocaleString('en-US')} kWh a year. That is ${share < 1 ? share.toFixed(1) : Math.round(share)}% of an average US household’s yearly electricity (about 10,500 kWh, EIA).`,
      notes,
    };
  },
  assumptions: [
    'Energy (kWh) = power (W) × hours ÷ 1,000. One kilowatt-hour is one kilowatt used for one hour (EIA).',
    'The duty cycle multiplies the hours: 50% means the appliance draws its full power for half the time it is switched on.',
    'A year is 365 days; a week has the number of use days you enter; a month is the yearly figure ÷ 12.',
    'The power figure is assumed to be constant while the appliance runs. Appliances with variable-speed motors or several heat settings draw different amounts at different times.',
    'To turn kWh into money, use the electricity cost calculator.',
  ],
  sources: [
    { title: 'Measuring electricity', publisher: 'U.S. Energy Information Administration (EIA)', url: 'https://www.eia.gov/energyexplained/electricity/measuring-electricity.php' },
    { title: 'Electricity use in homes', publisher: 'U.S. Energy Information Administration (EIA)', url: 'https://www.eia.gov/energyexplained/use-of-energy/electricity-use-in-homes.php' },
  ],
  relatedCalculators: ['electricity-cost-calculator', 'refrigerator-wattage-calculator', 'space-heater-cost-calculator', 'generator-size-calculator', 'solar-panel-calculator'],
  relatedPosts: [],
  reviewedAgainst: 'the U.S. Energy Information Administration’s definition of the kilowatt-hour and its 40 W bulb example',
  updated: '2026-11-08',
  affiliate: ['energy-monitor'],
};

export default config;
