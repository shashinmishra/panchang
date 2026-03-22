"use client";

import { useMemo, memo } from "react";
import { motion } from "framer-motion";
import { isSavan, type PanchangData, type Festival } from "@/lib/panchang";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAYS_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const WEEKDAYS_HI = ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"];

interface StaticMonthGridProps {
  year: number;
  month: number;
  primaryMode: "gregorian" | "panchang";
  monthPanchang: Map<number, PanchangData>;
  monthFestivals: Map<number, Festival>;
  selectedDay: number | null;
  onSelectDay: (year: number, month: number, day: number) => void;
}

function DayCell({
  day,
  panchang,
  festival,
  isPanchang,
  isToday,
  isSelected,
  onSelect,
}: {
  day: number;
  panchang: PanchangData | undefined;
  festival: Festival | undefined;
  isPanchang: boolean;
  isToday: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  if (!panchang) return null;

  const isShukla = panchang.paksha === "shukla";
  const inSavan = isSavan(panchang);

  const primary = isPanchang ? panchang.tithiName : String(day);
  const secondary = isPanchang ? String(day) : panchang.tithiName;
  const primaryFont = isPanchang ? "font-[family-name:var(--font-devanagari)]" : "font-sans";
  const secondaryFont = isPanchang ? "font-sans" : "font-[family-name:var(--font-devanagari)]";

  const cellBg = isSelected
    ? "bg-vermillion text-white shadow-lg shadow-vermillion/25 ring-2 ring-vermillion/30"
    : festival
      ? `${festival.bgClass} ring-2 ${festival.ringClass} shadow-sm`
      : isToday
        ? "bg-saffron/15 ring-1 ring-saffron/40"
        : inSavan
          ? isShukla
            ? "bg-tulsi-light/50 hover:bg-tulsi-light/70 ring-1 ring-tulsi/15"
            : "bg-tulsi/10 hover:bg-tulsi/20 ring-1 ring-tulsi/25"
          : isShukla
            ? "bg-saffron-light/30 hover:bg-saffron-light/50"
            : "bg-[oklch(0.93_0.02_230)]/40 hover:bg-[oklch(0.90_0.03_230)]/50";

  return (
    <motion.button
      onClick={onSelect}
      whileTap={{ scale: 0.92 }}
      className={`
        relative flex flex-col items-center justify-center rounded-xl
        min-h-[3.5rem] p-1 transition-colors duration-200 ${cellBg}
      `}
    >
      {festival && !isSelected && (
        <span className={`absolute top-1 left-1 w-2 h-2 rounded-full ${festival.color} shadow-sm`} />
      )}
      {isToday && !isSelected && !festival && (
        <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-saffron" />
      )}
      {inSavan && !isSelected && !festival && (
        <span className="absolute top-0.5 right-1 text-[0.5rem] leading-none text-tulsi/60">ॐ</span>
      )}
      <span
        className={`
          ${primaryFont} leading-none
          ${isPanchang ? "text-[0.6rem] font-semibold" : "text-base font-semibold"}
          ${isSelected ? "text-white" : festival ? "text-foreground" : isToday ? "text-saffron-dark" : inSavan ? "text-tulsi" : "text-foreground"}
        `}
      >
        {primary}
      </span>
      <span
        className={`
          ${secondaryFont} leading-tight mt-0.5
          ${isPanchang ? "text-[0.65rem]" : "text-[0.55rem]"}
          ${isSelected ? "text-white/75" : "text-muted-foreground"}
        `}
      >
        {secondary}
      </span>
      {!isSelected && (
        <span
          className={`absolute bottom-0.5 w-3 h-[2px] rounded-full ${
            inSavan ? (isShukla ? "bg-tulsi/40" : "bg-tulsi/70") : (isShukla ? "bg-saffron/30" : "bg-ganga/30")
          }`}
        />
      )}
    </motion.button>
  );
}

export const StaticMonthGrid = memo(function StaticMonthGrid({
  year,
  month,
  primaryMode,
  monthPanchang,
  monthFestivals,
  selectedDay,
  onSelectDay,
}: StaticMonthGridProps) {
  const isPanchang = primaryMode === "panchang";

  const { startDay, daysInMonth, todayDate } = useMemo(() => {
    const now = new Date();
    return {
      startDay: new Date(year, month - 1, 1).getDay(),
      daysInMonth: new Date(year, month, 0).getDate(),
      todayDate:
        now.getFullYear() === year && now.getMonth() + 1 === month
          ? now.getDate()
          : null,
    };
  }, [year, month]);

  const displayMasa = useMemo(() => {
    if (selectedDay !== null) {
      const p = monthPanchang.get(selectedDay);
      return p ? { hi: p.masaName, en: p.masaNameEn } : null;
    }
    const masaCounts = new Map<number, { count: number; hi: string; en: string }>();
    for (let d = 1; d <= daysInMonth; d++) {
      const p = monthPanchang.get(d);
      if (!p) continue;
      const existing = masaCounts.get(p.masa);
      if (existing) existing.count++;
      else masaCounts.set(p.masa, { count: 1, hi: p.masaName, en: p.masaNameEn });
    }
    const firstDayMasa = monthPanchang.get(1)?.masa;
    let best: { hi: string; en: string } | null = null;
    let bestCount = 0;
    for (const [masaNum, entry] of masaCounts) {
      if (entry.count > bestCount || (entry.count === bestCount && masaNum === firstDayMasa)) {
        bestCount = entry.count;
        best = { hi: entry.hi, en: entry.en };
      }
    }
    return best;
  }, [monthPanchang, selectedDay, daysInMonth]);

  const cells = useMemo(() => {
    const result: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [startDay, daysInMonth]);

  const weekdays = isPanchang ? WEEKDAYS_HI : WEEKDAYS_EN;

  return (
    <div className="w-full select-none">
      {/* Month header */}
      <div className="text-center mb-3">
        <h2 className="text-lg font-bold tracking-tight">
          {isPanchang ? (
            <span className="font-[family-name:var(--font-devanagari)]">{displayMasa?.hi}</span>
          ) : (
            `${MONTHS[month - 1]} ${year}`
          )}
        </h2>
        <p className="text-xs text-muted-foreground">
          {isPanchang ? (
            `${MONTHS[month - 1]} ${year}`
          ) : (
            <span className="font-[family-name:var(--font-devanagari)]">{displayMasa?.hi}</span>
          )}
        </p>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1.5 px-0.5">
        {weekdays.map((label, i) => (
          <div
            key={label}
            className={`
              text-center text-[0.65rem] font-semibold uppercase tracking-widest py-1
              ${i === 0 ? "text-vermillion/70" : "text-muted-foreground/70"}
              ${isPanchang ? "font-[family-name:var(--font-devanagari)] normal-case tracking-normal text-[0.7rem]" : ""}
            `}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1 px-0.5">
        {cells.map((day, i) =>
          day === null ? (
            <div key={`empty-${i}`} className="min-h-[3.5rem]" />
          ) : (
            <DayCell
              key={`day-${day}`}
              day={day}
              panchang={monthPanchang.get(day)}
              festival={monthFestivals.get(day)}
              isPanchang={isPanchang}
              isToday={day === todayDate}
              isSelected={day === selectedDay}
              onSelect={() => onSelectDay(year, month, day)}
            />
          )
        )}
      </div>
    </div>
  );
});
