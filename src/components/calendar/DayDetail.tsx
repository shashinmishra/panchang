"use client";

import { motion, AnimatePresence } from "framer-motion";
import { isSavan, type PanchangData, type Festival } from "@/lib/panchang";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface DayDetailProps {
  year: number;
  month: number;
  day: number | null;
  panchang: PanchangData | null;
  festival: Festival | null;
}

function DetailRow({
  labelHi,
  labelEn,
  valueHi,
  valueEn,
  accent,
}: {
  labelHi: string;
  labelEn: string;
  valueHi: string;
  valueEn: string;
  accent?: string;
}) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border/50 last:border-0">
      <div className="flex flex-col">
        <span className="text-[0.65rem] text-muted-foreground uppercase tracking-wider font-medium">
          {labelEn}
        </span>
        <span className="text-[0.6rem] text-muted-foreground/60 font-[family-name:var(--font-devanagari)]">
          {labelHi}
        </span>
      </div>
      <div className="flex flex-col items-end">
        <span className={`text-sm font-semibold ${accent ?? "text-foreground"}`}>
          {valueEn}
        </span>
        <span className="text-sm font-[family-name:var(--font-devanagari)] text-foreground/80">
          {valueHi}
        </span>
      </div>
    </div>
  );
}

export function DayDetail({ year, month, day, panchang, festival }: DayDetailProps) {
  const inSavan = panchang ? isSavan(panchang) : false;

  return (
    <AnimatePresence mode="wait">
      {day !== null && panchang && (
        <motion.div
          key={`detail-${year}-${month}-${day}`}
          initial={{ opacity: 0, y: 16, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div
            className="mt-5 mx-auto max-w-md rounded-2xl border border-border/60
                        bg-card/80 backdrop-blur-sm shadow-sm"
          >
            {/* Festival banner */}
            {festival && (
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-t-2xl border-b border-border/40
                  ${festival.bgClass}`}
              >
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
              <div
                className="flex items-center gap-3 px-4 py-2.5 rounded-t-2xl border-b border-tulsi/20
                            bg-tulsi-light/40"
              >
                <span className="text-base">ॐ</span>
                <div>
                  <p className="text-sm font-semibold text-tulsi">
                    Savan · श्रावण
                  </p>
                  <p className="text-xs text-tulsi/70">
                    {panchang.pakshaNameEn} · {panchang.pakshaName}
                  </p>
                </div>
              </div>
            )}

            {/* Header band */}
            <div
              className={`flex items-center justify-between px-4 py-3
                ${!festival && !inSavan ? "rounded-t-2xl" : ""}
                bg-gradient-to-r from-saffron/10 via-transparent to-tulsi-light/30
                border-b border-border/40`}
            >
              <div>
                <h3 className="text-lg font-bold">
                  {MONTHS[month - 1]} {day}, {year}
                </h3>
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

            {/* Panchang details */}
            <div className="px-4 py-1">
              <DetailRow
                labelHi="तिथि"
                labelEn="Tithi"
                valueHi={panchang.tithiName}
                valueEn={`${panchang.tithiNameEn} (${panchang.pakshaNameEn})`}
                accent="text-vermillion"
              />
              <DetailRow
                labelHi="नक्षत्र"
                labelEn="Nakshatra"
                valueHi={panchang.nakshatraName}
                valueEn={panchang.nakshatraNameEn}
                accent="text-tulsi"
              />
              <DetailRow
                labelHi="मास"
                labelEn="Masa"
                valueHi={panchang.masaName}
                valueEn={panchang.masaNameEn}
              />
              <DetailRow
                labelHi="राशि"
                labelEn="Rashi"
                valueHi={panchang.rashiName}
                valueEn={panchang.rashiNameEn}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
