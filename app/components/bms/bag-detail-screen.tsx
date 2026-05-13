"use client";

import type { ReactNode } from "react";
import { Cpu } from "lucide-react";
import {
  bagByLpn,
  flightByNo,
  incidentsForLpn,
  scansForLpn,
} from "./data";
import {
  EmptyState,
  Mono,
  Panel,
  PanelBody,
  PanelHead,
  SectionLabel,
  StatusPill,
} from "./primitives";

interface Props {
  lpn: string;
  onBack: () => void;
  onOpenFlight: (flightNo: string) => void;
  onOpenIncident: (id: string) => void;
}

const R753_LABELS = [
  "Acceptance",
  "Security screening",
  "Sortation",
  "Loading",
  "Transfer / arrival",
];

export function BagDetailScreen({
  lpn,
  onBack,
  onOpenFlight,
  onOpenIncident,
}: Props) {
  const bag = bagByLpn(lpn);
  const flight = bag ? flightByNo(bag.flightNo) : undefined;
  const scans = scansForLpn(lpn);
  const incidents = incidentsForLpn(lpn);

  if (!bag) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-blue-700 hover:underline"
        >
          ← Back
        </button>
        <EmptyState title="Bag record not found" hint="Verify LPN from tracking search." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Back
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-semibold text-slate-900">
            <Mono>{bag.lpn}</Mono>
          </span>
          <StatusPill>{bag.status}</StatusPill>
          <StatusPill>{bag.tagType}</StatusPill>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel>
          <PanelHead title="Bag information" />
          <PanelBody className="space-y-3 text-xs">
            <Row k="Weight" v={`${bag.weightKg} kg`} />
            <Row k="Last scan" v={bag.lastScanAt} />
            <Row k="Scan point" v={bag.scanPoint} />
            <Row k="Station context" v={bag.station} />
            <Row k="Screening" v={<StatusPill>{bag.screening}</StatusPill>} />
            <Row k="Operational risk" v={<StatusPill>{bag.risk}</StatusPill>} />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Passenger" />
          <PanelBody className="space-y-3 text-xs">
            <Row k="Name" v={bag.passenger} />
            <Row k="PNR" v={<Mono>{bag.pnr}</Mono>} />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Flight association" />
          <PanelBody className="space-y-3 text-xs">
            <Row
              k="Operating flight"
              v={
                <button
                  type="button"
                  onClick={() => onOpenFlight(bag.flightNo)}
                  className="font-mono text-[11px] font-semibold text-blue-700 hover:underline"
                >
                  {bag.flightNo}
                </button>
              }
            />
            {flight ? (
              <>
                <Row k="Route" v={`${flight.origin} → ${flight.dest}`} />
                <Row k="STD / STA" v={`${flight.stdLocal} • ${flight.staLocal}`} />
                <Row k="Gate" v={`${flight.gate} (${flight.terminal})`} />
              </>
            ) : (
              <p className="text-[11px] text-slate-500">Flight metadata unavailable.</p>
            )}
          </PanelBody>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelHead title="Baggage compliance workflow" subtitle="Operational verification checkpoints" />
          <PanelBody>
            <div className="grid gap-2 sm:grid-cols-5">
              {R753_LABELS.map((label, idx) => {
                const stepNo = idx + 1;
                const done = bag.r753Step >= stepNo;
                return (
                  <div
                    key={label}
                    className={`rounded-md border px-2 py-2 text-[11px] ${
                      done
                        ? "border-emerald-200 bg-emerald-50/60 text-emerald-900"
                        : "border-slate-200 bg-white text-slate-500"
                    }`}
                  >
                    <p className="font-semibold">{label}</p>
                    <p className="mt-1">{done ? "Verified" : "Pending"}</p>
                  </div>
                );
              })}
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead
            title="AI insight"
            action={<Cpu className="size-4 text-slate-400" aria-hidden />}
          />
          <PanelBody className="text-xs text-slate-700">
            <p>
              Last-mile dwell looks nominal unless screening escalates. Monitor{" "}
              <span className="font-semibold">{bag.scanPoint}</span> for repeat exceptions.
            </p>
            <p className="mt-2 text-[11px] text-slate-500">
              Advisory summary derived from bag status and scan cadence.
            </p>
          </PanelBody>
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel>
          <PanelHead title="Scan timeline" />
          <PanelBody>
            <ol className="relative space-y-4 border-l border-slate-200 pl-4">
              {scans.slice(-8).map((s) => (
                <li key={s.id} className="relative">
                  <span className="absolute -left-[21px] mt-0.5 size-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold text-slate-900">{s.scanPoint}</p>
                    <StatusPill>{s.scanType}</StatusPill>
                    <StatusPill>{s.result}</StatusPill>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600">
                    {s.at} • {s.deviceId} • {s.station}
                  </p>
                </li>
              ))}
            </ol>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Operational flags" />
          <PanelBody className="grid gap-2 text-xs text-slate-700">
            <FlagRow
              label="Reconciliation state"
              value={
                bag.status === "Short-shipped"
                  ? "Exception — short-shipped"
                  : "Aligned with manifest slice"
              }
            />
            <FlagRow
              label="Loading status"
              value={
                bag.status === "Loaded"
                  ? "Loaded — awaiting departure scans"
                  : bag.status
              }
            />
            <FlagRow
              label="Transfer tracking"
              value={
                bag.status === "Transfer Risk"
                  ? "Elevated — MTCT monitoring"
                  : "Nominal routing telemetry"
              }
            />
            <FlagRow
              label="Security screening"
              value={bag.screening}
            />
          </PanelBody>
        </Panel>
      </div>

      <Panel>
        <PanelHead title="Scan history" />
        {scans.length === 0 ? (
          <PanelBody>
            <EmptyState title="No scans recorded" />
          </PanelBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                <tr>
                  <th className="px-3 py-2">Timestamp</th>
                  <th className="px-3 py-2">Scan point</th>
                  <th className="px-3 py-2">Station</th>
                  <th className="px-3 py-2">Device</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...scans].reverse().map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-[11px] text-slate-600">{s.at}</td>
                    <td className="px-3 py-2 text-slate-800">{s.scanPoint}</td>
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
        )}
      </Panel>

      <Panel>
        <PanelHead title="Incident linkage" />
        <PanelBody>
          {incidents.length === 0 ? (
            <EmptyState title="No incident records linked to this LPN" />
          ) : (
            <div className="divide-y divide-slate-100 rounded-md border border-slate-100">
              {incidents.map((inc) => (
                <button
                  key={inc.id}
                  type="button"
                  onClick={() => onOpenIncident(inc.id)}
                  className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left hover:bg-slate-50"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Mono>{inc.id}</Mono>
                      <StatusPill>{inc.severity}</StatusPill>
                      <StatusPill>{inc.status}</StatusPill>
                    </div>
                    <p className="mt-1 text-xs text-slate-700">{inc.summary}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{inc.reportedAt}</p>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">{inc.station}</span>
                </button>
              ))}
            </div>
          )}
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHead title="Last scan visualization" />
        <PanelBody className="flex flex-wrap items-center gap-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <SectionLabel>Telemetry ping</SectionLabel>
            <p className="mt-2 text-sm font-semibold text-slate-900">{bag.scanPoint}</p>
            <p className="mt-1 text-[11px] text-slate-600">{bag.lastScanAt}</p>
          </div>
          <div className="flex flex-1 flex-wrap gap-2">
            {["RF read", "Location lock", "ULD correlation"].map((label, i) => (
              <span
                key={label}
                className={`rounded-full px-2 py-1 text-[11px] font-medium ring-1 ring-inset ${
                  i === 2 && bag.status === "Transfer Risk"
                    ? "bg-amber-50 text-amber-900 ring-amber-100"
                    : "bg-emerald-50 text-emerald-900 ring-emerald-100"
                }`}
              >
                {label}: {i === 2 && bag.status === "Transfer Risk" ? "Review" : "OK"}
              </span>
            ))}
          </div>
        </PanelBody>
      </Panel>
    </div>
  );
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[11px] font-medium text-slate-500">{k}</span>
      <div className="text-right text-[11px] text-slate-800">{v}</div>
    </div>
  );
}

function FlagRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50/60 px-3 py-2">
      <p className="text-[11px] font-semibold text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value}</p>
    </div>
  );
}
