"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getDeviceId } from "@/lib/device-id";

export interface NotificationEntry {
  id: string;
  daysBefore: number;
  repeat: "once" | "daily";
  enabled: boolean;
  label?: string;
}

export interface DateNotifications {
  [dateKey: string]: NotificationEntry[];
}

/** Date key format: "2026-03-22" */
export function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Supabase availability check
// ---------------------------------------------------------------------------
const supabaseEnabled =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ---------------------------------------------------------------------------
// localStorage fallback helpers (original behaviour)
// ---------------------------------------------------------------------------
const STORAGE_KEY = "panchang-notifications";

function loadNotificationsFromStorage(): DateNotifications {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveNotificationsToStorage(data: DateNotifications) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let nextLocalId = Date.now();

// ---------------------------------------------------------------------------
// Supabase row ↔ NotificationEntry mapping
// ---------------------------------------------------------------------------
interface SupabaseRow {
  id: string;
  date_key: string;
  days_before: number;
  repeat: string;
  enabled: boolean;
  label: string | null;
  device_id?: string;
}

function rowToEntry(row: SupabaseRow): NotificationEntry {
  return {
    id: row.id,
    daysBefore: row.days_before,
    repeat: row.repeat as "once" | "daily",
    enabled: row.enabled,
    ...(row.label ? { label: row.label } : {}),
  };
}

// ---------------------------------------------------------------------------
// Hook – Supabase-backed implementation
// ---------------------------------------------------------------------------
function useSupabaseNotifications(year: number, month: number, day: number | null) {
  const [entries, setEntries] = useState<NotificationEntry[]>([]);
  const dateKey = day !== null ? toDateKey(year, month, day) : "";
  const deviceId = useRef<string>("");

  // Resolve device id once on the client
  useEffect(() => {
    deviceId.current = getDeviceId();
  }, []);

  // Fetch entries whenever the selected date changes
  useEffect(() => {
    if (!dateKey) {
      setEntries([]);
      return;
    }

    let cancelled = false;

    async function fetch() {
      const did = getDeviceId(); // ensure we have it even on first render
      deviceId.current = did;

      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("date_key", dateKey)
        .eq("device_id", did);

      if (!cancelled && !error && data) {
        setEntries((data as SupabaseRow[]).map(rowToEntry));
      }
    }

    fetch();
    return () => {
      cancelled = true;
    };
  }, [dateKey]);

  const addNotification = useCallback(
    async (daysBefore: number, repeat: "once" | "daily") => {
      if (!dateKey) return;
      const did = deviceId.current || getDeviceId();

      const newRow = {
        date_key: dateKey,
        days_before: daysBefore,
        repeat,
        enabled: true,
        device_id: did,
      };

      const { data, error } = await supabase
        .from("notification_preferences")
        .insert(newRow)
        .select()
        .single();

      if (!error && data) {
        setEntries((prev) => [...prev, rowToEntry(data as SupabaseRow)]);
      }
    },
    [dateKey],
  );

  const removeNotification = useCallback(
    async (id: string) => {
      if (!dateKey) return;
      const { error } = await supabase
        .from("notification_preferences")
        .delete()
        .eq("id", id);

      if (!error) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
      }
    },
    [dateKey],
  );

  const toggleNotification = useCallback(
    async (id: string) => {
      if (!dateKey) return;
      const target = entries.find((e) => e.id === id);
      if (!target) return;

      const { error } = await supabase
        .from("notification_preferences")
        .update({ enabled: !target.enabled })
        .eq("id", id);

      if (!error) {
        setEntries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e)),
        );
      }
    },
    [dateKey, entries],
  );

  return { entries, addNotification, removeNotification, toggleNotification };
}

// ---------------------------------------------------------------------------
// Hook – localStorage fallback implementation (original)
// ---------------------------------------------------------------------------
function useLocalNotifications(year: number, month: number, day: number | null) {
  const [all, setAll] = useState<DateNotifications>(loadNotificationsFromStorage);
  const dateKey = day !== null ? toDateKey(year, month, day) : "";

  useEffect(() => {
    saveNotificationsToStorage(all);
  }, [all]);

  const entries = day !== null ? (all[dateKey] ?? []) : [];

  const addNotification = useCallback(
    (daysBefore: number, repeat: "once" | "daily") => {
      if (!dateKey) return;
      setAll((prev) => {
        const existing = prev[dateKey] ?? [];
        const entry: NotificationEntry = {
          id: String(++nextLocalId),
          daysBefore,
          repeat,
          enabled: true,
        };
        return { ...prev, [dateKey]: [...existing, entry] };
      });
    },
    [dateKey],
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
    [dateKey],
  );

  const toggleNotification = useCallback(
    (id: string) => {
      if (!dateKey) return;
      setAll((prev) => {
        const existing = prev[dateKey] ?? [];
        return {
          ...prev,
          [dateKey]: existing.map((e) =>
            e.id === id ? { ...e, enabled: !e.enabled } : e,
          ),
        };
      });
    },
    [dateKey],
  );

  return { entries, addNotification, removeNotification, toggleNotification };
}

// ---------------------------------------------------------------------------
// Public hook – delegates based on env config
// ---------------------------------------------------------------------------
export function useNotifications(year: number, month: number, day: number | null) {
  // We must call both hooks unconditionally to satisfy the Rules of Hooks,
  // then return the result from the appropriate one.
  const sbResult = useSupabaseNotifications(year, month, day);
  const localResult = useLocalNotifications(year, month, day);

  return supabaseEnabled ? sbResult : localResult;
}
