"use client";

import { useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isSavan, type PanchangData, type Festival } from "@/lib/panchang";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAYS_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const WEEKDAYS_HI = ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"];

interface MonthGridProps {
  year: number;
  month: number;
  primaryMode: "gregorian" | "panchang";
  monthPanchang: Map<number, PanchangData>;
  monthFestivals: Map<number, Festival>;
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
  onToggleMode: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
}

/* ── Sun icon (Gregorian/solar side of the coin) ── */
function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const r1 = 7.5, r2 = 10;
        const rad = (angle * Math.PI) / 180;
        return (
          <line
            key={angle}
            x1={12 + r1 * Math.cos(rad)}
            y1={12 + r1 * Math.sin(rad)}
            x2={12 + r2 * Math.cos(rad)}
            y2={12 + r2 * Math.sin(rad)}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

/* ── Crescent moon icon (Panchang/lunar side) ── */
function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Nav arrow ── */
function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Compact coin-flip toggle (top corner) ── */
export function FlipToggle({
  isPanchang,
  onToggle,
}: {
  isPanchang: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="relative w-8 h-8 active:scale-90 transition-transform"
      style={{ perspective: 400 }}
      aria-label={`Switch to ${isPanchang ? "Gregorian" : "Panchang"} primary view`}
    >
      <motion.div
        className="absolute inset-0"
        animate={{ rotateY: isPanchang ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, mass: 0.8 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front — Sun */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-full
                     bg-gradient-to-br from-saffron to-deepam text-white shadow-sm"
          style={{ backfaceVisibility: "hidden" }}
        >
          <SunIcon className="w-4 h-4" />
        </div>
        {/* Back — Moon */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-full
                     bg-gradient-to-br from-ganga to-[oklch(0.45_0.12_250)] text-white shadow-sm"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <MoonIcon className="w-4 h-4" />
        </div>
      </motion.div>
    </button>
  );
}

/* ── Individual day cell ── */
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

  // Determine the primary and secondary labels
  const primary = isPanchang ? panchang.tithiName : String(day);
  const secondary = isPanchang ? String(day) : panchang.tithiName;
  const primaryFont = isPanchang ? "font-[family-name:var(--font-devanagari)]" : "font-sans";
  const secondaryFont = isPanchang ? "font-sans" : "font-[family-name:var(--font-devanagari)]";

  // Cell background logic: selected > festival > today > savan > default paksha
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
      {/* Festival badge — colored dot at top-left */}
      {festival && !isSelected && (
        <span
          className={`absolute top-1 left-1 w-2 h-2 rounded-full ${festival.color} shadow-sm`}
          title={festival.name}
        />
      )}

      {/* Today indicator dot */}
      {isToday && !isSelected && !festival && (
        <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-saffron" />
      )}

      {/* Savan indicator — small leaf mark at top-right */}
      {inSavan && !isSelected && !festival && (
        <span className="absolute top-0.5 right-1 text-[0.5rem] leading-none text-tulsi/60">
          ॐ
        </span>
      )}

      {/* Primary label */}
      <span
        className={`
          ${primaryFont} leading-none
          ${isPanchang ? "text-[0.6rem] font-semibold" : "text-base font-semibold"}
          ${isSelected
            ? "text-white"
            : festival
              ? "text-foreground"
              : isToday
                ? "text-saffron-dark"
                : inSavan
                  ? "text-tulsi"
                  : "text-foreground"
          }
        `}
      >
        {primary}
      </span>

      {/* Secondary label */}
      <span
        className={`
          ${secondaryFont} leading-tight mt-0.5
          ${isPanchang ? "text-[0.65rem]" : "text-[0.55rem]"}
          ${isSelected ? "text-white/75" : "text-muted-foreground"}
        `}
      >
        {secondary}
      </span>

      {/* Paksha indicator */}
      {!isSelected && (
        <span
          className={`absolute bottom-0.5 w-3 h-[2px] rounded-full ${
            inSavan
              ? isShukla ? "bg-tulsi/40" : "bg-tulsi/70"
              : isShukla ? "bg-saffron/30" : "bg-ganga/30"
          }`}
        />
      )}
    </motion.button>
  );
}

/* ── Main month grid ── */
export function MonthGrid({
  year,
  month,
  primaryMode,
  monthPanchang,
  monthFestivals,
  selectedDay,
  onSelectDay,
  onToggleMode,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
}: MonthGridProps) {
  const isPanchang = primaryMode === "panchang";
  const directionRef = useRef(1); // 1 = forward, -1 = back

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

  // Determine the displayed masa:
  // - If a day is selected, use that day's masa
  // - Otherwise, use the masa with the most days in this Gregorian month
  //   (ties broken by whichever masa is active on the 1st)
  const displayMasa = useMemo(() => {
    if (selectedDay !== null) {
      const p = monthPanchang.get(selectedDay);
      return p ? { hi: p.masaName, en: p.masaNameEn } : null;
    }

    // Count days per masa
    const masaCounts = new Map<number, { count: number; hi: string; en: string }>();
    for (let d = 1; d <= daysInMonth; d++) {
      const p = monthPanchang.get(d);
      if (!p) continue;
      const existing = masaCounts.get(p.masa);
      if (existing) {
        existing.count++;
      } else {
        masaCounts.set(p.masa, { count: 1, hi: p.masaName, en: p.masaNameEn });
      }
    }

    // Find the masa with the highest count; on tie, prefer the one active on day 1
    const firstDayMasa = monthPanchang.get(1)?.masa;
    let best: { hi: string; en: string } | null = null;
    let bestCount = 0;

    for (const [masaNum, entry] of masaCounts) {
      if (
        entry.count > bestCount ||
        (entry.count === bestCount && masaNum === firstDayMasa)
      ) {
        bestCount = entry.count;
        best = { hi: entry.hi, en: entry.en };
      }
    }

    return best;
  }, [monthPanchang, selectedDay, daysInMonth]);

  // Build the grid cells: null for empty, number for day
  const cells = useMemo(() => {
    const result: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [startDay, daysInMonth]);

  const weekdays = isPanchang ? WEEKDAYS_HI : WEEKDAYS_EN;

  const handlePrev = () => {
    directionRef.current = -1;
    onPrevMonth();
  };

  const handleNext = () => {
    directionRef.current = 1;
    onNextMonth();
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir * 60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -60, opacity: 0 }),
  };

  return (
    <div className="w-full max-w-md mx-auto select-none">
      {/* ── Decorative top bar ── */}
      <div className="h-1 w-full rounded-full bg-gradient-to-r from-saffron via-vermillion to-tulsi mb-5 opacity-70" />

      {/* ── Month header with integrated toggle ── */}
      <div className="flex items-center justify-between px-1 mb-4">
        <button
          onClick={handlePrev}
          className="p-2 rounded-full hover:bg-accent active:scale-90 transition-transform"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-foreground/70" />
        </button>

        <button onClick={onGoToToday} className="text-center group">
          <AnimatePresence mode="wait" custom={directionRef.current}>
            <motion.div
              key={`${year}-${month}-${primaryMode}`}
              custom={directionRef.current}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <h2 className="text-xl font-bold tracking-tight group-hover:text-vermillion transition-colors">
                {isPanchang ? (
                  <span className="font-[family-name:var(--font-devanagari)]">
                    {displayMasa?.hi}
                  </span>
                ) : (
                  `${MONTHS[month - 1]} ${year}`
                )}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isPanchang ? (
                  `${MONTHS[month - 1]} ${year}`
                ) : (
                  <span className="font-[family-name:var(--font-devanagari)]">
                    {displayMasa?.hi}
                  </span>
                )}
              </p>
            </motion.div>
          </AnimatePresence>
        </button>

        <button
          onClick={handleNext}
          className="p-2 rounded-full hover:bg-accent active:scale-90 transition-transform"
          aria-label="Next month"
        >
          <ChevronLeft className="w-5 h-5 text-foreground/70 rotate-180" />
        </button>
      </div>

      {/* ── Weekday headers ── */}
      <div className="grid grid-cols-7 gap-1 mb-1.5 px-0.5">
        {weekdays.map((label, i) => (
          <div
            key={label}
            className={`
              text-center text-[0.65rem] font-semibold uppercase tracking-widest py-1.5
              ${i === 0 ? "text-vermillion/70" : "text-muted-foreground/70"}
              ${isPanchang ? "font-[family-name:var(--font-devanagari)] normal-case tracking-normal text-[0.7rem]" : ""}
            `}
          >
            {label}
          </div>
        ))}
      </div>

      {/* ── Day grid with month transition ── */}
      <AnimatePresence mode="wait" custom={directionRef.current}>
        <motion.div
          key={`grid-${year}-${month}`}
          custom={directionRef.current}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="grid grid-cols-7 gap-1 px-0.5"
        >
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
                onSelect={() => onSelectDay(day)}
              />
            )
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Decorative bottom bar ── */}
      <div className="h-px w-2/3 mx-auto mt-5 bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
}
