"use client";

import { useState, useEffect, useCallback } from "react";

export interface NotificationEntry {
  id: string;
  daysBefore: number;
  repeat: "once" | "daily";
  enabled: boolean;
}

export interface DateNotifications {
  [dateKey: string]: NotificationEntry[];
}

const STORAGE_KEY = "panchang-notifications";

function loadNotifications(): DateNotifications {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveNotifications(data: DateNotifications) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Date key format: "2026-03-22" */
export function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

let nextId = Date.now();

export function useNotifications(year: number, month: number, day: number | null) {
  const [all, setAll] = useState<DateNotifications>(loadNotifications);
  const dateKey = day !== null ? toDateKey(year, month, day) : "";

  // Sync to localStorage on change
  useEffect(() => {
    saveNotifications(all);
  }, [all]);

  const entries = day !== null ? (all[dateKey] ?? []) : [];

  const addNotification = useCallback(
    (daysBefore: number, repeat: "once" | "daily") => {
      if (!dateKey) return;
      setAll((prev) => {
        const existing = prev[dateKey] ?? [];
        const entry: NotificationEntry = {
          id: String(++nextId),
          daysBefore,
          repeat,
          enabled: true,
        };
        return { ...prev, [dateKey]: [...existing, entry] };
      });
    },
    [dateKey]
  );

  const removeNotification = useCallback(
    (id: string) => {
      if (!dateKey) return;
      setAll((prev) => {
        const existing = prev[dateKey] ?? [];
        const filtered = existing.filter((e) => e.id !== id);
        if (filtered.length === 0) {
          const next = { ...prev };
          delete next[dateKey];
          return next;
        }
        return { ...prev, [dateKey]: filtered };
      });
    },
    [dateKey]
  );

  const toggleNotification = useCallback(
    (id: string) => {
      if (!dateKey) return;
      setAll((prev) => {
        const existing = prev[dateKey] ?? [];
        return {
          ...prev,
          [dateKey]: existing.map((e) =>
            e.id === id ? { ...e, enabled: !e.enabled } : e
          ),
        };
      });
    },
    [dateKey]
  );

  return { entries, addNotification, removeNotification, toggleNotification };
}
