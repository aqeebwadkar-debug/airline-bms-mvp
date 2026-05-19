"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Plane,
  Briefcase,
  ScanLine,
  AlertTriangle,
  Bot,
  BarChart3,
  Bell,
  RefreshCw,
  Search,
  FileSearch,
} from "lucide-react";
import { AiAssistantScreen } from "./components/bms/ai-assistant-screen";
import { AnalyticsScreen } from "./components/bms/analytics-screen";
import { BagDetailScreen } from "./components/bms/bag-detail-screen";
import { BagsScreen } from "./components/bms/bags-screen";
import { cn } from "./components/bms/cn";
import {
  ALL_INCIDENTS,
  bagByLpn,
  flightByNo,
} from "./components/bms/data";
import { DashboardScreen } from "./components/bms/dashboard-screen";
import { FlightDetailScreen } from "./components/bms/flight-detail-screen";
import { FlightsScreen } from "./components/bms/flights-screen";
import { IncidentDetailScreen } from "./components/bms/incident-detail-screen";
import { IncidentReportScreen } from "./components/bms/incident-report-screen";
import { IncidentsScreen } from "./components/bms/incidents-screen";
import { InvestigationScreen } from "./components/bms/investigation-screen";
import { ScansScreen } from "./components/bms/scans-screen";

type PrimaryNav =
  | "dashboard"
  | "flights"
  | "bags"
  | "scans"
  | "incidents"
  | "investigation"
  | "ai"
  | "analytics";

type Overlay =
  | { kind: "flight"; flightNo: string }
  | { kind: "bag"; lpn: string }
  | { kind: "incident"; incidentId: string }
  | { kind: "incident-report" };

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [router]);

  const [primary, setPrimary] = useState<PrimaryNav>(() => {
    try {
      const saved = localStorage.getItem("bms_primary_nav");
      if (saved && (["dashboard","flights","bags","scans","incidents","investigation","ai","analytics"] as string[]).includes(saved)) {
        return saved as PrimaryNav;
      }
    } catch {}
    return "dashboard";
  });
  const [stack, setStack] = useState<Overlay[]>([]);
  const [globalQuery, setGlobalQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [syncTick, setSyncTick] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifications on outside click
  useEffect(() => {
    if (!notificationsOpen) return;
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notificationsOpen]);

  // Close notifications on ESC
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setNotificationsOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const NOTIFICATIONS = [
    {
      id: "notif-1",
      title: "UA884 reconciliation dropped below threshold",
      subtitle: "Open flight exception requires supervisor review.",
      target: { kind: "flight" as const, flightNo: "UA884" },
    },
    {
      id: "notif-2",
      title: "Transfer delay detected at ORD",
      subtitle: "ORD transfer tunnel occupancy above 80%.",
      target: { kind: "flight" as const, flightNo: "UA884" },
    },
    {
      id: "notif-3",
      title: "Security hold applied to LPN 0176260023",
      subtitle: "Bag flagged at DXB checkpoint.",
      target: { kind: "bag" as const, lpn: "0176260023" },
    },
    {
      id: "notif-4",
      title: "Pending incident review at LHR",
      subtitle: "Case INC-240903 is awaiting action.",
      target: { kind: "incident" as const, incidentId: "INC-240903" },
    },
    {
      id: "notif-5",
      title: "Flight BA114 shows loading variance",
      subtitle: "Manual recount recommended prior departure.",
      target: { kind: "flight" as const, flightNo: "BA114" },
    },
    {
      id: "notif-6",
      title: "QR617 SLA breach — DOH transfer dwell +4h",
      subtitle: "Investigation INV-10045 escalated.",
      target: { kind: "incident" as const, incidentId: "INC-240971" },
    },
  ];

  const searchResults = useMemo(() => {
    const query = globalQuery.trim().toLowerCase();
    if (!query) return [] as Array<{
      id: string;
      label: string;
      subtitle: string;
      action: () => void;
    }>;

    const results: Array<{
      id: string;
      label: string;
      subtitle: string;
      action: () => void;
    }> = [];

    const bag = bagByLpn(query.toUpperCase());
    if (bag) {
      results.push({
        id: `bag-${bag.lpn}`,
        label: `Bag ${bag.lpn}`,
        subtitle: `${bag.station} • ${bag.status}`,
        action: () => pushOverlay({ kind: "bag", lpn: bag.lpn }),
      });
    }

    const flight = flightByNo(query.toUpperCase());
    if (flight) {
      results.push({
        id: `flight-${flight.flightNo}`,
        label: `Flight ${flight.flightNo}`,
        subtitle: `${flight.origin} → ${flight.dest} • ${flight.status}`,
        action: () => pushOverlay({ kind: "flight", flightNo: flight.flightNo }),
      });
    }

    const incident = ALL_INCIDENTS.find(
      (i) => i.id.toLowerCase() === query || i.tracerRef.toLowerCase() === query,
    );
    if (incident) {
      results.push({
        id: `incident-${incident.id}`,
        label: `Incident ${incident.id}`,
        subtitle: `${incident.category} • ${incident.status}`,
        action: () => pushOverlay({ kind: "incident", incidentId: incident.id }),
      });
    }

    return results;
  }, [globalQuery]);

  const top = stack[stack.length - 1];

  function navigatePrimary(next: PrimaryNav) {
    setPrimary(next);
    setStack([]);
    setNotificationsOpen(false);
    try { localStorage.setItem("bms_primary_nav", next); } catch {}
  }

  function pushOverlay(entry: Overlay) {
    setStack((s) => [...s, entry]);
  }

  function popOverlay() {
    setStack((s) => s.slice(0, -1));
  }

  function resolveGlobalSearch(raw: string) {
    const q = raw.trim();
    if (!q) return;
    if (bagByLpn(q)) {
      pushOverlay({ kind: "bag", lpn: q });
      return;
    }
    if (flightByNo(q)) {
      pushOverlay({ kind: "flight", flightNo: q });
      return;
    }
    const inc = ALL_INCIDENTS.find((i) => i.id === q || i.tracerRef === q);
    if (inc) {
      pushOverlay({ kind: "incident", incidentId: inc.id });
      return;
    }
  }

  const headerTitle = useMemo(() => {
    if (top?.kind === "incident-report") return "Report incident";
    if (top?.kind === "incident") return `Incident ${top.incidentId}`;
    if (top?.kind === "bag") return `Bag ${top.lpn}`;
    if (top?.kind === "flight") return `Flight ${top.flightNo}`;
    switch (primary) {
      case "dashboard":
        return "Dashboard";
      case "flights":
        return "Flights";
      case "bags":
        return "Bag Tracking";
      case "scans":
        return "Scan Events";
      case "incidents":
        return "Incidents";
      case "investigation":
        return "Baggage Investigation & Resolution";
      case "ai":
        return "Baggage Assistant";
      case "analytics":
        return "Analytics";
      default:
        return "Workspace";
    }
  }, [primary, top]);

  const headerSubtitle = !top ? (() => {
    switch (primary) {
      case "dashboard":     return "Centralized visibility across baggage handling, flight activity, and incident monitoring.";
      case "flights":       return "Monitor active baggage handling workflows across scheduled flights.";
      case "bags":          return "Track baggage movement, scan activity, and operational exceptions.";
      case "scans":         return "Live baggage scan activity across operational scan checkpoints.";
      case "incidents":     return "Track baggage incidents, escalations, and operational disruptions.";
      case "investigation": return "Track and resolve baggage exceptions — lost bags, missing scans, transfer risk, and SLA breaches.";
      case "ai":            return "Intelligent operations assistant for baggage tracking, flight operations, and incident analysis.";
      case "analytics":     return "Network-wide baggage throughput, reconciliation trends, scan compliance, and transfer-risk insights.";
      default:              return "";
    }
  })() : "";

  const body = (() => {
    if (top?.kind === "incident-report") {
      return (
        <IncidentReportScreen
          onCancel={popOverlay}
          onSubmitted={popOverlay}
        />
      );
    }
    if (top?.kind === "incident") {
      return (
        <IncidentDetailScreen
          incidentId={top.incidentId}
          onBack={popOverlay}
          onOpenBag={(lpn) => pushOverlay({ kind: "bag", lpn })}
          onOpenFlight={(flightNo) => pushOverlay({ kind: "flight", flightNo })}
          syncTick={syncTick}
        />
      );
    }
    if (top?.kind === "bag") {
      return (
        <BagDetailScreen
          lpn={top.lpn}
          onBack={popOverlay}
          onOpenFlight={(flightNo) => pushOverlay({ kind: "flight", flightNo })}
          onOpenIncident={(incidentId) =>
            pushOverlay({ kind: "incident", incidentId })
          }
          syncTick={syncTick}
        />
      );
    }
    if (top?.kind === "flight") {
      return (
        <FlightDetailScreen
          flightNo={top.flightNo}
          onBack={popOverlay}
          onOpenBag={(lpn) => pushOverlay({ kind: "bag", lpn })}
          syncTick={syncTick}
        />
      );
    }

    switch (primary) {
      case "dashboard":
        return (
          <DashboardScreen
            onOpenFlight={(flightNo) => pushOverlay({ kind: "flight", flightNo })}
            onOpenBag={(lpn) => pushOverlay({ kind: "bag", lpn })}
            onOpenIncident={(incidentId) =>
              pushOverlay({ kind: "incident", incidentId })
            }
            syncTick={syncTick}
          />
        );
      case "flights":
        return (
          <FlightsScreen
            onOpenFlight={(flightNo) => pushOverlay({ kind: "flight", flightNo })}
            syncTick={syncTick}
          />
        );
      case "bags":
        return (
          <BagsScreen
            onOpenBag={(lpn) => pushOverlay({ kind: "bag", lpn })}
            onOpenInvestigation={() => navigatePrimary("investigation")}
            syncTick={syncTick}
          />
        );
      case "scans":
        return (
          <ScansScreen
            onOpenBag={(lpn) => pushOverlay({ kind: "bag", lpn })}
            syncTick={syncTick}
          />
        );
      case "incidents":
        return (
          <IncidentsScreen
            onOpenIncident={(incidentId) =>
              pushOverlay({ kind: "incident", incidentId })
            }
            onOpenBag={(lpn) => pushOverlay({ kind: "bag", lpn })}
            onReport={() => pushOverlay({ kind: "incident-report" })}
            onOpenInvestigation={() => navigatePrimary("investigation")}
            syncTick={syncTick}
          />
        );
      case "investigation":
        return (
          <InvestigationScreen
            onOpenBag={(lpn) => pushOverlay({ kind: "bag", lpn })}
            onOpenFlight={(flightNo) => pushOverlay({ kind: "flight", flightNo })}
            onOpenIncident={(incidentId) => pushOverlay({ kind: "incident", incidentId })}
            syncTick={syncTick}
          />
        );
      case "ai":
        return (
          <AiAssistantScreen
            onNavigate={(target) => navigatePrimary(target as PrimaryNav)}
            syncTick={syncTick}
          />
        );
      case "analytics":
        return <AnalyticsScreen syncTick={syncTick} />;
      default:
        return null;
    }
  })();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100 text-slate-900 lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-slate-800 bg-slate-950 text-slate-200 sm:w-60 sm:border-b-0 sm:border-r lg:w-64">
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            B
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              Airline BMS
            </p>
            <p className="truncate text-[11px] text-slate-400">
              Operations control suite
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Operations
          </p>
          <SidebarButton
            icon={LayoutDashboard}
            label="Dashboard"
            active={primary === "dashboard"}
            onClick={() => navigatePrimary("dashboard")}
          />
          <SidebarButton
            icon={Plane}
            label="Flights"
            active={primary === "flights"}
            onClick={() => navigatePrimary("flights")}
          />
          <SidebarButton
            icon={Briefcase}
            label="Bag Tracking"
            active={primary === "bags"}
            onClick={() => navigatePrimary("bags")}
          />
          <SidebarButton
            icon={ScanLine}
            label="Scan Events"
            active={primary === "scans"}
            onClick={() => navigatePrimary("scans")}
          />

          <p className="mt-4 px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Issues & insights
          </p>
          <SidebarButton
            icon={AlertTriangle}
            label="Incidents"
            active={primary === "incidents"}
            onClick={() => navigatePrimary("incidents")}
          />
          <SidebarButton
            icon={FileSearch}
            label="Investigation"
            active={primary === "investigation"}
            onClick={() => navigatePrimary("investigation")}
          />
          <SidebarButton
            icon={Bot}
            label="Baggage Assistant"
            active={primary === "ai"}
            onClick={() => navigatePrimary("ai")}
          />
          <SidebarButton
            icon={BarChart3}
            label="Analytics"
            active={primary === "analytics"}
            onClick={() => navigatePrimary("analytics")}
          />
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-slate-900/80 px-3 py-2 ring-1 ring-slate-800">
            <div className="flex size-8 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
              OP
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">
                Duty supervisor
              </p>
              <p className="truncate text-[11px] text-slate-400">
                operations@airline-bms.local
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-2 lg:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-slate-900 lg:text-base">
              {headerTitle}
            </h1>
            {headerSubtitle ? (
              <p className="mt-0.5 text-[11px] text-slate-500">{headerSubtitle}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                onFocus={() => setSearchActive(true)}
                onBlur={() => {
                  window.setTimeout(() => setSearchActive(false), 150);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    resolveGlobalSearch(globalQuery);
                  }
                }}
                placeholder="Jump to flight, LPN, incident…"
                className="h-9 w-56 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none ring-blue-500/30 focus:bg-white focus:ring-2 lg:w-72"
              />
              {searchActive && searchResults.length > 0 ? (
                <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        item.action();
                        setSearchActive(false);
                        setGlobalQuery("");
                      }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50"
                    >
                      <div className="font-medium text-slate-900">{item.label}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500">{item.subtitle}</div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen((open) => !open)}
                className="relative flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="size-4" />
                <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>
              {notificationsOpen ? (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <div className="border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Operational alerts
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {NOTIFICATIONS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false);
                          pushOverlay(item.target);
                        }}
                        className="w-full px-4 py-3 text-left text-xs hover:bg-slate-50"
                      >
                        <div className="font-medium text-slate-900">{item.title}</div>
                        <div className="mt-0.5 text-[11px] text-slate-500">{item.subtitle}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setSyncTick((t) => t + 1)}
              className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Sync live feed"
              title="Sync live feed"
            >
              <RefreshCw className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("isLoggedIn");
                router.push("/login");
              }}
              className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Sign out"
              title="Sign out"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 lg:px-6 lg:py-5">
          {body}
        </div>
      </main>
    </div>
  );
}

function SidebarButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors",
        active
          ? "bg-blue-600 text-white shadow-sm shadow-blue-900/30"
          : "text-slate-300 hover:bg-slate-900 hover:text-white",
      )}
    >
      <Icon className="size-4 shrink-0 opacity-90" />
      <span className="truncate">{label}</span>
    </button>
  );
}
