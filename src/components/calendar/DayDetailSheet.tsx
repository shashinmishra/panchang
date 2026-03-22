"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { isSavan, type PanchangData, type Festival } from "@/lib/panchang";
import { useNotifications, type NotificationEntry } from "@/hooks/useNotifications";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface DayDetailSheetProps {
  year: number;
  month: number;
  day: number | null;
  panchang: PanchangData | null;
  festival: Festival | null;
  onDismiss: () => void;
}

/* ── Icons ── */

function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Notification Section ── */

const DAYS_BEFORE_OPTIONS = [0, 1, 2, 3, 7, 14];

function NotificationSection({
  year, month, day,
}: {
  year: number; month: number; day: number;
}) {
  const { entries, addNotification, removeNotification, toggleNotification } = useNotifications(year, month, day);
  const [showAdd, setShowAdd] = useState(false);
  const [newDaysBefore, setNewDaysBefore] = useState(1);
  const [newRepeat, setNewRepeat] = useState<"once" | "daily">("once");

  const handleAdd = () => {
    addNotification(newDaysBefore, newRepeat);
    setShowAdd(false);
    setNewDaysBefore(1);
    setNewRepeat("once");
  };

  return (
    <div className="mx-3 mb-3">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <BellIcon className="w-4 h-4 text-saffron-dark" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Notifications
          </span>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium
                     text-saffron-dark hover:bg-saffron/10 active:scale-95 transition-all"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      {/* Existing notifications */}
      {entries.length > 0 ? (
        <div className="space-y-1.5 px-4">
          {entries.map((entry) => (
            <NotificationRow
              key={entry.id}
              entry={entry}
              onToggle={() => toggleNotification(entry.id)}
              onDelete={() => removeNotification(entry.id)}
            />
          ))}
        </div>
      ) : !showAdd ? (
        <p className="px-4 text-xs text-muted-foreground/60 italic">
          No notifications set
        </p>
      ) : null}

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mx-4 mt-2 p-3 rounded-xl bg-saffron-light/30 border border-saffron/20">
              {/* Days before */}
              <label className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Remind me
              </label>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {DAYS_BEFORE_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setNewDaysBefore(d)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors
                      ${newDaysBefore === d
                        ? "bg-saffron-dark text-white"
                        : "bg-background/60 text-foreground hover:bg-background"
                      }`}
                  >
                    {d === 0 ? "Same day" : d === 1 ? "1 day before" : `${d} days before`}
                  </button>
                ))}
              </div>

              {/* Repeat */}
              <label className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Frequency
              </label>
              <div className="flex gap-1.5 mb-3">
                <button
                  onClick={() => setNewRepeat("once")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors
                    ${newRepeat === "once" ? "bg-saffron-dark text-white" : "bg-background/60 text-foreground hover:bg-background"}`}
                >
                  Once
                </button>
                <button
                  onClick={() => setNewRepeat("daily")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors
                    ${newRepeat === "daily" ? "bg-saffron-dark text-white" : "bg-background/60 text-foreground hover:bg-background"}`}
                >
                  Daily countdown
                </button>
              </div>

              {/* Confirm */}
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  className="flex-1 py-1.5 rounded-lg bg-saffron-dark text-white text-xs font-semibold
                             active:scale-95 transition-transform"
                >
                  Set Notification
                </button>
                <button
                  onClick={() => setShowAdd(false)}
                  className="px-3 py-1.5 rounded-lg bg-background/60 text-muted-foreground text-xs font-medium
                             active:scale-95 transition-transform"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotificationRow({
  entry,
  onToggle,
  onDelete,
}: {
  entry: NotificationEntry;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const label =
    entry.daysBefore === 0
      ? "Same day"
      : entry.daysBefore === 1
        ? "1 day before"
        : `${entry.daysBefore} days before`;

  const repeatLabel = entry.repeat === "daily" ? "daily countdown" : "once";

  return (
    <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-background/50">
      {/* Toggle */}
      <button
        onClick={onToggle}
        className={`w-8 h-5 rounded-full p-0.5 transition-colors ${
          entry.enabled ? "bg-saffron-dark" : "bg-muted"
        }`}
      >
        <motion.div
          className="w-4 h-4 rounded-full bg-white shadow-sm"
          animate={{ x: entry.enabled ? 12 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium ${entry.enabled ? "text-foreground" : "text-muted-foreground"}`}>
          {label}
        </p>
        <p className="text-[0.6rem] text-muted-foreground/60">{repeatLabel}</p>
      </div>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive transition-colors"
      >
        <TrashIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/* ── Panchang Detail Row ── */

function DetailRow({
  labelHi, labelEn, valueHi, valueEn, accent,
}: {
  labelHi: string; labelEn: string; valueHi: string; valueEn: string; accent?: string;
}) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border/50 last:border-0">
      <div className="flex flex-col">
        <span className="text-[0.65rem] text-muted-foreground uppercase tracking-wider font-medium">{labelEn}</span>
        <span className="text-[0.6rem] text-muted-foreground/60 font-[family-name:var(--font-devanagari)]">{labelHi}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className={`text-sm font-semibold ${accent ?? "text-foreground"}`}>{valueEn}</span>
        <span className="text-sm font-[family-name:var(--font-devanagari)] text-foreground/80">{valueHi}</span>
      </div>
    </div>
  );
}

/* ── Main Bottom Sheet ── */

export function DayDetailSheet({ year, month, day, panchang, festival, onDismiss }: DayDetailSheetProps) {
  const isOpen = day !== null && panchang !== null;
  const inSavan = panchang ? isSavan(panchang) : false;

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onDismiss]);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.y > 80 || info.velocity.y > 300) {
        onDismiss();
      }
    },
    [onDismiss]
  );

  return (
    <AnimatePresence>
      {isOpen && panchang && day !== null && (
        <>
          {/* Backdrop */}
          <motion.div
            key="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onDismiss}
            className="fixed inset-0 z-40 bg-black/20"
          />

          {/* Sheet */}
          <motion.div
            key={`sheet-${year}-${month}-${day}`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[80dvh]
                       rounded-t-2xl bg-card border-t border-border/60
                       shadow-[0_-8px_30px_rgba(0,0,0,0.12)]
                       overflow-hidden"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="overflow-y-auto max-h-[calc(80dvh-2rem)] pb-6">
              <div className="max-w-md mx-auto">
                {/* Festival banner */}
                {festival && (
                  <div className={`flex items-center gap-3 mx-3 px-4 py-3 rounded-xl mb-2 ${festival.bgClass}`}>
                    <span className={`w-3 h-3 rounded-full ${festival.color} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold">{festival.name}</p>
                      <p className="text-sm font-[family-name:var(--font-devanagari)] font-semibold text-foreground/80">
                        {festival.nameHi}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">{festival.description}</p>
                      <p className="text-xs font-[family-name:var(--font-devanagari)] text-muted-foreground/70">
                        {festival.descriptionHi}
                      </p>
                    </div>
                  </div>
                )}

                {/* Savan banner */}
                {inSavan && !festival && (
                  <div className="flex items-center gap-3 mx-3 px-4 py-2.5 rounded-xl mb-2 bg-tulsi-light/40">
                    <span className="text-base">ॐ</span>
                    <div>
                      <p className="text-sm font-semibold text-tulsi">Savan · श्रावण</p>
                      <p className="text-xs text-tulsi/70">{panchang.pakshaNameEn} · {panchang.pakshaName}</p>
                    </div>
                  </div>
                )}

                {/* Date header */}
                <div className="flex items-center justify-between mx-3 px-4 py-3 rounded-xl bg-gradient-to-r from-saffron/10 via-transparent to-tulsi-light/30 mb-3">
                  <div>
                    <h3 className="text-lg font-bold">{MONTHS[month - 1]} {day}, {year}</h3>
                    <p className="text-xs text-muted-foreground">{panchang.varaNameEn}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold font-[family-name:var(--font-devanagari)] text-saffron-dark">
                      {panchang.tithiName}
                    </p>
                    <p className="text-xs font-[family-name:var(--font-devanagari)] text-muted-foreground">
                      {panchang.varaName}
                    </p>
                  </div>
                </div>

                {/* ── Section 1: Notifications ── */}
                <NotificationSection year={year} month={month} day={day} />

                {/* Divider */}
                <div className="h-px mx-6 my-2 bg-border/50" />

                {/* ── Section 2: Panchang details ── */}
                <div className="mx-3 px-4 pt-1 pb-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Panchang Details
                  </p>
                  <DetailRow
                    labelHi="तिथि" labelEn="Tithi"
                    valueHi={panchang.tithiName}
                    valueEn={`${panchang.tithiNameEn} (${panchang.pakshaNameEn})`}
                    accent="text-vermillion"
                  />
                  <DetailRow
                    labelHi="नक्षत्र" labelEn="Nakshatra"
                    valueHi={panchang.nakshatraName}
                    valueEn={panchang.nakshatraNameEn}
                    accent="text-tulsi"
                  />
                  <DetailRow
                    labelHi="मास" labelEn="Masa"
                    valueHi={panchang.masaName}
                    valueEn={panchang.masaNameEn}
                  />
                  <DetailRow
                    labelHi="राशि" labelEn="Rashi"
                    valueHi={panchang.rashiName}
                    valueEn={panchang.rashiNameEn}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
