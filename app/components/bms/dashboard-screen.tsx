"use client";

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
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
  ALL_INCIDENTS,
  DELAY_REASONS,
  HEATMAP_GRID,
  MOCK_FLIGHTS,
  MOCK_SCANS,
  STATION_PERF,
  TREND_HOURLY,
} from "./data";
import { EmptyState, Mono, Panel, PanelBody, PanelHead, StatusPill } from "./primitives";
import type { FlightRecord } from "./types";

const pieColors = ["#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1"];

interface Props {
  onOpenFlight: (flightNo: string) => void;
  onOpenBag: (lpn: string) => void;
  onOpenIncident: (id: string) => void;
}

export function DashboardScreen({
  onOpenFlight,
  onOpenBag,
  onOpenIncident,
}: Props) {
  const slaPct =
    MOCK_FLIGHTS.reduce((a, f) => a + f.reconciliationPct, 0) /
    Math.max(1, MOCK_FLIGHTS.filter((f) => f.bagsPlanned > 0).length);

  const openIncidents = ALL_INCIDENTS.filter(
    (i) => i.status === "Open" || i.status === "Investigating",
  ).length;

  const delayedFlights = MOCK_FLIGHTS.filter((f) => f.status === "Delayed").length;

  const kpi = [
    { label: "Active flights", value: String(MOCK_FLIGHTS.length), hint: "Network-wide" },
    {
      label: "Avg reconciliation",
      value: `${slaPct.toFixed(1)}%`,
      hint: "Rolling window",
    },
    {
      label: "Transfer-risk bags",
      value: String(
        MOCK_FLIGHTS.reduce((a, f) => a + f.transferRiskBags, 0),
      ),
      hint: "MTCT breaches predicted",
    },
    {
      label: "Open incidents",
      value: String(openIncidents),
      hint: "Needs supervisor queue",
    },
    {
      label: "Delayed flights",
      value: String(delayedFlights),
      hint: "AOCC tracked",
    },
    {
      label: "Scan success",
      value: "99.74%",
      hint: "Last 24h aggregate",
    },
  ];

  const activity = [...MOCK_SCANS]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);

  const priorityIncidents = ALL_INCIDENTS.filter(
    (i) => i.severity === "High" || i.severity === "Critical",
  ).slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {kpi.map((k) => (
          <Panel key={k.label}>
            <PanelBody className="py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                {k.label}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
                {k.value}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">{k.hint}</p>
            </PanelBody>
          </Panel>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHead
            title="Baggage throughput vs mishandled"
            subtitle="Hourly processed bags compared with mishandled events"
          />
          <PanelBody className="h-auto min-h-[200px] p-2 pt-0">
            <div className="w-full h-[200px]">
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={TREND_HOURLY}>
                <defs>
                  <linearGradient id="bdash-bags" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    borderColor: "#e2e8f0",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="bags"
                  stroke="#2563eb"
                  fill="url(#bdash-bags)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="mishandled"
                  stroke="#e11d48"
                  strokeWidth={2}
                  dot={false}
                />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Station load heat" subtitle="Relative intensity by hour block" />
          <PanelBody>
            <div className="grid grid-cols-5 gap-1 text-[10px] text-slate-500">
              <span />
              {["06", "10", "14", "18"].map((h) => (
                <span key={h} className="text-center">
                  {h}h
                </span>
              ))}
            </div>
            <div className="mt-2 space-y-1">
              {Array.from(new Set(HEATMAP_GRID.map((h) => h.station))).map(
                (st) => (
                  <div key={st} className="grid grid-cols-5 items-center gap-1">
                    <span className="text-[11px] font-medium text-slate-600">
                      {st}
                    </span>
                    {HEATMAP_GRID.filter((h) => h.station === st).map((cell) => (
                      <div
                        key={`${cell.station}-${cell.hour}`}
                        title={`${cell.station} ${cell.hour}`}
                        className="h-5 rounded-sm ring-1 ring-slate-200/80"
                        style={{
                          backgroundColor: `rgba(37,99,235,${0.08 + cell.v * 0.14})`,
                        }}
                      />
                    ))}
                  </div>
                ),
              )}
            </div>
          </PanelBody>
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel>
          <PanelHead title="SLA — reconciliation mix" />
          <PanelBody className="h-auto min-h-[200px] p-2">
            <div className="w-full h-[170px]">
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={MOCK_FLIGHTS.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="flightNo"
                    tick={{ fontSize: 10 }}
                    stroke="#94a3b8"
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v) => [`${Number(v ?? 0).toFixed(1)}%`, "Recon"]}
                  />
                  <Bar dataKey="reconciliationPct" fill="#0f766e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-1 text-xs text-slate-500 px-2">
  <p>Target SLA: 95%</p>
  <p>Lowest: BA114 (53%)</p>
  <p>Highest: EK226 (99%)</p>
</div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Delay reasons (24h)" />
          <PanelBody className="h-auto min-h-[200px] p-2">
            <div className="w-full h-[180px]">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={DELAY_REASONS}
                    dataKey="count"
                    nameKey="reason"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {DELAY_REASONS.map((_, i) => (
                      <Cell
                        key={`delay-${i}`}
                        fill={pieColors[i % pieColors.length]}
                      />
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
                    style={{ backgroundColor: pieColors[idx % pieColors.length] }}
                  />
                  <span>{entry.reason}</span>
                  <span className="ml-auto text-slate-500">{entry.count}</span>
                </div>
              ))}
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Station performance" />
          <PanelBody className="h-auto min-h-[200px] p-2">
            <div className="w-full h-[170px]">
              <ResponsiveContainer width="100%" height={170}>
                <LineChart data={STATION_PERF}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="code" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line
                    type="monotone"
                    dataKey="mishandled24h"
                    stroke="#b45309"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-1 text-xs text-slate-500 px-2">
  <p>Peak station: SIN</p>
  <p>Lowest throughput: DXB</p>
  <p>Active stations: 6</p>
</div>
          </PanelBody>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelHead
            title="Active flights snapshot"
            subtitle="Click a row for operational drill-down"
          />
          <div className="w-full overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                <tr>
                  <th className="px-3 py-2">Flight</th>
                  <th className="px-3 py-2">Route</th>
                  <th className="px-3 py-2">STD / STA</th>
                  <th className="px-3 py-2">PAX / Bags</th>
                  <th className="px-3 py-2">Recon</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_FLIGHTS.slice(0, 6).map((f: FlightRecord) => (
                  <tr
                    key={f.flightNo}
                    onClick={() => onOpenFlight(f.flightNo)}
                    className="cursor-pointer hover:bg-slate-50/80"
                  >
                    <td className="px-3 py-2">
                      <Mono>{f.flightNo}</Mono>
                      <div className="text-[11px] text-slate-500">{f.airline}</div>
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {f.origin} → {f.dest}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-600">
                      {f.stdLocal.split(" ").slice(1).join(" ")} /{" "}
                      {f.staLocal.split(" ").slice(1).join(" ")}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-slate-700">
                      {f.pax} / {f.bagsLoaded}/{f.bagsPlanned}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-slate-800">
                      {f.reconciliationPct.toFixed(1)}%
                    </td>
                    <td className="px-3 py-2">
                      <StatusPill>{f.status}</StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel>
          <PanelHead title="Predicted bottlenecks" subtitle="Operational bottleneck alerts" />
          <PanelBody className="space-y-3">
            {[
              {
                t: "DXB T3 sorter",
                d: "Projected dwell +6m vs SLA during bank peak.",
                sev: "Medium",
              },
              {
                t: "ORD transfer tunnel",
                d: "Tunnel occupancy trending above 82% for UA884 bank.",
                sev: "High",
              },
              {
                t: "LHR reclaim Belt 7",
                d: "Carousel pacing variance vs inbound wave.",
                sev: "Low",
              },
            ].map((x) => (
              <div
                key={x.t}
                className="rounded-md border border-slate-100 bg-slate-50/70 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">{x.t}</p>
                  <StatusPill>{x.sev}</StatusPill>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-slate-600">
                  {x.d}
                </p>
              </div>
            ))}
          </PanelBody>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel>
          <PanelHead
            title="Live scan activity"
            subtitle="Latest operational telemetry"
          />
          {activity.length === 0 ? (
            <PanelBody>
              <EmptyState title="No scan activity" />
            </PanelBody>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">LPN</th>
                    <th className="px-3 py-2">Point</th>
                    <th className="px-3 py-2">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activity.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80">
                      <td className="px-3 py-2 text-[11px] text-slate-600">
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
                      <td className="px-3 py-2 text-slate-700">{s.scanPoint}</td>
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
          <PanelHead title="Priority incidents" />
          <div className="divide-y divide-slate-100">
            {priorityIncidents.map((inc) => (
              <button
                key={inc.id}
                type="button"
                onClick={() => onOpenIncident(inc.id)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Mono>{inc.id}</Mono>
                    <StatusPill>{inc.severity}</StatusPill>
                    <StatusPill>{inc.status}</StatusPill>
                  </div>
                  <p className="mt-1 text-xs text-slate-700">{inc.summary}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {inc.station} • {inc.reportedAt}
                  </p>
                </div>
                {inc.lpn ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenBag(inc.lpn!);
                    }}
                    className="shrink-0 font-mono text-[11px] font-semibold text-blue-700 hover:underline"
                  >
                    {inc.lpn}
                  </button>
                ) : null}
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHead
          title="Transfer reconciliation pulse"
          subtitle="Loaded vs planned + transfer-risk indicator"
        />
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
              <tr>
                <th className="px-3 py-2">Flight</th>
                <th className="px-3 py-2">Loaded</th>
                <th className="px-3 py-2">Short-shipped</th>
                <th className="px-3 py-2">Transfer-risk bags</th>
                <th className="px-3 py-2">Delayed bags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_FLIGHTS.map((f) => (
                <tr key={f.flightNo} className="hover:bg-slate-50/60">
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onOpenFlight(f.flightNo)}
                      className="font-mono text-[11px] font-semibold text-blue-700 hover:underline"
                    >
                      {f.flightNo}
                    </button>
                  </td>
                  <td className="px-3 py-2 tabular-nums text-slate-700">
                    {f.bagsLoaded}/{f.bagsPlanned}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-slate-700">
                    {f.shortShipped}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-rose-700">
                    {f.transferRiskBags}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-amber-800">
                    {f.delayedBags}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
