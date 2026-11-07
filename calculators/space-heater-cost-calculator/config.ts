import type { CalculatorConfig } from '@/lib/engine/types';
import { CURRENCIES, currencySymbol } from '@/lib/engine/format';

/** Heater settings offered as presets (watts). 1,500 W is the usual maximum for a household plug-in heater (CPSC staff assessment, 2023). */
export const HEATER_PRESETS: Record<string, number> = { high: 1500, low: 750 };

/**
 * In CPSC's 2023 staff assessment of 27 household portable electric heaters, 23 had a maximum input of 1,500 W
 * (Table 6-1, counting the one labelled 2,000 W that measured 1,500 W). UL 1278 classes a 2,000 W heater as
 * commercial/industrial.
 */
export const TYPICAL_MAX_W = 1500;

const money = (v: number, currency: unknown) => `${currencySymbol(currency)}${v.toFixed(2)}`;

const config: CalculatorConfig = {
  slug: 'space-heater-cost-calculator',
  title: 'Space Heater Cost Calculator',
  h1: 'How Much Does It Cost to Run a Space Heater?',
  metaTitle: 'Cost to Run a Space Heater Calculator | CoolWave',
  metaDescription:
    'How much does it cost to run a space heater? Pick 1,500 W, 750 W or your wattage and your kWh price to see the cost per hour, per day and per month.',
  category: 'heating-energy',
  shortDescription: 'Work out what an electric space heater costs per hour, per day and per month at your electricity price.',
  primaryKeyword: 'how much does it cost to run a space heater',
  secondaryKeywords: [
    'does a portable heater use a lot of electricity',
    'space heater cost to run',
    'space heater cost calculator',
    'space heater calculator',
  ],
  inputs: [
    {
      id: 'setting',
      label: 'Heater power',
      type: 'select',
      default: 'high',
      options: [
        { value: 'high', label: '1,500 W (high setting of a typical plug-in heater)' },
        { value: 'low', label: '750 W (low setting on many 1,500 W heaters; check the label)' },
        { value: 'custom', label: 'Enter my heater’s wattage' },
      ],
    },
    {
      id: 'watts',
      label: 'Heater wattage',
      type: 'number',
      unitLabel: 'W',
      default: 1000,
      min: 50,
      max: 5000,
      step: 1,
      help: 'Printed on the label or base of the heater. 1 kW = 1,000 W.',
      showIf: { input: 'setting', equals: 'custom' },
    },
    { id: 'hours', label: 'Hours used per day', type: 'number', unitLabel: 'h/day', default: 8, min: 0, max: 24, step: 0.25 },
    { id: 'days', label: 'Days used per month', type: 'number', unitLabel: 'days', default: 30, min: 1, max: 31, step: 1 },
    {
      id: 'duty',
      label: 'Share of the time the heater is actually heating',
      type: 'number',
      unitLabel: '%',
      default: 100,
      min: 1,
      max: 100,
      step: 1,
      help: 'A heater with a thermostat switches off once the room is warm. 100% is the worst case. A plug-in energy monitor shows your real figure.',
    },
    { id: 'rate', label: 'Electricity price per kWh', type: 'number', unitLabel: 'per kWh', default: 0.18, min: 0, max: 10, step: 0.001, help: 'The unit rate on your bill, e.g. 0.18 for 18¢ or 0.25 for 25p.' },
    { id: 'currency', label: 'Currency', type: 'select', default: 'USD', options: CURRENCIES.map((c) => ({ value: c.value, label: c.label })) },
  ],
  outputs: [
    { id: 'hour', label: 'Cost per hour', format: 'currency', decimals: 2, primary: true },
    { id: 'day', label: 'Cost per day (hours entered)', format: 'currency', decimals: 2 },
    { id: 'month', label: 'Cost per month', format: 'currency', decimals: 2 },
    { id: 'kwhDay', label: 'Electricity per day', unitLabel: 'kWh', decimals: 2 },
    { id: 'kwhMonth', label: 'Electricity per month', unitLabel: 'kWh', decimals: 1 },
    { id: 'avgW', label: 'Average power drawn', unitLabel: 'W', decimals: 0 },
  ],
  compute(inputs) {
    const watts = inputs.setting === 'custom' ? Number(inputs.watts) : HEATER_PRESETS[String(inputs.setting)];
    if (!Number.isFinite(watts) || watts <= 0) {
      return { ok: false, error: 'Enter the heater’s wattage from its label, or choose the 1,500 W or 750 W setting.' };
    }
    const duty = Number(inputs.duty) / 100;
    const rate = Number(inputs.rate);
    const hours = Number(inputs.hours);
    const avgW = watts * duty;
    const kwhHour = avgW / 1000;
    const kwhDay = kwhHour * hours;
    const kwhMonth = kwhDay * Number(inputs.days);
    const hour = kwhHour * rate;
    const day = kwhDay * rate;
    const month = kwhMonth * rate;
    const notes: string[] = [];
    if (duty === 1) {
      notes.push(
        'This assumes the heater runs flat out the whole time. With its thermostat on, it cycles off once the room is warm, so real use is usually lower. Lower the “share of the time” figure to reflect that.',
      );
    }
    if (watts > TYPICAL_MAX_W) {
      notes.push(
        'More than 1,500 W is unusual for a household plug-in heater: 23 of 27 household models tested by CPSC staff topped out at 1,500 W, and UL 1278 classes a 2,000 W heater as commercial/industrial. Check the label.',
      );
    }
    return {
      ok: true,
      values: { hour, day, month, kwhDay, kwhMonth, avgW },
      status: watts > TYPICAL_MAX_W ? 'caution' : 'info',
      summary: `A ${watts.toLocaleString('en-US')} W heater${duty < 1 ? ` heating ${Math.round(duty * 100)}% of the time` : ''} costs about ${money(hour, inputs.currency)} an hour, ${money(day, inputs.currency)} for ${hours} hours, and ${money(month, inputs.currency)} a month at that use.`,
      notes,
    };
  },
  assumptions: [
    'Energy (kWh) = watts × hours ÷ 1,000; one kilowatt-hour is 1,000 watts used for one hour (EIA).',
    'Cost = kWh × your price per kWh. Fixed standing or service charges, taxes and tiered or time-of-use prices are not included.',
    'The heater draws its rated wattage whenever it is heating. The “share of the time” input scales that down for thermostat cycling.',
    'Presets: 1,500 W is the usual maximum for a household plug-in heater (CPSC staff testing, 2023). 750 W is a common low setting, but low settings vary by model, so check your heater’s label.',
    'The default price, $0.18 per kWh, is close to the US residential average of 18.16¢ per kWh for August 2026 (EIA, preliminary). Replace it with your own rate.',
    'A month is the hours per day × the days you enter, not a calendar month.',
  ],
  sources: [
    { title: 'Measuring electricity', publisher: 'U.S. Energy Information Administration (EIA)', url: 'https://www.eia.gov/energyexplained/electricity/measuring-electricity.php' },
    { title: 'Electric Power Monthly, Table 5.6.A: Average Price of Electricity by State', publisher: 'U.S. Energy Information Administration (EIA)', url: 'https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_a' },
    { title: 'CPSC Staff Assessment on Portable Electric Heaters (February 2023)', publisher: 'U.S. Consumer Product Safety Commission (CPSC)', url: 'https://www.cpsc.gov/s3fs-public/CPSCStaffAssessmentonPortableElectricHeatersFebruary2023.pdf' },
    {
      title: 'Stay Safe While Staying Warm This Winter (space heater safety tips)',
      publisher: 'U.S. Consumer Product Safety Commission (CPSC)',
      url: 'https://www.cpsc.gov/Newsroom/News-Releases/2024/Stay-Safe-While-Staying-Warm-This-Winter-CPSC-Warns-Consumers-to-be-Cautious-When-Using-Generators-Furnaces-and-Space-Heaters',
    },
    { title: 'Heating safety', publisher: 'National Fire Protection Association (NFPA)', url: 'https://www.nfpa.org/education-and-research/home-fire-safety/heating' },
    { title: 'Air-Source Heat Pumps', publisher: 'ENERGY STAR (US EPA)', url: 'https://www.energystar.gov/products/air_source_heat_pumps' },
  ],
  relatedCalculators: ['electricity-cost-calculator', 'heat-pump-vs-gas-furnace-calculator', 'watts-to-kwh-calculator', 'btu-to-watts-converter', 'furnace-size-calculator'],
  relatedPosts: [],
  disclaimer:
    'Space heaters cause about a third of US home heating fires but nearly nine in ten heating fire deaths (NFPA). Keep all sides at least 3 feet (1 m) from anything that can burn, plug it straight into a wall outlet (never a power strip), stand it on a stable, level surface, and do not leave it on while you sleep or in a closed room unattended (CPSC). This calculator estimates running cost only; it is not safety advice for your particular heater.',
  reviewedAgainst: 'the EIA definition of the kilowatt-hour and CPSC staff test data on household portable electric heaters',
  updated: '2026-11-08',
  affiliate: ['space-heater', 'energy-monitor'],
};

export default config;
