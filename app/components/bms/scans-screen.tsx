"use client";

import { useMemo, useState } from "react";
import { MOCK_SCANS } from "./data";
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

interface Props {
  onOpenBag: (lpn: string) => void;
}

export function ScansScreen({ onOpenBag }: Props) {
  const [station, setStation] = useState("All");
  const [scanPoint, setScanPoint] = useState("All");
  const [result, setResult] = useState<ScanEventRecord["result"] | "All">("All");
  const [date, setDate] = useState("2026-05-12");
  const [hour, setHour] = useState("All");

  const stations = useMemo(() => {
    const s = new Set(MOCK_SCANS.map((x) => x.station));
    return ["All", ...Array.from(s)];
  }, []);

  const points = useMemo(() => {
    const s = new Set(MOCK_SCANS.map((x) => x.scanPoint));
    return ["All", ...Array.from(s)];
  }, []);

  const filtered = useMemo(() => {
    return MOCK_SCANS.filter((s) => {
      const okSt = station === "All" || s.station === station;
      const okP = scanPoint === "All" || s.scanPoint === scanPoint;
      const okR = result === "All" || s.result === result;
      const okD = date === "All" || s.at.startsWith(date);
      const okH =
        hour === "All" ||
        s.at.startsWith(`${date} ${hour.padStart(2, "0")}`);
      return okSt && okP && okR && okD && okH;
    });
  }, [station, scanPoint, result, hour, date]);

  const { page, totalPages, slice, setPage, resetPage } = usePagination(
    filtered,
    12,
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-slate-500">
          Operational scan event monitoring
        </p>
      </div>

      <Panel>
        <PanelHead title="Monitoring filters" />
        <PanelBody className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <label className="space-y-1 lg:col-span-2">
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
          <label className="space-y-1 lg:col-span-2">
            <span className="text-[11px] font-medium text-slate-500">Scan point</span>
            <select
              value={scanPoint}
              onChange={(e) => {
                setScanPoint(e.target.value);
                resetPage();
              }}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            >
              {points.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Hour (local)</span>
            <select
              value={hour}
              onChange={(e) => {
                setHour(e.target.value);
                resetPage();
              }}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            >
              <option value="All">All hours</option>
              {Array.from({ length: 24 }, (_, i) => String(i)).map((h) => (
                <option key={h} value={h}>
                  {h.padStart(2, "0")}:00–{h.padStart(2, "0")}:59
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                resetPage();
              }}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
              min="2026-05-11"
              max="2026-05-16"
            />
          </label>
          <label className="space-y-1 lg:col-span-2">
            <span className="text-[11px] font-medium text-slate-500">Read result</span>
            <select
              value={result}
              onChange={(e) => {
                setResult(e.target.value as ScanEventRecord["result"] | "All");
                resetPage();
              }}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            >
              <option value="All">All results</option>
              <option value="Success">Success</option>
              <option value="No-read">No-read</option>
              <option value="Exception">Exception</option>
            </select>
          </label>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHead title="Event stream" subtitle={`${filtered.length} events`} />
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
                    <tr key={s.id} className="hover:bg-slate-50">
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
