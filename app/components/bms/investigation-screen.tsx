"use client";

import { useMemo, useState } from "react";
import { AlertOctagon, CheckCircle2, Clock, FileSearch, ShieldAlert, Cpu, Radio } from "lucide-react";
import {
  MOCK_INVESTIGATIONS,
  investigationById,
  downloadCsv,
} from "./data";
import { nudge, useLiveRefresh } from "./use-live-tick";
import {
  EmptyState,
  Mono,
  PaginationBar,
  Panel,
  PanelBody,
  PanelHead,
  StatusPill,
} from "./primitives";
import type { InvestigationRecord, InvestigationStatus } from "./types";
import { usePagination } from "./use-pagination";

type InvTab = "active" | "lost" | "resolution" | "resolved" | "sla";

interface Props {
  onOpenBag?: (lpn: string) => void;
  onOpenFlight?: (flightNo: string) => void;
  onOpenIncident?: (id: string) => void;
  syncTick?: number;
}

const statusPillMap: Record<string, string> = {
  Active: "bg-blue-50 text-blue-800 ring-blue-100",
  "Under Resolution": "bg-amber-50 text-amber-900 ring-amber-100",
  Resolved: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  Escalated: "bg-red-50 text-red-800 ring-red-100",
  "SLA Breach": "bg-rose-50 text-rose-800 ring-rose-100",
  "Missing Scan": "bg-orange-50 text-orange-900 ring-orange-100",
  "Lost in Transit": "bg-red-50 text-red-800 ring-red-100",
  "Under Investigation": "bg-amber-50 text-amber-900 ring-amber-100",
  "Investigation Required": "bg-blue-50 text-blue-800 ring-blue-100",
  "Resolved & Delivered": "bg-emerald-50 text-emerald-800 ring-emerald-100",
};

function InvStatusPill({ label }: { label: string }) {
  const cls = statusPillMap[label] ?? "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${cls}`}>
      {label}
    </span>
  );
}

export function InvestigationScreen({ onOpenBag, onOpenFlight, onOpenIncident, syncTick }: Props) {
  const [tab, setTab] = useState<InvTab>("active");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const baseKpi = useMemo(() => {
    const active = MOCK_INVESTIGATIONS.filter((i) => i.status === "Active" || i.status === "Under Resolution").length;
    const missing = MOCK_INVESTIGATIONS.filter((i) => i.caseType === "Missing Scan").length;
    const escalated = MOCK_INVESTIGATIONS.filter((i) => i.status === "Escalated").length;
    const sla = MOCK_INVESTIGATIONS.filter((i) => i.slaBreach).length;
    const resolved = MOCK_INVESTIGATIONS.filter((i) => i.status === "Resolved").length;
    return { active, missing, escalated, sla, resolved };
  }, []);

  const [liveActive,    setLiveActive]    = useState(baseKpi.active);
  const [liveMissing,   setLiveMissing]   = useState(baseKpi.missing);
  const [liveEscalated, setLiveEscalated] = useState(baseKpi.escalated);
  const [liveSla,       setLiveSla]       = useState(baseKpi.sla);
  const [lastSync,      setLastSync]      = useState(new Date());
  const [flashedIds,    setFlashedIds]    = useState<Set<string>>(new Set());

  function doRefresh() {
    setLiveActive((v) =>
      Math.max(baseKpi.active, Math.min(baseKpi.active + 3, v + (Math.random() > 0.65 ? 1 : 0))),
    );
    setLiveMissing((v) =>
      Math.max(baseKpi.missing, Math.min(baseKpi.missing + 2, v + (Math.random() > 0.75 ? 1 : 0))),
    );
    setLiveEscalated((v) =>
      Math.max(baseKpi.escalated, Math.min(baseKpi.escalated + 2, v + (Math.random() > 0.8 ? 1 : 0))),
    );
    setLiveSla((v) =>
      Math.max(baseKpi.sla, Math.min(baseKpi.sla + 1, nudge(v, 0.4) > v + 0.2 ? v + 1 : v)),
    );

    // Flash a random queue row
    const pick = MOCK_INVESTIGATIONS[Math.floor(Math.random() * MOCK_INVESTIGATIONS.length)]?.id;
    if (pick) {
      setFlashedIds(new Set([pick]));
      setTimeout(() => setFlashedIds(new Set()), 1400);
    }
    setLastSync(new Date());
  }

  useLiveRefresh(doRefresh, syncTick, 3000);

  const kpi = { ...baseKpi, active: liveActive, missing: liveMissing, escalated: liveEscalated, sla: liveSla, avgRes: "4h 32m" };

  const tabFiltered = useMemo(() => {
    switch (tab) {
      case "active":
        return MOCK_INVESTIGATIONS.filter((i) => i.status === "Active" || i.status === "Under Resolution" || i.status === "Escalated");
      case "lost":
        return MOCK_INVESTIGATIONS.filter((i) => i.caseType === "Lost in Transit" || i.caseType === "Missing Scan");
      case "resolution":
        return MOCK_INVESTIGATIONS.filter((i) => i.status === "Under Resolution" || i.status === "Active");
      case "resolved":
        return MOCK_INVESTIGATIONS.filter((i) => i.status === "Resolved");
      case "sla":
        return MOCK_INVESTIGATIONS.filter((i) => i.slaBreach);
      default:
        return MOCK_INVESTIGATIONS;
    }
  }, [tab]);

  const { page, totalPages, slice, setPage, resetPage } = usePagination(tabFiltered, 8);

  const selected = selectedId ? MOCK_INVESTIGATIONS.find((i) => i.id === selectedId) : null;

  if (selected) {
    return (
      <InvestigationDetail
        inv={selected}
        onBack={() => setSelectedId(null)}
        onOpenBag={onOpenBag}
        onOpenFlight={onOpenFlight}
        onOpenIncident={onOpenIncident}
      />
    );
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
            Synced {lastSync.toLocaleTimeString()}
          </span>
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                "investigations.csv",
                tabFiltered.map((i) => ({
                  id: i.id,
                  caseType: i.caseType,
                  status: i.status,
                  severity: i.severity,
                  lpn: i.lpn ?? "",
                  flightNo: i.flightNo,
                  station: i.station,
                  passenger: i.passenger ?? "",
                  reportedAt: i.reportedAt,
                  slaBreach: i.slaBreach,
                })),
              )
            }
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div>
        <div className="mb-2">
          <p className="text-sm font-semibold text-slate-900">Investigation Overview</p>
          <p className="text-[11px] text-slate-500">Live visibility into investigation cases, escalations, and resolutions.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {[
            { label: "Active Investigations", value: String(kpi.active), icon: FileSearch, color: "text-blue-700" },
            { label: "Missing Scan Cases", value: String(kpi.missing), icon: AlertOctagon, color: "text-orange-700" },
            { label: "Escalated Cases", value: String(kpi.escalated), icon: ShieldAlert, color: "text-red-700" },
            { label: "SLA Breaches", value: String(kpi.sla), icon: Clock, color: "text-rose-700" },
            { label: "Resolved Cases", value: String(kpi.resolved), icon: CheckCircle2, color: "text-emerald-700" },
            { label: "Avg Resolution Time", value: kpi.avgRes, icon: Clock, color: "text-slate-600" },
          ].map((k) => (
            <Panel key={k.label}>
              <PanelBody className="py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {k.label}
                </p>
                <p className={`mt-1 text-xl font-semibold tabular-nums ${k.color}`}>
                  {k.value}
                </p>
              </PanelBody>
            </Panel>
          ))}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1">
        {(
          [
            ["active", "Active Investigations"],
            ["lost", "Lost / Missing Baggage"],
            ["resolution", "Under Resolution"],
            ["resolved", "Resolved Cases"],
            ["sla", "SLA Breaches"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setTab(k);
              resetPage();
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === k
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Panel>
        <PanelHead
          title="Active Investigation Queue"
          subtitle="Investigation cases requiring operational review or intervention."
        />
        {tabFiltered.length === 0 ? (
          <PanelBody>
            <EmptyState title="No cases for this filter" hint="Switch tab or check back after next update cycle." />
          </PanelBody>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Case ID</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">LPN</th>
                    <th className="px-3 py-2">Flight</th>
                    <th className="px-3 py-2">Station</th>
                    <th className="px-3 py-2">Passenger</th>
                    <th className="px-3 py-2">Team</th>
                    <th className="px-3 py-2">SLA</th>
                    <th className="px-3 py-2">Severity</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slice.map((inv: InvestigationRecord) => (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedId(inv.id)}
                      className={`cursor-pointer transition-colors duration-700 hover:bg-slate-50 ${
                        flashedIds.has(inv.id) ? "bg-blue-50" :
                        inv.slaBreach ? "bg-rose-50/30" : inv.status === "Escalated" ? "bg-orange-50/20" : ""
                      }`}
                    >
                      <td className="px-3 py-2">
                        <Mono>{inv.id}</Mono>
                      </td>
                      <td className="px-3 py-2">
                        <InvStatusPill label={inv.caseType} />
                      </td>
                      <td className="px-3 py-2">
                        {inv.lpn ? (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onOpenBag?.(inv.lpn!); }}
                            className="font-mono text-[11px] font-semibold text-blue-700 hover:underline"
                          >
                            {inv.lpn}
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onOpenFlight?.(inv.flightNo); }}
                          className="font-mono text-[11px] font-semibold text-blue-700 hover:underline"
                        >
                          {inv.flightNo}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-slate-700">{inv.station}</td>
                      <td className="px-3 py-2 text-slate-700">{inv.passenger ?? "—"}</td>
                      <td className="max-w-[140px] truncate px-3 py-2 text-[11px] text-slate-600">{inv.assignedTeam}</td>
                      <td className="px-3 py-2">
                        {inv.slaBreach ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-100">
                            Breach
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-700">OK</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <StatusPill>{inv.severity}</StatusPill>
                      </td>
                      <td className="px-3 py-2">
                        <InvStatusPill label={inv.status} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-[11px] text-slate-600">
                        {inv.lastUpdated}
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

function InvestigationDetail({
  inv,
  onBack,
  onOpenBag,
  onOpenFlight,
  onOpenIncident,
}: {
  inv: InvestigationRecord;
  onBack: () => void;
  onOpenBag?: (lpn: string) => void;
  onOpenFlight?: (flightNo: string) => void;
  onOpenIncident?: (id: string) => void;
}) {
  const timeline: { t: string; d: string; status: "done" | "active" | "pending" }[] = [
    { t: "Case Opened", d: inv.reportedAt, status: "done" },
    {
      t: "Initial Scan Correlation",
      d: inv.status !== "Active" ? "Complete" : "In progress",
      status: inv.status !== "Active" ? "done" : "active",
    },
    {
      t: "Field Investigation",
      d:
        inv.status === "Escalated" || inv.status === "Under Resolution" || inv.status === "Resolved"
          ? "Complete"
          : "Pending supervisor assignment",
      status:
        inv.status === "Escalated" || inv.status === "Under Resolution" || inv.status === "Resolved"
          ? "done"
          : "pending",
    },
    {
      t: "Escalation / Resolution",
      d:
        inv.status === "Resolved"
          ? inv.resolutionNotes ?? "Resolved"
          : inv.status === "Escalated"
            ? "Escalated to operations lead"
            : "Awaiting outcome",
      status: inv.status === "Resolved" ? "done" : inv.status === "Escalated" ? "active" : "pending",
    },
    {
      t: "Passenger Notification",
      d: inv.status === "Resolved" ? "Completed" : "Pending resolution",
      status: inv.status === "Resolved" ? "done" : "pending",
    },
  ];

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
            <Mono>{inv.id}</Mono>
          </span>
          <InvStatusPill label={inv.caseType} />
          <StatusPill>{inv.severity}</StatusPill>
          <InvStatusPill label={inv.status} />
          {inv.slaBreach && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800">
              SLA Breach
            </span>
          )}
        </div>
      </div>

      {/* Summary + Linkage */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHead title="Case Summary" subtitle="Operational context and exception details" />
          <PanelBody className="space-y-3 text-xs text-slate-700">
            <p>{inv.summary}</p>
            <div className="rounded-md border border-slate-100 bg-slate-50/70 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Last Known Location
              </p>
              <p className="mt-1 font-semibold text-slate-900">{inv.lastKnownLocation}</p>
            </div>
            <div className="rounded-md border border-blue-100 bg-blue-50/40 px-3 py-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                <Cpu className="size-3.5" aria-hidden />
                AI Recommendation
              </div>
              <p className="mt-1 text-slate-700">{inv.aiRecommendation}</p>
              <p className="mt-2 text-[11px] text-slate-400 italic">AI-assisted operational insights.</p>
            </div>
            {inv.resolutionNotes && (
              <div className="rounded-md border border-emerald-100 bg-emerald-50/40 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Resolution Notes</p>
                <p className="mt-1 text-slate-700">{inv.resolutionNotes}</p>
              </div>
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Case Linkage" />
          <PanelBody className="space-y-3 text-xs">
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-medium text-slate-500">Case ID</span>
              <Mono>{inv.id}</Mono>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-medium text-slate-500">Flight</span>
              <button
                type="button"
                onClick={() => onOpenFlight?.(inv.flightNo)}
                className="font-mono text-[11px] font-semibold text-blue-700 hover:underline"
              >
                {inv.flightNo}
              </button>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-medium text-slate-500">LPN</span>
              {inv.lpn ? (
                <button
                  type="button"
                  onClick={() => onOpenBag?.(inv.lpn!)}
                  className="font-mono text-[11px] font-semibold text-blue-700 hover:underline"
                >
                  {inv.lpn}
                </button>
              ) : (
                <span className="text-slate-400">Unassigned</span>
              )}
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-medium text-slate-500">Passenger</span>
              <span className="text-slate-900">{inv.passenger ?? "—"}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-medium text-slate-500">Station</span>
              <span className="font-semibold text-slate-900">{inv.station}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-medium text-slate-500">Assigned Team</span>
              <span className="text-[11px] text-slate-700">{inv.assignedTeam}</span>
            </div>
            {inv.incidentRef && (
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-medium text-slate-500">Incident Ref</span>
                <button
                  type="button"
                  onClick={() => onOpenIncident?.(inv.incidentRef!)}
                  className="font-mono text-[11px] font-semibold text-blue-700 hover:underline"
                >
                  {inv.incidentRef}
                </button>
              </div>
            )}
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-medium text-slate-500">Reported</span>
              <span className="text-[11px] text-slate-600">{inv.reportedAt}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-medium text-slate-500">Last Updated</span>
              <span className="text-[11px] text-slate-600">{inv.lastUpdated}</span>
            </div>
          </PanelBody>
        </Panel>
      </div>

      {/* Timeline + Operational flags */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel>
          <PanelHead title="Investigation Timeline" subtitle="Operational workflow progression" />
          <PanelBody>
            <ol className="relative border-l border-slate-200 pl-4">
              {timeline.map((step) => (
                <li key={step.t} className="mb-4 ml-1">
                  <span
                    className={`absolute -left-1 flex size-3 items-center justify-center rounded-full ring-4 ring-white ${
                      step.status === "done"
                        ? "bg-emerald-500"
                        : step.status === "active"
                          ? "bg-blue-600"
                          : "bg-slate-300"
                    }`}
                  />
                  <p className="text-xs font-semibold text-slate-900">{step.t}</p>
                  <p className="mt-0.5 text-[11px] text-slate-600">{step.d}</p>
                </li>
              ))}
            </ol>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Operational Flags" />
          <PanelBody className="space-y-2 text-xs">
            {[
              {
                label: "SLA Status",
                value: inv.slaBreach ? "Breach — exceeded dwell threshold" : "Within SLA parameters",
                highlight: inv.slaBreach,
              },
              {
                label: "Case Severity",
                value: inv.severity,
                highlight: inv.severity === "Critical" || inv.severity === "High",
              },
              {
                label: "Escalation Required",
                value: inv.status === "Escalated" ? "Yes — operations lead notified" : "No",
                highlight: inv.status === "Escalated",
              },
              {
                label: "Passenger Impact",
                value: inv.passenger ? `Affecting ${inv.passenger}` : "Passenger unlinked",
                highlight: false,
              },
              {
                label: "Resolution State",
                value: inv.status,
                highlight: false,
              },
            ].map((flag) => (
              <div
                key={flag.label}
                className={`rounded-md border px-3 py-2 ${
                  flag.highlight
                    ? "border-rose-100 bg-rose-50/60"
                    : "border-slate-100 bg-slate-50/60"
                }`}
              >
                <p className="text-[11px] font-semibold text-slate-500">{flag.label}</p>
                <p className={`mt-1 font-medium ${flag.highlight ? "text-rose-800" : "text-slate-900"}`}>
                  {flag.value}
                </p>
              </div>
            ))}
          </PanelBody>
        </Panel>
      </div>

      {/* Escalation workflow */}
      <Panel>
        <PanelHead title="Escalation & Resolution Actions" subtitle="Operational orchestration options" />
        <PanelBody className="grid gap-3 md:grid-cols-3">
          {[
            {
              label: "Escalate to Operations Lead",
              desc: "Route this case to senior ops for immediate intervention.",
              action: "Escalate",
              style: "bg-rose-600 text-white hover:bg-rose-700",
              disabled: inv.status === "Resolved",
            },
            {
              label: "Request Ground Sweep",
              desc: "Dispatch handheld scan sweep at last known location.",
              action: "Dispatch",
              style: "bg-blue-600 text-white hover:bg-blue-700",
              disabled: inv.status === "Resolved",
            },
            {
              label: "Mark as Resolved",
              desc: "Close investigation and trigger passenger notification.",
              action: "Resolve",
              style: "bg-emerald-600 text-white hover:bg-emerald-700",
              disabled: inv.status === "Resolved",
            },
          ].map((action) => (
            <div
              key={action.label}
              className="rounded-md border border-slate-100 bg-slate-50/60 p-3"
            >
              <p className="text-xs font-semibold text-slate-900">{action.label}</p>
              <p className="mt-1 text-[11px] text-slate-600">{action.desc}</p>
              <button
                type="button"
                disabled={action.disabled}
                className={`mt-3 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ${action.style}`}
              >
                {action.action}
              </button>
            </div>
          ))}
        </PanelBody>
      </Panel>
    </div>
  );
}
