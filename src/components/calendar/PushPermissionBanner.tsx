"use client";

import { useState, useEffect } from "react";
import { usePushSubscription } from "@/hooks/usePushSubscription";

const DISMISS_KEY = "panchang-push-banner-dismissed";
const DISMISS_DAYS = 7;

function isDismissed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = parseInt(raw, 10);
    const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    return daysSince < DISMISS_DAYS;
  } catch {
    return false;
  }
}

function dismiss() {
  localStorage.setItem(DISMISS_KEY, String(Date.now()));
}

export function PushPermissionBanner() {
  const { isSubscribed, permissionState, requestPermission } = usePushSubscription();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only show if push is supported, not yet subscribed, not denied, and not recently dismissed
    const supported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window;

    if (supported && !isSubscribed && permissionState !== "denied" && !isDismissed()) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [isSubscribed, permissionState]);

  if (!visible) return null;

  const handleEnable = async () => {
    setLoading(true);
    const success = await requestPermission();
    setLoading(false);
    if (success) {
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    dismiss();
    setVisible(false);
  };

  return (
    <div className="mx-4 mt-3 mb-1 rounded-xl border border-saffron/30 bg-saffron/5 px-4 py-3 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground/80 leading-snug">
          Enable notifications to get reminders for festivals and special dates
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleDismiss}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
        >
          Not now
        </button>
        <button
          onClick={handleEnable}
          disabled={loading}
          className="text-xs font-medium text-white bg-saffron-dark hover:bg-saffron-dark/90
                     disabled:opacity-50 rounded-lg px-3 py-1.5 transition-colors"
        >
          {loading ? "..." : "Enable"}
        </button>
      </div>
    </div>
  );
}
