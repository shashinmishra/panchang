"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PinScreenProps {
  mode: "setup" | "confirm" | "enter";
  onComplete: (pin: string) => void;
  error?: string | null;
}

const PIN_LENGTH = 6;

const TITLES: Record<PinScreenProps["mode"], string> = {
  setup: "Set Your PIN",
  confirm: "Confirm Your PIN",
  enter: "Enter Your PIN",
};

export function PinScreen({ mode, onComplete, error }: PinScreenProps) {
  const [digits, setDigits] = useState<number[]>([]);
  const [shaking, setShaking] = useState(false);
  const completedRef = useRef(false);

  // Reset when mode changes
  useEffect(() => {
    setDigits([]);
    completedRef.current = false;
  }, [mode]);

  // Handle error: shake then clear
  useEffect(() => {
    if (error) {
      setShaking(true);
      const timer = setTimeout(() => {
        setShaking(false);
        setDigits([]);
        completedRef.current = false;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleDigit = useCallback(
    (digit: number) => {
      if (completedRef.current) return;
      setDigits((prev) => {
        if (prev.length >= PIN_LENGTH) return prev;
        const next = [...prev, digit];
        if (next.length === PIN_LENGTH) {
          completedRef.current = true;
          setTimeout(() => {
            onComplete(next.join(""));
          }, 200);
        }
        return next;
      });
    },
    [onComplete]
  );

  const handleDelete = useCallback(() => {
    if (completedRef.current) return;
    setDigits((prev) => prev.slice(0, -1));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[oklch(0.08_0.02_50)]">
      {/* Title */}
      <motion.h1
        key={mode}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-2xl font-semibold tracking-tight text-white"
      >
        {TITLES[mode]}
      </motion.h1>

      {/* Subtitle */}
      <p className="mt-2 text-sm text-white/40">6-digit passcode</p>

      {/* Error message */}
      <div className="mt-4 h-5">
        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              key={error}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-medium text-vermillion"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      <motion.div
        className="mt-8 flex items-center gap-4"
        animate={
          shaking
            ? { x: [0, -10, 10, -10, 10, 0] }
            : { x: 0 }
        }
        transition={
          shaking
            ? { duration: 0.4, ease: "easeInOut" }
            : { duration: 0.1 }
        }
      >
        {Array.from({ length: PIN_LENGTH }).map((_, i) => {
          const filled = i < digits.length;
          return (
            <motion.div
              key={i}
              className={`w-3.5 h-3.5 rounded-full ${
                filled ? "bg-saffron" : "border-2 border-white/25"
              }`}
              animate={
                filled
                  ? { scale: [1.4, 1], opacity: 1 }
                  : { scale: 1, opacity: 1 }
              }
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            />
          );
        })}
      </motion.div>

      {/* Numeric keypad */}
      <div className="mt-12 grid grid-cols-3 gap-x-6 gap-y-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <DigitButton key={digit} digit={digit} onPress={handleDigit} />
        ))}

        {/* Bottom row: spacer, 0, backspace */}
        <div className="w-20 h-20" />
        <DigitButton digit={0} onPress={handleDigit} />
        <button
          type="button"
          onClick={handleDelete}
          className="flex w-20 h-20 items-center justify-center rounded-full
                     text-white/60 active:bg-white/10 active:scale-95
                     transition-all duration-100"
          aria-label="Delete"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            <path d="M7.4 4.8A2 2 0 0 1 8.93 4H20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8.93a2 2 0 0 1-1.53-.72l-4.68-5.56a2 2 0 0 1 0-2.56L7.4 4.8z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function DigitButton({
  digit,
  onPress,
}: {
  digit: number;
  onPress: (d: number) => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={() => onPress(digit)}
      whileTap={{ scale: 0.95 }}
      className="flex w-20 h-20 items-center justify-center rounded-full
                 bg-white/10 backdrop-blur-sm text-white text-2xl font-light
                 active:bg-white/20 transition-colors duration-100
                 select-none"
    >
      {digit}
    </motion.button>
  );
}
