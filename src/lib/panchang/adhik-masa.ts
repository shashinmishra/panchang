/**
 * Adhik Masa (intercalary month) detection and Purnimant masa computation.
 *
 * A lunar month (Amavasya to Amavasya) is Adhik Masa if the Sun does NOT
 * transit into a new rashi during that period (no Sankranti).
 *
 * This module also handles the Amant → Purnimant month conversion:
 * - Shukla Paksha days: Purnimant month = current Amant period's month
 * - Krishna Paksha days: Purnimant month = NEXT Amant period's month
 *   (because in Purnimant, Krishna Paksha starts the month and belongs
 *    to the month named after the upcoming Amavasya's Amant month)
 */

import {
  toJulianDay,
  sunLongitude,
  moonLongitude,
  toSidereal,
} from "./astronomy";

interface AmasvasyaPeriod {
  startJD: number;
  endJD: number;
  isAdhik: boolean;
  masa: number; // Amant-style masa (0-11)
}

export interface PurnimantInfo {
  masa: number;    // Purnimant-correct masa
  isAdhik: boolean; // Adhik in Purnimant context
}

const cache = new Map<number, AmasvasyaPeriod[]>();

function tithiAtJD(jd: number): number {
  const sunSid = toSidereal(sunLongitude(jd), jd);
  const moonSid = toSidereal(moonLongitude(jd), jd);
  let elong = moonSid - sunSid;
  if (elong < 0) elong += 360;
  const t = Math.floor(elong / 12) + 1;
  return t > 30 ? 30 : t;
}

function rashiAtJD(jd: number): number {
  return Math.floor(toSidereal(sunLongitude(jd), jd) / 30);
}

function findAmavasyas(startJD: number, endJD: number): number[] {
  const result: number[] = [];
  let prev = tithiAtJD(startJD - 1);
  for (let jd = startJD; jd <= endJD; jd += 1) {
    const t = tithiAtJD(jd);
    if (t === 30 && prev !== 30) {
      result.push(jd);
    }
    prev = t;
  }
  return result;
}

function buildPeriods(year: number): AmasvasyaPeriod[] {
  const scanStart = toJulianDay(year - 1, 10, 1, 0);
  const scanEnd = toJulianDay(year + 1, 3, 31, 0);
  const amavasyas = findAmavasyas(scanStart, scanEnd);
  const periods: AmasvasyaPeriod[] = [];

  for (let i = 0; i < amavasyas.length - 1; i++) {
    const jd1 = amavasyas[i];
    const jd2 = amavasyas[i + 1];
    const rashiStart = rashiAtJD(jd1);

    let hasSankranti = false;
    let prevRashi = rashiStart;
    for (let jd = jd1 + 1; jd <= jd2; jd += 1) {
      const r = rashiAtJD(jd);
      if (r !== prevRashi) {
        hasSankranti = true;
        break;
      }
      prevRashi = r;
    }

    periods.push({
      startJD: jd1,
      endJD: jd2,
      isAdhik: !hasSankranti,
      masa: (rashiStart + 1) % 12,
    });
  }

  return periods;
}

function getPeriodsForYear(year: number): AmasvasyaPeriod[] {
  if (!cache.has(year)) {
    cache.set(year, buildPeriods(year));
  }
  return cache.get(year)!;
}

/**
 * Get Purnimant-correct masa and Adhik status for a given Julian Day.
 *
 * Converts from Amant (period-table) to Purnimant by checking the paksha:
 * - Shukla (tithi 1-15): uses current Amant period
 * - Krishna (tithi 16-30): uses NEXT Amant period
 *   (the Amant month starting at the upcoming Amavasya)
 */
export function getPurnimantInfo(jd: number, year: number, tithi: number): PurnimantInfo {
  const periods = getPeriodsForYear(year);
  const isKrishna = tithi >= 16;

  for (let i = 0; i < periods.length; i++) {
    const period = periods[i];
    if (jd >= period.startJD && jd < period.endJD) {
      if (isKrishna && i + 1 < periods.length) {
        // Krishna Paksha: Purnimant month = next Amant month
        const next = periods[i + 1];
        return { masa: next.masa, isAdhik: next.isAdhik };
      } else {
        // Shukla Paksha: Purnimant month = current Amant month
        return { masa: period.masa, isAdhik: period.isAdhik };
      }
    }
  }

  return { masa: -1, isAdhik: false };
}

// Keep backward compat
export interface AdhikInfo {
  isAdhik: boolean;
  masa: number;
}

export function getAdhikInfo(jd: number, year: number): AdhikInfo {
  const periods = getPeriodsForYear(year);
  for (const period of periods) {
    if (jd >= period.startJD && jd < period.endJD) {
      return { isAdhik: period.isAdhik, masa: period.masa };
    }
  }
  return { isAdhik: false, masa: -1 };
}

export function clearAdhikCache(): void {
  cache.clear();
}
