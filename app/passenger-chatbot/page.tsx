"use client";

import { useEffect, useRef, useState } from "react";
import { Send, ArrowLeft, MoreVertical, Paperclip, Camera, Mic, Smile } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Role = "bot" | "user";

interface TextMsg { id: string; role: Role;   kind: "text"; text: string; ts: Date }
interface CardMsg { id: string; role: "bot";  kind: "card"; card: "track" | "case" | "deliv"; ts: Date }
interface PillMsg { id: string; role: "bot";  kind: "pill"; text: string; ts: Date }

type Msg  = TextMsg | CardMsg | PillMsg;
type Flow = "welcome" | "track_pnr" | "track_done" | "report_type" | "report_details" | "report_done" | "delivery" | "status" | "agent" | "free";

// ─── Mock data ───────────────────────────────────────────────────────────────

const JOURNEY = [
  { label: "Checked in at Mumbai Terminal 2", sub: "Counter 14 · 08:42 IST",         done: true,  active: false },
  { label: "Security screening completed",    sub: "T2 Screening Bay 3 · 09:15 IST", done: true,  active: false },
  { label: "Loaded onto Flight AI472",        sub: "ULD Cart 7B · 10:05 IST",        done: true,  active: false },
  { label: "In transit to Dubai",             sub: "Flight AI472 · ETA 12:30 GST",   done: false, active: true  },
  { label: "Expected on Belt 6",              sub: "Dubai International T3",         done: false, active: false },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _uid = 0;
function uid() { return `m${++_uid}`; }

function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

const MENU_TEXT =
  "Hi! I'm the *SkyTrack* baggage assistant ✈️\n\nPlease reply with a number:\n\n1️⃣  Track my baggage\n2️⃣  Report missing baggage\n3️⃣  Check incident status\n4️⃣  Baggage delivery update\n5️⃣  Talk to an agent";

function initMsgs(): Msg[] {
  return [{ id: uid(), role: "bot", kind: "text", text: MENU_TEXT, ts: new Date() }];
}

// Renders *bold* inline within text while preserving whitespace-pre-line newlines
function renderText(text: string): React.ReactNode {
  const parts = text.split(/\*([^*]+)\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold">{part}</strong>
      : <span key={i}>{part}</span>
  );
}

// ─── Bubbles ─────────────────────────────────────────────────────────────────

function BotBubble({ text, ts }: { text: string; ts: Date }) {
  return (
    <div className="flex justify-start px-2 py-[2px]">
      <div
        className="relative max-w-[75%] rounded-[7px] rounded-tl-none px-[9px] py-[6px] shadow-sm"
        style={{ background: "#ffffff" }}
      >
        <div
          className="absolute -left-[7px] top-0 h-0 w-0"
          style={{ borderTop: "8px solid #ffffff", borderLeft: "8px solid transparent" }}
        />
        <p className="whitespace-pre-line text-[14px] leading-[1.4] text-[#111b21]">
          {renderText(text)}
        </p>
        <p className="mt-[3px] text-right text-[11px] leading-none text-[#667781]">{fmtTime(ts)}</p>
      </div>
    </div>
  );
}

function UserBubble({ text, ts }: { text: string; ts: Date }) {
  return (
    <div className="flex justify-end px-2 py-[2px]">
      <div
        className="relative max-w-[75%] rounded-[7px] rounded-tr-none px-[9px] py-[6px] shadow-sm"
        style={{ background: "#d9fdd3" }}
      >
        <div
          className="absolute -right-[7px] top-0 h-0 w-0"
          style={{ borderTop: "8px solid #d9fdd3", borderRight: "8px solid transparent" }}
        />
        <p className="whitespace-pre-line text-[14px] leading-[1.4] text-[#111b21]">
          {renderText(text)}
        </p>
        <div className="mt-[3px] flex items-center justify-end gap-[3px]">
          <span className="text-[11px] leading-none text-[#667781]">{fmtTime(ts)}</span>
          {/* Blue double-tick read receipt */}
          <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
            <path d="M11.071.653a.75.75 0 0 1 .053 1.06l-6.5 7a.75.75 0 0 1-1.112 0l-3-3.25a.75.75 0 0 1 1.112-1.028L4.5 7.066l5.956-6.36a.75.75 0 0 1 1.06-.053z" fill="#53bdeb"/>
            <path d="M14.571.653a.75.75 0 0 1 .053 1.06l-6.5 7a.75.75 0 0 1-1.059.022L8.5 7.066l.959-1.031.806.868 5.246-5.197a.75.75 0 0 1 1.06-.053z" fill="#53bdeb"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex justify-start px-2 py-[2px]">
      <div
        className="relative rounded-[7px] rounded-tl-none bg-white px-4 py-3 shadow-sm"
      >
        <div
          className="absolute -left-[7px] top-0 h-0 w-0"
          style={{ borderTop: "8px solid #ffffff", borderLeft: "8px solid transparent" }}
        />
        <div className="flex items-center gap-[5px]">
          <span className="size-[7px] rounded-full bg-[#8696a0] animate-bounce [animation-delay:-0.32s]" />
          <span className="size-[7px] rounded-full bg-[#8696a0] animate-bounce [animation-delay:-0.16s]" />
          <span className="size-[7px] rounded-full bg-[#8696a0] animate-bounce" />
        </div>
      </div>
    </div>
  );
}

function DatePill({ label }: { label: string }) {
  return (
    <div className="flex justify-center py-2">
      <span className="rounded-full bg-[#e9f0f7]/90 px-3 py-[3px] text-[12px] font-medium text-[#54656f] shadow-sm">
        {label}
      </span>
    </div>
  );
}

// ─── Rich cards ───────────────────────────────────────────────────────────────

function TrackCard({ ts }: { ts: Date }) {
  return (
    <div className="flex justify-start px-2 py-[2px]">
      <div className="w-[75%] overflow-hidden rounded-[7px] rounded-tl-none shadow-sm" style={{ background: "#ffffff" }}>
        <div className="border-b border-gray-100 bg-[#128C7E] px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/80">Baggage Status</p>
          <p className="text-[13px] font-bold text-white">LPN AI-0987654321</p>
          <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">In Transit</span>
        </div>
        <div className="px-3 py-2">
          {JOURNEY.map((step, i) => (
            <div key={i} className="flex gap-2">
              <div className="flex flex-col items-center">
                <div className={[
                  "flex size-4 shrink-0 items-center justify-center rounded-full mt-0.5",
                  step.done ? "bg-[#25D366]" : step.active ? "bg-[#128C7E]" : "bg-gray-200",
                ].join(" ")}>
                  {step.done ? (
                    <svg className="size-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : step.active ? (
                    <span className="size-1.5 rounded-full bg-white animate-pulse" />
                  ) : (
                    <span className="size-1 rounded-full bg-gray-400" />
                  )}
                </div>
                {i < JOURNEY.length - 1 && (
                  <div className={["w-px flex-1 my-0.5", step.done ? "bg-[#25D366]" : "bg-gray-200"].join(" ")} style={{ minHeight: 10 }} />
                )}
              </div>
              <div className="pb-2">
                <p className={["text-[11.5px] font-semibold leading-tight", step.done ? "text-gray-700" : step.active ? "text-[#128C7E]" : "text-gray-400"].join(" ")}>
                  {step.label}
                </p>
                <p className="text-[10px] text-gray-400">{step.sub}</p>
              </div>
            </div>
          ))}
          <div className="mt-1 rounded bg-amber-50 px-2 py-1.5 text-[11px] font-semibold text-amber-800">
            ⏱ ETA: 18 min · Belt 6 · Dubai T3
          </div>
        </div>
        <p className="px-3 pb-2 text-right text-[11px] text-[#667781]">{fmtTime(ts)}</p>
      </div>
    </div>
  );
}

function CaseCard({ ts }: { ts: Date }) {
  return (
    <div className="flex justify-start px-2 py-[2px]">
      <div className="w-[75%] overflow-hidden rounded-[7px] rounded-tl-none bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-[#128C7E] px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/80">Case Opened</p>
          <p className="text-[13px] font-bold text-white">BG-20451</p>
          <span className="inline-block rounded-full bg-amber-400/30 px-2 py-0.5 text-[10px] font-semibold text-white">Under Investigation</span>
        </div>
        <div className="space-y-1 px-3 py-2 text-[12px]">
          <div className="flex justify-between"><span className="text-gray-500">Last scanned</span><span className="font-medium text-gray-700">Mumbai T2 · Counter 14</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Assigned to</span><span className="font-medium text-gray-700">Dubai Recovery Unit</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Next update</span><span className="font-medium text-gray-700">Within 2 hours</span></div>
        </div>
        <div className="mx-3 mb-2 rounded bg-gray-50 px-2 py-1 text-[10.5px] text-gray-500">
          Confirmation sent to your registered email · Ref: BG-20451
        </div>
        <p className="px-3 pb-2 text-right text-[11px] text-[#667781]">{fmtTime(ts)}</p>
      </div>
    </div>
  );
}

function DelivCard({ ts }: { ts: Date }) {
  return (
    <div className="flex justify-start px-2 py-[2px]">
      <div className="w-[75%] overflow-hidden rounded-[7px] rounded-tl-none bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-[#128C7E] px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/80">Delivery Status</p>
          <p className="text-[13px] font-bold text-white">BlueDart Express</p>
          <span className="inline-block rounded-full bg-[#25D366]/30 px-2 py-0.5 text-[10px] font-semibold text-white">Out for Delivery</span>
        </div>
        <div className="space-y-1 px-3 py-2 text-[12px]">
          <div className="flex justify-between"><span className="text-gray-500">Tracking ID</span><span className="font-medium text-gray-700">BD-9814022</span></div>
          <div className="flex justify-between"><span className="text-gray-500">ETA</span><span className="font-semibold text-[#25D366]">Today before 7:00 PM</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Deliver to</span><span className="font-medium text-gray-700">Villa 42, Jumeirah Lakes</span></div>
        </div>
        <p className="px-3 pb-2 text-right text-[11px] text-[#667781]">{fmtTime(ts)}</p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PassengerChatbotPage() {
  const [msgs, setMsgs]     = useState<Msg[]>(initMsgs);
  const [flow, setFlow]     = useState<Flow>("welcome");
  const [typing, setTyping] = useState(false);
  const [input, setInput]   = useState("");
  const sessionRef          = useRef(0);
  const bottomRef           = useRef<HTMLDivElement>(null);
  const textareaRef         = useRef<HTMLTextAreaElement>(null);
  const containerRef        = useRef<HTMLDivElement>(null);
  const scrollAreaRef       = useRef<HTMLDivElement>(null);

  // Prevent body/html from scrolling behind the chat (iOS + Android)
  useEffect(() => {
    const b = document.body;
    const h = document.documentElement;
    const prev = [b.style.overflow, h.style.overflow, b.style.position, b.style.width];
    b.style.overflow = "hidden";
    h.style.overflow = "hidden";
    // position:fixed on body stops iOS Safari rubber-band scroll leaking through
    b.style.position = "fixed";
    b.style.width = "100%";
    return () => {
      [b.style.overflow, h.style.overflow, b.style.position, b.style.width] = prev;
    };
  }, []);

  // visualViewport handler — the only reliable cross-browser fix for:
  //  • Android Chrome: viewport shrinks when keyboard opens
  //  • iOS Safari: keyboard overlays layout viewport (offsetTop becomes non-zero)
  //  • Samsung Internet: similar to Android Chrome
  // We drive the container height from visualViewport.height so the chat always
  // fills exactly the visible area above the keyboard, then instantly jump to
  // the latest message so the user never loses context while typing.
  useEffect(() => {
    const container = containerRef.current;
    const scroller  = scrollAreaRef.current;
    if (!container) return;

    function sync() {
      const vv = window.visualViewport;
      const h  = vv ? vv.height    : window.innerHeight;
      const y  = vv ? vv.offsetTop : 0;
      container!.style.height = `${h}px`;
      container!.style.top    = `${y}px`;
      // Instantly pin to bottom so latest messages stay visible when keyboard opens
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
    }

    sync(); // apply on mount

    const vv = window.visualViewport;
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    // Fallback for browsers that lack visualViewport (very old Android WebView)
    window.addEventListener("resize", sync);

    return () => {
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  // Smooth scroll to bottom when new messages arrive or typing indicator changes
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  function push(msg: Msg) {
    setMsgs((p) => [...p, msg]);
  }

  function safeAfter(ms: number, cb: () => void) {
    const snap = sessionRef.current;
    setTimeout(() => { if (sessionRef.current === snap) cb(); }, ms);
  }

  function botAfter(ms: number, cb: () => void) {
    const snap = sessionRef.current;
    setTyping(true);
    setTimeout(() => {
      if (sessionRef.current !== snap) return;
      setTyping(false);
      cb();
    }, ms);
  }

  function reset() {
    sessionRef.current++;
    _uid = 0;
    setMsgs(initMsgs());
    setFlow("welcome");
    setTyping(false);
    setInput("");
  }

  function resetTextareaHeight() {
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function sendText() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    resetTextareaHeight();
    const now = new Date();
    push({ id: uid(), role: "user", kind: "text", text, ts: now });

    if (flow === "welcome") {
      const n = text.trim();
      if (n === "1") {
        setFlow("track_pnr");
        botAfter(900, () => push({ id: uid(), role: "bot", kind: "text", text: "Please enter your *PNR* or *baggage tag number* and I'll look it up.", ts: new Date() }));
      } else if (n === "2") {
        setFlow("report_type");
        botAfter(900, () => push({
          id: uid(), role: "bot", kind: "text",
          text: "Sorry to hear that. Please reply with the issue type:\n\n1️⃣  Bag not arrived\n2️⃣  Damaged baggage\n3️⃣  Wrong bag collected\n4️⃣  Missing item from bag",
          ts: new Date(),
        }));
      } else if (n === "3") {
        setFlow("status");
        botAfter(900, () => push({ id: uid(), role: "bot", kind: "text", text: "Please enter your *case reference number* (e.g. BG-20451) to check the status.", ts: new Date() }));
      } else if (n === "4") {
        setFlow("delivery");
        botAfter(900, () => {
          push({ id: uid(), role: "bot", kind: "text", text: "Here is the latest delivery update for your baggage:", ts: new Date() });
          safeAfter(300, () => push({ id: uid(), role: "bot", kind: "card", card: "deliv", ts: new Date() }));
          safeAfter(1500, () => {
            push({ id: uid(), role: "bot", kind: "text", text: "Is there anything else I can help you with?\n\nReply *menu* to go back to the main menu.", ts: new Date() });
            setFlow("free");
          });
        });
      } else if (n === "5") {
        setFlow("agent");
        botAfter(800, () => {
          push({ id: uid(), role: "bot", kind: "text", text: "Connecting you to a support agent. Please hold on...", ts: new Date() });
          setTyping(true);
          safeAfter(2500, () => {
            setTyping(false);
            push({ id: uid(), role: "bot", kind: "text", text: "You are now connected with *Priya M.* (Baggage Support).\n\nHow can I help you today?", ts: new Date() });
            setFlow("free");
          });
        });
      } else {
        botAfter(700, () => push({ id: uid(), role: "bot", kind: "text", text: "Please reply with a number between 1 and 5 to select an option from the menu.", ts: new Date() }));
      }
      return;
    }

    if (flow === "report_type") {
      const issues: Record<string, string> = { "1": "Bag not arrived", "2": "Damaged baggage", "3": "Wrong bag collected", "4": "Missing item from bag" };
      const issue = issues[text.trim()];
      if (issue) {
        setFlow("report_details");
        botAfter(900, () => push({ id: uid(), role: "bot", kind: "text", text: `Got it — *${issue}*.\n\nPlease provide your *baggage tag number* (e.g. AI-0987654321) so I can file a report.`, ts: new Date() }));
      } else {
        botAfter(700, () => push({ id: uid(), role: "bot", kind: "text", text: "Please reply with 1, 2, 3, or 4 to select the issue type.", ts: new Date() }));
      }
      return;
    }

    if (flow === "track_pnr") {
      const pnr = text.toUpperCase();
      setFlow("track_done");
      botAfter(1200, () => {
        push({ id: uid(), role: "bot", kind: "text", text: `Found your baggage for *${pnr}*. Here is the current status:`, ts: new Date() });
        safeAfter(300, () => {
          push({ id: uid(), role: "bot", kind: "card", card: "track", ts: new Date() });
          safeAfter(2200, () => push({ id: uid(), role: "bot", kind: "pill", text: "📍 Your baggage has arrived in Dubai", ts: new Date() }));
          safeAfter(3500, () => push({ id: uid(), role: "bot", kind: "pill", text: "🛄 Belt assignment confirmed — Belt 6, T3", ts: new Date() }));
          safeAfter(4800, () => {
            push({ id: uid(), role: "bot", kind: "text", text: "Is there anything else I can help you with?\n\nReply *menu* to see all options.", ts: new Date() });
            setFlow("free");
          });
        });
      });
      return;
    }

    if (flow === "status") {
      setFlow("free");
      botAfter(1000, () => {
        push({ id: uid(), role: "bot", kind: "text", text: `Here is the latest status for *${text.toUpperCase()}*:`, ts: new Date() });
        safeAfter(300, () => push({ id: uid(), role: "bot", kind: "card", card: "case", ts: new Date() }));
        safeAfter(1500, () => {
          push({ id: uid(), role: "bot", kind: "text", text: "You will receive an SMS update as soon as there is progress.\n\nReply *menu* for more options.", ts: new Date() });
        });
      });
      return;
    }

    if (flow === "report_details") {
      setFlow("report_done");
      botAfter(1500, () => {
        push({ id: uid(), role: "bot", kind: "text", text: "Thank you. Your report has been filed and the recovery team has been notified.", ts: new Date() });
        safeAfter(300, () => {
          push({ id: uid(), role: "bot", kind: "card", card: "case", ts: new Date() });
          safeAfter(1000, () => {
            push({ id: uid(), role: "bot", kind: "text", text: "You will receive updates via SMS at each stage of the recovery process.\n\nReply *menu* for more options.", ts: new Date() });
            setFlow("free");
          });
        });
      });
      return;
    }

    if (text.toLowerCase() === "menu" || text === "0") {
      setFlow("welcome");
      botAfter(600, () => push({ id: uid(), role: "bot", kind: "text", text: MENU_TEXT, ts: new Date() }));
      return;
    }

    const q = text.toLowerCase();
    let reply = "I can help with baggage tracking, reports, and delivery updates.\n\nReply *menu* to see all options.";
    if (q.includes("belt") || q.includes("carousel"))
      reply = "Your baggage is expected on *Belt 6*, Dubai International Terminal 3. Belt assignments are confirmed about 20 minutes before doors open.";
    else if (q.includes("delay") || q.includes("why"))
      reply = "Delays can occur due to transfer volumes or security screening. Your bag is progressing normally on flight AI472.";
    else if (q.includes("lost") || q.includes("missing"))
      reply = "If your baggage is not located within 5 days, a PIR escalation is filed under IATA Resolution 753. The recovery team will contact you within 24 hours.";
    else if (q.includes("where") || q.includes("status"))
      reply = "LPN AI-0987654321 was last scanned at Dubai T3 arrivals at 11:48 GST.\n\nEstimated time to Belt 6: *18 minutes*.";
    botAfter(900, () => push({ id: uid(), role: "bot", kind: "text", text: reply, ts: new Date() }));
  }

  const hasInput = input.trim().length > 0;

  return (
    <div
      ref={containerRef}
      className="flex flex-col"
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        // `height` is set to 100dvh as a CSS baseline; the visualViewport effect
        // immediately overrides this with the real visible-area height in JS.
        // Using explicit top/left/right instead of `inset` avoids the `bottom:0`
        // anchor that fights iOS Safari when the keyboard slides up.
        height: "100dvh",
        background: "#efeae2",
        overflow: "hidden",
      }}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div
        className="flex shrink-0 items-center gap-2 px-2 shadow-md"
        style={{ background: "#128C7E", paddingTop: "10px", paddingBottom: "10px" }}
      >
        <button className="shrink-0 p-1 text-white active:opacity-70">
          <ArrowLeft className="size-[22px]" />
        </button>

        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-[15px] select-none">
          ✈️
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-[5px]">
            <span className="truncate text-[15px] font-semibold leading-tight text-white">
              SkyTrack Baggage Support
            </span>
            {/* WhatsApp-style verified badge */}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
              <circle cx="7" cy="7" r="7" fill="#4fc3f7" />
              <path d="M3.5 7l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-[11.5px] leading-tight text-white/70">Business Account</span>
        </div>

        {/* 3-dot menu — tapping resets the conversation */}
        <button onClick={reset} className="shrink-0 p-1 text-white/80 active:opacity-70" title="New conversation">
          <MoreVertical className="size-5" />
        </button>
      </div>

      {/* ── Message area ─────────────────────────────────────────────────── */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto py-2"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23b0a99f' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          // contain: prevents rubber-band from bubbling to body (iOS + Android)
          overscrollBehavior: "contain",
          // pan-y: lets the browser know this element scrolls vertically,
          // enabling native touch momentum without waiting for JS
          touchAction: "pan-y",
        }}
      >
        <DatePill label="Today" />

        {msgs.map((msg) => {
          if (msg.kind === "text")
            return msg.role === "user"
              ? <UserBubble key={msg.id} text={msg.text} ts={msg.ts} />
              : <BotBubble  key={msg.id} text={msg.text} ts={msg.ts} />;

          if (msg.kind === "card") {
            if (msg.card === "track") return <TrackCard key={msg.id} ts={msg.ts} />;
            if (msg.card === "case")  return <CaseCard  key={msg.id} ts={msg.ts} />;
            if (msg.card === "deliv") return <DelivCard key={msg.id} ts={msg.ts} />;
          }

          if (msg.kind === "pill")
            return (
              <div key={msg.id} className="flex justify-center py-1">
                <span className="rounded-full bg-[#e9f0f7]/90 px-3 py-[3px] text-[12px] font-medium text-[#54656f] shadow-sm">
                  {msg.text}
                </span>
              </div>
            );

          return null;
        })}

        {typing && <TypingDots />}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* ── Input bar ────────────────────────────────────────────────────── */}
      <div
        className="flex shrink-0 items-end gap-2 px-2 py-2"
        style={{
          background: "#f0f2f5",
          paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* White pill: emoji · textarea · paperclip · camera */}
        <div className="flex flex-1 items-end gap-2 rounded-[24px] bg-white px-3 py-[9px] shadow-sm">
          <button className="shrink-0 self-end pb-[2px] text-[#8696a0] active:opacity-60">
            <Smile className="size-[22px]" />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendText();
              }
            }}
            placeholder="Type a message"
            className="flex-1 resize-none bg-transparent text-[15px] leading-relaxed text-[#111b21] outline-none placeholder:text-[#8696a0]"
            style={{ maxHeight: 120 }}
          />

          <button className="shrink-0 self-end pb-[2px] text-[#8696a0] active:opacity-60">
            <Paperclip className="size-[20px]" />
          </button>
          <button className="shrink-0 self-end pb-[2px] text-[#8696a0] active:opacity-60">
            <Camera className="size-[20px]" />
          </button>
        </div>

        {/* Send / Mic button */}
        <button
          onClick={hasInput ? sendText : undefined}
          className="flex size-[46px] shrink-0 items-center justify-center rounded-full text-white shadow-sm active:opacity-80"
          style={{ background: "#00a884" }}
        >
          {hasInput
            ? <Send className="size-[20px] translate-x-[1px]" />
            : <Mic className="size-[20px]" />
          }
        </button>
      </div>
    </div>
  );
}
