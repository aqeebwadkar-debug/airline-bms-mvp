import { useEffect, useRef } from "react";

/**
 * Centralized live-refresh hook used platform-wide.
 *
 * Calls `doRefresh` on a fixed interval (default 3 s) and whenever
 * the global `syncTick` counter from the header increments.
 * Stores the callback in a ref so stale-closure issues are avoided —
 * the latest version of `doRefresh` (with up-to-date state) is always
 * invoked without resetting the interval.
 */
export function useLiveRefresh(
  doRefresh: () => void,
  syncTick?: number,
  intervalMs = 3000,
): void {
  const ref = useRef(doRefresh);
  ref.current = doRefresh;

  useEffect(() => {
    const id = setInterval(() => ref.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  useEffect(() => {
    if (syncTick) ref.current();
  }, [syncTick]);
}

/** Nudge a number by ±range/2 and round to 2 decimal places. */
export function nudge(base: number, range: number): number {
  return Math.round((base + (Math.random() - 0.5) * range) * 100) / 100;
}

/** Format a Date as the "YYYY-MM-DD HH:MM:SS" string used throughout the data layer. */
export function fmtTs(d: Date): string {
  return (
    `${d.getFullYear()}-` +
    `${String(d.getMonth() + 1).padStart(2, "0")}-` +
    `${String(d.getDate()).padStart(2, "0")} ` +
    `${String(d.getHours()).padStart(2, "0")}:` +
    `${String(d.getMinutes()).padStart(2, "0")}:` +
    `${String(d.getSeconds()).padStart(2, "0")}`
  );
}
