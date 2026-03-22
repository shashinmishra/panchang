import type { PanchangData } from "./types";
import { getPanchang } from "./calculator";

/**
 * Observation rule for determining which day a festival falls on
 * when its tithi spans two sunrise-to-sunrise days.
 *
 * - "nishita"  → tithi must prevail at Nishita Kaal (midnight IST ≈ 18:30 UTC)
 * - "pradosh"  → tithi must prevail at Pradosh Kaal (evening IST ≈ 12:30 UTC)
 * - "sunrise"  → tithi at sunrise (default, ≈ 00:30 UTC)
 */
type ObservationRule = "sunrise" | "pradosh" | "nishita";

/** UTC hour for each observation rule (IST = UTC + 5:30) */
const OBSERVATION_HOUR: Record<ObservationRule, number> = {
  sunrise: 0.5,   // 06:00 IST
  pradosh: 12.5,  // 18:00 IST (evening twilight)
  nishita: 18.5,  // 00:00 IST (midnight — next calendar day in IST but same Hindu day)
};

export interface Festival {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  masa: number;
  tithi: number;
  /** Rule for resolving which day when tithi spans two days */
  observationRule: ObservationRule;
  /** CSS color token for the festival badge */
  color: string;
  /** Tailwind bg class for the cell tint */
  bgClass: string;
  /** Tailwind ring/border class */
  ringClass: string;
}

export const FESTIVALS: Festival[] = [
  {
    id: "holi",
    name: "Holi",
    nameHi: "होली",
    description: "Festival of Colors",
    descriptionHi: "रंगों का त्यौहार",
    masa: 11,  // Phalguna
    tithi: 15, // Purnima
    observationRule: "sunrise", // Purnima at sunrise = Holika Dahan day
    color: "bg-gradient-to-r from-pink-500 via-yellow-400 to-green-400",
    bgClass: "bg-pink-50",
    ringClass: "ring-pink-400/50",
  },
  {
    id: "janmashtami",
    name: "Janmashtami",
    nameHi: "जन्माष्टमी",
    description: "Birth of Lord Krishna",
    descriptionHi: "श्री कृष्ण जन्मोत्सव",
    masa: 5,   // Bhadrapada
    tithi: 23, // Krishna Ashtami
    observationRule: "nishita", // Krishna born at midnight
    color: "bg-indigo-600",
    bgClass: "bg-indigo-50",
    ringClass: "ring-indigo-400/50",
  },
  {
    id: "maha-shivratri",
    name: "Maha Shivratri",
    nameHi: "महाशिवरात्रि",
    description: "Great Night of Lord Shiva",
    descriptionHi: "भगवान शिव की महारात्रि",
    masa: 11,  // Phalguna (Purnimant system)
    tithi: 29, // Krishna Chaturdashi
    observationRule: "nishita", // Puja at Nishita Kaal (midnight)
    color: "bg-purple-700",
    bgClass: "bg-purple-50",
    ringClass: "ring-purple-400/50",
  },
  {
    id: "diwali",
    name: "Diwali",
    nameHi: "दीवाली",
    description: "Festival of Lights",
    descriptionHi: "दीपों का त्यौहार",
    masa: 7,   // Kartika
    tithi: 30, // Amavasya
    observationRule: "pradosh", // Lakshmi Puja during Pradosh Kaal
    color: "bg-amber-500",
    bgClass: "bg-amber-50",
    ringClass: "ring-amber-400/50",
  },
];

/** Shravana masa index */
export const SAVAN_MASA = 4;

/**
 * Sample times across the Hindu day (6 AM IST to midnight IST).
 * A tithi can last as little as ~19 hours, so a single check per day
 * can miss it entirely. Checking every ~3 hours ensures we catch
 * even short-duration tithis.
 */
const SAMPLE_HOURS_UTC = [
  0.5,  // 06:00 IST (sunrise)
  3.5,  // 09:00 IST
  6.5,  // 12:00 IST (noon)
  9.5,  // 15:00 IST
  12.5, // 18:00 IST (Pradosh)
  18.5, // 00:00 IST (Nishita/midnight)
];

/**
 * Find the festival for a specific Gregorian date.
 *
 * Uses sunrise panchang for masa and Adhik determination (canonical
 * for the Hindu day), then checks tithi at multiple sample points
 * to catch short-duration tithis (~19 hours minimum).
 */
export function getFestivalForDate(
  year: number,
  month: number,
  day: number
): Festival | null {
  // Canonical masa and Adhik status from sunrise (defines the Hindu day)
  const pSunrise = getPanchang(year, month, day, 0.5);
  const dayMasa = pSunrise.masa;
  const dayIsAdhik = pSunrise.isAdhik;

  for (const f of FESTIVALS) {
    // Skip if wrong month or Adhik period
    if (dayMasa !== f.masa || dayIsAdhik) continue;

    // Check tithi at multiple points to catch short-duration tithis
    for (const h of SAMPLE_HOURS_UTC) {
      const p = getPanchang(year, month, day, h);
      if (p.tithi === f.tithi) {
        return f;
      }
    }
  }
  return null;
}

/**
 * Year-level festival index. Computes festivals for the entire year once,
 * ensuring each festival appears exactly once (first occurrence wins).
 * Cached per year.
 */
const yearFestivalCache = new Map<
  number,
  { festivalId: string; month: number; day: number; festival: Festival }[]
>();

function computeYearFestivals(
  year: number
): { festivalId: string; month: number; day: number; festival: Festival }[] {
  const result: { festivalId: string; month: number; day: number; festival: Festival }[] = [];
  const seen = new Set<string>();

  for (let m = 1; m <= 12; m++) {
    const daysInMonth = new Date(year, m, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const f = getFestivalForDate(year, m, day);
      if (f && !seen.has(f.id)) {
        result.push({ festivalId: f.id, month: m, day, festival: f });
        seen.add(f.id);
      }
    }
  }

  return result;
}

function getYearFestivals(year: number) {
  if (!yearFestivalCache.has(year)) {
    yearFestivalCache.set(year, computeYearFestivals(year));
  }
  return yearFestivalCache.get(year)!;
}

/**
 * Get festivals for a specific month, derived from the year-level index.
 * Each festival appears exactly once per year (no duplicates).
 */
export function getMonthFestivals(
  year: number,
  month: number
): Map<number, Festival> {
  const yearFests = getYearFestivals(year);
  const result = new Map<number, Festival>();

  for (const entry of yearFests) {
    if (entry.month === month) {
      result.set(entry.day, entry.festival);
    }
  }

  return result;
}

/** Check if a day falls in Savan (Shravana) month — uses sunrise panchang */
export function isSavan(panchang: PanchangData): boolean {
  return panchang.masa === SAVAN_MASA;
}

/**
 * Legacy function — checks sunrise panchang against festival criteria.
 * Prefer getFestivalForDate() for accurate day assignment.
 */
export function getFestival(panchang: PanchangData): Festival | null {
  return FESTIVALS.find((f) => f.masa === panchang.masa && f.tithi === panchang.tithi) ?? null;
}
