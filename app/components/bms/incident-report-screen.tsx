"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { MOCK_FLIGHTS } from "./data";
import { Panel, PanelBody, PanelHead, StatusPill } from "./primitives";

interface Props {
  onCancel: () => void;
  onSubmitted: () => void;
}

export function IncidentReportScreen({ onCancel, onSubmitted }: Props) {
  const [lpn, setLpn] = useState("");
  const [flight, setFlight] = useState(MOCK_FLIGHTS[0]?.flightNo ?? "");
  const [type, setType] = useState("Delayed Bag");
  const [station, setStation] = useState("DXB");
  const [severity, setSeverity] = useState("Medium");
  const [rootCause, setRootCause] = useState("");
  const [notes, setNotes] = useState("");
  const [tracer, setTracer] = useState("");
  const [reportedBy, setReportedBy] = useState("");
  const [status, setStatus] = useState("Open");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function submit() {
    const next: Record<string, string> = {};
    if (!flight.trim()) next.flight = "Select an operating flight.";
    if (!station.trim()) next.station = "Station is required.";
    if (!reportedBy.trim()) next.reportedBy = "Reporter identity is required.";
    if (!notes.trim()) next.notes = "Operational notes are required.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSubmitted(true);
    window.setTimeout(() => onSubmitted(), 2000);
  }

  if (submitted) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center space-y-4 py-12">
        <CheckCircle2 className="size-12 text-emerald-500" />
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-900">Incident created successfully</p>
          <p className="mt-1 text-xs text-slate-500">Assigned to operations queue</p>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-md border border-slate-100 bg-slate-50/80 px-6 py-3 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            Incident created and routed to operations queue
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-blue-500" />
            Assigned for supervisor review
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
            Linked investigation workflow generating…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">
            Create and route baggage operation incidents for review and escalation.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>

      <Panel>
        <PanelHead title="Incident characteristics" subtitle="Complete all required fields for proper routing and escalation" />
        <PanelBody className="grid gap-4 md:grid-cols-2">
          <Field label="Bag ID (LPN)" error={errors.lpn}>
            <input
              value={lpn}
              onChange={(e) => setLpn(e.target.value)}
              placeholder="Optional — include if known"
              className="h-9 w-full rounded-md border border-slate-200 px-2 font-mono text-xs outline-none ring-blue-500/30 focus:ring-2"
            />
          </Field>
          <Field label="Operating flight" error={errors.flight}>
            <select
              value={flight}
              onChange={(e) => setFlight(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            >
              {MOCK_FLIGHTS.map((f) => (
                <option key={f.flightNo} value={f.flightNo}>
                  {f.flightNo} • {f.origin}→{f.dest}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Incident type">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            >
              {["Delayed Bag", "Damaged Bag", "Lost Bag", "Missing Scan", "Security Hold", "Short-shipped", "Tag Error", "Transfer Risk"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Station" error={errors.station}>
            <input
              value={station}
              onChange={(e) => setStation(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 px-2 text-xs uppercase outline-none ring-blue-500/30 focus:ring-2"
            />
          </Field>
          <Field label="Severity">
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            >
              {["Low", "Medium", "High", "Critical"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Initial status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            >
              {["Open", "Investigating"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Root cause hint">
            <input
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="e.g., Transfer tunnel congestion"
              className="h-9 w-full rounded-md border border-slate-200 px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            />
          </Field>
          <Field label="Tracer reference">
            <input
              value={tracer}
              onChange={(e) => setTracer(e.target.value)}
              placeholder="Optional — WT reference format"
              className="h-9 w-full rounded-md border border-slate-200 px-2 font-mono text-xs outline-none ring-blue-500/30 focus:ring-2"
            />
          </Field>
          <Field label="Reported by" error={errors.reportedBy}>
            <input
              value={reportedBy}
              onChange={(e) => setReportedBy(e.target.value)}
              placeholder="Station ID / role / badge number"
              className="h-9 w-full rounded-md border border-slate-200 px-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Operational notes" error={errors.notes}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Timeline, witnesses, equipment IDs, scan references…"
                className="w-full rounded-md border border-slate-200 px-2 py-2 text-xs outline-none ring-blue-500/30 focus:ring-2"
              />
            </Field>
          </div>
        </PanelBody>
      </Panel>

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={submit}
          className="rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
        >
          Submit report
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-semibold text-slate-600">{label}</span>
      {children}
      {error ? (
        <span className="block text-[11px] font-medium text-rose-600">{error}</span>
      ) : null}
    </label>
  );
}
