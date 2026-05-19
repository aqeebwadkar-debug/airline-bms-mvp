"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Send, ExternalLink } from "lucide-react";
import { useLiveRefresh } from "./use-live-tick";
import { ALL_INCIDENTS, MOCK_BAGS, MOCK_FLIGHTS, MOCK_INVESTIGATIONS, MOCK_SCANS } from "./data";
import { Mono, Panel, PanelBody } from "./primitives";

type Role = "assistant" | "user";

interface Msg {
  role: Role;
  text: string;
  cards?: string[];
  links?: { label: string; target: string }[];
}

const SEEDS: string[] = [
  "Which flights have reconciliation risk?",
  "Show delayed baggage cases",
  "Which station has highest transfer congestion?",
  "Any unresolved security holds?",
  "Show flights below SLA target",
  "Active incidents by severity",
  "Scan failure summary",
  "Any SLA breaches in investigations?",
];

const ADVISORIES = [
  { label: "Transfer risk elevated", note: "QR617 and UA884 contributing 55% of network transfer-risk bag count. Review MTCT windows.", level: "amber" },
  { label: "ORD tunnel occupancy", note: "Tunnel occupancy above 80% threshold — UA884 bank under active monitoring.", level: "amber" },
  { label: "Scan compliance — AMS leading", note: "AMS at 99.4% scan compliance over 24h window. CDG and ORD trailing network average.", level: "green" },
  { label: "CDG Pier C anomaly", note: "Manual loading override unresolved — AF229 departure window at risk. Supervisor action required.", level: "red" },
  { label: "SIN pier pacing variance", note: "SIN transfer pier dwell +6 minutes vs baseline. QR617 SLA exposure confirmed — escalate to ground ops.", level: "amber" },
  { label: "DXB rescreen queue", note: "14 bags in DXB secondary screening queue. Hold-room capacity at 78% — clear before EK410 departure.", level: "red" },
  { label: "LHR recon improved", note: "BA114 reconciliation recovered to 97.2% following manual recount. No further action required.", level: "green" },
  { label: "DOH transfer dwell breach", note: "QR617 transfer dwell exceeded 4h SLA threshold. Investigation INV-10045 auto-escalated to operations lead.", level: "red" },
];

function buildReply(input: string): Msg {
  const q = input.toLowerCase();

  if (q.includes("delayed") && q.includes("dxb")) {
    const bags = MOCK_BAGS.filter(
      (b) => b.station === "DXB" && (b.status === "Delayed" || b.status === "Transfer Risk"),
    );
    return {
      role: "assistant",
      text: bags.length === 0
        ? "No delayed or transfer-risk bags currently flagged at DXB."
        : `${bags.length} DXB-associated bags show elevated dwell or transfer markers.`,
      cards: bags.slice(0, 4).map((b) => `${b.lpn} • ${b.status} • ${b.scanPoint}`),
    };
  }

  if (q.includes("reconciliation") || (q.includes("recon") && q.includes("risk"))) {
    const risky = MOCK_FLIGHTS.filter((f) => f.reconciliationPct < 94 && f.bagsPlanned > 0)
      .sort((a, b) => a.reconciliationPct - b.reconciliationPct)
      .slice(0, 6);
    return {
      role: "assistant",
      text: "Flights below the reconciliation guardrail (<94%) — prioritise recount and tunnel pacing:",
      cards: risky.map(
        (f) => `${f.flightNo} • recon ${f.reconciliationPct.toFixed(1)}% • ${f.transferRiskBags} transfer-risk bags`,
      ),
      links: [{ label: "View Flights", target: "flights" }],
    };
  }

  if (q.includes("bottleneck") || (q.includes("transfer") && q.includes("congestion"))) {
    return {
      role: "assistant",
      text: "Transfer tunnel occupancy is the primary constraint in current feeds — UA884 and QR617 banks under watch:",
      cards: [
        "ORD tunnel projected 82% occupancy (+11% vs baseline)",
        "SIN transfer pier pacing variance +6 minutes",
        "DOH transfer dwell breach — QR617 SLA at risk",
        "CDG Pier C loading override unresolved — AF229 exposure",
      ],
      links: [{ label: "View Investigations", target: "investigation" }],
    };
  }

  if (q.includes("sla breach") || (q.includes("sla") && q.includes("breach"))) {
    const breaches = MOCK_INVESTIGATIONS.filter((i) => i.slaBreach);
    return {
      role: "assistant",
      text: `${breaches.length} active SLA breach${breaches.length !== 1 ? "es" : ""} detected across the investigation queue:`,
      cards: breaches.map(
        (i) => `${i.id} • ${i.caseType} • ${i.station} • ${i.flightNo}`,
      ),
      links: [{ label: "Open Investigation Module", target: "investigation" }],
    };
  }

  if (q.includes("escalat")) {
    const escalated = MOCK_INVESTIGATIONS.filter((i) => i.status === "Escalated");
    return {
      role: "assistant",
      text: `${escalated.length} investigation case${escalated.length !== 1 ? "s" : ""} currently escalated to operations leads:`,
      cards: escalated.map(
        (i) => `${i.id} • ${i.summary.slice(0, 60)}…`,
      ),
      links: [{ label: "View Escalated Cases", target: "investigation" }, { label: "View Incidents", target: "incidents" }],
    };
  }

  if (q.includes("missing scan") || q.includes("telemetry gap")) {
    const missing = MOCK_INVESTIGATIONS.filter((i) => i.caseType === "Missing Scan");
    return {
      role: "assistant",
      text: `${missing.length} missing scan case${missing.length !== 1 ? "s" : ""} in the investigation queue — telemetry gaps require field sweep:`,
      cards: missing.map(
        (i) => `${i.id} • ${i.station} • Last known: ${i.lastKnownLocation}`,
      ),
      links: [{ label: "Open Investigations", target: "investigation" }],
    };
  }

  const lpnMatch = input.match(/\b\d{10}\b/);
  if (lpnMatch || q.includes("track lpn")) {
    const lpn = lpnMatch?.[0] ?? "0176275312";
    const bag = MOCK_BAGS.find((b) => b.lpn === lpn);
    return {
      role: "assistant",
      text: bag
        ? `Bag ${lpn} linked to ${bag.flightNo}. Last telemetry: ${bag.lastScanAt} at ${bag.scanPoint}.`
        : `LPN ${lpn} not found in current inventory — verify scan ingestion or widen station scope.`,
      cards: bag
        ? [`Screening: ${bag.screening}`, `Risk flag: ${bag.risk}`, `Status: ${bag.status}`]
        : undefined,
    };
  }

  if ((q.includes("incident") && q.includes("severity")) || q.includes("by severity")) {
    const critical = ALL_INCIDENTS.filter((i) => i.severity === "Critical" && i.status !== "Closed");
    const high = ALL_INCIDENTS.filter((i) => i.severity === "High" && i.status !== "Closed");
    const medium = ALL_INCIDENTS.filter((i) => i.severity === "Medium" && i.status !== "Closed");
    return {
      role: "assistant",
      text: `Active incidents by severity — ${critical.length + high.length + medium.length} open cases:`,
      cards: [
        `Critical: ${critical.length} — ${critical.map((i) => i.id).join(", ") || "none"}`,
        `High: ${high.length} — ${high.slice(0, 3).map((i) => `${i.id} (${i.category})`).join(", ")}`,
        `Medium: ${medium.length} open cases across network`,
      ],
      links: [{ label: "View All Incidents", target: "incidents" }],
    };
  }

  if (q.includes("incident") || q.includes("case")) {
    const open = ALL_INCIDENTS.filter((i) => i.status === "Open" || i.status === "Escalated").slice(0, 5);
    return {
      role: "assistant",
      text: `${open.length} open or escalated incidents in the queue — severity-weighted summary:`,
      cards: open.map((i) => `${i.id} • ${i.category} • ${i.station} • ${i.severity}`),
      links: [{ label: "View All Incidents", target: "incidents" }],
    };
  }

  if (q.includes("security hold") || q.includes("unresolved security")) {
    const held = MOCK_BAGS.filter((b) => b.screening !== "Cleared" || b.status === "Held Security");
    return {
      role: "assistant",
      text: `${held.length} bag${held.length !== 1 ? "s" : ""} currently flagged for security hold or rescreening:`,
      cards: held.slice(0, 5).map((b) => `${b.lpn} • ${b.screening} • ${b.station} • ${b.status}`),
      links: [{ label: "View Bag Tracking", target: "bags" }],
    };
  }

  if (q.includes("scan failure") || q.includes("scan success") || (q.includes("scan") && q.includes("summary"))) {
    const nonSuccess = MOCK_SCANS.filter((s) => s.result !== "Success");
    const retries = MOCK_SCANS.filter((s) => s.result === "Retry Required" || s.result === "No-read").length;
    const missing = MOCK_SCANS.filter((s) => s.result === "Missing Arrival Scan" || s.result === "Telemetry Gap").length;
    const successRate = (((MOCK_SCANS.length - nonSuccess.length) / MOCK_SCANS.length) * 100).toFixed(2);
    return {
      role: "assistant",
      text: `Scan telemetry summary — ${successRate}% success rate across ${MOCK_SCANS.length} events:`,
      cards: [
        `Non-success reads: ${nonSuccess.length} (${((nonSuccess.length / MOCK_SCANS.length) * 100).toFixed(1)}% of total)`,
        `Retry / no-read events: ${retries}`,
        `Missing arrival scans + telemetry gaps: ${missing}`,
        `Active devices: ${new Set(MOCK_SCANS.map((s) => s.deviceId)).size} across ${new Set(MOCK_SCANS.map((s) => s.station)).size} stations`,
      ],
      links: [{ label: "View Scan Events", target: "scans" }],
    };
  }

  if ((q.includes("transfer risk") && !q.includes("congestion")) || q.includes("transfer-risk")) {
    const risky = MOCK_FLIGHTS.filter((f) => f.transferRiskBags > 0)
      .sort((a, b) => b.transferRiskBags - a.transferRiskBags)
      .slice(0, 6);
    const total = MOCK_FLIGHTS.reduce((a, f) => a + f.transferRiskBags, 0);
    return {
      role: "assistant",
      text: `${total} total transfer-risk bags across network — top flights by risk count:`,
      cards: risky.map((f) => `${f.flightNo} • ${f.transferRiskBags} risk bags • ${f.origin}→${f.dest} • ${f.status}`),
      links: [{ label: "View Flights", target: "flights" }, { label: "View Investigations", target: "investigation" }],
    };
  }

  if ((q.includes("below sla") || (q.includes("sla") && q.includes("target"))) && !q.includes("breach")) {
    const below = MOCK_FLIGHTS.filter((f) => f.bagsPlanned > 0 && f.reconciliationPct < 95)
      .sort((a, b) => a.reconciliationPct - b.reconciliationPct);
    return {
      role: "assistant",
      text: `${below.length} flight${below.length !== 1 ? "s" : ""} below the 95% reconciliation SLA target:`,
      cards: below.slice(0, 6).map((f) => `${f.flightNo} • ${f.reconciliationPct.toFixed(1)}% recon • ${f.status}`),
      links: [{ label: "View Flights", target: "flights" }],
    };
  }

  if (q.includes("loading variance") || q.includes("loading")) {
    const risky = MOCK_FLIGHTS.filter((f) => f.bagsPlanned > 0 && (f.bagsLoaded / f.bagsPlanned) < 0.6);
    return {
      role: "assistant",
      text: risky.length > 0
        ? `${risky.length} flight${risky.length !== 1 ? "s" : ""} with loading coverage below 60%:`
        : "No critical loading variances detected. All active flights within expected load bands.",
      cards: risky.map((f) => `${f.flightNo} • ${f.bagsLoaded}/${f.bagsPlanned} loaded • ${f.reconciliationPct.toFixed(1)}% recon`),
      links: risky.length > 0 ? [{ label: "View Flights", target: "flights" }] : undefined,
    };
  }

  if (q.includes("delayed bag") || q.includes("delayed")) {
    const delayed = MOCK_FLIGHTS.filter((f) => f.delayedBags > 5).slice(0, 5);
    return {
      role: "assistant",
      text: `${delayed.length} flights with elevated delayed bag counts:`,
      cards: delayed.map((f) => `${f.flightNo} • ${f.delayedBags} delayed bags • ${f.status}`),
    };
  }

  return {
    role: "assistant",
    text: "Provide a flight number, LPN, station, or issue keyword for a focused operational response.",
    cards: ["Try: flight number, LPN, or airport code — e.g. UA884, QR617, or 'SLA breach'"],
  };
}

interface Props {
  onNavigate?: (target: "flights" | "incidents" | "investigation" | "bags" | "scans") => void;
  syncTick?: number;
}

export function AiAssistantScreen({ onNavigate, syncTick }: Props) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Ask about flights, baggage activity, incidents, transfer risks, or investigations.",
    },
  ]);
  const [advisoryOffset, setAdvisoryOffset] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const doRefresh = useCallback(() => {
    setAdvisoryOffset((o) => (o + 1) % ADVISORIES.length);
  }, []);

  useLiveRefresh(doRefresh, syncTick);

  const liveAdvisories = useMemo(() => {
    const offset = advisoryOffset % ADVISORIES.length;
    return [...ADVISORIES.slice(offset), ...ADVISORIES.slice(0, offset)].slice(0, 4);
  }, [advisoryOffset]);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setMessages((m) => [...m, { role: "user", text: trimmed }]);
      window.setTimeout(() => {
        const reply = buildReply(trimmed);
        setMessages((m) => [...m, reply]);
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 280);
      setInput("");
    },
    [],
  );

  const suggestions = useMemo(() => SEEDS, []);

  return (
    <div className="space-y-4">
      {/* Operational advisories */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Live Advisories</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {liveAdvisories.map((a, idx) => (
          <div
            key={`${a.label}-${idx}`}
            className={`rounded-lg border px-3 py-2.5 ${
              a.level === "red"
                ? "border-rose-100 bg-rose-50/60"
                : a.level === "amber"
                  ? "border-amber-100 bg-amber-50/50"
                  : "border-emerald-100 bg-emerald-50/50"
            }`}
          >
            <p className={`text-[11px] font-semibold ${
              a.level === "red" ? "text-rose-800" : a.level === "amber" ? "text-amber-900" : "text-emerald-800"
            }`}>
              {a.label}
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-600">{a.note}</p>
          </div>
        ))}
      </div>

      <Panel className="flex min-h-[calc(100vh-320px)] flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
          <p className="text-[11px] text-slate-500">AI Operations Assistant</p>
        </div>
        <PanelBody className="flex flex-1 flex-col gap-3 p-0">
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, idx) => (
              <div
                key={`${idx}-${m.role}`}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[min(640px,92vw)] rounded-lg px-3 py-2 text-xs leading-relaxed shadow-sm ring-1 ${
                    m.role === "user"
                      ? "bg-slate-900 text-white ring-slate-900"
                      : "bg-white text-slate-800 ring-slate-200"
                  }`}
                >
                  <p>{m.text}</p>
                  {m.cards?.length ? (
                    <div
                      className={`mt-2 space-y-1 border-t pt-2 text-[11px] opacity-95 ${
                        m.role === "user" ? "border-white/15" : "border-slate-100"
                      }`}
                    >
                      {m.cards.map((c) => (
                        <div
                          key={c}
                          className={`rounded-md px-2 py-1 ${
                            m.role === "user"
                              ? "bg-white/10"
                              : "bg-slate-50 text-slate-700 ring-1 ring-slate-100"
                          }`}
                        >
                          <Mono>{c}</Mono>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {m.links?.length && m.role === "assistant" ? (
                    <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2">
                      {m.links.map((link) => (
                        <button
                          key={link.label}
                          type="button"
                          onClick={() => onNavigate?.(link.target as "flights" | "incidents" | "investigation" | "bags" | "scans")}
                          className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          <ExternalLink className="size-3" aria-hidden />
                          {link.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-slate-100 px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-white"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Type your question here..."
                className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none ring-blue-500/30 focus:ring-2"
              />
              <button
                type="button"
                onClick={() => send(input)}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <Send className="size-4" aria-hidden />
                Send
              </button>
            </div>
          </div>
        </PanelBody>
      </Panel>
    </div>
  );
}
