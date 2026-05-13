"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DELAY_REASONS,
  HEATMAP_GRID,
  MOCK_FLIGHTS,
  STATION_PERF,
  TREND_HOURLY,
} from "./data";
import { Panel, PanelBody, PanelHead } from "./primitives";

const pieNeutral = ["#0f172a", "#334155", "#475569", "#64748b", "#94a3b8"];

export function AnalyticsScreen() {
  const throughput = STATION_PERF.map((s) => ({
    station: s.code,
    bph: s.bagsPerHour,
    mishandled: s.mishandled24h,
  }));

  const transfer = MOCK_FLIGHTS.map((f) => ({
    flight: f.flightNo,
    transferRisk: f.transferRiskBags,
    recon: f.reconciliationPct,
  }));

  const scanCompliance = STATION_PERF.map((s) => ({
    station: s.code,
    compliance: 98 + (s.code.charCodeAt(0) % 3) * 0.2 - s.mishandled24h * 0.08,
  }));

  const rankings = [...STATION_PERF]
    .sort((a, b) => a.mishandled24h - b.mishandled24h)
    .slice(0, 6);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-slate-500">
          Operational analytics for throughput, station ranking, and risk monitoring.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        {[
          { label: "Network mishandled / 1k", value: "3.9", change: "-0.4 vs PY" },
          { label: "SLA recon median", value: "93.8%", change: "+1.1 pts" },
          { label: "Avg scan success", value: "99.71%", change: "+6 bps" },
          { label: "Transfer success", value: "97.9%", change: "Stable" },
        ].map((k) => (
          <Panel key={k.label}>
            <PanelBody className="py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {k.label}
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
                {k.value}
              </p>
              <p className="mt-0.5 text-[11px] text-emerald-700">{k.change}</p>
            </PanelBody>
          </Panel>
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelHead title="Baggage throughput vs mishandled" />
          <PanelBody className="h-auto min-h-[240px] p-2">
            <div className="w-full h-[240px]">
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={TREND_HOURLY}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="bags" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="mishandled"
                  stroke="#be123c"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
              </ResponsiveContainer>
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Station ranking (mishandled 24h)" />
          <PanelBody className="space-y-2">
            {rankings.map((s, idx) => (
              <div
                key={s.code}
                className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/60 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-800">{s.code}</span>
                </div>
                <span className="text-xs tabular-nums text-slate-600">
                  {s.mishandled24h} • cap {s.capacityPct}%
                </span>
              </div>
            ))}
          </PanelBody>
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel>
          <PanelHead title="Airport performance — bags/hour" />
          <PanelBody className="h-auto min-h-[220px] p-2">
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={throughput}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="station" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="bph" fill="#0f766e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Incident category composition" />
          <PanelBody className="h-auto min-h-[220px] p-2">
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={DELAY_REASONS}
                    dataKey="count"
                    nameKey="reason"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {DELAY_REASONS.map((_, i) => (
                      <Cell key={`dr-${i}`} fill={pieNeutral[i % pieNeutral.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-2 text-[11px] text-slate-600">
              {DELAY_REASONS.map((entry, idx) => (
                <div key={entry.reason} className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: pieNeutral[idx % pieNeutral.length] }}
                  />
                  <span>{entry.reason}</span>
                  <span className="ml-auto text-slate-500">{entry.count}</span>
                </div>
              ))}
            </div>
          </PanelBody>
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel>
          <PanelHead title="Operational risk by flight" />
          <PanelBody className="space-y-3">
            {transfer.map((item) => (
              <div key={item.flight} className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold text-slate-900">{item.flight}</span>
                  <span>{item.transferRisk} risk bags</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-rose-500"
                    style={{ width: `${Math.min(100, item.transferRisk * 2.4)}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-500">
                  {item.recon.toFixed(1)}% reconciliation
                </div>
              </div>
            ))}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Scan compliance index" />
          <PanelBody className="h-auto min-h-[240px] p-2">
            <div className="w-full h-[240px]">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={scanCompliance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="station" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis domain={[96, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line
                    type="monotone"
                    dataKey="compliance"
                    stroke="#0369a1"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </PanelBody>
        </Panel>
      </div>

      <Panel>
        <PanelHead title="Operational heat — station × peak blocks" />
        <PanelBody>
          <div className="grid grid-cols-[96px_1fr] gap-2 text-[11px]">
            <div />
            <div className="grid grid-cols-4 gap-1 text-center text-slate-500">
              {["06", "10", "14", "18"].map((h) => (
                <span key={h}>{h}:00</span>
              ))}
            </div>
            {Array.from(new Set(HEATMAP_GRID.map((h) => h.station))).map((st) => (
              <div key={st} className="contents">
                <div className="flex items-center font-semibold text-slate-700">{st}</div>
                <div className="grid grid-cols-4 gap-1">
                  {HEATMAP_GRID.filter((h) => h.station === st).map((cell) => (
                    <div
                      key={`${cell.station}-${cell.hour}`}
                      className="h-6 rounded-sm ring-1 ring-slate-200/80"
                      style={{
                        backgroundColor: `rgba(15,118,110,${0.06 + cell.v * 0.14})`,
                      }}
                      title={`Intensity ${cell.v}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PanelBody>
      </Panel>
    </div>
  );
}
