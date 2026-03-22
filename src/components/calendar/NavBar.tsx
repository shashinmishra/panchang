"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function ScrollIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 6v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function NavBar() {
  const pathname = usePathname();
  const isScroll = pathname === "/";
  const isMonth = pathname === "/month";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card/90 backdrop-blur-sm border-t border-border/40 pb-safe-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto py-2">
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors
            ${isScroll ? "text-saffron-dark" : "text-muted-foreground/50 hover:text-muted-foreground"}`}
        >
          <ScrollIcon className="w-5 h-5" />
          <span className="text-[0.6rem] font-medium">Scroll</span>
        </Link>
        <Link
          href="/month"
          className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors
            ${isMonth ? "text-saffron-dark" : "text-muted-foreground/50 hover:text-muted-foreground"}`}
        >
          <GridIcon className="w-5 h-5" />
          <span className="text-[0.6rem] font-medium">Month</span>
        </Link>
      </div>
    </nav>
  );
}
