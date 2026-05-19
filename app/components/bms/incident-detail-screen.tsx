"use client";

import { useState } from "react";
import { Cpu, Radio } from "lucide-react";
import { incidentById, MOCK_INVESTIGATIONS } from "./data";
import { useLiveRefresh } from "./use-live-tick";
import { EmptyState, Mono, Panel, PanelBody, PanelHead, StatusPill } from "./primitives";

interface Props {
  incidentId: string;
  onBack: () => void;
  onOpenBag: (lpn: string) => void;
  onOpenFlight: (flightNo: string) => void;
  syncTick?: number;
}

export function IncidentDetailScreen({
  incidentId,
  onBack,
  onOpenBag,
  onOpenFlight,
  syncTick,
}: Props) {
  const inc           = incidentById(incidentId);
  const investigation = MOCK_INVESTIGATIONS.find((i) => i.incidentRef === incidentId);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useLiveRefresh(() => setLastRefresh(new Date()), syncTick);

  if (!inc) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-blue-700 hover:underline"
        >
          ← Back
        </button>
        <EmptyState title="Incident not found" />
      </div>
    );
  }

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
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">
              <Mono>{inc.id}</Mono>
            </span>
            <StatusPill>{inc.severity}</StatusPill>
            <StatusPill>{inc.status}</StatusPill>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
            <Radio className="size-3 animate-pulse" aria-hidden />
            Live Monitoring
          </span>
          <span className="text-[11px] text-slate-400">Updated {lastRefresh.toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHead title="Case Narrative" />
          <PanelBody className="space-y-3 text-xs text-slate-700">
            <p>{inc.summary}</p>
            <div className="rounded-md border border-slate-100 bg-slate-50/70 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Supervisor routing hint
              </p>
              <p className="mt-1">{inc.rootCauseHint}</p>
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Operational Reference" />
          <PanelBody className="space-y-3 text-xs">
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-medium text-slate-500">Flight</span>
              <button
                type="button"
                onClick={() => onOpenFlight(inc.flightNo)}
                className="font-mono text-[11px] font-semibold text-blue-700 hover:underline"
              >
                {inc.flightNo}
              </button>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-medium text-slate-500">Bag</span>
              {inc.lpn ? (
                <button
                  type="button"
                  onClick={() => onOpenBag(inc.lpn!)}
                  className="font-mono text-[11px] font-semibold text-blue-700 hover:underline"
                >
                  {inc.lpn}
                </button>
              ) : (
                <span className="text-slate-400">Unassigned</span>
              )}
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-medium text-slate-500">Tracer ref.</span>
              <Mono>{inc.tracerRef}</Mono>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-medium text-slate-500">Station</span>
              <span className="font-semibold text-slate-900">{inc.station}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-medium text-slate-500">Reported</span>
              <span className="text-[11px] text-slate-700">{inc.reportedAt}</span>
            </div>
          </PanelBody>
        </Panel>
      </div>

      {investigation && (
        <Panel>
          <PanelHead
            title="Linked Investigation"
            subtitle="This incident has an active investigation record in the resolution queue"
          />
          <PanelBody className="grid gap-3 sm:grid-cols-2 text-xs">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-medium text-slate-500">Case ID</span>
                <span className="font-mono text-[11px] font-semibold text-slate-900">{investigation.id}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-medium text-slate-500">Case type</span>
                <span className="text-[11px] text-slate-700">{investigation.caseType}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-medium text-slate-500">Status</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                  investigation.status === "Resolved" ? "bg-emerald-50 text-emerald-800 ring-emerald-100" :
                  investigation.status === "Escalated" || investigation.status === "SLA Breach" ? "bg-rose-50 text-rose-800 ring-rose-100" :
                  "bg-blue-50 text-blue-800 ring-blue-100"
                }`}>{investigation.status}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-medium text-slate-500">Assigned team</span>
                <span className="text-[11px] text-slate-700">{investigation.assignedTeam}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-medium text-slate-500">SLA</span>
                <span className={`text-[11px] font-semibold ${investigation.slaBreach ? "text-rose-700" : "text-emerald-700"}`}>
                  {investigation.slaBreach ? "Breach" : "Within threshold"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-medium text-slate-500">Last known</span>
                <span className="text-[11px] text-slate-700">{investigation.lastKnownLocation}</span>
              </div>
            </div>
            <div className="rounded-md border border-blue-100 bg-blue-50/40 px-3 py-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                <Cpu className="size-3.5" aria-hidden />
                AI Recommendation
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-700">{investigation.aiRecommendation}</p>
              <p className="mt-2 text-[11px]  text-slate-400">AI-assisted operational insights.</p>
            </div>
          </PanelBody>
        </Panel>
      )}

      <Panel>
        <PanelHead title="Operational SLA Status" />
        <PanelBody className="grid gap-2 md:grid-cols-4 text-xs">
          {[
            ["Acknowledgement", inc.status !== "Open" ? "Complete" : "Due"],
            ["Tracer correlation", "Queued"],
            ["Baggage search protocol", inc.category === "Lost Bag" ? "Active" : "N/A"],
            ["Customer comms template", "Prepared"],
          ].map(([k, v]) => (
            <div
              key={k}
              className="rounded-md border border-slate-100 bg-white px-3 py-2 shadow-sm"
            >
              <p className="text-[11px] font-semibold text-slate-500">{k}</p>
              <p className="mt-1 font-medium text-slate-900">{v}</p>
            </div>
          ))}
        </PanelBody>
      </Panel>
    </div>
  );
}
