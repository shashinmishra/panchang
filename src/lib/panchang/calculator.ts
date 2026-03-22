/**
 * Panchang Calculator — computes all five elements of the Hindu calendar
 * for any given Gregorian date.
 */

import { toJulianDay, sunLongitude, moonLongitude, toSidereal } from "./astronomy";
import { getPurnimantInfo } from "./adhik-masa";
import {
  TITHI_NAMES,
  TITHI_NAMES_EN,
  PAKSHA_NAMES,
  NAKSHATRA_NAMES,
  NAKSHATRA_NAMES_EN,
  MASA_NAMES,
  MASA_NAMES_EN,
  VARA_NAMES,
  VARA_NAMES_EN,
  RASHI_NAMES,
  RASHI_NAMES_EN,
  type PanchangData,
  type Paksha,
} from "./types";

/**
 * Compute tithi (1-30) from Sun and Moon sidereal longitudes.
 */
function computeTithi(moonLong: number, sunLong: number): number {
  let elongation = moonLong - sunLong;
  if (elongation < 0) elongation += 360;
  const tithi = Math.floor(elongation / 12) + 1;
  return tithi > 30 ? 30 : tithi;
}

/**
 * Compute nakshatra (0-26) from Moon's sidereal longitude.
 */
function computeNakshatra(moonLong: number): number {
  return Math.floor(moonLong / (360 / 27));
}

/**
 * Compute rashi (0-11) from Sun's sidereal longitude.
 */
function computeRashi(sunLong: number): number {
  return Math.floor(sunLong / 30);
}

/**
 * Compute vara (day of week, 0=Sunday) from Julian Day.
 */
function computeVara(jd: number): number {
  return Math.floor(jd + 1.5) % 7;
}

/**
 * Compute the lunar month (masa) using Purnimant system.
 * Estimates the Amavasya within the current Purnimant month from the
 * current tithi, then uses the Sun's rashi at that point.
 */
function computeMasaPurnimant(tithi: number, jd: number): number {
  let daysToAmavasya: number;
  if (tithi >= 16) {
    daysToAmavasya = (30 - tithi) * (29.53 / 30);
  } else {
    daysToAmavasya = -(tithi) * (29.53 / 30);
  }
  const amavasya_jd = jd + daysToAmavasya;
  const sunAtAmavasya = toSidereal(sunLongitude(amavasya_jd), amavasya_jd);
  const rashiAtAmavasya = Math.floor(sunAtAmavasya / 30);
  return (rashiAtAmavasya + 1) % 12;
}

/**
 * Get complete Panchang data for a Gregorian date.
 *
 * Hybrid approach:
 * - Masa: from computeMasaPurnimant (Sun-position estimation, proven accurate)
 * - Adhik: from period table with Purnimant conversion (correctly handles
 *   the Amant→Purnimant paksha adjustment for Adhik detection)
 */
export function getPanchang(
  year: number,
  month: number,
  day: number,
  hourUTC: number = 0
): PanchangData {
  const jd = toJulianDay(year, month, day, hourUTC);

  const sunTropical = sunLongitude(jd);
  const moonTropical = moonLongitude(jd);

  const sunSidereal = toSidereal(sunTropical, jd);
  const moonSidereal = toSidereal(moonTropical, jd);

  const tithi = computeTithi(moonSidereal, sunSidereal);
  const paksha: Paksha = tithi <= 15 ? "shukla" : "krishna";
  const nakshatra = computeNakshatra(moonSidereal);
  const vara = computeVara(jd);
  const rashi = computeRashi(sunSidereal);

  // Masa: proven Sun-position estimation
  const masa = computeMasaPurnimant(tithi, jd);

  // Adhik: period table with Purnimant conversion
  // (Krishna Paksha uses NEXT Amant period's Adhik status, matching Purnimant convention)
  const purnimant = getPurnimantInfo(jd, year, tithi);
  const isAdhik = purnimant.isAdhik;

  return {
    tithi,
    tithiName: TITHI_NAMES[tithi - 1],
    tithiNameEn: TITHI_NAMES_EN[tithi - 1],
    paksha,
    pakshaName: PAKSHA_NAMES[paksha].hi,
    pakshaNameEn: PAKSHA_NAMES[paksha].en,
    nakshatra,
    nakshatraName: NAKSHATRA_NAMES[nakshatra],
    nakshatraNameEn: NAKSHATRA_NAMES_EN[nakshatra],
    masa,
    masaName: MASA_NAMES[masa],
    masaNameEn: MASA_NAMES_EN[masa],
    vara,
    varaName: VARA_NAMES[vara],
    varaNameEn: VARA_NAMES_EN[vara],
    rashi,
    rashiName: RASHI_NAMES[rashi],
    rashiNameEn: RASHI_NAMES_EN[rashi],
    sunLongitude: sunSidereal,
    moonLongitude: moonSidereal,
    isAdhik,
  };
}

/**
 * Compute Panchang for every day of a given month.
 */
export function getMonthPanchang(
  year: number,
  month: number
): Map<number, PanchangData> {
  const result = new Map<number, PanchangData>();
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    result.set(day, getPanchang(year, month, day));
  }

  return result;
}

/**
 * Compute Panchang for every day of a given year.
 */
export function getYearPanchang(
  year: number
): Map<number, Map<number, PanchangData>> {
  const result = new Map<number, Map<number, PanchangData>>();

  for (let month = 1; month <= 12; month++) {
    result.set(month, getMonthPanchang(year, month));
  }

  return result;
}
