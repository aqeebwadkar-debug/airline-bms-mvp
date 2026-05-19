"use client";

import { useMemo, useState } from "react";
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
import { Radio } from "lucide-react";
import {
  ALL_INCIDENTS,
  DELAY_REASONS,
  HEATMAP_GRID,
  MOCK_FLIGHTS,
  MOCK_SCANS,
  STATION_PERF,
  TREND_HOURLY,
} from "./data";
import { nudge, useLiveRefresh } from "./use-live-tick";
import { EmptyState, Mono, Panel, PanelBody, PanelHead, StatusPill } from "./primitives";
import type { FlightRecord } from "./types";

const SLA_COLORS = {
  good:     "#1e3a5f",
  caution:  "#92400e",
  critical: "#7f1d1d",
} as const;

const pieColors = ["#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1"];

const ALL_BOTTLENECKS = [
  { t: "DXB T3 sorter",       d: "Projected dwell +6m vs SLA during bank peak.",              sev: "Medium" },
  { t: "ORD transfer tunnel",  d: "Tunnel occupancy trending above 82% for UA884 bank.",       sev: "High"   },
  { t: "LHR reclaim Belt 7",   d: "Carousel pacing variance vs inbound wave.",                 sev: "Low"    },
  { t: "CDG Pier C loading",   d: "Manual override unresolved — AF229 departure risk.",        sev: "High"   },
  { t: "SIN transfer pier",    d: "Pacing variance +6m — QR617 connection window tightening.", sev: "Medium" },
  { t: "DOH terminal B belt",  d: "Baggage belt throughput below 65% target capacity.",        sev: "Medium" },
];

interface Props {
  onOpenFlight: (flightNo: string) => void;
  onOpenBag: (lpn: string) => void;
  onOpenIncident: (id: string) => void;
  syncTick?: number;
}

export function DashboardScreen({ onOpenFlight, onOpenBag, onOpenIncident, syncTick }: Props) {
  const baseSlaPct =
    MOCK_FLIGHTS.reduce((a, f) => a + f.reconciliationPct, 0) /
    Math.max(1, MOCK_FLIGHTS.filter((f) => f.bagsPlanned > 0).length);

  const baseOpenIncidents = ALL_INCIDENTS.filter(
    (i) => i.status === "Open" || i.status === "Investigating",
  ).length;

  const baseTransferRisk  = MOCK_FLIGHTS.reduce((a, f) => a + f.transferRiskBags, 0);
  const baseDelayedFlights = MOCK_FLIGHTS.filter((f) => f.status === "Delayed").length;

  const highPriorityIncidents = useMemo(
    () => ALL_INCIDENTS.filter((i) => i.severity === "High" || i.severity === "Critical"),
    [],
  );

  // ── Live telemetry state ──────────────────────────────────────────────────
  const [scanSuccess,   setScanSuccess]   = useState(99.74);
  const [openIncidents, setOpenIncidents] = useState(baseOpenIncidents);
  const [transferRisk,  setTransferRisk]  = useState(baseTransferRisk);
  const [slaPct,        setSlaPct]        = useState(baseSlaPct);
  const [trendData,     setTrendData]     = useState(TREND_HOURLY);
  const [lastRefresh,   setLastRefresh]   = useState(new Date());
  const [flashedRows,   setFlashedRows]   = useState<Set<string>>(new Set());

  const [liveFlights,      setLiveFlights]      = useState(() => MOCK_FLIGHTS.map((f) => ({ ...f })));
  const [liveActivity,     setLiveActivity]     = useState(() =>
    [...MOCK_SCANS].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8),
  );
  const [liveHeatmap,      setLiveHeatmap]      = useState(() => HEATMAP_GRID.map((c) => ({ ...c })));
  const [liveDelayReasons, setLiveDelayReasons] = useState(() => DELAY_REASONS.map((d) => ({ ...d })));
  const [liveStationPerf,  setLiveStationPerf]  = useState(() => STATION_PERF.map((s) => ({ ...s })));
  const [bottleneckOffset, setBottleneckOffset] = useState(0);
  const [incidentOffset,   setIncidentOffset]   = useState(0);

  function doRefresh() {
    setScanSuccess((v)   => Math.min(99.99, Math.max(99.30, nudge(v, 0.12))));
    setOpenIncidents((v) => Math.max(baseOpenIncidents, Math.min(baseOpenIncidents + 4, v + (Math.random() > 0.6 ? 1 : 0))));
    setTransferRisk((v)  => Math.max(baseTransferRisk - 5, Math.min(baseTransferRisk + 8, v + Math.round((Math.random() - 0.45) * 3))));
    setSlaPct((v)        => Math.min(99, Math.max(82, nudge(v, 0.4))));

    setTrendData((prev) =>
      prev.map((p) => ({
        ...p,
        bags:       Math.round(nudge(p.bags, 200)),
        mishandled: Math.round(nudge(p.mishandled, 3)),
      })),
    );

    setLiveFlights((prev) =>
      prev.map((f) => ({
        ...f,
        reconciliationPct: Math.min(100, Math.max(0, nudge(f.reconciliationPct, 0.6))),
        transferRiskBags:  Math.max(0, f.transferRiskBags + (Math.random() > 0.6 ? Math.round((Math.random() - 0.5) * 2) : 0)),
        delayedBags:       Math.max(0, f.delayedBags + (Math.random() > 0.75 ? (Math.random() > 0.5 ? 1 : -1) : 0)),
      })),
    );

    setLiveActivity([...MOCK_SCANS].sort(() => Math.random() - 0.5).slice(0, 8));

    setLiveHeatmap((prev) =>
      prev.map((c) => ({
        ...c,
        v: Math.min(5, Math.max(0, Math.round(nudge(c.v, 0.8)))),
      })),
    );

    setLiveDelayReasons((prev) =>
      prev.map((d) => ({
        ...d,
        count: Math.max(1, Math.round(nudge(d.count, 5))),
      })),
    );

    setLiveStationPerf((prev) =>
      prev.map((s) => ({
        ...s,
        mishandled24h: Math.max(0, Math.round(nudge(s.mishandled24h, 2))),
      })),
    );

    setBottleneckOffset((prev) =>
      Math.random() > 0.65 ? (prev + 1) % Math.max(1, ALL_BOTTLENECKS.length - 3) : prev,
    );

    setIncidentOffset((prev) =>
      Math.random() > 0.7 ? (prev + 1) % Math.max(1, highPriorityIncidents.length - 4) : prev,
    );

    setLastRefresh(new Date());

    const keys = liveFlights.slice(0, 6).map((f) => f.flightNo);
    const pick = keys[Math.floor(Math.random() * keys.length)];
    setFlashedRows(new Set([pick]));
    setTimeout(() => setFlashedRows(new Set()), 1400);
  }

  useLiveRefresh(doRefresh, syncTick);

  // ── Derived display values ────────────────────────────────────────────────
  const kpi = [
    { label: "Active flights",     value: String(MOCK_FLIGHTS.length),   hint: "Network-wide"            },
    { label: "Avg reconciliation", value: `${slaPct.toFixed(1)}%`,       hint: "Live network average"    },
    { label: "Transfer-risk bags", value: String(transferRisk),          hint: "Predicted transfer risks" },
    { label: "Open incidents",     value: String(openIncidents),         hint: "Active review queue"      },
    { label: "Delayed flights",    value: String(baseDelayedFlights),    hint: "Actively monitored"       },
    { label: "Scan success",       value: `${scanSuccess.toFixed(2)}%`,  hint: "Last 24h aggregate"      },
  ];

  const liveBottlenecks = useMemo(() => {
    const len = ALL_BOTTLENECKS.length;
    return Array.from({ length: 4 }, (_, i) => ALL_BOTTLENECKS[(bottleneckOffset + i) % len]);
  }, [bottleneckOffset]);

  const livePriorityIncidents = useMemo(
    () => highPriorityIncidents.slice(incidentOffset, incidentOffset + 5),
    [highPriorityIncidents, incidentOffset],
  );

  const slaChartData = liveFlights.slice(0, 8);

  // Shared axis label config — textAnchor: "middle" centers rotated Y-axis labels
  const yLabel = (value: string, side: "left" | "right" = "left") => ({
    value,
    angle:     side === "left" ? -90 : 90,
    position:  side === "left" ? ("insideLeft" as const) : ("insideRight" as const),
    offset:    0,
    fontSize:  10,
    fill:      "#94a3b8",
    textAnchor: "middle" as const,
  });

  const xLabel = (value: string) => ({
    value,
    position: "insideBottom" as const,
    offset:   -14,
    fontSize: 10,
    fill:     "#94a3b8",
  });

  return (
    <div className="space-y-4">
      {/* Controls row */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
            <Radio className="size-3 animate-pulse" aria-hidden />
            Live Monitoring
          </span>
          <span className="text-[11px] text-slate-400">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* KPI section */}
      <div>
        <div className="mb-2">
          <p className="text-sm font-semibold text-slate-900">Performance Overview</p>
          <p className="text-[11px] text-slate-500">Live KPIs across baggage handling and flight activity.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {kpi.map((k) => (
            <Panel key={k.label}>
              <PanelBody className="py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{k.label}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{k.value}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{k.hint}</p>
              </PanelBody>
            </Panel>
          ))}
        </div>
      </div>

      {/* Row 1: throughput chart + heatmap */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHead
            title="Baggage Throughput vs Mishandled"
            subtitle="Hourly processed bags compared with mishandled events (network-wide)"
          />
          <PanelBody className="h-auto min-h-[200px] p-2 pt-0">
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={trendData} margin={{ left: 16, right: 24, top: 4, bottom: 24 }}>
                  <defs>
                    <linearGradient id="bdash-bags" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10 }}
                    stroke="#94a3b8"
                    label={xLabel("Hour (UTC)")}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 10 }}
                    stroke="#94a3b8"
                    label={yLabel("Bags processed", "left")}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10 }}
                    stroke="#94a3b8"
                    label={yLabel("Mishandled", "right")}
                  />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e2e8f0" }} />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 11, paddingBottom: 6 }} />
                  <Area  yAxisId="left"  type="monotone" dataKey="bags"       name="Bags processed" stroke="#2563eb" fill="url(#bdash-bags)" strokeWidth={2} />
                  <Line  yAxisId="right" type="monotone" dataKey="mishandled" name="Mishandled"      stroke="#e11d48" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </PanelBody>
        </Panel>

        {/* Airport Load Heatmap — clean matrix, no axes, live intensity */}
        <Panel>
          <PanelHead title="Airport Activity by Time Block" subtitle="Baggage handling intensity across stations" />
          <PanelBody>
            <div className="grid grid-cols-5 gap-1 text-[10px] text-slate-500">
              <span />
              {["06", "10", "14", "18"].map((h) => (
                <span key={h} className="text-center">{h}h</span>
              ))}
            </div>
            <div className="mt-2 space-y-1">
              {Array.from(new Set(liveHeatmap.map((h) => h.station))).map((st) => (
                <div key={st} className="grid grid-cols-5 items-center gap-1">
                  <span className="text-[11px] font-medium text-slate-600">{st}</span>
                  {liveHeatmap.filter((h) => h.station === st).map((cell) => (
                    <div
                      key={`${cell.station}-${cell.hour}`}
                      title={`${cell.station} ${cell.hour} — intensity ${cell.v}`}
                      className="h-5 rounded-sm ring-1 ring-slate-200/80 transition-colors duration-700"
                      style={{ backgroundColor: `rgba(37,99,235,${0.08 + cell.v * 0.14})` }}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
              <div className="h-2 w-4 rounded-sm" style={{ background: "rgba(37,99,235,0.08)" }} />
              Low
              <div className="h-2 w-4 rounded-sm" style={{ background: "rgba(37,99,235,0.5)" }} />
              High
            </div>
          </PanelBody>
        </Panel>
      </div>

      {/* Row 2: SLA chart + delay reasons + station perf */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Panel>
          <PanelHead title="Reconciliation SLA Status" subtitle="Per-flight reconciliation % vs 95% target" />
          <PanelBody className="h-auto min-h-[200px] p-2">
            <div className="w-full h-[170px]">
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={slaChartData} margin={{ left: 16, right: 14, top: 4, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="flightNo"
                    tick={{ fontSize: 9 }}
                    stroke="#94a3b8"
                    label={xLabel("Flight")}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10 }}
                    stroke="#94a3b8"
                    label={yLabel("Recon %")}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v) => [`${Number(v ?? 0).toFixed(1)}%`, "Reconciliation"]}
                  />
                  <Bar dataKey="reconciliationPct" name="Reconciliation %" radius={[3, 3, 0, 0]}>
                    {slaChartData.map((f) => (
                      <Cell
                        key={f.flightNo}
                        fill={
                          f.reconciliationPct < 90
                            ? SLA_COLORS.critical
                            : f.reconciliationPct < 95
                              ? SLA_COLORS.caution
                              : SLA_COLORS.good
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex gap-3 text-[11px] text-slate-500 px-2">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: SLA_COLORS.good }} />
                ≥95%
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: SLA_COLORS.caution }} />
                90–95%
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: SLA_COLORS.critical }} />
                &lt;90%
              </span>
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Top Delay Causes (24h)" subtitle="Primary causes of baggage delays across the network" />
          <PanelBody className="h-auto min-h-[200px] p-2">
            <div className="w-full h-[160px]">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={liveDelayReasons}
                    dataKey="count"
                    nameKey="reason"
                    innerRadius={44}
                    outerRadius={68}
                    paddingAngle={2}
                  >
                    {liveDelayReasons.map((_, i) => (
                      <Cell key={`delay-${i}`} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1.5 text-[11px] text-slate-600">
              {liveDelayReasons.map((entry, idx) => (
                <div key={entry.reason} className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: pieColors[idx % pieColors.length] }} />
                  <span className="truncate">{entry.reason}</span>
                  <span className="ml-auto text-slate-500">{entry.count}</span>
                </div>
              ))}
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Mishandled Bags by Station" subtitle="Mishandled bags per station over last 24h" />
          <PanelBody className="h-auto min-h-[200px] p-2">
            <div className="w-full h-[170px]">
              <ResponsiveContainer width="100%" height={170}>
                <LineChart data={liveStationPerf} margin={{ left: 16, right: 14, top: 4, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="code"
                    tick={{ fontSize: 10 }}
                    stroke="#94a3b8"
                    label={xLabel("Station")}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    stroke="#94a3b8"
                    label={yLabel("Mishandled")}
                  />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="mishandled24h" name="Mishandled 24h" stroke="#b45309" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1 text-[11px] text-slate-500 px-2">
              <p>Peak: {liveStationPerf.reduce((a, b) => a.mishandled24h > b.mishandled24h ? a : b).code}</p>
              <p>Active stations: {liveStationPerf.length}</p>
            </div>
          </PanelBody>
        </Panel>
      </div>

      {/* Row 3: active flights + bottlenecks */}
      <div className="grid gap-3 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelHead
            title="Active Flights"
            subtitle="Select a flight to view baggage details"
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
                {liveFlights.slice(0, 8).map((f: FlightRecord) => (
                  <tr
                    key={f.flightNo}
                    onClick={() => onOpenFlight(f.flightNo)}
                    title={`Open flight ${f.flightNo}`}
                    className={`cursor-pointer transition-colors duration-700 hover:bg-slate-50/80 ${
                      flashedRows.has(f.flightNo) ? "bg-blue-50" : ""
                    } ${f.reconciliationPct > 0 && f.reconciliationPct < 90 ? "bg-rose-50/20" : ""}`}
                  >
                    <td className="px-3 py-2">
                      <Mono>{f.flightNo}</Mono>
                      <div className="text-[11px] text-slate-500">{f.airline.split("—")[0].trim()}</div>
                    </td>
                    <td className="px-3 py-2 text-slate-700">{f.origin} → {f.dest}</td>
                    <td className="px-3 py-2 text-[11px] text-slate-600">
                      {f.stdLocal.split(" ").slice(1).join(" ")} / {f.staLocal.split(" ").slice(1).join(" ")}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-slate-700">
                      {f.pax} / {f.bagsLoaded}/{f.bagsPlanned}
                    </td>
                    <td className={`px-3 py-2 tabular-nums font-semibold ${f.reconciliationPct > 0 && f.reconciliationPct < 90 ? "text-rose-700" : "text-slate-800"}`}>
                      {f.bagsPlanned === 0 ? "—" : `${f.reconciliationPct.toFixed(1)}%`}
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
          <PanelHead
            title="Predicted Bottlenecks"
            subtitle="AI-assisted operational risk alerts across the baggage network"
          />
          <PanelBody className="space-y-3">
            {liveBottlenecks.map((x) => (
              <div
                key={x.t}
                title={`${x.t} — ${x.sev} severity`}
                className="rounded-md border border-slate-100 bg-slate-50/70 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">{x.t}</p>
                  <StatusPill>{x.sev}</StatusPill>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-slate-600">{x.d}</p>
              </div>
            ))}
            <p className="text-[11px] text-slate-400">
              AI-assisted advisory — monitor and verify with ground teams
            </p>
          </PanelBody>
        </Panel>
      </div>

      {/* Row 4: scan activity + priority incidents */}
      <div className="grid gap-3 xl:grid-cols-2">
        <Panel>
          <PanelHead title="Live Scan Activity" subtitle="Real-time baggage scan activity across the network" />
          {liveActivity.length === 0 ? (
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
                  {liveActivity.map((s) => (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50/80 ${s.result !== "Success" ? "bg-amber-50/20" : ""}`}
                    >
                      <td className="px-3 py-2 text-[11px] text-slate-600">{s.at}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => onOpenBag(s.lpn)}
                          title={`View bag ${s.lpn}`}
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
          <PanelHead title="Priority Baggage Incidents" subtitle="High-priority operational cases requiring immediate attention" />
          <div className="divide-y divide-slate-100">
            {livePriorityIncidents.map((inc) => (
              <button
                key={inc.id}
                type="button"
                onClick={() => onOpenIncident(inc.id)}
                title={`Open incident ${inc.id}`}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 ${
                  inc.severity === "Critical" ? "bg-rose-50/30" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Mono>{inc.id}</Mono>
                    <StatusPill>{inc.severity}</StatusPill>
                    <StatusPill>{inc.status}</StatusPill>
                  </div>
                  <p className="mt-1 text-xs text-slate-700">{inc.summary}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{inc.station} • {inc.reportedAt}</p>
                </div>
                {inc.lpn ? (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onOpenBag(inc.lpn!); }}
                    title={`View bag ${inc.lpn}`}
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

      {/* Transfer reconciliation pulse — clean table, no row/cell fill colors */}
      <Panel>
        <PanelHead
          title="Transfer Reconciliation Pulse"
          subtitle="Flight reconciliation and transfer-risk overview across active flights"
        />
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
              <tr>
                <th className="px-3 py-2">Flight</th>
                <th className="px-3 py-2">Loaded / Planned</th>
                <th className="px-3 py-2">Short-shipped</th>
                <th className="px-3 py-2">Transfer-risk bags</th>
                <th className="px-3 py-2">Delayed bags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {liveFlights.map((f) => (
                <tr key={f.flightNo} className="hover:bg-slate-50/60">
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onOpenFlight(f.flightNo)}
                      title={`Open flight ${f.flightNo}`}
                      className="font-mono text-[11px] font-semibold text-blue-700 hover:underline"
                    >
                      {f.flightNo}
                    </button>
                  </td>
                  <td className="px-3 py-2 tabular-nums text-slate-700">
                    {f.bagsLoaded}/{f.bagsPlanned}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-slate-700">{f.shortShipped}</td>
                  <td className={`px-3 py-2 tabular-nums ${f.transferRiskBags > 20 ? "font-semibold text-slate-800" : "text-slate-700"}`}>
                    {f.transferRiskBags}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-slate-700">{f.delayedBags}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
