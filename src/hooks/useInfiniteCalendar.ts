"use client";

import { useState, useCallback, useMemo } from "react";
import { getMonthPanchang, getMonthFestivals, type PanchangData, type Festival } from "@/lib/panchang";

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
  // Full year + 3 months before and after if needed
  const months: MonthKey[] = [];
  for (let m = 1; m <= 12; m++) {
    months.push({ year: y, month: m });
  }
  return months;
}

/** Cache for computed panchang and festival data */
const panchangCache = new Map<string, Map<number, PanchangData>>();
const festivalCache = new Map<string, Map<number, Festival>>();

function cacheKey(year: number, month: number): string {
  return `${year}-${month}`;
}

export function getCachedPanchang(year: number, month: number): Map<number, PanchangData> {
  const key = cacheKey(year, month);
  if (!panchangCache.has(key)) {
    panchangCache.set(key, getMonthPanchang(year, month));
  }
  return panchangCache.get(key)!;
}

export function getCachedFestivals(year: number, month: number): Map<number, Festival> {
  const key = cacheKey(year, month);
  if (!festivalCache.has(key)) {
    festivalCache.set(key, getMonthFestivals(year, month));
  }
  return festivalCache.get(key)!;
}

export function useInfiniteCalendar() {
  const today = useMemo(() => new Date(), []);

  const [primaryMode, setPrimaryMode] = useState<CalendarMode>("gregorian");
  const [selectedDate, setSelectedDate] = useState<SelectedDate | null>(null);
  const [months, setMonths] = useState<MonthKey[]>(generateInitialMonths);

  const toggleMode = useCallback(() => {
    setPrimaryMode((prev) => (prev === "gregorian" ? "panchang" : "gregorian"));
  }, []);

  const selectDay = useCallback((year: number, month: number, day: number) => {
    setSelectedDate((prev) => {
      // Toggle off if same day tapped again
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

  // Selected day's panchang and festival data
  const selectedPanchang = useMemo(() => {
    if (!selectedDate) return null;
    return getCachedPanchang(selectedDate.year, selectedDate.month).get(selectedDate.day) ?? null;
  }, [selectedDate]);

  const selectedFestival = useMemo(() => {
    if (!selectedDate) return null;
    return getCachedFestivals(selectedDate.year, selectedDate.month).get(selectedDate.day) ?? null;
  }, [selectedDate]);

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
