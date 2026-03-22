/**
 * Astronomical calculations based on Jean Meeus' "Astronomical Algorithms"
 * Computes Sun and Moon ecliptic longitudes for Panchang determination.
 */

/** Convert a Gregorian date to Julian Day Number */
export function toJulianDay(year: number, month: number, day: number, hour: number = 0): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    hour / 24 +
    B -
    1524.5
  );
}

/** Julian centuries from J2000.0 epoch */
function julianCenturies(jd: number): number {
  return (jd - 2451545.0) / 36525.0;
}

/** Normalize angle to 0-360 range */
function normalize(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

/** Degrees to radians */
function rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Radians to degrees */
function deg(r: number): number {
  return (r * 180) / Math.PI;
}

/**
 * Sun's ecliptic longitude (Meeus Ch. 25)
 * Accuracy: ~0.01° (sufficient for tithi boundaries)
 */
export function sunLongitude(jd: number): number {
  const T = julianCenturies(jd);

  // Geometric mean longitude
  const L0 = normalize(280.46646 + 36000.76983 * T + 0.0003032 * T * T);

  // Mean anomaly
  const M = normalize(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const Mrad = rad(M);

  // Equation of center
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad) +
    0.000289 * Math.sin(3 * Mrad);

  // Sun's true longitude
  const sunTrue = L0 + C;

  // Apparent longitude (nutation + aberration correction)
  const omega = normalize(125.04 - 1934.136 * T);
  const apparent = sunTrue - 0.00569 - 0.00478 * Math.sin(rad(omega));

  return normalize(apparent);
}

/**
 * Moon's ecliptic longitude (Meeus Ch. 47 — simplified)
 * Uses the major periodic terms for accuracy ~0.1°
 */
export function moonLongitude(jd: number): number {
  const T = julianCenturies(jd);

  // Moon's mean longitude
  const Lp = normalize(
    218.3164477 +
      481267.88123421 * T -
      0.0015786 * T * T +
      T * T * T / 538841 -
      T * T * T * T / 65194000
  );

  // Mean elongation
  const D = normalize(
    297.8501921 +
      445267.1114034 * T -
      0.0018819 * T * T +
      T * T * T / 545868 -
      T * T * T * T / 113065000
  );

  // Sun's mean anomaly
  const M = normalize(
    357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + T * T * T / 24490000
  );

  // Moon's mean anomaly
  const Mp = normalize(
    134.9633964 +
      477198.8675055 * T +
      0.0087414 * T * T +
      T * T * T / 69699 -
      T * T * T * T / 14712000
  );

  // Moon's argument of latitude
  const F = normalize(
    93.272095 +
      483202.0175233 * T -
      0.0036539 * T * T -
      T * T * T / 3526000 +
      T * T * T * T / 863310000
  );

  // Eccentricity correction
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;

  const Dr = rad(D);
  const Mr = rad(M);
  const Mpr = rad(Mp);
  const Fr = rad(F);

  // Major longitude correction terms (largest ~60 terms, using top 20 for good accuracy)
  let sumL = 0;
  sumL += 6288774 * Math.sin(Mpr);
  sumL += 1274027 * Math.sin(2 * Dr - Mpr);
  sumL += 658314 * Math.sin(2 * Dr);
  sumL += 213618 * Math.sin(2 * Mpr);
  sumL += -185116 * E * Math.sin(Mr);
  sumL += -114332 * Math.sin(2 * Fr);
  sumL += 58793 * Math.sin(2 * Dr - 2 * Mpr);
  sumL += 57066 * E * Math.sin(2 * Dr - Mr - Mpr);
  sumL += 53322 * Math.sin(2 * Dr + Mpr);
  sumL += 45758 * E * Math.sin(2 * Dr - Mr);
  sumL += -40923 * E * Math.sin(Mr - Mpr);
  sumL += -34720 * Math.sin(Dr);
  sumL += -30383 * E * Math.sin(Mr + Mpr);
  sumL += 15327 * Math.sin(2 * Dr - 2 * Fr);
  sumL += -12528 * Math.sin(Mpr + 2 * Fr);
  sumL += 10980 * Math.sin(Mpr - 2 * Fr);
  sumL += 10675 * Math.sin(4 * Dr - Mpr);
  sumL += 10034 * Math.sin(3 * Mpr);
  sumL += 8548 * Math.sin(4 * Dr - 2 * Mpr);
  sumL += -7888 * E * Math.sin(2 * Dr + Mr - Mpr);

  // Convert from 0.000001 degrees
  const longitude = Lp + sumL / 1000000;

  // Nutation correction (simplified)
  const omega = normalize(125.04452 - 1934.136261 * T);
  const nutation = -17.2 / 3600 * Math.sin(rad(omega)) - 1.32 / 3600 * Math.sin(rad(2 * Lp));

  return normalize(longitude + nutation);
}

/**
 * Ayanamsa (Lahiri) — precession correction for sidereal zodiac
 * This converts tropical (Western) longitudes to sidereal (Hindu) longitudes
 */
export function lahiriAyanamsa(jd: number): number {
  const T = julianCenturies(jd);
  // Lahiri ayanamsa approximation (good to ~1 arcmin for modern dates)
  return 23.85 + 0.0137 * (jd - 2451545.0) / 365.25;
}

/** Convert tropical longitude to sidereal (Lahiri) */
export function toSidereal(tropicalLongitude: number, jd: number): number {
  return normalize(tropicalLongitude - lahiriAyanamsa(jd));
}
