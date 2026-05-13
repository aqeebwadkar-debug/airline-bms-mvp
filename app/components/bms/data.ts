import type {
  BagRecord,
  DelayReason,
  FlightRecord,
  IncidentRecord,
  ScanEventRecord,
  StationLoad,
  TrendPoint,
} from "./types";

export const AIRPORTS = ["DXB", "ORD", "LHR", "JFK", "SIN", "FRA"] as const;

export const MOCK_FLIGHTS: FlightRecord[] = [
  {
    flightNo: "EK412",
    airline: "Global Airways Group — GX",
    origin: "DXB",
    dest: "SYD",
    stdLocal: "2026-05-11 10:25",
    staLocal: "2026-05-12 06:40",
    aircraft: "A380",
    gate: "C22",
    terminal: "T3",
    status: "Boarding",
    pax: 412,
    bagsPlanned: 463,
    bagsLoaded: 441,
    reconciliationPct: 95.2,
    transferRiskBags: 18,
    delayedBags: 6,
    shortShipped: 3,
  },
  {
    flightNo: "UA884",
    airline: "United Meridian — UM",
    origin: "ORD",
    dest: "LHR",
    stdLocal: "2026-05-12 17:45",
    staLocal: "2026-05-13 06:10",
    aircraft: "B777",
    gate: "K09",
    terminal: "T1",
    status: "Delayed",
    pax: 268,
    bagsPlanned: 292,
    bagsLoaded: 277,
    reconciliationPct: 91.4,
    transferRiskBags: 34,
    delayedBags: 14,
    shortShipped: 5,
  },
  {
    flightNo: "QF902",
    airline: "Pacific Crown Airlines — PC",
    origin: "SIN",
    dest: "MEL",
    stdLocal: "2026-05-13 23:15",
    staLocal: "2026-05-14 09:05",
    aircraft: "A350",
    gate: "A05",
    terminal: "T3",
    status: "Loading",
    pax: 241,
    bagsPlanned: 268,
    bagsLoaded: 251,
    reconciliationPct: 93.7,
    transferRiskBags: 11,
    delayedBags: 5,
    shortShipped: 2,
  },
  {
    flightNo: "LH441",
    airline: "EuroJet Cooperative — EJ",
    origin: "FRA",
    dest: "JFK",
    stdLocal: "2026-05-14 12:05",
    staLocal: "2026-05-14 14:55",
    aircraft: "A343",
    gate: "Z62",
    terminal: "T1",
    status: "Gate Open",
    pax: 194,
    bagsPlanned: 208,
    bagsLoaded: 184,
    reconciliationPct: 88.5,
    transferRiskBags: 21,
    delayedBags: 9,
    shortShipped: 7,
  },
  {
    flightNo: "BA114",
    airline: "Atlantic Union — AU",
    origin: "LHR",
    dest: "JFK",
    stdLocal: "2026-05-15 15:30",
    staLocal: "2026-05-15 18:05",
    aircraft: "B787",
    gate: "B33",
    terminal: "T5",
    status: "Check-in",
    pax: 214,
    bagsPlanned: 236,
    bagsLoaded: 128,
    reconciliationPct: 54.2,
    transferRiskBags: 9,
    delayedBags: 2,
    shortShipped: 0,
  },
  {
    flightNo: "EK226",
    airline: "Global Airways Group — GX",
    origin: "LAX",
    dest: "DXB",
    stdLocal: "2026-05-16 16:50",
    staLocal: "2026-05-17 19:20",
    aircraft: "B777",
    gate: "154",
    terminal: "TB",
    status: "Departed",
    pax: 302,
    bagsPlanned: 331,
    bagsLoaded: 329,
    reconciliationPct: 99.4,
    transferRiskBags: 4,
    delayedBags: 1,
    shortShipped: 0,
  },
  {
    flightNo: "SQ318",
    airline: "Pacific Crown Airlines — PC",
    origin: "SIN",
    dest: "LHR",
    stdLocal: "2026-05-11 01:10",
    staLocal: "2026-05-11 07:45",
    aircraft: "A350",
    gate: "E11",
    terminal: "T3",
    status: "Arrived",
    pax: 276,
    bagsPlanned: 305,
    bagsLoaded: 303,
    reconciliationPct: 99.3,
    transferRiskBags: 2,
    delayedBags: 0,
    shortShipped: 1,
  },
  {
    flightNo: "DL552",
    airline: "NorthStar Lines — NS",
    origin: "JFK",
    dest: "ATL",
    stdLocal: "2026-05-14 09:40",
    staLocal: "2026-05-14 12:15",
    aircraft: "B737",
    gate: "T4-B08",
    terminal: "T4",
    status: "Scheduled",
    pax: 162,
    bagsPlanned: 178,
    bagsLoaded: 0,
    reconciliationPct: 0,
    transferRiskBags: 0,
    delayedBags: 0,
    shortShipped: 0,
  },
];

const names = [
  ["M. Rahman", "K. Schmidt", "L. Okonkwo"],
  ["S. Patel", "J. Müller", "A. Laurent"],
  ["T. Nguyen", "R. Silva", "H. Andersson"],
];

function bagFor(
  idx: number,
  flight: FlightRecord,
  overrides: Partial<BagRecord> = {},
): BagRecord {
  const baseLpn = 176260000 + idx * 17 + (flight.flightNo.charCodeAt(0) % 9);
  const statusCycle: BagRecord["status"][] = [
    "Loaded",
    "Sorted",
    "In Transit",
    "Delivered",
    "Transfer Risk",
    "Held Security",
    "Short-shipped",
  ];
  const status =
    overrides.status ??
    statusCycle[idx % statusCycle.length] ??
    "Sorted";
  const nm = names[idx % names.length];
  const passenger = `${nm[idx % 3]}`;
  const date = flight.stdLocal.split(" ")[0];
  const scanHour = 6 + (idx % 12);
  return {
    lpn: String(baseLpn).padStart(10, "0"),
    passenger,
    pnr: `${String.fromCharCode(65 + (idx % 26))}${String.fromCharCode(
      65 + ((idx * 3) % 26),
    )}${1000 + idx}`,
    flightNo: flight.flightNo,
    weightKg: Math.round(18 + (idx % 13) + (idx % 7) * 0.8),
    tagType: idx % 5 === 0 ? "Interline" : idx % 4 === 0 ? "Priority" : "Standard",
    status,
    lastScanAt: `${date} ${String(scanHour).padStart(2, "0")}:${String((idx * 5) % 60).padStart(2, "0")}`,
    scanPoint:
      idx % 3 === 0
        ? "Sorter Line A"
        : idx % 3 === 1
          ? "ULD Loader L2"
          : "Transfer Tunnel T1",
    station: flight.origin,
    risk:
      status === "Transfer Risk" || status === "Held Security"
        ? "High"
        : idx % 11 === 0
          ? "Medium"
          : "Low",
    screening: idx % 17 === 0 ? "Hold" : idx % 15 === 0 ? "Rescreen" : "Cleared",
    r753Step: Math.min(5, 2 + (idx % 4)),
    incidentIds:
      idx % 19 === 0 ? [`INC-${176200 + idx}`] : [],
    ...overrides,
  };
}

export const MOCK_BAGS: BagRecord[] = MOCK_FLIGHTS.flatMap((f, fi) =>
  Array.from({ length: Math.min(14, 6 + (fi % 5)) }, (_, i) =>
    bagFor(fi * 20 + i + 1, f),
  ),
);

export const MOCK_INCIDENTS: IncidentRecord[] = [
  {
    id: "INC-240891",
    category: "Delayed Bag",
    status: "Open",
    severity: "High",
    station: "ORD",
    flightNo: "UA884",
    lpn: MOCK_BAGS.find((b) => b.flightNo === "UA884")?.lpn ?? "0176260194",
    tracerRef: "WT-ORD-884112",
    reportedAt: "2026-05-12 09:18 UTC",
    summary: "Inbound transfer belt slowdown; bag missed planned ULD close.",
    rootCauseHint: "Ground handling delay — tunnel congestion",
  },
  {
    id: "INC-240903",
    category: "Damaged Bag",
    status: "Investigating",
    severity: "Medium",
    station: "LHR",
    flightNo: "BA114",
    lpn: MOCK_BAGS.find((b) => b.flightNo === "BA114")?.lpn ?? null,
    tracerRef: "WT-LHR-441903",
    reportedAt: "2026-05-11 22:41 UTC",
    summary: "Corner abrasion observed at arrival reclaim handoff.",
    rootCauseHint: "Carousel overload shift B",
  },
  {
    id: "INC-240917",
    category: "Lost Bag",
    status: "Escalated",
    severity: "Critical",
    station: "FRA",
    flightNo: "LH441",
    lpn: "0176275312",
    tracerRef: "WT-FRA-773204",
    reportedAt: "2026-05-12 06:02 UTC",
    summary: "No arrival scan at destination; bag still traced last at transfer.",
    rootCauseHint: "Potential mis-sort at hub matrix",
  },
  {
    id: "INC-240928",
    category: "Security Hold",
    status: "Open",
    severity: "Medium",
    station: "DXB",
    flightNo: "EK412",
    lpn: MOCK_BAGS.find((b) => b.flightNo === "EK412")?.lpn ?? null,
    tracerRef: "WT-DXB-901772",
    reportedAt: "2026-05-12 07:55 UTC",
    summary: "Secondary screening requested by regulator sampling.",
    rootCauseHint: "Random inspection queue",
  },
  {
    id: "INC-240935",
    category: "Short-shipped",
    status: "Closed",
    severity: "Low",
    station: "SIN",
    flightNo: "QF902",
    lpn: null,
    tracerRef: "WT-SIN-220881",
    reportedAt: "2026-05-11 14:12 UTC",
    summary: "ULD revised post-departure; bags forwarded next rotation.",
    rootCauseHint: "Late cargo amendment",
  },
  {
    id: "INC-240941",
    category: "Transfer Risk",
    status: "Open",
    severity: "High",
    station: "SIN",
    flightNo: "QF902",
    lpn: "0176260842",
    tracerRef: "WT-SIN-553019",
    reportedAt: "2026-05-12 08:33 UTC",
    summary: "Minimum connection time breach predicted for 11 bags.",
    rootCauseHint: "Inbound delay — gate reassignment",
  },
];

const extraIncidents: IncidentRecord[] = Array.from({ length: 9 }, (_, i) => ({
  id: `INC-24095${i}`,
  category: ["Delayed Bag", "Tag Error", "Loading Error", "Offload"][i % 4],
  status: ["Open", "Investigating", "Resolved"][i % 3] as IncidentRecord["status"],
  severity: (["Low", "Medium", "High"] as const)[i % 3],
  station: AIRPORTS[i % AIRPORTS.length],
  flightNo: MOCK_FLIGHTS[i % MOCK_FLIGHTS.length].flightNo,
  lpn: i % 2 === 0 ? MOCK_BAGS[(i * 7) % MOCK_BAGS.length].lpn : null,
  tracerRef: `WT-${AIRPORTS[i % AIRPORTS.length]}-99${100 + i}`,
  reportedAt: `2026-05-${String(11 + (i % 6)).padStart(2, "0")} ${10 + i}:22 UTC`,
  summary: "Operational review entry generated from monitoring thresholds.",
  rootCauseHint: "Automated classification — pending supervisor validation",
}));

export const ALL_INCIDENTS: IncidentRecord[] = [
  ...MOCK_INCIDENTS,
  ...extraIncidents,
];


const SCAN_POINTS = [
  ["Check-in Belt", "CI-HH-01"],
  ["Security Matrix", "SEC-FXD-12"],
  ["Sorter Primary", "SRT-A-07"],
  ["ULD Loader", "ULD-L2-03"],
  ["Transfer Tunnel", "TRN-HH-04"],
  ["Arrival Carousel", "ARR-FXD-02"],
] as const;

export const MOCK_SCANS: ScanEventRecord[] = MOCK_BAGS.slice(0, 42).flatMap(
  (bag, i): ScanEventRecord[] => {
    const flight = MOCK_FLIGHTS.find((f) => f.flightNo === bag.flightNo)!;
    const baseIdx = i % SCAN_POINTS.length;
    const [point, devSuffix] = SCAN_POINTS[baseIdx];
    const types: ScanEventRecord["scanType"][] = [
      "Barcode",
      "RFID Fixed",
      "RFID Handheld",
      "ULD",
    ];
    const date = flight.stdLocal.split(" ")[0];
    return [
      {
        id: `SCN-${bag.lpn}-${i}-a`,
        at: `${date} ${String(5 + (i % 14)).padStart(2, "0")}:${String((i * 7) % 59).padStart(2, "0")}:42`,
        lpn: bag.lpn,
        flightNo: bag.flightNo,
        scanPoint: point,
        station: flight.origin,
        deviceId: `${flight.origin}-${devSuffix}`,
        scanType: types[i % types.length],
        result: i % 23 === 0 ? "No-read" : i % 31 === 0 ? "Exception" : "Success",
      },
      {
        id: `SCN-${bag.lpn}-${i}-b`,
        at: `${date} ${String(6 + (i % 12)).padStart(2, "0")}:${String((i * 11) % 59).padStart(2, "0")}:09`,
        lpn: bag.lpn,
        flightNo: bag.flightNo,
        scanPoint: SCAN_POINTS[(baseIdx + 2) % SCAN_POINTS.length][0],
        station: flight.dest,
        deviceId: `${flight.dest}-${SCAN_POINTS[(baseIdx + 2) % SCAN_POINTS.length][1]}`,
        scanType: "RFID Fixed",
        result: "Success",
      },
    ];
  },
);

export const TREND_HOURLY: TrendPoint[] = [
  { time: "00:00", bags: 4200, mishandled: 14 },
  { time: "04:00", bags: 6100, mishandled: 21 },
  { time: "08:00", bags: 12400, mishandled: 48 },
  { time: "12:00", bags: 15200, mishandled: 52 },
  { time: "16:00", bags: 13800, mishandled: 39 },
  { time: "20:00", bags: 9100, mishandled: 27 },
];

export const STATION_PERF: StationLoad[] = AIRPORTS.map((code, i) => ({
  code,
  bagsPerHour: 3200 + i * 420,
  capacityPct: 62 + ((i * 17) % 28),
  mishandled24h: 5 + ((i * 3) % 14),
}));

export const DELAY_REASONS: DelayReason[] = [
  { reason: "Transfer tunnel delay", count: 42 },
  { reason: "ULD sequencing", count: 28 },
  { reason: "Tag encoding exception", count: 19 },
  { reason: "Staffing — ramp", count: 14 },
  { reason: "Weather / ground stop", count: 11 },
];

export function flightByNo(no: string): FlightRecord | undefined {
  return MOCK_FLIGHTS.find((f) => f.flightNo === no);
}

export function bagsForFlight(no: string): BagRecord[] {
  return MOCK_BAGS.filter((b) => b.flightNo === no);
}

export function bagByLpn(lpn: string): BagRecord | undefined {
  return MOCK_BAGS.find((b) => b.lpn === lpn);
}

export function incidentById(id: string): IncidentRecord | undefined {
  return ALL_INCIDENTS.find((i) => i.id === id);
}

export function scansForLpn(lpn: string): ScanEventRecord[] {
  return MOCK_SCANS.filter((s) => s.lpn === lpn).sort((a, b) =>
    a.at.localeCompare(b.at),
  );
}

export function incidentsForLpn(lpn: string): IncidentRecord[] {
  return ALL_INCIDENTS.filter((i) => i.lpn === lpn);
}

const lh441Bag = MOCK_BAGS.find((b) => b.flightNo === "LH441");
if (lh441Bag) {
  lh441Bag.lpn = "0176275312";
  lh441Bag.status = "Transfer Risk";
  lh441Bag.risk = "High";
}

/** Hour × station intensity 0–5 for heat strip */
export const HEATMAP_GRID: { station: string; hour: string; v: number }[] =
  AIRPORTS.flatMap((station) =>
    ["06", "10", "14", "18"].map((hour, hi) => ({
      station,
      hour: `${hour}:00`,
      v: (station.charCodeAt(0) + hi * 3) % 6,
    })),
  );
