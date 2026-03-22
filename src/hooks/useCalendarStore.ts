"use client";

import { useState, useCallback, useMemo } from "react";
import { getMonthPanchang, getMonthFestivals, type PanchangData, type Festival } from "@/lib/panchang";

export type CalendarMode = "gregorian" | "panchang";

export interface CalendarState {
  year: number;
  month: number; // 1-12
  selectedDay: number | null;
  primaryMode: CalendarMode;
}

export function useCalendarStore() {
  const today = new Date();
  const [state, setState] = useState<CalendarState>({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    selectedDay: null,
    primaryMode: "gregorian",
  });

  const monthPanchang = useMemo(
    () => getMonthPanchang(state.year, state.month),
    [state.year, state.month]
  );

  const monthFestivals = useMemo(
    () => getMonthFestivals(state.year, state.month),
    [state.year, state.month]
  );

  const goToMonth = useCallback((year: number, month: number) => {
    setState((prev) => ({ ...prev, year, month, selectedDay: null }));
  }, []);

  const prevMonth = useCallback(() => {
    setState((prev) => {
      const m = prev.month === 1 ? 12 : prev.month - 1;
      const y = prev.month === 1 ? prev.year - 1 : prev.year;
      return { ...prev, year: y, month: m, selectedDay: null };
    });
  }, []);

  const nextMonth = useCallback(() => {
    setState((prev) => {
      const m = prev.month === 12 ? 1 : prev.month + 1;
      const y = prev.month === 12 ? prev.year + 1 : prev.year;
      return { ...prev, year: y, month: m, selectedDay: null };
    });
  }, []);

  const selectDay = useCallback((day: number | null) => {
    setState((prev) => ({ ...prev, selectedDay: day }));
  }, []);

  const toggleMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      primaryMode: prev.primaryMode === "gregorian" ? "panchang" : "gregorian",
    }));
  }, []);

  const goToToday = useCallback(() => {
    const now = new Date();
    setState({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      selectedDay: now.getDate(),
      primaryMode: state.primaryMode,
    });
  }, [state.primaryMode]);

  const selectedPanchang: PanchangData | null = useMemo(() => {
    if (state.selectedDay === null) return null;
    return monthPanchang.get(state.selectedDay) ?? null;
  }, [state.selectedDay, monthPanchang]);

  const selectedFestival: Festival | null = useMemo(() => {
    if (state.selectedDay === null) return null;
    return monthFestivals.get(state.selectedDay) ?? null;
  }, [state.selectedDay, monthFestivals]);

  return {
    ...state,
    monthPanchang,
    monthFestivals,
    selectedPanchang,
    selectedFestival,
    goToMonth,
    prevMonth,
    nextMonth,
    selectDay,
    toggleMode,
    goToToday,
  };
}
