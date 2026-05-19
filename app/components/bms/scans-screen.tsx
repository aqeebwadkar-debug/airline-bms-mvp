"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Radio } from "lucide-react";
import { MOCK_SCANS, downloadCsv } from "./data";
import {
  EmptyState,
  Mono,
  PaginationBar,
  Panel,
  PanelBody,
  PanelHead,
  StatusPill,
} from "./primitives";
import type { ScanEventRecord } from "./types";
import { usePagination } from "./use-pagination";

const LIVE_RESULTS: ScanEventRecord["result"][] = [
  "Success", "Success", "Success", "Success",
  "No-read", "Retry Required",
];

interface Props {
  onOpenBag: (lpn: string) => void;
  syncTick?: number;
}

export function ScansScreen({ onOpenBag, syncTick }: Props) {
  const [station, setStation] = useState("All");
  const [scanPoint, setScanPoint] = useState("All");
  const [result, setResult] = useState<ScanEventRecord["result"] | "All">("All");
  const [date, setDate] = useState("");
  const [hour, setHour] = useState("All");

  const liveSeq = useRef(0);
  const [liveScans, setLiveScans] = useState<ScanEventRecord[]>(() => [...MOCK_SCANS]);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState(new Date());

  function genLiveScan(): ScanEventRecord {
    const t = MOCK_SCANS[Math.floor(Math.random() * MOCK_SCANS.length)];
    const now = new Date();
    liveSeq.current += 1;
    const ts =
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ` +
      `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    return {
      id: `LIVE-${liveSeq.current}`,
      at: ts,
      lpn: t.lpn,
      flightNo: t.flightNo,
      scanPoint: t.scanPoint,
      station: t.station,
      deviceId: t.deviceId,
      scanType: t.scanType,
      result: LIVE_RESULTS[Math.floor(Math.random() * LIVE_RESULTS.length)],
    };
  }

  function appendScan() {
    const scan = genLiveScan();
    setLiveScans((prev) => [scan, ...prev].slice(0, 600));
    setFlashIds(new Set([scan.id]));
    setLastRefresh(new Date());
    setTimeout(() => setFlashIds(new Set()), 1800);
  }

  useEffect(() => {
    const id = setInterval(appendScan, 3000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Respond to header global sync
  useEffect(() => {
    if (syncTick) { appendScan(); resetPage(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncTick]);

  const stations = useMemo(() => {
    const s = new Set(MOCK_SCANS.map((x) => x.station));
    return ["All", ...Array.from(s)];
  }, []);

  const points = useMemo(() => {
    const s = new Set(MOCK_SCANS.map((x) => x.scanPoint));
    return ["All", ...Array.from(s)];
  }, []);

  const filtered = useMemo(() => {
    return liveScans.filter((s) => {
      const okSt = station === "All" || s.station === station;
      const okP = scanPoint === "All" || s.scanPoint === scanPoint;
      const okR = result === "All" || s.result === result;
      const okD = !date || s.at.startsWith(date);
      const okH =
        hour === "All" ||
        s.at.startsWith(`${date || "2026"} ${hour.padStart(2, "0")}`);
      return okSt && okP && okR && okD && okH;
    });
  }, [liveScans, station, scanPoint, result, hour, date]);

  const { page, totalPages, slice, setPage, resetPage } = usePagination(
    filtered,
    12,
  );

  // KPI counts derived from live data
  const totalReads = liveScans.length;
  const retryEvents = liveScans.filter((s) => s.result === "Retry Required" || s.result === "No-read").length;
  const missingScans = liveScans.filter((s) => s.result === "Missing Arrival Scan" || s.result === "Telemetry Gap").length;
  const activeDevices = new Set(liveScans.map((s) => s.deviceId)).size;

  function isProblematic(r: ScanEventRecord["result"]) {
    return r !== "Success";
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
            <Radio className="size-3 animate-pulse" aria-hidden />
            Live Monitoring
          </span>
          <span className="text-[11px] text-slate-400">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                "scans.csv",
                filtered.map((s) => ({
                  timestamp: s.at,
                  lpn: s.lpn,
                  flightNo: s.flightNo,
                  scanPoint: s.scanPoint,
                  station: s.station,
                  deviceId: s.deviceId,
                  scanType: s.scanType,
                  result: s.result,
                })),
              )
            }
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="size-3.5" aria-hidden />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Reads", value: totalReads.toLocaleString(), color: "text-slate-900" },
          { label: "Retry Events", value: retryEvents.toLocaleString(), color: "text-amber-700" },
          { label: "Missing Scans", value: missingScans.toLocaleString(), color: "text-rose-700" },
          { label: "Active Devices", value: activeDevices.toLocaleString(), color: "text-blue-700" },
        ].map((k) => (
          <Panel key={k.label}>
            <PanelBody className="py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{k.label}</p>
              <p className={`mt-1 text-xl font-semibold tabular-nums ${k.color}`}>{k.value}</p>
            </PanelBody>
          </Panel>
        ))}
      </div>

      {/* Filters */}
      <Panel>
        <PanelHead title="Monitoring filters" />
        <PanelBody className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <label className="space-y-1 lg:col-span-2">
            <span className="text-[11px] font-medium text-slate-500">Station</span>
            <select
              value={station}
              onChange={(e) => { setStation(e.target.value); resetPage(); }}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            >
              {stations.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="space-y-1 lg:col-span-2">
            <span className="text-[11px] font-medium text-slate-500">Scan point</span>
            <select
              value={scanPoint}
              onChange={(e) => { setScanPoint(e.target.value); resetPage(); }}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            >
              {points.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Hour (local)</span>
            <select
              value={hour}
              onChange={(e) => { setHour(e.target.value); resetPage(); }}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            >
              <option value="All">All hours</option>
              {Array.from({ length: 24 }, (_, i) => String(i)).map((h) => (
                <option key={h} value={h}>{h.padStart(2, "0")}:00–{h.padStart(2, "0")}:59</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); resetPage(); }}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            />
          </label>
          <label className="space-y-1 lg:col-span-2">
            <span className="text-[11px] font-medium text-slate-500">Read result</span>
            <select
              value={result}
              onChange={(e) => { setResult(e.target.value as ScanEventRecord["result"] | "All"); resetPage(); }}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            >
              <option value="All">All results</option>
              <option value="Success">Success</option>
              <option value="No-read">No-read</option>
              <option value="Exception">Exception</option>
              <option value="Retry Required">Retry Required</option>
              <option value="Partial Read">Partial Read</option>
              <option value="Telemetry Gap">Telemetry Gap</option>
              <option value="Missing Arrival Scan">Missing Arrival Scan</option>
              <option value="Delayed Read">Delayed Read</option>
            </select>
          </label>
        </PanelBody>
      </Panel>

      {/* Event stream */}
      <Panel>
        <PanelHead
          title="Live Scan Activity"
          subtitle={`Real-time baggage scan events across the network — ${filtered.length} events`}
        />
        {filtered.length === 0 ? (
          <PanelBody>
            <EmptyState title="No scans match filters" />
          </PanelBody>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Timestamp</th>
                    <th className="px-3 py-2">LPN</th>
                    <th className="px-3 py-2">Flight</th>
                    <th className="px-3 py-2">Scan point</th>
                    <th className="px-3 py-2">Station</th>
                    <th className="px-3 py-2">Device</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slice.map((s) => (
                    <tr
                      key={s.id}
                      className={`transition-colors duration-700 hover:bg-slate-50 ${
                        flashIds.has(s.id)
                          ? "bg-emerald-50"
                          : isProblematic(s.result)
                            ? s.result === "Missing Arrival Scan" || s.result === "Telemetry Gap"
                              ? "bg-rose-50/40"
                              : "bg-amber-50/30"
                            : ""
                      }`}
                    >
                      <td className="whitespace-nowrap px-3 py-2 text-[11px] text-slate-600">
                        {s.at}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => onOpenBag(s.lpn)}
                          className="font-mono text-[11px] font-semibold text-blue-700 hover:underline"
                        >
                          {s.lpn}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <Mono>{s.flightNo}</Mono>
                      </td>
                      <td className="px-3 py-2 text-slate-700">{s.scanPoint}</td>
                      <td className="px-3 py-2 text-slate-700">{s.station}</td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-700">
                        {s.deviceId}
                      </td>
                      <td className="px-3 py-2">
                        <StatusPill>{s.scanType}</StatusPill>
                      </td>
                      <td className="px-3 py-2">
                        <StatusPill>{s.result}</StatusPill>
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
