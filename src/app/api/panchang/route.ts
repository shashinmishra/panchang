import { NextResponse } from "next/server";

/**
 * Server-side panchang computation using Swiss Ephemeris (via @fusionstrings/panchangam).
 *
 * The WASM package is Node.js CJS only (uses require('fs'), __dirname),
 * so all computation must happen server-side.
 *
 * GET /api/panchang?year=2026&month=3
 * Returns: { panchang: Record<day, PanchangData>, festivals: Record<day, Festival> }
 */

// Lazy-load the WASM module to avoid top-level await issues
let _panchangam: typeof import("@fusionstrings/panchangam") | null = null;
async function getPanchangam() {
  if (!_panchangam) {
    _panchangam = await import("@fusionstrings/panchangam");
  }
  return _panchangam;
}

// Re-import types/constants from our own types (kept as source of truth for names)
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
} from "@/lib/panchang/types";

import { FESTIVALS, type Festival } from "@/lib/panchang/special-days";

/** Compute a single day's panchang using Swiss Ephemeris */
async function computePanchang(
  year: number,
  month: number,
  day: number,
  hourUTC: number = 6.5 // ~6:30 AM GMT (London sunrise) = 06:30 UTC
): Promise<PanchangData> {
  const p = await getPanchangam();

  const jd = p.p_julday(year, month, day, hourUTC, 1);

  const tithiInfo = p.calculate_tithi(jd);
  const tithi = tithiInfo.index; // 1-30
  const paksha: Paksha = tithi <= 15 ? "shukla" : "krishna";

  const nakshatraInfo = p.calculate_nakshatra(jd, p.AyanamshaMode.Lahiri);
  const nakshatra = nakshatraInfo.index - 1; // 1-indexed → 0-indexed

  const varaInfo = p.calculate_vara(jd);
  const vara = varaInfo.index; // 0=Sunday

  const ayan = p.get_ayanamsha(p.AyanamshaMode.Lahiri, jd);
  const sunTrop = p.calc_ut(jd, p.Constants.SE_SUN, p.Constants.SEFLG_SWIEPH).longitude;
  const moonTrop = p.calc_ut(jd, p.Constants.SE_MOON, p.Constants.SEFLG_SWIEPH).longitude;
  const sunSidereal = ((sunTrop - ayan) % 360 + 360) % 360;
  const moonSidereal = ((moonTrop - ayan) % 360 + 360) % 360;
  const rashi = Math.floor(sunSidereal / 30);

  // Masa via Sun's rashi at estimated Amavasya (Purnimant system)
  const masa = computeMasaPurnimant(tithi, jd, sunSidereal);

  // Adhik masa detection
  const isAdhik = await computeIsAdhik(jd, year, tithi);

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

/** Compute masa using Purnimant system: Sun's rashi at estimated Amavasya */
function computeMasaPurnimant(tithi: number, jd: number, sunSidereal: number): number {
  // Estimate days to the Amavasya within this Purnimant month
  let daysToAmavasya: number;
  if (tithi >= 16) {
    daysToAmavasya = (30 - tithi) * (29.53 / 30);
  } else {
    daysToAmavasya = -(tithi) * (29.53 / 30);
  }
  // Sun moves ~1°/day, so adjust sidereal longitude
  const sunAtAmavasya = sunSidereal + daysToAmavasya * (360 / 365.25);
  const rashiAtAmavasya = Math.floor(((sunAtAmavasya % 360) + 360) % 360 / 30);
  return (rashiAtAmavasya + 1) % 12;
}

// --- Adhik Masa detection (Swiss Ephemeris backed) ---

interface AmavasyaPeriod {
  startJD: number;
  endJD: number;
  isAdhik: boolean;
  masa: number;
}

const adhikCache = new Map<number, AmavasyaPeriod[]>();

async function tithiAtJD(jd: number): Promise<number> {
  const p = await getPanchangam();
  return p.calculate_tithi(jd).index;
}

async function rashiAtJD(jd: number): Promise<number> {
  const p = await getPanchangam();
  const ayan = p.get_ayanamsha(p.AyanamshaMode.Lahiri, jd);
  const sunTrop = p.calc_ut(jd, p.Constants.SE_SUN, p.Constants.SEFLG_SWIEPH).longitude;
  return Math.floor(((sunTrop - ayan) % 360 + 360) % 360 / 30);
}

async function findAmavasyas(startJD: number, endJD: number): Promise<number[]> {
  const result: number[] = [];
  let prev = await tithiAtJD(startJD - 1);
  for (let jd = startJD; jd <= endJD; jd += 1) {
    const t = await tithiAtJD(jd);
    if (t === 30 && prev !== 30) {
      result.push(jd);
    }
    prev = t;
  }
  return result;
}

async function buildPeriods(year: number): Promise<AmavasyaPeriod[]> {
  const p = await getPanchangam();
  const scanStart = p.p_julday(year - 1, 10, 1, 0, 1);
  const scanEnd = p.p_julday(year + 1, 3, 31, 0, 1);
  const amavasyas = await findAmavasyas(scanStart, scanEnd);
  const periods: AmavasyaPeriod[] = [];

  for (let i = 0; i < amavasyas.length - 1; i++) {
    const jd1 = amavasyas[i];
    const jd2 = amavasyas[i + 1];
    const rashiStart = await rashiAtJD(jd1);

    let hasSankranti = false;
    let prevRashi = rashiStart;
    for (let jd = jd1 + 1; jd <= jd2; jd += 1) {
      const r = await rashiAtJD(jd);
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

async function getPeriodsForYear(year: number): Promise<AmavasyaPeriod[]> {
  if (!adhikCache.has(year)) {
    adhikCache.set(year, await buildPeriods(year));
  }
  return adhikCache.get(year)!;
}

async function computeIsAdhik(jd: number, year: number, tithi: number): Promise<boolean> {
  const periods = await getPeriodsForYear(year);
  const isKrishna = tithi >= 16;

  for (let i = 0; i < periods.length; i++) {
    const period = periods[i];
    if (jd >= period.startJD && jd < period.endJD) {
      if (isKrishna && i + 1 < periods.length) {
        return periods[i + 1].isAdhik;
      }
      return period.isAdhik;
    }
  }
  return false;
}

// --- Festival detection (server-side, using Swiss Ephemeris) ---

const SAMPLE_HOURS_UTC = [0.5, 3.5, 6.5, 9.5, 12.5, 18.5];

async function getFestivalForDate(
  year: number,
  month: number,
  day: number
): Promise<Festival | null> {
  const pSunrise = await computePanchang(year, month, day, 0.5);
  const dayMasa = pSunrise.masa;
  const dayIsAdhik = pSunrise.isAdhik;

  for (const f of FESTIVALS) {
    if (dayMasa !== f.masa || dayIsAdhik) continue;

    for (const h of SAMPLE_HOURS_UTC) {
      const pd = await computePanchang(year, month, day, h);
      if (pd.tithi === f.tithi) {
        return f;
      }
    }
  }
  return null;
}

// Year-level festival index for dedup (each festival appears once per year)
const yearFestivalCache = new Map<
  number,
  { festivalId: string; month: number; day: number; festival: Festival }[]
>();

async function getYearFestivals(year: number) {
  if (!yearFestivalCache.has(year)) {
    const result: { festivalId: string; month: number; day: number; festival: Festival }[] = [];
    const seen = new Set<string>();

    for (let m = 1; m <= 12; m++) {
      const daysInMonth = new Date(year, m, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const f = await getFestivalForDate(year, m, day);
        if (f && !seen.has(f.id)) {
          result.push({ festivalId: f.id, month: m, day, festival: f });
          seen.add(f.id);
        }
      }
    }

    yearFestivalCache.set(year, result);
  }
  return yearFestivalCache.get(year)!;
}

// --- API Route Handler ---

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") ?? "", 10);
  const month = parseInt(searchParams.get("month") ?? "", 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json(
      { error: "Invalid year or month parameter" },
      { status: 400 }
    );
  }

  const daysInMonth = new Date(year, month, 0).getDate();

  // Compute panchang for all days in the month
  const panchangMap: Record<number, PanchangData> = {};
  for (let day = 1; day <= daysInMonth; day++) {
    panchangMap[day] = await computePanchang(year, month, day);
  }

  // Get festivals from year-level index (ensures dedup)
  const yearFests = await getYearFestivals(year);
  const festivalMap: Record<number, Festival> = {};
  for (const entry of yearFests) {
    if (entry.month === month) {
      festivalMap[entry.day] = entry.festival;
    }
  }

  return NextResponse.json(
    { panchang: panchangMap, festivals: festivalMap },
    {
      headers: {
        // Panchang data is deterministic for a given date — cache aggressively
        "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400",
      },
    }
  );
}
