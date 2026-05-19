"use client";

import { useMemo, useState } from "react";
import { Cpu, Radio } from "lucide-react";
import { bagsForFlight, flightByNo, MOCK_SCANS } from "./data";
import { nudge, fmtTs, useLiveRefresh } from "./use-live-tick";
import {
  EmptyState,
  Mono,
  Panel,
  PanelBody,
  PanelHead,
  SectionLabel,
  StatusPill,
} from "./primitives";
import type { BagRecord, ScanEventRecord } from "./types";

type Tab = "manifest" | "reconcile" | "short";

interface Props {
  flightNo: string;
  onBack: () => void;
  onOpenBag: (lpn: string) => void;
  syncTick?: number;
}

export function FlightDetailScreen({
  flightNo,
  onBack,
  onOpenBag,
  syncTick,
}: Props) {
  const [tab, setTab] = useState<Tab>("manifest");

  const flight = flightByNo(flightNo);
  const bags   = useMemo(() => bagsForFlight(flightNo), [flightNo]);

  const baseRecon = flight?.reconciliationPct ?? 0;
  const baseLoaded = flight?.bagsLoaded ?? 0;

  // Live operational metrics
  const [liveRecon,    setLiveRecon]    = useState(baseRecon);
  const [liveLoaded,   setLiveLoaded]   = useState(baseLoaded);
  const [liveTransfer, setLiveTransfer] = useState(
    () => bags.filter((b) => b.status === "Transfer Risk").length,
  );
  const [lastRefresh, setLastRefresh]  = useState(new Date());

  const baseRecentScans = useMemo(
    () =>
      [...MOCK_SCANS]
        .filter((s) => s.flightNo === flightNo)
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 8),
    [flightNo],
  );

  const [recentScans, setRecentScans] = useState<ScanEventRecord[]>(() => baseRecentScans);

  function doRefresh() {
    if (!flight) return;
    setLiveRecon((v) => Math.min(100, Math.max(0, nudge(v, 0.4))));
    setLiveLoaded((v) => Math.min(flight.bagsPlanned, Math.max(0, v + (Math.random() > 0.75 ? 1 : 0))));
    setLiveTransfer((v) => Math.max(0, v + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0)));

    if (Math.random() > 0.45) {
      const base = MOCK_SCANS.find((s) => s.flightNo === flightNo);
      if (base) {
        const now = new Date();
        const liveScan: ScanEventRecord = {
          ...base,
          id:     `LIVE-${now.getTime()}`,
          at:     fmtTs(now),
          result: Math.random() > 0.1 ? "Success" : "Retry Required",
        };
        setRecentScans((prev) => [liveScan, ...prev].slice(0, 8));
      }
    }
    setLastRefresh(new Date());
  }

  useLiveRefresh(doRefresh, syncTick);

  const loadPct =
    flight && flight.bagsPlanned > 0
      ? Math.round((liveLoaded / flight.bagsPlanned) * 100)
      : 0;

  if (!flight) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-blue-700 hover:underline"
        >
          ← Back
        </button>
        <EmptyState title="Flight not found" />
      </div>
    );
  }

  const shortShipped = bags.filter((b) => b.status === "Short-shipped");
  const transferRisk = bags.filter((b) => b.status === "Transfer Risk");
  const delayed = bags.filter((b) => b.status === "Delayed");

  const reconcileIssues = bags.filter(
    (b) => b.status === "Short-shipped" || b.status === "Transfer Risk",
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">
              <Mono>{flight.flightNo}</Mono>
            </span>
            <StatusPill>{flight.status}</StatusPill>
          </div>
          <p className="text-xs text-slate-500">{flight.airline}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
            <Radio className="size-3 animate-pulse" aria-hidden />
            Live
          </span>
          <span className="text-[11px] text-slate-400">Updated {lastRefresh.toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        <SummaryTile label="Route" value={`${flight.origin} → ${flight.dest}`} />
        <SummaryTile
          label="STD / STA (local)"
          value={`${flight.stdLocal.split(" ").slice(1).join(" ")} • ${flight.staLocal.split(" ").slice(1).join(" ")}`}
        />
        <SummaryTile
          label="Gate / Terminal"
          value={`${flight.gate} / ${flight.terminal}`}
        />
        <SummaryTile label="Aircraft" value={flight.aircraft} />
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <MiniMetric label="Passengers" value={String(flight.pax)} />
        <MiniMetric
          label="Bags loaded"
          value={`${liveLoaded}/${flight.bagsPlanned}`}
        />
        <MiniMetric
          label="Reconciliation"
          value={`${liveRecon.toFixed(1)}%`}
        />
        <MiniMetric label="Transfer Risk Bags" value={String(liveTransfer)} />
        <MiniMetric label="Loading progress" value={`${loadPct}%`} />
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelHead
            title="Baggage Operations"
            subtitle="Manifest, reconciliation status, and short-shipped baggage monitoring"
            action={
              <div className="flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
                {(
                  [
                    ["manifest", "Manifest"],
                    ["reconcile", "Reconciliation"],
                    ["short", "Short-shipped"],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTab(k)}
                    className={`rounded px-2 py-1 text-[11px] font-semibold ${
                      tab === k
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            }
          />
          {tab === "manifest" ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <tr>
                    <th className="px-3 py-2">LPN</th>
                    <th className="px-3 py-2">Passenger</th>
                    <th className="px-3 py-2">Tag</th>
                    <th className="px-3 py-2">Weight</th>
                    <th className="px-3 py-2">Screening</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bags.map((b: BagRecord) => (
                    <tr
                      key={b.lpn}
                      className={`cursor-pointer hover:bg-slate-50 ${
                        b.status === "Transfer Risk" || b.status === "Held Security"
                          ? "bg-rose-50/30"
                          : b.status === "Delayed" || b.status === "Short-shipped"
                            ? "bg-amber-50/20"
                            : ""
                      }`}
                      onClick={() => onOpenBag(b.lpn)}
                    >
                      <td className="px-3 py-2">
                        <Mono>{b.lpn}</Mono>
                      </td>
                      <td className="px-3 py-2 text-slate-700">{b.passenger}</td>
                      <td className="px-3 py-2">
                        <StatusPill>{b.tagType}</StatusPill>
                      </td>
                      <td className="px-3 py-2 tabular-nums text-slate-700">
                        {b.weightKg} kg
                      </td>
                      <td className="px-3 py-2">
                        <StatusPill>{b.screening}</StatusPill>
                      </td>
                      <td className="px-3 py-2">
                        <StatusPill>{b.status}</StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === "reconcile" ? (
            <PanelBody>
              {reconcileIssues.length === 0 ? (
                <EmptyState title="No reconciliation exceptions found" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                      <tr>
                        <th className="px-3 py-2">LPN</th>
                        <th className="px-3 py-2">Exception</th>
                        <th className="px-3 py-2">Last scan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reconcileIssues.map((b) => (
                        <tr
                          key={b.lpn}
                          className="cursor-pointer hover:bg-slate-50"
                          onClick={() => onOpenBag(b.lpn)}
                        >
                          <td className="px-3 py-2">
                            <Mono>{b.lpn}</Mono>
                          </td>
                          <td className="px-3 py-2">
                            <StatusPill>{b.status}</StatusPill>
                          </td>
                          <td className="px-3 py-2 text-[11px] text-slate-600">
                            {b.lastScanAt} • {b.scanPoint}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </PanelBody>
          ) : null}

          {tab === "short" ? (
            <PanelBody>
              {shortShipped.length === 0 ? (
                <EmptyState title="No short-shipped bags flagged" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                      <tr>
                        <th className="px-3 py-2">LPN</th>
                        <th className="px-3 py-2">Passenger</th>
                        <th className="px-3 py-2">Last known point</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {shortShipped.map((b) => (
                        <tr
                          key={b.lpn}
                          className="cursor-pointer hover:bg-slate-50"
                          onClick={() => onOpenBag(b.lpn)}
                        >
                          <td className="px-3 py-2">
                            <Mono>{b.lpn}</Mono>
                          </td>
                          <td className="px-3 py-2">{b.passenger}</td>
                          <td className="px-3 py-2 text-[11px] text-slate-600">
                            {b.scanPoint} ({b.station})
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </PanelBody>
          ) : null}
        </Panel>

        <div className="space-y-3">
          <Panel>
            <PanelHead title="Transfer Risk" subtitle="Derived from baggage transfer thresholds" />
            <PanelBody className="space-y-2">
              {transferRisk.length === 0 ? (
                <p className="text-xs text-slate-600">No bags flagged.</p>
              ) : (
                transferRisk.slice(0, 6).map((b) => (
                  <button
                    key={b.lpn}
                    type="button"
                    onClick={() => onOpenBag(b.lpn)}
                    className="flex w-full items-center justify-between rounded-md border border-rose-100 bg-rose-50/40 px-3 py-2 text-left hover:bg-rose-50"
                  >
                    <Mono>{b.lpn}</Mono>
                    <StatusPill>Transfer Risk</StatusPill>
                  </button>
                ))
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead title="Delayed Bags" />
            <PanelBody className="space-y-2">
              {delayed.length === 0 ? (
                <p className="text-xs text-slate-600">None on this flight slice.</p>
              ) : (
                delayed.map((b) => (
                  <button
                    key={b.lpn}
                    type="button"
                    onClick={() => onOpenBag(b.lpn)}
                    className="flex w-full justify-between rounded-md border border-amber-100 bg-amber-50/40 px-3 py-2 text-left hover:bg-amber-50"
                  >
                    <span className="text-xs text-slate-800">{b.passenger}</span>
                    <Mono>{b.lpn}</Mono>
                  </button>
                ))
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead
              title="Operational Insight"
              action={<Cpu className="size-4 text-slate-400" aria-hidden />}
            />
            <PanelBody className="space-y-2 text-xs text-slate-700">
              <p>
                Pattern scan suggests focusing reconciling effort on{" "}
                <span className="font-semibold">ULD sequencing</span> if tunnel dwell
                exceeds <span className="font-mono">7m</span> during bank overlap.
              </p>
              <p className="text-[11px] text-slate-500">
                AI-assisted insights generated from live baggage events and operational monitoring patterns.
              </p>
            </PanelBody>
          </Panel>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel>
          <PanelHead title="Loading Overview" subtitle="Container allocation, baggage mix, and loading distribution" />
          <PanelBody className="grid gap-3 sm:grid-cols-2">
            <div>
              <SectionLabel>Container positions</SectionLabel>
              <div className="mt-2 overflow-hidden rounded-md border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Container</th>
                      <th className="px-3 py-2">Position</th>
                      <th className="px-3 py-2 text-right">Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[11px]">AKE‑04211</span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">L2‑fwd</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-700">312 kg</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[11px]">AKE‑04229</span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">L2‑aft</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-700">298 kg</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[11px]">PMC‑88102</span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">bulk</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-700">410 kg</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <SectionLabel>Bag categories</SectionLabel>
              <div className="mt-2 overflow-hidden rounded-md border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2 text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-3 py-2 text-slate-700">Standard</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-900">
                        {bags.filter((b) => b.tagType === "Standard").length}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-slate-700">Priority</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-900">
                        {bags.filter((b) => b.tagType === "Priority").length}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-slate-700">Interline</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-900">
                        {bags.filter((b) => b.tagType === "Interline").length}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Recent Flight Scan Events" subtitle="Latest baggage scan activity associated with this flight" />
          {recentScans.length === 0 ? (
            <PanelBody>
              <EmptyState title="No linked scans" />
            </PanelBody>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">LPN</th>
                    <th className="px-3 py-2">Device</th>
                    <th className="px-3 py-2">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentScans.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-[11px] text-slate-600">{s.at}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className="font-mono text-[11px] font-semibold text-blue-700 hover:underline"
                          onClick={() => onOpenBag(s.lpn)}
                        >
                          {s.lpn}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-slate-700">{s.deviceId}</td>
                      <td className="px-3 py-2">
                        <StatusPill>{s.result}</StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <Panel>
        <PanelHead title="Passenger Baggage Summary" subtitle="Passenger-linked baggage metrics and screening overview" />
        <PanelBody className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-slate-100 bg-slate-50/60 p-3">
            <p className="text-[11px] font-semibold text-slate-500">PNR-linked bags</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{bags.length}</p>
          </div>
          <div className="rounded-md border border-slate-100 bg-slate-50/60 p-3">
            <p className="text-[11px] font-semibold text-slate-500">Avg weight / bag</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {(bags.reduce((a, b) => a + b.weightKg, 0) / Math.max(1, bags.length)).toFixed(1)} kg
            </p>
          </div>
          <div className="rounded-md border border-slate-100 bg-slate-50/60 p-3">
            <p className="text-[11px] font-semibold text-slate-500">Screening holds</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {bags.filter((b) => b.screening !== "Cleared").length}
            </p>
          </div>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHead title="Operational Timeline" subtitle="Chronological baggage handling and loading events" />
        <PanelBody>
          <ol className="relative border-l border-slate-200 pl-4">
            {[
              {
                t: "ULD plan issued",
                d: "Automated plan reconciled against inbound scans.",
              },
              {
                t: "Ramp loading window",
                d: `Loader assignments confirmed for gate ${flight.gate}.`,
              },
              {
                t: "Final reconcile checkpoint",
                d: "Baggage supervisor sign-off pending if exceptions exist.",
              },
            ].map((step) => (
              <li key={step.t} className="mb-4 ml-1">
                <span className="absolute -left-1 flex size-3 items-center justify-center rounded-full bg-blue-600 ring-4 ring-white" />
                <p className="text-xs font-semibold text-slate-900">{step.t}</p>
                <p className="mt-0.5 text-[11px] text-slate-600">{step.d}</p>
              </li>
            ))}
          </ol>
        </PanelBody>
      </Panel>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <Panel>
      <PanelBody className="py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
      </PanelBody>
    </Panel>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <Panel>
      <PanelBody className="py-3">
        <p className="text-[11px] font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">{value}</p>
      </PanelBody>
    </Panel>
  );
}
