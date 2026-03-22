"use client";

import { useCalendarStore } from "@/hooks/useCalendarStore";
import { MonthGrid, FlipToggle } from "@/components/calendar/MonthGrid";
import { DayDetail } from "@/components/calendar/DayDetail";

export default function MonthView() {
  const {
    year,
    month,
    selectedDay,
    primaryMode,
    monthPanchang,
    monthFestivals,
    selectedPanchang,
    selectedFestival,
    prevMonth,
    nextMonth,
    selectDay,
    toggleMode,
    goToToday,
  } = useCalendarStore();

  return (
    <div className="flex flex-col flex-1 min-h-dvh bg-background">
      <main className="flex-1 px-3 pb-8 w-full max-w-md mx-auto">
        <div className="flex items-center justify-between pt-6 pb-2 px-1">
          <h1 className="text-sm font-medium tracking-[0.3em] uppercase text-muted-foreground/60">
            Panchang
          </h1>
          <FlipToggle isPanchang={primaryMode === "panchang"} onToggle={toggleMode} />
        </div>

        <MonthGrid
          year={year}
          month={month}
          primaryMode={primaryMode}
          monthPanchang={monthPanchang}
          monthFestivals={monthFestivals}
          selectedDay={selectedDay}
          onSelectDay={selectDay}
          onToggleMode={toggleMode}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onGoToToday={goToToday}
        />

        <DayDetail
          year={year}
          month={month}
          day={selectedDay}
          panchang={selectedPanchang}
          festival={selectedFestival}
        />
      </main>
    </div>
  );
}
