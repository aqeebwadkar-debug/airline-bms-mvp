"use client";

import { useMemo, useState } from "react";
import {
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
  DELAY_REASONS,
  HEATMAP_GRID,
  MOCK_FLIGHTS,
  STATION_PERF,
  TREND_HOURLY,
} from "./data";
import { nudge, useLiveRefresh } from "./use-live-tick";
import { Panel, PanelBody, PanelHead } from "./primitives";

const pieNeutral = ["#0f172a", "#334155", "#475569", "#64748b", "#94a3b8"];

const ALL_OBSERVATIONS = [
  { label: "Congestion trend", note: "ORD and SIN transfer tunnels elevated — bank overlap risk flagged." },
  { label: "Scan compliance leader", note: "AMS leading network at 99.4% scan compliance over the 24h window." },
  { label: "Transfer-risk spike", note: "QR617 and UA884 contributing 55% of total transfer-risk bag count." },
  { label: "Bottleneck — CDG Pier C", note: "Loading anomaly flagged — manual override unresolved. AF229 departure exposure." },
  { label: "Reconciliation lag", note: "KL892 and BA114 in check-in phase — reconciliation pending loading window." },
  { label: "DXB sorter dwell", note: "DXB T3 sorter projected dwell +6m vs SLA during bank peak. Monitor closely." },
  { label: "SIN transfer pier", note: "SIN transfer pier pacing variance +6 minutes — QR617 connection window tightening." },
  { label: "LHR carousel variance", note: "LHR reclaim Belt 7 showing carousel pacing variance vs inbound wave schedule." },
];

interface Props {
  syncTick?: number;
}

export function AnalyticsScreen({ syncTick }: Props) {
  const [kpi, setKpi] = useState({
    mishandled: 3.9,
    reconMedian: 93.8,
    scanSuccess: 99.71,
    transferSuccess: 97.9,
  });
  const [obsOffset, setObsOffset] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Live chart datasets — all charts animate naturally when these update
  const [liveTrend,       setLiveTrend]       = useState(() => TREND_HOURLY.map((p) => ({ ...p })));
  const [liveStationPerf, setLiveStationPerf] = useState(() => STATION_PERF.map((s) => ({ ...s })));
  const [liveDelayReasons,setLiveDelayReasons]= useState(() => DELAY_REASONS.map((d) => ({ ...d })));
  const [liveHeatmap,     setLiveHeatmap]     = useState(() => HEATMAP_GRID.map((c) => ({ ...c })));
  const [liveFlightsData, setLiveFlightsData] = useState(() => MOCK_FLIGHTS.map((f) => ({ ...f })));

  function doRefresh() {
    setKpi((prev) => ({
      mishandled:      Math.max(3.2,  Math.min(4.5,   nudge(prev.mishandled, 0.15))),
      reconMedian:     Math.max(91,   Math.min(96,    nudge(prev.reconMedian, 0.3))),
      scanSuccess:     Math.max(99.4, Math.min(99.95, nudge(prev.scanSuccess, 0.06))),
      transferSuccess: Math.max(97.2, Math.min(98.8,  nudge(prev.transferSuccess, 0.12))),
    }));

    setObsOffset((i) => (i + 1) % ALL_OBSERVATIONS.length);

    setLiveTrend((prev) =>
      prev.map((p) => ({
        ...p,
        bags:       Math.max(2000, Math.round(nudge(p.bags, 350))),
        mishandled: Math.max(5,    Math.round(nudge(p.mishandled, 5))),
      })),
    );

    setLiveStationPerf((prev) =>
      prev.map((s) => ({
        ...s,
        bagsPerHour:    Math.max(2000, Math.round(nudge(s.bagsPerHour, 180))),
        capacityPct:    Math.max(50, Math.min(95, Math.round(nudge(s.capacityPct, 3)))),
        mishandled24h:  Math.max(0, Math.round(nudge(s.mishandled24h, 2))),
      })),
    );

    setLiveDelayReasons((prev) =>
      prev.map((d) => ({
        ...d,
        count: Math.max(5, Math.round(nudge(d.count, 5))),
      })),
    );

    setLiveHeatmap((prev) =>
      prev.map((c) => ({
        ...c,
        v: Math.min(5, Math.max(0, Math.round(nudge(c.v, 0.9)))),
      })),
    );

    setLiveFlightsData((prev) =>
      prev.map((f) => ({
        ...f,
        reconciliationPct: Math.min(100, Math.max(0, nudge(f.reconciliationPct, 0.5))),
        transferRiskBags:  Math.max(0, f.transferRiskBags + (Math.random() > 0.65 ? Math.round((Math.random() - 0.5) * 2) : 0)),
      })),
    );

    setLastRefresh(new Date());
  }

  useLiveRefresh(doRefresh, syncTick, 3000);

  const observations = useMemo(() => {
    const len = ALL_OBSERVATIONS.length;
    return Array.from({ length: 5 }, (_, i) => ALL_OBSERVATIONS[(obsOffset + i) % len]);
  }, [obsOffset]);

  // All derived chart data comes from live state so charts re-render and animate
  const throughput = useMemo(() =>
    liveStationPerf.map((s) => ({
      station: s.code,
      bph: s.bagsPerHour,
      mishandled: s.mishandled24h,
    })),
  [liveStationPerf]);

  const transfer = useMemo(() =>
    liveFlightsData.filter((f) => f.bagsPlanned > 0).map((f) => ({
      flight: f.flightNo,
      transferRisk: f.transferRiskBags,
      recon: f.reconciliationPct,
    })),
  [liveFlightsData]);

  const scanCompliance = useMemo(() =>
    liveStationPerf.map((s) => ({
      station: s.code,
      compliance: Math.max(96, Math.min(99.9, 99.1 - s.mishandled24h * 0.06 + (s.code.charCodeAt(0) % 3) * 0.15)),
    })),
  [liveStationPerf]);

  const rankings = useMemo(() =>
    [...liveStationPerf]
      .sort((a, b) => a.mishandled24h - b.mishandled24h)
      .slice(0, 8),
  [liveStationPerf]);

  return (
    <div className="space-y-4">
      {/* Live badge */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
            <Radio className="size-3 animate-pulse" aria-hidden />
            Live Analytics
          </span>
          <span className="text-[11px] text-slate-400">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid gap-3 lg:grid-cols-4">
        {[
          { label: "Mishandled Bags / 1K", value: kpi.mishandled.toFixed(1), change: "-0.4 vs PY" },
          { label: "SLA Reconciliation Median", value: `${kpi.reconMedian.toFixed(1)}%`, change: "+1.1 pts" },
          { label: "Avg scan success", value: `${kpi.scanSuccess.toFixed(2)}%`, change: "+6 bps" },
          { label: "Transfer success", value: `${kpi.transferSuccess.toFixed(1)}%`, change: "Stable" },
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

      {/* Throughput chart + station ranking */}
      <div className="grid gap-3 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelHead
            title="Baggage Throughput vs Mishandled"
            subtitle="Hourly baggage throughput vs mishandled bags"
          />
          <PanelBody className="px-2 pb-3 pt-1">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={liveTrend} margin={{ left: 60, right: 64, top: 4, bottom: 8 }}>
                <defs>
                  <linearGradient id="an-bags" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 10 }}
                  stroke="#94a3b8"
                  label={{ value: "Bags", angle: -90, position: "insideLeft", dx: -20, style: { textAnchor: "middle", fontSize: 10, fill: "#64748b" } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10 }}
                  stroke="#94a3b8"
                  label={{ value: "Mishandled", angle: 90, position: "insideRight", dx: 26, style: { textAnchor: "middle", fontSize: 10, fill: "#64748b" } }}
                />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="bags" name="Bags processed" fill="#2563eb" radius={[4, 4, 0, 0]} isAnimationActive />
                <Line yAxisId="right" type="monotone" dataKey="mishandled" name="Mishandled" stroke="#be123c" strokeWidth={2} dot={false} isAnimationActive />
              </ComposedChart>
            </ResponsiveContainer>
            <p className="mt-1 text-center text-[10px] text-slate-400">Hour (UTC)</p>
          </PanelBody>
        </Panel>

        <Panel className="flex flex-col overflow-hidden max-h-[380px]">
          <PanelHead
            title="Station Ranking"
            subtitle="Ranked by mishandled bags (24h) — lowest first"
          />
          <PanelBody className="flex-1 min-h-0 overflow-y-auto space-y-2">
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
                <div className="text-right">
                  <span className={`text-xs tabular-nums font-semibold ${s.mishandled24h > 14 ? "text-rose-700" : "text-slate-700"}`}>
                    {s.mishandled24h} mishandled
                  </span>
                  <div className="text-[11px] text-slate-500">cap {s.capacityPct}%</div>
                </div>
              </div>
            ))}
          </PanelBody>
        </Panel>
      </div>

      {/* Airport bags/hour + Incident composition */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel>
          <PanelHead
            title="Airport Baggage Volume by Station"
            subtitle="Baggage processing rate per station"
          />
          <PanelBody className="px-2 pb-3 pt-1">
            <ResponsiveContainer width="100%" height={252}>
              <BarChart data={throughput} margin={{ left: 60, right: 8, top: 4, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="station" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis
                  tick={{ fontSize: 10 }}
                  stroke="#94a3b8"
                  label={{ value: "Bags / hr", angle: -90, position: "insideLeft", dx: -22, style: { textAnchor: "middle", fontSize: 10, fill: "#64748b" } }}
                />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="bph" name="Bags/hour" fill="#0f766e" radius={[4, 4, 0, 0]} isAnimationActive />
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-1 text-center text-[10px] text-slate-400">Station</p>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead
            title="Delay Cause Distribution"
            subtitle="Distribution of delay causes across the network (24h)"
          />
          <PanelBody className="px-2 pb-2 pt-1">
            <ResponsiveContainer width="100%" height={208}>
              <PieChart margin={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Pie
                  data={liveDelayReasons}
                  dataKey="count"
                  nameKey="reason"
                  innerRadius={56}
                  outerRadius={82}
                  paddingAngle={2}
                  isAnimationActive
                >
                  {liveDelayReasons.map((_, i) => (
                    <Cell key={`dr-${i}`} fill={pieNeutral[i % pieNeutral.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-1.5 space-y-1.5 border-t border-slate-100 pt-2 text-[11px] text-slate-600">
              {liveDelayReasons.map((entry, idx) => (
                <div key={entry.reason} className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: pieNeutral[idx % pieNeutral.length] }} />
                  <span className="truncate">{entry.reason}</span>
                  <span className="ml-auto tabular-nums text-slate-500">{entry.count}</span>
                </div>
              ))}
            </div>
          </PanelBody>
        </Panel>
      </div>

      {/* Risk by flight + Scan compliance */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel>
          <PanelHead
            title="Transfer Risk by Flight"
            subtitle="Transfer-risk bags and reconciliation rate per flight"
          />
          <PanelBody className="space-y-2 max-h-[360px] overflow-y-auto">
            {transfer.map((item) => (
              <div key={item.flight} className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold text-slate-900">{item.flight}</span>
                  <span className={item.transferRisk > 20 ? "font-semibold text-rose-700" : ""}>{item.transferRisk} risk bags</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${item.transferRisk > 20 ? "bg-rose-500" : item.transferRisk > 10 ? "bg-amber-400" : "bg-blue-400"}`}
                    style={{ width: `${Math.min(100, item.transferRisk * 2.2)}%` }}
                  />
                </div>
                <div className={`text-[11px] ${item.recon < 90 ? "font-semibold text-rose-700" : item.recon < 95 ? "text-amber-700" : "text-slate-500"}`}>
                  {item.recon.toFixed(1)}% reconciliation
                </div>
              </div>
            ))}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead
            title="Scan Compliance Index"
            subtitle="Per-station scan success rate across the network"
          />
          <PanelBody className="px-2 pb-3 pt-1">
            <ResponsiveContainer width="100%" height={256}>
              <LineChart data={scanCompliance} margin={{ left: 60, right: 8, top: 4, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="station" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis
                  domain={[96, 100]}
                  tick={{ fontSize: 10 }}
                  stroke="#94a3b8"
                  label={{ value: "Compliance %", angle: -90, position: "insideLeft", dx: -26, style: { textAnchor: "middle", fontSize: 10, fill: "#64748b" } }}
                />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${Number(v).toFixed(2)}%`, "Compliance"]} />
                <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="compliance" name="Scan compliance %" stroke="#0369a1" strokeWidth={2} dot={{ r: 3 }} isAnimationActive />
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-1 text-center text-[10px] text-slate-400">Station</p>
          </PanelBody>
        </Panel>
      </div>

      {/* Heatmap — live intensity */}
      <Panel>
        <PanelHead
          title="Station load — Peak Hour Bands"
          subtitle="Baggage activity levels across stations during peak hours"
        />
        <PanelBody>
          <div className="grid grid-cols-[96px_1fr] gap-2 text-[11px]">
            <div />
            <div className="grid grid-cols-4 gap-1 text-center text-slate-500">
              {["06:00", "10:00", "14:00", "18:00"].map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>
            {Array.from(new Set(liveHeatmap.map((h) => h.station))).map((st) => (
              <div key={st} className="contents">
                <div className="flex items-center font-semibold text-slate-700">{st}</div>
                <div className="grid grid-cols-4 gap-1">
                  {liveHeatmap.filter((h) => h.station === st).map((cell) => (
                    <div
                      key={`${cell.station}-${cell.hour}`}
                      className="h-6 rounded-sm ring-1 ring-slate-200/80 transition-colors duration-700"
                      style={{ backgroundColor: `rgba(15,118,110,${0.06 + cell.v * 0.14})` }}
                      title={`${cell.station} ${cell.hour} — intensity ${cell.v}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
            <div className="h-2 w-4 rounded-sm" style={{ background: "rgba(15,118,110,0.06)" }} />
            Low
            <div className="h-2 w-4 rounded-sm" style={{ background: "rgba(15,118,110,0.62)" }} />
            High
          </div>
        </PanelBody>
      </Panel>

      {/* Network observations */}
      <Panel>
        <PanelHead
          title="Network insights"
          subtitle="Live monitoring observations across the baggage network"
        />
        <PanelBody className="space-y-2">
          {observations.map((obs) => (
            <div
              key={obs.label}
              className="flex gap-3 rounded-md border border-slate-100 bg-slate-50/60 px-3 py-2"
            >
              <div className="min-w-[120px] shrink-0">
                <p className="text-[11px] font-semibold text-slate-700">{obs.label}</p>
              </div>
              <p className="text-[11px] text-slate-600">{obs.note}</p>
            </div>
          ))}
        </PanelBody>
      </Panel>
    </div>
  );
}
