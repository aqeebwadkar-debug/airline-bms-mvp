"use client";

import { useMemo, useState } from "react";
import { Download, ExternalLink, Radio, Upload } from "lucide-react";
import { MOCK_BAGS, MOCK_FLIGHTS, downloadCsv } from "./data";
import { fmtTs, useLiveRefresh } from "./use-live-tick";
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
import type { BagRecord, BagStatus } from "./types";
import { usePagination } from "./use-pagination";

interface Props {
  onOpenBag: (lpn: string) => void;
  onOpenInvestigation?: () => void;
  syncTick?: number;
}

const EXCEPTION_STATUSES = new Set(["Transfer Risk", "Held Security", "Short-shipped", "Delayed"]);

const LIVE_SCAN_POINTS = [
  "Check-in Belt", "Sorter Primary", "ULD Loader",
  "Transfer Tunnel", "RFID Tunnel", "Gate Reader", "Arrival Carousel",
] as const;

export function BagsScreen({ onOpenBag, onOpenInvestigation, syncTick }: Props) {
  const [query,  setQuery]  = useState("");
  const [flight, setFlight] = useState<string>("All");
  const [status, setStatus] = useState<BagStatus | "All">("All");
  const [station,setStation]= useState<string>("All");
  const [showUpload, setShowUpload] = useState(false);

  // Live state — update scan timestamps for a handful of bags every 3 s
  const [liveBags,     setLiveBags]     = useState(() => MOCK_BAGS.map((b) => ({ ...b })));
  const [lastRefresh,  setLastRefresh]  = useState(new Date());
  const [flashedLpns,  setFlashedLpns]  = useState<Set<string>>(new Set());

  function doRefresh() {
    const now = new Date();
    const ts  = fmtTs(now);
    const idxA = Math.floor(Math.random() * liveBags.length);
    const idxB = Math.floor(Math.random() * liveBags.length);
    const idxC = Math.floor(Math.random() * liveBags.length);
    const toUpdate = new Set([idxA, idxB, idxC]);

    const toFlash: string[] = [];
    setLiveBags((prev) =>
      prev.map((b, i) => {
        if (!toUpdate.has(i)) return b;
        if (b.status === "Transfer Risk" || b.status === "Held Security") return b;
        toFlash.push(b.lpn);
        return {
          ...b,
          lastScanAt: ts,
          scanPoint: LIVE_SCAN_POINTS[i % LIVE_SCAN_POINTS.length],
        };
      }),
    );

    // Flash after state settles
    const flashSet = new Set(
      [idxA, idxB, idxC]
        .map((i) => liveBags[i])
        .filter((b) => b && b.status !== "Transfer Risk" && b.status !== "Held Security")
        .map((b) => b!.lpn),
    );
    setFlashedLpns(flashSet);
    setTimeout(() => setFlashedLpns(new Set()), 1400);
    setLastRefresh(now);
  }

  useLiveRefresh(doRefresh, syncTick);

  const stations = useMemo(() => {
    const s = new Set(MOCK_BAGS.map((b) => b.station));
    return ["All", ...Array.from(s)];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return liveBags.filter((b) => {
      const okQ =
        !q ||
        b.lpn.includes(q) ||
        b.passenger.toLowerCase().includes(q) ||
        b.pnr.toLowerCase().includes(q);
      const okF  = flight  === "All" || b.flightNo === flight;
      const okS  = status  === "All" || b.status   === status;
      const okSt = station === "All" || b.station  === station;
      return okQ && okF && okS && okSt;
    });
  }, [query, flight, status, station, liveBags]);

  const { page, totalPages, slice, setPage, resetPage } = usePagination(filtered, 12);

  function handleExport() {
    downloadCsv(
      "bags.csv",
      filtered.map((b) => ({
        lpn: b.lpn,
        passenger: b.passenger,
        pnr: b.pnr,
        flightNo: b.flightNo,
        weightKg: b.weightKg,
        tagType: b.tagType,
        status: b.status,
        lastScanAt: b.lastScanAt,
        scanPoint: b.scanPoint,
        station: b.station,
        risk: b.risk,
        screening: b.screening,
      })),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
            <Radio className="size-3 animate-pulse" aria-hidden />
            Live Tracking Active
          </span>
          <span className="text-[11px] text-slate-400">
            Updated {lastRefresh.toLocaleTimeString()}
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
          type="bags"
          onClose={() => setShowUpload(false)}
          onImported={() => setShowUpload(false)}
        />
      )}

      <Panel>
        <PanelHead title="Search & Filters" />
        <PanelBody className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Search</span>
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); resetPage(); }}
              placeholder="LPN, PNR, passenger…"
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Flight</span>
            <select
              value={flight}
              onChange={(e) => { setFlight(e.target.value); resetPage(); }}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            >
              <option value="All">All flights</option>
              {MOCK_FLIGHTS.map((f) => (
                <option key={f.flightNo} value={f.flightNo}>{f.flightNo}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Status</span>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value as BagStatus | "All"); resetPage(); }}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            >
              <option value="All">All statuses</option>
              {(["Accepted", "Screened", "Sorted", "Loaded", "In Transit", "Transfer Risk", "Delivered", "Delayed", "Held Security", "Short-shipped"] as const).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
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
          title="Live Baggege Tracking"
          subtitle={`${filtered.length} bags match current filters`}
        />
        {filtered.length === 0 ? (
          <PanelBody>
            <EmptyState title="No bags match filters" hint="Clear filters or widen status." />
          </PanelBody>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <tr>
                    <th className="px-3 py-2">LPN</th>
                    <th className="px-3 py-2">Passenger</th>
                    <th className="px-3 py-2">Flight</th>
                    <th className="px-3 py-2">PNR</th>
                    <th className="px-3 py-2">Tag</th>
                    <th className="px-3 py-2">Last scan</th>
                    <th className="px-3 py-2">Scan point</th>
                    <th className="px-3 py-2">Station</th>
                    <th className="px-3 py-2">Risk</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slice.map((b: BagRecord) => (
                    <tr
                      key={b.lpn}
                      onClick={() => onOpenBag(b.lpn)}
                      className={`cursor-pointer transition-colors duration-700 hover:bg-slate-50 ${
                        flashedLpns.has(b.lpn) ? "bg-emerald-50" :
                        b.status === "Transfer Risk" || b.status === "Held Security" ? "bg-rose-50/30" :
                        b.status === "Delayed" || b.status === "Short-shipped" ? "bg-amber-50/20" : ""
                      }`}
                    >
                      <td className="px-3 py-2">
                        <Mono>{b.lpn}</Mono>
                      </td>
                      <td className="px-3 py-2 text-slate-700">{b.passenger}</td>
                      <td className="px-3 py-2">
                        <Mono>{b.flightNo}</Mono>
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-600">
                        {b.pnr}
                      </td>
                      <td className="px-3 py-2">
                        <StatusPill>{b.tagType}</StatusPill>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-[11px] text-slate-600">
                        {b.lastScanAt}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{b.scanPoint}</td>
                      <td className="px-3 py-2 text-slate-700">{b.station}</td>
                      <td className="px-3 py-2">
                        <StatusPill>{b.risk}</StatusPill>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <div className="min-w-[120px]">
  <StatusPill>{b.status}</StatusPill>
</div>
                          {EXCEPTION_STATUSES.has(b.status) && onOpenInvestigation ? (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onOpenInvestigation(); }}
                              title="Open Investigation module"
                              className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-50"
                            >
                              <ExternalLink className="size-2.5" aria-hidden />
                              Investigate
                            </button>
                          ) : null}
                        </div>
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
