"use client";

import { useMemo, useState } from "react";
import { Plus, Download, ExternalLink, Radio, Upload } from "lucide-react";
import { ALL_INCIDENTS, downloadCsv } from "./data";
import { useLiveRefresh } from "./use-live-tick";
import { BulkUploadModal } from "./bulk-upload-modal";
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
  onOpenInvestigation?: () => void;
  syncTick?: number;
}

const INVESTIGATION_CATEGORIES = new Set(["Lost Bag", "Missing Scan", "Transfer Risk", "Delayed Bag"]);

// Statuses that the auto-generated extra incidents (idx ≥ 11) can rotate through
const LIVE_STATUSES: IncidentStatus[] = ["Open", "Investigating", "Resolved"];

export function IncidentsScreen({
  onOpenIncident,
  onOpenBag,
  onReport,
  onOpenInvestigation,
  syncTick,
}: Props) {
  const [category, setCategory] = useState("All");
  const [status,   setStatus]   = useState<IncidentStatus | "All">("All");
  const [severity, setSeverity] = useState<string>("All");
  const [station,  setStation]  = useState("All");
  const [showUpload, setShowUpload] = useState(false);

  // Live state — keep main incidents stable, allow extra ones to transition
  const [liveIncidents, setLiveIncidents] = useState(() => [...ALL_INCIDENTS]);
  const [lastRefresh,   setLastRefresh]   = useState(new Date());
  const [flashedIds,    setFlashedIds]    = useState<Set<string>>(new Set());

  function doRefresh() {
    setLiveIncidents((prev) =>
      prev.map((inc, idx) => {
        if (idx < 11) return inc; // keep the curated incidents stable
        if (Math.random() > 0.82) {
          return {
            ...inc,
            status: LIVE_STATUSES[Math.floor(Math.random() * LIVE_STATUSES.length)],
          };
        }
        return inc;
      }),
    );

    // Flash a random row
    const pick = liveIncidents[Math.floor(Math.random() * Math.min(10, liveIncidents.length))]?.id;
    if (pick) {
      setFlashedIds(new Set([pick]));
      setTimeout(() => setFlashedIds(new Set()), 1400);
    }
    setLastRefresh(new Date());
  }

  useLiveRefresh(doRefresh, syncTick);

  const categories = useMemo(() => {
    const s = new Set(ALL_INCIDENTS.map((i) => i.category));
    return ["All", ...Array.from(s)];
  }, []);

  const stations = useMemo(() => {
    const s = new Set(ALL_INCIDENTS.map((i) => i.station));
    return ["All", ...Array.from(s)];
  }, []);

  const filtered = useMemo(() => {
    return liveIncidents.filter((i) => {
      const okC   = category === "All" || i.category === category;
      const okS   = status   === "All" || i.status   === status;
      const okSev = severity === "All" || i.severity === severity;
      const okSt  = station  === "All" || i.station  === station;
      return okC && okS && okSev && okSt;
    });
  }, [category, status, severity, station, liveIncidents]);

  const { page, totalPages, slice, setPage, resetPage } = usePagination(filtered, 10);

  // Live KPI counts derived from liveIncidents
  const liveOpenCount        = useMemo(() => liveIncidents.filter((i) => i.status === "Open").length, [liveIncidents]);
  const liveInvestigating    = useMemo(() => liveIncidents.filter((i) => i.status === "Investigating").length, [liveIncidents]);
  const liveEscalated        = useMemo(() => liveIncidents.filter((i) => i.status === "Escalated").length, [liveIncidents]);
  const liveCritical         = useMemo(() => liveIncidents.filter((i) => i.severity === "Critical" && i.status !== "Closed").length, [liveIncidents]);

  function handleExport() {
    downloadCsv(
      "incidents.csv",
      filtered.map((i) => ({
        id: i.id,
        category: i.category,
        status: i.status,
        severity: i.severity,
        station: i.station,
        flightNo: i.flightNo,
        lpn: i.lpn ?? "",
        tracerRef: i.tracerRef,
        reportedAt: i.reportedAt,
        summary: i.summary,
        rootCauseHint: i.rootCauseHint,
      })),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
            <Radio className="size-3 animate-pulse" aria-hidden />
            Live Monitoring
          </span>
          <span className="text-[11px] text-slate-400">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="size-3.5" aria-hidden />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Upload className="size-3.5" aria-hidden />
            Bulk Upload
          </button>
          <button
            type="button"
            onClick={onReport}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"
          >
            <Plus className="size-4" aria-hidden />
            Report incident
          </button>
        </div>
      </div>
      {showUpload && (
        <BulkUploadModal
          type="incidents"
          onClose={() => setShowUpload(false)}
          onImported={() => setShowUpload(false)}
        />
      )}

      {/* Live KPI strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Open",          value: liveOpenCount,     color: "text-slate-900" },
          { label: "Investigating", value: liveInvestigating, color: "text-amber-700" },
          { label: "Escalated",     value: liveEscalated,     color: "text-orange-700" },
          { label: "Critical active", value: liveCritical,    color: "text-rose-700" },
        ].map((k) => (
          <Panel key={k.label}>
            <PanelBody className="py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{k.label}</p>
              <p className={`mt-1 text-xl font-semibold tabular-nums ${k.color}`}>{k.value}</p>
            </PanelBody>
          </Panel>
        ))}
      </div>

      <Panel>
        <PanelHead title="Filters" />
        <PanelBody className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Category</span>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); resetPage(); }}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            >
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Status</span>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value as IncidentStatus | "All"); resetPage(); }}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            >
              <option value="All">All statuses</option>
              {(["Open", "Investigating", "Escalated", "Resolved", "Closed"] as const).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Severity</span>
            <select
              value={severity}
              onChange={(e) => { setSeverity(e.target.value); resetPage(); }}
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
              onChange={(e) => { setStation(e.target.value); resetPage(); }}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            >
              {stations.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHead
          title="Active Incident Queue"
          subtitle={`Active baggage incidents requiring monitoring or investigation — ${filtered.length} records`}
        />
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
                    <th className="px-3 py-2">Investigation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slice.map((i: IncidentRecord) => (
                    <tr
                      key={i.id}
                      onClick={() => onOpenIncident(i.id)}
                      className={`cursor-pointer transition-colors duration-700 hover:bg-slate-50 ${
                        flashedIds.has(i.id) ? "bg-blue-50" :
                        i.severity === "Critical" ? "bg-rose-50/30" :
                        i.severity === "High" && i.status === "Escalated" ? "bg-orange-50/30" : ""
                      }`}
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
                            onClick={(e) => { e.stopPropagation(); onOpenBag(i.lpn!); }}
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
                      <td className="px-3 py-2">
                        {INVESTIGATION_CATEGORIES.has(i.category) ? (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onOpenInvestigation?.(); }}
                            className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            <ExternalLink className="size-3" aria-hidden />
                            Investigate
                          </button>
                        ) : (
                          <span className="inline-flex cursor-default items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-400">N/A</span>
                        )}
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
