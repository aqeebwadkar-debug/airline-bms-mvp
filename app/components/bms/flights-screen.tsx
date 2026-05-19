"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Download, Filter, Radio, Upload } from "lucide-react";
import { MOCK_FLIGHTS, downloadCsv } from "./data";
import { nudge, useLiveRefresh } from "./use-live-tick";
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
import type { FlightRecord, FlightStatus } from "./types";
import { usePagination } from "./use-pagination";

interface Props {
  onOpenFlight: (flightNo: string) => void;
  syncTick?: number;
}

export function FlightsScreen({ onOpenFlight, syncTick }: Props) {
  const [query, setQuery] = useState("");
  const [airline, setAirline] = useState("All");
  const [status, setStatus] = useState<FlightStatus | "All">("All");
  const [date, setDate] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  // Live state — nudge per-flight operational metrics every 3 s
  const [liveFlights,  setLiveFlights]  = useState(() => MOCK_FLIGHTS.map((f) => ({ ...f })));
  const [lastRefresh,  setLastRefresh]  = useState(new Date());
  const [flashedRows,  setFlashedRows]  = useState<Set<string>>(new Set());

  function doRefresh() {
    setLiveFlights((prev) =>
      prev.map((f) => ({
        ...f,
        reconciliationPct: Math.min(100, Math.max(0, nudge(f.reconciliationPct, 0.5))),
        transferRiskBags:  Math.max(0, f.transferRiskBags + (Math.random() > 0.7 ? Math.round((Math.random() - 0.5) * 2) : 0)),
        delayedBags:       Math.max(0, f.delayedBags + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0)),
      })),
    );

    // Flash a random visible flight
    const pick = liveFlights[Math.floor(Math.random() * Math.min(8, liveFlights.length))]?.flightNo;
    if (pick) {
      setFlashedRows(new Set([pick]));
      setTimeout(() => setFlashedRows(new Set()), 1400);
    }
    setLastRefresh(new Date());
  }

  useLiveRefresh(doRefresh, syncTick);

  const airlines = useMemo(() => {
    const s = new Set(MOCK_FLIGHTS.map((f) => f.airline.split("—")[0].trim()));
    return ["All", ...Array.from(s)];
  }, []);

  const filtered = useMemo(() => {
    return liveFlights.filter((f) => {
      const q = query.trim().toLowerCase();
      const matchesQ =
        !q ||
        f.flightNo.toLowerCase().includes(q) ||
        f.origin.toLowerCase().includes(q) ||
        f.dest.toLowerCase().includes(q) ||
        f.airline.toLowerCase().includes(q);
      const matchesAir =
        airline === "All" ||
        f.airline.split("—")[0]?.trim() === airline.trim();
      const matchesSt = status === "All" || f.status === status;
      const matchesDate = !date || f.stdLocal.startsWith(date);
      return matchesQ && matchesAir && matchesSt && matchesDate;
    });
  }, [query, airline, status, date, liveFlights]);

  const { page, totalPages, slice, setPage, resetPage } = usePagination(
    filtered,
    10,
  );

  function handleExport() {
    downloadCsv(
      "flights.csv",
      filtered.map((f) => ({
        flightNo: f.flightNo,
        airline: f.airline,
        origin: f.origin,
        dest: f.dest,
        std: f.stdLocal,
        sta: f.staLocal,
        aircraft: f.aircraft,
        gate: f.gate,
        terminal: f.terminal,
        status: f.status,
        pax: f.pax,
        bagsPlanned: f.bagsPlanned,
        bagsLoaded: f.bagsLoaded,
        reconciliationPct: f.reconciliationPct,
        transferRiskBags: f.transferRiskBags,
        delayedBags: f.delayedBags,
        shortShipped: f.shortShipped,
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
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600">
            <Filter className="size-3.5" aria-hidden />
            {filtered.length} Active flights
          </span>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="size-3.5" aria-hidden />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Upload className="size-3.5" aria-hidden />
            Bulk Upload
          </button>
        </div>
      </div>
      {showUpload && (
        <BulkUploadModal
          type="flights"
          onClose={() => setShowUpload(false)}
          onImported={() => setShowUpload(false)}
        />
      )}

      <Panel>
        <PanelHead title="Filters" />
        <PanelBody className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Search</span>
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); resetPage(); }}
              placeholder="Flight, airport code, airline…"
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Operational date</span>
            <span className="relative flex items-center">
              <CalendarDays className="pointer-events-none absolute left-2 size-4 text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); resetPage(); }}
                className="h-9 w-full rounded-md border border-slate-200 bg-white pl-8 pr-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
              />
            </span>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Airline</span>
            <select
              value={airline}
              onChange={(e) => { setAirline(e.target.value); resetPage(); }}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            >
              {airlines.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Status</span>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value as FlightStatus | "All"); resetPage(); }}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            >
              {(["All", "Scheduled", "Check-in", "Gate Open", "Boarding", "Loading", "Departed", "Arrived", "Delayed"] as const).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHead
          title="Active Flight Operations"
          subtitle="Select a flight to view baggage operations and reconciliation details."
        />
        {filtered.length === 0 ? (
          <PanelBody>
            <EmptyState title="No flights for filters" hint="Adjust date or clear status filters." />
          </PanelBody>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Flight</th>
                    <th className="px-3 py-2">Airline</th>
                    <th className="px-3 py-2">Route</th>
                    <th className="px-3 py-2">STD / STA</th>
                    <th className="px-3 py-2">Terminal / Gate</th>
                    <th className="px-3 py-2">Aircraft</th>
                    <th className="px-3 py-2">PAX</th>
                    <th className="px-3 py-2">Bags</th>
                    <th className="px-3 py-2">Recon</th>
                    <th className="px-3 py-2">Risk</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slice.map((f: FlightRecord) => (
                    <tr
                      key={f.flightNo}
                      onClick={() => onOpenFlight(f.flightNo)}
                      className={`cursor-pointer transition-colors duration-700 hover:bg-slate-50/90 ${
                        flashedRows.has(f.flightNo) ? "bg-blue-50" :
                        f.status === "Delayed" ? "bg-amber-50/30" :
                        f.transferRiskBags > 20 ? "bg-rose-50/20" : ""
                      }`}
                    >
                      <td className="px-3 py-2">
                        <Mono>{f.flightNo}</Mono>
                      </td>
                      <td className="max-w-[120px] truncate px-3 py-2 text-slate-700">
                        {f.airline.split("—")[0].trim()}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{f.origin} → {f.dest}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[11px] text-slate-600">
                        {f.stdLocal.split(" ")[1]} / {f.staLocal.split(" ")[1]}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{f.terminal} / {f.gate}</td>
                      <td className="px-3 py-2 text-slate-700">{f.aircraft}</td>
                      <td className="px-3 py-2 tabular-nums text-slate-800">{f.pax}</td>
                      <td className="px-3 py-2 tabular-nums text-slate-800">
                        {f.bagsLoaded}/{f.bagsPlanned}
                      </td>
                      <td className={`px-3 py-2 tabular-nums font-semibold ${
                        f.bagsPlanned === 0 ? "text-slate-400" :
                        f.reconciliationPct < 90 ? "text-rose-700" :
                        f.reconciliationPct < 95 ? "text-amber-700" :
                        "text-emerald-700"
                      }`}>
                        {f.bagsPlanned === 0 ? "—" : `${f.reconciliationPct.toFixed(1)}%`}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-slate-700">
                        {f.transferRiskBags > 0 ? (
                          <span className={`font-semibold ${f.transferRiskBags > 20 ? "text-rose-700" : "text-amber-700"}`}>
                            {f.transferRiskBags}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <StatusPill>{f.status}</StatusPill>
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
