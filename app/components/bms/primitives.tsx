import type { ReactNode } from "react";
import { cn } from "./cn";

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200/90 bg-white shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PanelHead({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function PanelBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("p-4", className)}>{children}</div>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </p>
  );
}

const pillMap: Record<string, string> = {
  Scheduled: "bg-slate-100 text-slate-700 ring-slate-200",
  "Check-in": "bg-sky-50 text-sky-800 ring-sky-100",
  Boarding: "bg-indigo-50 text-indigo-800 ring-indigo-100",
  Departed: "bg-blue-50 text-blue-800 ring-blue-100",
  Arrived: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  Delayed: "bg-amber-50 text-amber-900 ring-amber-100",
  Loading: "bg-violet-50 text-violet-800 ring-violet-100",
  "Gate Open": "bg-cyan-50 text-cyan-900 ring-cyan-100",
  Accepted: "bg-slate-50 text-slate-700 ring-slate-200",
  Screened: "bg-sky-50 text-sky-800 ring-sky-100",
  Sorted: "bg-indigo-50 text-indigo-800 ring-indigo-100",
  Loaded: "bg-blue-50 text-blue-800 ring-blue-100",
  "In Transit": "bg-blue-50 text-blue-800 ring-blue-100",
  Delivered: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  "Transfer Risk": "bg-rose-50 text-rose-800 ring-rose-100",
  "Held Security": "bg-orange-50 text-orange-900 ring-orange-100",
  "Short-shipped": "bg-amber-50 text-amber-900 ring-amber-100",
  Open: "bg-rose-50 text-rose-800 ring-rose-100",
  Investigating: "bg-amber-50 text-amber-900 ring-amber-100",
  Escalated: "bg-red-50 text-red-800 ring-red-100",
  Resolved: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  Closed: "bg-slate-100 text-slate-600 ring-slate-200",
  Success: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  "No-read": "bg-amber-50 text-amber-900 ring-amber-100",
  Exception: "bg-rose-50 text-rose-800 ring-rose-100",
  Low: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  Medium: "bg-amber-50 text-amber-900 ring-amber-100",
  High: "bg-orange-50 text-orange-900 ring-orange-100",
  Critical: "bg-red-50 text-red-800 ring-red-100",
  Cleared: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  Hold: "bg-orange-50 text-orange-900 ring-orange-100",
  Rescreen: "bg-amber-50 text-amber-900 ring-amber-100",
  Standard: "bg-slate-50 text-slate-800 ring-slate-200",
  Priority: "bg-indigo-50 text-indigo-900 ring-indigo-100",
  Interline: "bg-blue-50 text-blue-900 ring-blue-100",
  "RFID Fixed": "bg-slate-50 text-slate-800 ring-slate-200",
  "RFID Handheld": "bg-slate-50 text-slate-800 ring-slate-200",
  Barcode: "bg-slate-50 text-slate-700 ring-slate-200",
  ULD: "bg-violet-50 text-violet-900 ring-violet-100",
};

export function StatusPill({ children }: { children: string }) {
  const cls =
    pillMap[children] ?? "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        cls,
      )}
    >
      {children}
    </span>
  );
}

export function Mono({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[11px] font-medium text-slate-800">
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function PaginationBar({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-2">
      <p className="text-[11px] text-slate-500">
        Page{" "}
        <span className="font-medium text-slate-700">{page}</span> of{" "}
        <span className="font-medium text-slate-700">{totalPages}</span>
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 1}
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
