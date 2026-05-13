"use client";

import { incidentById } from "./data";
import { EmptyState, Mono, Panel, PanelBody, PanelHead, StatusPill } from "./primitives";

interface Props {
  incidentId: string;
  onBack: () => void;
  onOpenBag: (lpn: string) => void;
  onOpenFlight: (flightNo: string) => void;
}

export function IncidentDetailScreen({
  incidentId,
  onBack,
  onOpenBag,
  onOpenFlight,
}: Props) {
  const inc = incidentById(incidentId);

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

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHead title="Case narrative" />
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
          <PanelHead title="Linkage" />
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

      <Panel>
        <PanelHead title="Operational SLA checkpoints" />
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
