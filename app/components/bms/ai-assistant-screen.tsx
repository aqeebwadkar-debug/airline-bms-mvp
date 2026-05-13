"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { ALL_INCIDENTS, MOCK_BAGS, MOCK_FLIGHTS } from "./data";
import { Mono, Panel, PanelBody, PanelHead } from "./primitives";

type Role = "assistant" | "user";

interface Msg {
  role: Role;
  text: string;
  cards?: string[];
}

const SEEDS: string[] = [
  "Which flights have reconciliation risk?",
  "Show delayed baggage cases",
  "Which station has highest transfer congestion?",
  "Any unresolved security holds?",
  "Show flights below SLA target",
  "Active incidents by severity",
  "Which bags missed transfer scan?",
  "Scan failure summary",
  "Flights with loading variance",
  "Any operational bottlenecks today?",
];

function buildReply(input: string): Msg {
  const q = input.toLowerCase();

  if (q.includes("delayed") && q.includes("dxb")) {
    const bags = MOCK_BAGS.filter(
      (b) =>
        b.station === "DXB" &&
        (b.status === "Delayed" || b.status === "Transfer Risk"),
    );
    return {
      role: "assistant",
      text:
        bags.length === 0
          ? "No delayed or transfer-risk bags are currently flagged at DXB."
          : `Found ${bags.length} DXB-associated bags with elevated dwell or transfer markers.`,
      cards: bags.slice(0, 4).map((b) => `${b.lpn} • ${b.status} • ${b.scanPoint}`),
    };
  }

  if (q.includes("reconciliation") && q.includes("flight")) {
    const risky = MOCK_FLIGHTS.filter((f) => f.reconciliationPct < 94 && f.bagsPlanned > 0)
      .sort((a, b) => a.reconciliationPct - b.reconciliationPct)
      .slice(0, 5);
    return {
      role: "assistant",
      text:
        "Flights below the reconciliation guardrail (<94%) should be prioritized for recount and tunnel pacing.",
      cards: risky.map(
        (f) =>
          `${f.flightNo} • recon ${f.reconciliationPct.toFixed(1)}% • ${f.transferRiskBags} transfer-risk`,
      ),
    };
  }

  if (q.includes("bottleneck") || q.includes("transfer")) {
    return {
      role: "assistant",
      text:
        "Transfer tunnel occupancy is the primary choke point in current operational feeds — especially around UA884 and QF902 banks.",
      cards: [
        "ORD tunnel projected 82% occupancy (+11% vs baseline)",
        "SIN transfer pier pacing variance +6 minutes",
        "DXB T3 sorter surge window 12:40–13:30 local",
      ],
    };
  }

  const lpnMatch = input.match(/\b\d{10}\b/);
  if (lpnMatch || q.includes("track lpn")) {
    const lpn = lpnMatch?.[0] ?? "0176275312";
    const bag = MOCK_BAGS.find((b) => b.lpn === lpn);
    return {
      role: "assistant",
      text: bag
        ? `Bag ${lpn} is associated with ${bag.flightNo}. Last operational read: ${bag.lastScanAt} at ${bag.scanPoint}.`
        : `LPN ${lpn} is not present in the seeded inventory — verify scan ingestion or widen station scope.`,

      cards: bag
        ? [`Screening: ${bag.screening}`, `Risk flag: ${bag.risk}`, `Status: ${bag.status}`]
        : undefined,
    };
  }

  if (q.includes("incident")) {
    const open = ALL_INCIDENTS.filter((i) => i.status === "Open").slice(0, 4);
    return {
      role: "assistant",
      text:
        "Open incidents requiring routing attention (severity-weighted preview):",
      cards: open.map(
        (i) => `${i.id} • ${i.category} • ${i.station} • ${i.severity}`,
      ),
    };
  }

  return {
    role: "assistant",
    text:
      "Please provide a flight number, LPN, station, or issue type for a focused operational response.",
    cards: [
      "Try flight number, LPN, or airport code for best results.",
    ],
  };
}

export function AiAssistantScreen() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text:
        "Hello, I’m your baggage assistant. Ask about flights, baggage status, transfer risks, scan exceptions, or operational incidents.",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

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
      <div>
        <p className="text-xs text-slate-500">
          Operational baggage advisory and case assistance
        </p>
      </div>

      <Panel className="flex min-h-[calc(100vh-220px)] flex-col">
        <PanelHead
          title="Baggage Assistant"
          action={
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-100">
              <Sparkles className="size-3.5" aria-hidden />
              Operations advisory
            </span>
          }
        />
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
                        m.role === "user"
                          ? "border-white/15"
                          : "border-slate-100"
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
                placeholder="Ask about flights, LPNs, incidents, or operational bottlenecks..."
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
