"use client";

import { motion } from "framer-motion";

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
        <div
          className="absolute inset-0 flex items-center justify-center rounded-full
                     bg-gradient-to-br from-saffron to-deepam text-white shadow-sm"
          style={{ backfaceVisibility: "hidden" }}
        >
          <SunIcon className="w-4 h-4" />
        </div>
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
