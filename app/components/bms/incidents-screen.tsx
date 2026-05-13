"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ALL_INCIDENTS } from "./data";
import {
  EmptyState,
  Mono,
  PaginationBar,
  Panel,
  PanelBody,
  PanelHead,
  StatusPill,
} from "./primitives";
import type { IncidentRecord, IncidentStatus } from "./types";
import { usePagination } from "./use-pagination";

interface Props {
  onOpenIncident: (id: string) => void;
  onOpenBag: (lpn: string) => void;
  onReport: () => void;
}

export function IncidentsScreen({
  onOpenIncident,
  onOpenBag,
  onReport,
}: Props) {
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState<IncidentStatus | "All">("All");
  const [severity, setSeverity] = useState<string>("All");
  const [station, setStation] = useState("All");

  const categories = useMemo(() => {
    const s = new Set(ALL_INCIDENTS.map((i) => i.category));
    return ["All", ...Array.from(s)];
  }, []);

  const stations = useMemo(() => {
    const s = new Set(ALL_INCIDENTS.map((i) => i.station));
    return ["All", ...Array.from(s)];
  }, []);

  const filtered = useMemo(() => {
    return ALL_INCIDENTS.filter((i) => {
      const okC = category === "All" || i.category === category;
      const okS = status === "All" || i.status === status;
      const okSev = severity === "All" || i.severity === severity;
      const okSt = station === "All" || i.station === station;
      return okC && okS && okSev && okSt;
    });
  }, [category, status, severity, station]);

  const { page, totalPages, slice, setPage, resetPage } = usePagination(
    filtered,
    10,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs text-slate-500">
            Operational incident monitoring and review
          </p>
        </div>
        <button
          type="button"
          onClick={onReport}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"
        >
          <Plus className="size-4" aria-hidden />
          Report incident
        </button>
      </div>

      <Panel>
        <PanelHead title="Filters" />
        <PanelBody className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Category</span>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                resetPage();
              }}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Status</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as IncidentStatus | "All");
                resetPage();
              }}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            >
              <option value="All">All statuses</option>
              {(
                [
                  "Open",
                  "Investigating",
                  "Escalated",
                  "Resolved",
                  "Closed",
                ] as const
              ).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Severity</span>
            <select
              value={severity}
              onChange={(e) => {
                setSeverity(e.target.value);
                resetPage();
              }}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            >
              <option value="All">All</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Station</span>
            <select
              value={station}
              onChange={(e) => {
                setStation(e.target.value);
                resetPage();
              }}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            >
              {stations.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHead title="Case queue" subtitle={`${filtered.length} records`} />
        {filtered.length === 0 ? (
          <PanelBody>
            <EmptyState title="No incidents for filters" />
          </PanelBody>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Incident</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Station</th>
                    <th className="px-3 py-2">Flight</th>
                    <th className="px-3 py-2">LPN</th>
                    <th className="px-3 py-2">Tracer</th>
                    <th className="px-3 py-2">Severity</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Reported</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slice.map((i: IncidentRecord) => (
                    <tr
                      key={i.id}
                      onClick={() => onOpenIncident(i.id)}
                      className="cursor-pointer hover:bg-slate-50"
                    >
                      <td className="px-3 py-2">
                        <Mono>{i.id}</Mono>
                      </td>
                      <td className="px-3 py-2 text-slate-700">{i.category}</td>
                      <td className="px-3 py-2 text-slate-700">{i.station}</td>
                      <td className="px-3 py-2">
                        <Mono>{i.flightNo}</Mono>
                      </td>
                      <td className="px-3 py-2">
                        {i.lpn ? (
                          <button
                            type="button"
                            className="font-mono text-[11px] font-semibold text-blue-700 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenBag(i.lpn!);
                            }}
                          >
                            {i.lpn}
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-600">
                        {i.tracerRef}
                      </td>
                      <td className="px-3 py-2">
                        <StatusPill>{i.severity}</StatusPill>
                      </td>
                      <td className="px-3 py-2">
                        <StatusPill>{i.status}</StatusPill>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-[11px] text-slate-600">
                        {i.reportedAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationBar
              page={page}
              totalPages={totalPages}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          </>
        )}
      </Panel>
    </div>
  );
}
