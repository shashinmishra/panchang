"use client";

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlipToggle } from "@/components/calendar/MonthGrid";
import { StaticMonthGrid } from "@/components/calendar/StaticMonthGrid";
import { DayDetailSheet } from "@/components/calendar/DayDetailSheet";
import {
  useInfiniteCalendar,
  getCachedPanchang,
  getCachedFestivals,
} from "@/hooks/useInfiniteCalendar";

function TodayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="16" r="2" fill="currentColor" />
    </svg>
  );
}

export default function Home() {
  const {
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
  } = useInfiniteCalendar();

  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const currentMonthRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);
  const [showFab, setShowFab] = useState(false);

  // Scroll to current month on first render
  useLayoutEffect(() => {
    if (!hasScrolled.current && currentMonthRef.current) {
      currentMonthRef.current.scrollIntoView({ block: "start" });
      hasScrolled.current = true;
    }
  });

  // Bottom sentinel: append months
  useEffect(() => {
    const el = bottomSentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) appendMonths(3);
      },
      { rootMargin: "300px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [appendMonths]);

  // Top sentinel: prepend months with scroll position preservation
  useEffect(() => {
    const el = topSentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const prevHeight = document.documentElement.scrollHeight;
          prependMonths(3);
          requestAnimationFrame(() => {
            const newHeight = document.documentElement.scrollHeight;
            window.scrollBy(0, newHeight - prevHeight);
          });
        }
      },
      { rootMargin: "100px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [prependMonths]);

  // Track current month visibility for FAB
  useEffect(() => {
    const el = currentMonthRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFab(!entry.isIntersecting);
      },
      { rootMargin: "-50px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scrollToToday = useCallback(() => {
    currentMonthRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;

  return (
    <div className="flex flex-col flex-1 min-h-dvh bg-background">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3 w-full max-w-md mx-auto">
          <h1 className="text-sm font-medium tracking-[0.3em] uppercase text-muted-foreground/60">
            Panchang
          </h1>
          <FlipToggle isPanchang={primaryMode === "panchang"} onToggle={toggleMode} />
        </div>
      </header>

      {/* Scrollable month list */}
      <main className="flex-1 px-3 pb-8 w-full max-w-md mx-auto">
        <div ref={topSentinelRef} className="h-1" />

        {months.map(({ year, month }) => {
          const isCurrentMonth = year === todayYear && month === todayMonth;
          const isSelectedMonth =
            selectedDate !== null &&
            selectedDate.year === year &&
            selectedDate.month === month;

          return (
            <div
              key={`${year}-${month}`}
              id={`month-${year}-${month}`}
              ref={isCurrentMonth ? currentMonthRef : undefined}
              className="pt-6 pb-2"
            >
              <div className="h-[2px] w-full rounded-full bg-gradient-to-r from-saffron via-vermillion to-tulsi mb-5 opacity-50" />

              <StaticMonthGrid
                year={year}
                month={month}
                primaryMode={primaryMode}
                monthPanchang={getCachedPanchang(year, month)}
                monthFestivals={getCachedFestivals(year, month)}
                selectedDay={isSelectedMonth ? selectedDate.day : null}
                onSelectDay={selectDay}
              />

            </div>
          );
        })}

        <div ref={bottomSentinelRef} className="h-1" />
      </main>

      {/* Day detail bottom sheet */}
      <DayDetailSheet
        year={selectedDate?.year ?? 0}
        month={selectedDate?.month ?? 0}
        day={selectedDate?.day ?? null}
        panchang={selectedPanchang}
        festival={selectedFestival}
        onDismiss={() => selectDay(selectedDate?.year ?? 0, selectedDate?.month ?? 0, selectedDate?.day ?? 0)}
      />

      {/* Scroll to today FAB */}
      <AnimatePresence>
        {showFab && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToToday}
            className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full
                       bg-saffron-dark text-white shadow-lg shadow-saffron-dark/30
                       flex items-center justify-center
                       active:scale-90 transition-transform"
            aria-label="Scroll to today"
          >
            <TodayIcon className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
