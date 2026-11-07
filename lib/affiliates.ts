/**
 * Affiliate links live only in this file.
 * Set NEXT_PUBLIC_AMAZON_TAG (e.g. "coolwave-20") in Vercel to turn on tracking.
 * Links point to Amazon search/category pages, never to a specific product we have not reviewed.
 */
const TAG = process.env.NEXT_PUBLIC_AMAZON_TAG ?? '';

function amazonSearch(query: string): string {
  const url = new URL('https://www.amazon.com/s');
  url.searchParams.set('k', query);
  if (TAG) url.searchParams.set('tag', TAG);
  return url.toString();
}

export const AFFILIATES = {
  'window-ac': { label: 'Window air conditioners', blurb: 'Compare window units by BTU rating and CEER.', url: amazonSearch('window air conditioner') },
  'portable-ac': { label: 'Portable air conditioners', blurb: 'Dual-hose models cool more efficiently than single-hose.', url: amazonSearch('dual hose portable air conditioner') },
  'mini-split': { label: 'Ductless mini-split systems', blurb: 'Filter by BTU size and SEER2 rating.', url: amazonSearch('ductless mini split') },
  'ceiling-fan': { label: 'Ceiling fans', blurb: 'Look for the CFM and CFM-per-watt figures on the label.', url: amazonSearch('ceiling fan') },
  dehumidifier: { label: 'Dehumidifiers', blurb: 'Check the pint rating against the 2019 DOE test standard.', url: amazonSearch('energy star dehumidifier') },
  'space-heater': { label: 'Space heaters', blurb: 'Look for tip-over and overheat protection.', url: amazonSearch('space heater tip over protection') },
  generator: { label: 'Portable and standby generators', blurb: 'Compare running and starting watts.', url: amazonSearch('home generator') },
  'energy-monitor': { label: 'Plug-in energy monitors', blurb: 'Measure an appliance’s real watts and kWh.', url: amazonSearch('plug in electricity usage monitor') },
  hygrometer: { label: 'Thermometer-hygrometers', blurb: 'Track indoor temperature and humidity.', url: amazonSearch('digital thermometer hygrometer') },
  thermostat: { label: 'Smart thermostats', blurb: 'Schedule setbacks automatically.', url: amazonSearch('smart thermostat') },
  insulation: { label: 'Insulation and draught-proofing', blurb: 'Compare R-value per inch.', url: amazonSearch('insulation roll r-value') },
  'sound-machine': { label: 'White noise machines', blurb: 'For when you want sound without a phone.', url: amazonSearch('white noise machine') },
  'sound-meter': { label: 'Sound level meters', blurb: 'A calibrated meter is far more accurate than a phone.', url: amazonSearch('sound level meter class 2') },
  'solar-kit': { label: 'Solar panel kits', blurb: 'Compare panel wattage and inverter size.', url: amazonSearch('solar panel kit') },
} as const;

export type AffiliateKey = keyof typeof AFFILIATES;
