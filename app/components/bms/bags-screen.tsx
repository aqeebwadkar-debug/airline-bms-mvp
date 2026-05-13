"use client";

import { useMemo, useState } from "react";
import { MOCK_BAGS, MOCK_FLIGHTS } from "./data";
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
}

export function BagsScreen({ onOpenBag }: Props) {
  const [query, setQuery] = useState("");
  const [flight, setFlight] = useState<string>("All");
  const [status, setStatus] = useState<BagStatus | "All">("All");
  const [station, setStation] = useState<string>("All");

  const stations = useMemo(() => {
    const s = new Set(MOCK_BAGS.map((b) => b.station));
    return ["All", ...Array.from(s)];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_BAGS.filter((b) => {
      const okQ =
        !q ||
        b.lpn.includes(q) ||
        b.passenger.toLowerCase().includes(q) ||
        b.pnr.toLowerCase().includes(q);
      const okF = flight === "All" || b.flightNo === flight;
      const okS = status === "All" || b.status === status;
      const okSt = station === "All" || b.station === station;
      return okQ && okF && okS && okSt;
    });
  }, [query, flight, status, station]);

  const { page, totalPages, slice, setPage, resetPage } = usePagination(
    filtered,
    10,
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-slate-500">
          Baggage status and routing visibility
        </p>
      </div>

      <Panel>
        <PanelHead title="Search & filters" />
        <PanelBody className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Query</span>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                resetPage();
              }}
              placeholder="LPN, PNR, passenger…"
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Flight</span>
            <select
              value={flight}
              onChange={(e) => {
                setFlight(e.target.value);
                resetPage();
              }}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            >
              <option value="All">All flights</option>
              {MOCK_FLIGHTS.map((f) => (
                <option key={f.flightNo} value={f.flightNo}>
                  {f.flightNo}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Status</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as BagStatus | "All");
                resetPage();
              }}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            >
              <option value="All">All statuses</option>
              {(
                [
                  "Accepted",
                  "Screened",
                  "Sorted",
                  "Loaded",
                  "In Transit",
                  "Transfer Risk",
                  "Delivered",
                  "Delayed",
                  "Held Security",
                  "Short-shipped",
                ] as const
              ).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
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
        <PanelHead
          title="Results"
          subtitle={`${filtered.length} bags match`}
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
                    <th className="px-3 py-2">Last scan</th>
                    <th className="px-3 py-2">Scan point</th>
                    <th className="px-3 py-2">Station</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slice.map((b: BagRecord) => (
                    <tr
                      key={b.lpn}
                      onClick={() => onOpenBag(b.lpn)}
                      className="cursor-pointer hover:bg-slate-50"
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
                      <td className="whitespace-nowrap px-3 py-2 text-[11px] text-slate-600">
                        {b.lastScanAt}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{b.scanPoint}</td>
                      <td className="px-3 py-2 text-slate-700">{b.station}</td>
                      <td className="px-3 py-2">
                        <StatusPill>{b.status}</StatusPill>
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
