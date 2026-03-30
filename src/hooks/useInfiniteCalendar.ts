"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import type { PanchangData } from "@/lib/panchang/types";
import type { Festival } from "@/lib/panchang/special-days";

export type CalendarMode = "gregorian" | "panchang";

export interface MonthKey {
  year: number;
  month: number;
}

export interface SelectedDate {
  year: number;
  month: number;
  day: number;
}

function generateInitialMonths(): MonthKey[] {
  const now = new Date();
  const y = now.getFullYear();
  const months: MonthKey[] = [];
  for (let m = 1; m <= 12; m++) {
    months.push({ year: y, month: m });
  }
  return months;
}

/** Module-level caches populated by API fetches */
const panchangCache = new Map<string, Map<number, PanchangData>>();
const festivalCache = new Map<string, Map<number, Festival>>();
const fetchingSet = new Set<string>();

function cacheKey(year: number, month: number): string {
  return `${year}-${month}`;
}

/**
 * Synchronous cache reader — returns empty Map if data hasn't loaded yet.
 * React components call this during render; data appears once the fetch completes.
 */
export function getCachedPanchang(year: number, month: number): Map<number, PanchangData> {
  return panchangCache.get(cacheKey(year, month)) ?? new Map();
}

export function getCachedFestivals(year: number, month: number): Map<number, Festival> {
  return festivalCache.get(cacheKey(year, month)) ?? new Map();
}

/** Fetch panchang + festival data for a month from the API */
async function fetchMonth(
  year: number,
  month: number,
  onComplete: () => void
): Promise<void> {
  const key = cacheKey(year, month);
  if (panchangCache.has(key) || fetchingSet.has(key)) return;
  fetchingSet.add(key);

  try {
    const res = await fetch(`/api/panchang?year=${year}&month=${month}`);
    if (!res.ok) return;

    const data = await res.json();

    // Convert JSON objects to Maps
    const pMap = new Map<number, PanchangData>();
    for (const [day, pd] of Object.entries(data.panchang)) {
      pMap.set(Number(day), pd as PanchangData);
    }
    panchangCache.set(key, pMap);

    const fMap = new Map<number, Festival>();
    for (const [day, f] of Object.entries(data.festivals)) {
      fMap.set(Number(day), f as Festival);
    }
    festivalCache.set(key, fMap);

    onComplete();
  } finally {
    fetchingSet.delete(key);
  }
}

export function useInfiniteCalendar() {
  const today = useMemo(() => new Date(), []);

  const [primaryMode, setPrimaryMode] = useState<CalendarMode>("gregorian");
  const [selectedDate, setSelectedDate] = useState<SelectedDate | null>(null);
  const [months, setMonths] = useState<MonthKey[]>(generateInitialMonths);
  // Counter to trigger re-renders when async data arrives
  const [updateCount, setUpdateCount] = useState(0);

  const forceUpdate = useCallback(() => {
    setUpdateCount((n) => n + 1);
  }, []);

  // Fetch data for all visible months
  useEffect(() => {
    for (const { year, month } of months) {
      fetchMonth(year, month, forceUpdate);
    }
  }, [months, forceUpdate]);

  const toggleMode = useCallback(() => {
    setPrimaryMode((prev) => (prev === "gregorian" ? "panchang" : "gregorian"));
  }, []);

  const selectDay = useCallback((year: number, month: number, day: number) => {
    setSelectedDate((prev) => {
      if (prev && prev.year === year && prev.month === month && prev.day === day) {
        return null;
      }
      return { year, month, day };
    });
  }, []);

  const prependMonths = useCallback((count: number) => {
    setMonths((prev) => {
      const first = prev[0];
      const added: MonthKey[] = [];
      let y = first.year, m = first.month;
      for (let i = 0; i < count; i++) {
        m--;
        if (m < 1) { m = 12; y--; }
        added.unshift({ year: y, month: m });
      }
      return [...added, ...prev];
    });
  }, []);

  const appendMonths = useCallback((count: number) => {
    setMonths((prev) => {
      const last = prev[prev.length - 1];
      const added: MonthKey[] = [];
      let y = last.year, m = last.month;
      for (let i = 0; i < count; i++) {
        m++;
        if (m > 12) { m = 1; y++; }
        added.push({ year: y, month: m });
      }
      return [...prev, ...added];
    });
  }, []);

  // Selected day's panchang and festival data — depend on updateCount to react to fetches
  const selectedPanchang = useMemo(() => {
    if (!selectedDate) return null;
    void updateCount; // ensure dependency
    return getCachedPanchang(selectedDate.year, selectedDate.month).get(selectedDate.day) ?? null;
  }, [selectedDate, updateCount]);

  const selectedFestival = useMemo(() => {
    if (!selectedDate) return null;
    void updateCount;
    return getCachedFestivals(selectedDate.year, selectedDate.month).get(selectedDate.day) ?? null;
  }, [selectedDate, updateCount]);

  return {
    today,
    primaryMode,
    selectedDate,
    selectedPanchang,
    selectedFestival,
    months,
    toggleMode,
    selectDay,
    prependMonths,
    appendMonths,
  };
}
