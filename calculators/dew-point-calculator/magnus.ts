/**
 * Shared psychrometric functions (pure, all temperatures in °C, pressures in hPa).
 *
 * Saturation vapour pressure over liquid water uses the Magnus form with the coefficients of
 * Alduchov & Eskridge (1996), "Improved Magnus Form Approximation of Saturation Vapor Pressure",
 * J. Appl. Meteor. 35, 601–609, doi:10.1175/1520-0450(1996)035<0601:IMFAOS>2.0.CO;2:
 *   es(T) = 6.1094 · exp(17.625·T / (T + 243.04))   [hPa], fitted for −40 °C to +50 °C.
 * The dew point is the exact inverse of the same formula (as used by Lawrence 2005, BAMS 86, 225–233).
 *
 * Used by dew-point-calculator and relative-humidity-calculator.
 */

/** Magnus coefficient a (dimensionless), Alduchov & Eskridge (1996). */
export const MAGNUS_A = 17.625;
/** Magnus coefficient b (°C), Alduchov & Eskridge (1996). */
export const MAGNUS_B = 243.04;
/** Magnus coefficient c (hPa), Alduchov & Eskridge (1996). */
export const MAGNUS_C = 6.1094;

/** Lower and upper limits (°C) of the range the coefficients were fitted for. */
export const MAGNUS_MIN_C = -40;
export const MAGNUS_MAX_C = 50;

/** Standard sea-level pressure in hPa. */
export const STANDARD_PRESSURE_HPA = 1013.25;

/** Saturation vapour pressure over liquid water, hPa. */
export function saturationVaporPressure(tC: number): number {
  return MAGNUS_C * Math.exp((MAGNUS_A * tC) / (MAGNUS_B + tC));
}

/** Actual vapour pressure (hPa) from air temperature (°C) and relative humidity (%). */
export function vaporPressure(tC: number, rh: number): number {
  return (rh / 100) * saturationVaporPressure(tC);
}

/** Temperature (°C) at which the saturation vapour pressure equals e (hPa): the inverse Magnus formula. */
export function dewPointFromVaporPressure(e: number): number {
  const g = Math.log(e / MAGNUS_C);
  return (MAGNUS_B * g) / (MAGNUS_A - g);
}

/** Dew point (°C) from air temperature (°C) and relative humidity (%, greater than 0). */
export function dewPoint(tC: number, rh: number): number {
  const g = Math.log(rh / 100) + (MAGNUS_A * tC) / (MAGNUS_B + tC);
  return (MAGNUS_B * g) / (MAGNUS_A - g);
}

/** Relative humidity (%) from air temperature and dew point (°C). */
export function relativeHumidity(tC: number, tdC: number): number {
  return (100 * saturationVaporPressure(tdC)) / saturationVaporPressure(tC);
}

/**
 * Actual vapour pressure (hPa) from a ventilated psychrometer, using the psychrometer equation
 * published by the NWS (El Paso WFO, "Relative Humidity and Dewpoint Temperature from Temperature
 * and Wet Bulb Temperature"): e = ew − P·(T − Tw)·0.00066·(1 + 0.00115·Tw).
 * Valid for a wet (not iced) wick.
 */
export function vaporPressureFromWetBulb(tC: number, twC: number, pressureHpa = STANDARD_PRESSURE_HPA): number {
  return saturationVaporPressure(twC) - pressureHpa * (tC - twC) * 0.00066 * (1 + 0.00115 * twC);
}

/** Relative humidity (%) from dry-bulb and wet-bulb temperatures (°C) and station pressure (hPa). */
export function relativeHumidityFromWetBulb(tC: number, twC: number, pressureHpa = STANDARD_PRESSURE_HPA): number {
  return (100 * vaporPressureFromWetBulb(tC, twC, pressureHpa)) / saturationVaporPressure(tC);
}
