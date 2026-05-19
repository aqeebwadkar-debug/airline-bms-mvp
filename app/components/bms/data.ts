import type {
  BagRecord,
  DelayReason,
  FlightRecord,
  IncidentRecord,
  InvestigationRecord,
  ScanEventRecord,
  StationLoad,
  TrendPoint,
} from "./types";

export const AIRPORTS = ["DXB", "ORD", "LHR", "JFK", "SIN", "FRA", "CDG", "AMS", "NRT", "KUL", "HKG", "IST", "AUH", "YYZ", "ATL"] as const;

export const MOCK_FLIGHTS: FlightRecord[] = [
  {
    flightNo: "EK412",
    airline: "Global Airways Group — GX",
    origin: "DXB",
    dest: "SYD",
    stdLocal: "2026-05-16 10:25",
    staLocal: "2026-05-17 06:40",
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
    stdLocal: "2026-05-16 17:45",
    staLocal: "2026-05-17 06:10",
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
    stdLocal: "2026-05-16 23:15",
    staLocal: "2026-05-17 09:05",
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
    stdLocal: "2026-05-16 12:05",
    staLocal: "2026-05-16 14:55",
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
    stdLocal: "2026-05-16 15:30",
    staLocal: "2026-05-16 18:05",
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
    stdLocal: "2026-05-15 01:10",
    staLocal: "2026-05-15 07:45",
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
    stdLocal: "2026-05-16 09:40",
    staLocal: "2026-05-16 12:15",
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
  {
    flightNo: "AF229",
    airline: "Alliance Air France — AF",
    origin: "CDG",
    dest: "JFK",
    stdLocal: "2026-05-16 11:20",
    staLocal: "2026-05-16 13:45",
    aircraft: "A330",
    gate: "F14",
    terminal: "T2F",
    status: "Delayed",
    pax: 287,
    bagsPlanned: 318,
    bagsLoaded: 294,
    reconciliationPct: 89.6,
    transferRiskBags: 28,
    delayedBags: 11,
    shortShipped: 4,
  },
  {
    flightNo: "TK581",
    airline: "TransOrbis Carriers — TC",
    origin: "IST",
    dest: "LAX",
    stdLocal: "2026-05-16 14:30",
    staLocal: "2026-05-16 18:50",
    aircraft: "B787",
    gate: "D08",
    terminal: "T1",
    status: "Gate Open",
    pax: 251,
    bagsPlanned: 274,
    bagsLoaded: 261,
    reconciliationPct: 95.3,
    transferRiskBags: 7,
    delayedBags: 3,
    shortShipped: 1,
  },
  {
    flightNo: "CX781",
    airline: "Pacific Crown Airlines — PC",
    origin: "HKG",
    dest: "LHR",
    stdLocal: "2026-05-16 00:05",
    staLocal: "2026-05-16 06:55",
    aircraft: "A350",
    gate: "G22",
    terminal: "T1",
    status: "Boarding",
    pax: 269,
    bagsPlanned: 296,
    bagsLoaded: 288,
    reconciliationPct: 97.3,
    transferRiskBags: 5,
    delayedBags: 2,
    shortShipped: 0,
  },
  {
    flightNo: "NH856",
    airline: "Pacific Crown Airlines — PC",
    origin: "NRT",
    dest: "SYD",
    stdLocal: "2026-05-15 22:45",
    staLocal: "2026-05-16 10:30",
    aircraft: "B777",
    gate: "B07",
    terminal: "T2",
    status: "Departed",
    pax: 233,
    bagsPlanned: 258,
    bagsLoaded: 255,
    reconciliationPct: 98.8,
    transferRiskBags: 3,
    delayedBags: 1,
    shortShipped: 0,
  },
  {
    flightNo: "EY204",
    airline: "Global Airways Group — GX",
    origin: "AUH",
    dest: "LHR",
    stdLocal: "2026-05-15 09:15",
    staLocal: "2026-05-15 13:40",
    aircraft: "A380",
    gate: "A14",
    terminal: "T3",
    status: "Arrived",
    pax: 396,
    bagsPlanned: 441,
    bagsLoaded: 439,
    reconciliationPct: 99.5,
    transferRiskBags: 1,
    delayedBags: 0,
    shortShipped: 0,
  },
  {
    flightNo: "QR617",
    airline: "TransOrbis Carriers — TC",
    origin: "DOH",
    dest: "ORD",
    stdLocal: "2026-05-16 08:55",
    staLocal: "2026-05-16 14:20",
    aircraft: "B777",
    gate: "C19",
    terminal: "T1",
    status: "Delayed",
    pax: 291,
    bagsPlanned: 322,
    bagsLoaded: 287,
    reconciliationPct: 86.4,
    transferRiskBags: 41,
    delayedBags: 18,
    shortShipped: 9,
  },
  {
    flightNo: "KL892",
    airline: "Alliance Air France — AF",
    origin: "AMS",
    dest: "JFK",
    stdLocal: "2026-05-16 13:10",
    staLocal: "2026-05-16 15:35",
    aircraft: "B787",
    gate: "D31",
    terminal: "D",
    status: "Check-in",
    pax: 224,
    bagsPlanned: 246,
    bagsLoaded: 89,
    reconciliationPct: 36.2,
    transferRiskBags: 6,
    delayedBags: 2,
    shortShipped: 0,
  },
  {
    flightNo: "AC876",
    airline: "NorthStar Lines — NS",
    origin: "YYZ",
    dest: "LHR",
    stdLocal: "2026-05-16 20:15",
    staLocal: "2026-05-17 08:30",
    aircraft: "B787",
    gate: "F24",
    terminal: "T1",
    status: "Scheduled",
    pax: 198,
    bagsPlanned: 217,
    bagsLoaded: 0,
    reconciliationPct: 0,
    transferRiskBags: 0,
    delayedBags: 0,
    shortShipped: 0,
  },
  {
    flightNo: "MH307",
    airline: "Pacific Crown Airlines — PC",
    origin: "KUL",
    dest: "LHR",
    stdLocal: "2026-05-16 03:30",
    staLocal: "2026-05-16 09:05",
    aircraft: "A350",
    gate: "H11",
    terminal: "T1",
    status: "Loading",
    pax: 247,
    bagsPlanned: 271,
    bagsLoaded: 238,
    reconciliationPct: 87.8,
    transferRiskBags: 19,
    delayedBags: 7,
    shortShipped: 5,
  },
  {
    flightNo: "AA991",
    airline: "Atlantic Union — AU",
    origin: "MIA",
    dest: "CDG",
    stdLocal: "2026-05-16 18:00",
    staLocal: "2026-05-17 07:55",
    aircraft: "B777",
    gate: "J18",
    terminal: "D",
    status: "Gate Open",
    pax: 279,
    bagsPlanned: 308,
    bagsLoaded: 293,
    reconciliationPct: 95.1,
    transferRiskBags: 8,
    delayedBags: 3,
    shortShipped: 1,
  },
  {
    flightNo: "VS412",
    airline: "Atlantic Union — AU",
    origin: "LHR",
    dest: "JFK",
    stdLocal: "2026-05-16 11:45",
    staLocal: "2026-05-16 14:20",
    aircraft: "A350",
    gate: "B44",
    terminal: "T3",
    status: "Departed",
    pax: 265,
    bagsPlanned: 291,
    bagsLoaded: 289,
    reconciliationPct: 99.3,
    transferRiskBags: 3,
    delayedBags: 1,
    shortShipped: 0,
  },
  {
    flightNo: "WN444",
    airline: "NorthStar Lines — NS",
    origin: "DEN",
    dest: "ATL",
    stdLocal: "2026-05-16 07:20",
    staLocal: "2026-05-16 12:45",
    aircraft: "B737",
    gate: "C12",
    terminal: "B",
    status: "Boarding",
    pax: 143,
    bagsPlanned: 156,
    bagsLoaded: 148,
    reconciliationPct: 94.9,
    transferRiskBags: 5,
    delayedBags: 2,
    shortShipped: 1,
  },
];

const names = [
  ["M. Rahman", "K. Schmidt", "L. Okonkwo"],
  ["S. Patel", "J. Müller", "A. Laurent"],
  ["T. Nguyen", "R. Silva", "H. Andersson"],
  ["C. Park", "D. Osei", "F. Rossi"],
  ["N. Yamamoto", "P. Kowalski", "I. Santos"],
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
    "Accepted",
    "Screened",
    "Delayed",
  ];
  const status =
    overrides.status ??
    statusCycle[idx % statusCycle.length] ??
    "Sorted";
  const nameGroup = names[idx % names.length];
  const passenger = `${nameGroup[idx % 3]}`;
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
      idx % 4 === 0
        ? "Sorter Line A"
        : idx % 4 === 1
          ? "ULD Loader L2"
          : idx % 4 === 2
            ? "Transfer Tunnel T1"
            : "RFID Tunnel Gate",
    station: flight.origin,
    risk:
      status === "Transfer Risk" || status === "Held Security"
        ? "High"
        : status === "Delayed" || status === "Short-shipped"
          ? "Medium"
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
  Array.from({ length: Math.min(16, 8 + (fi % 5)) }, (_, i) =>
    bagFor(fi * 20 + i + 1, f),
  ),
);

// Key investigation-linked bags (mutated after array creation)
const INV_LPNS = {
  lost1: "0176275312",
  missing1: "0176275890",
  missing2: "0176276108",
  escalated1: "0176276441",
  resolved1: "0176277023",
  sla1: "0176277614",
};

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
    reportedAt: "2026-05-16 09:18 UTC",
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
    reportedAt: "2026-05-15 22:41 UTC",
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
    lpn: INV_LPNS.lost1,
    tracerRef: "WT-FRA-773204",
    reportedAt: "2026-05-16 06:02 UTC",
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
    reportedAt: "2026-05-16 07:55 UTC",
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
    reportedAt: "2026-05-15 14:12 UTC",
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
    lpn: INV_LPNS.missing1,
    tracerRef: "WT-SIN-553019",
    reportedAt: "2026-05-16 08:33 UTC",
    summary: "Minimum connection time breach predicted for 11 bags.",
    rootCauseHint: "Inbound delay — gate reassignment",
  },
  {
    id: "INC-240958",
    category: "Lost Bag",
    status: "Escalated",
    severity: "Critical",
    station: "CDG",
    flightNo: "AF229",
    lpn: INV_LPNS.escalated1,
    tracerRef: "WT-CDG-229441",
    reportedAt: "2026-05-16 10:07 UTC",
    summary: "Bag not loaded despite manifest confirmation — last scan at CDG pier C.",
    rootCauseHint: "Loading slip — manual override not actioned",
  },
  {
    id: "INC-240964",
    category: "Missing Scan",
    status: "Investigating",
    severity: "High",
    station: "IST",
    flightNo: "TK581",
    lpn: INV_LPNS.missing2,
    tracerRef: "WT-IST-581092",
    reportedAt: "2026-05-16 11:22 UTC",
    summary: "Telemetry gap after sortation — no downstream read for 3+ hours.",
    rootCauseHint: "RFID reader offline — IT ticket raised",
  },
  {
    id: "INC-240971",
    category: "Delayed Bag",
    status: "Open",
    severity: "High",
    station: "DOH",
    flightNo: "QR617",
    lpn: INV_LPNS.sla1,
    tracerRef: "WT-DOH-617778",
    reportedAt: "2026-05-16 07:44 UTC",
    summary: "Bag delayed at Doha hub due to transfer tunnel saturation during morning peak.",
    rootCauseHint: "Capacity breach — transfer tunnel occupancy 94%",
  },
  {
    id: "INC-240982",
    category: "Transfer Risk",
    status: "Resolved",
    severity: "Medium",
    station: "AMS",
    flightNo: "KL892",
    lpn: INV_LPNS.resolved1,
    tracerRef: "WT-AMS-892331",
    reportedAt: "2026-05-15 19:30 UTC",
    summary: "MCT breach resolved; bag rerouted to next available rotation with passenger notified.",
    rootCauseHint: "Tight connection window — handled via fast-track",
  },
  {
    id: "INC-240989",
    category: "Damaged Bag",
    status: "Closed",
    severity: "Low",
    station: "NRT",
    flightNo: "NH856",
    lpn: MOCK_BAGS.find((b) => b.flightNo === "NH856")?.lpn ?? null,
    tracerRef: "WT-NRT-856041",
    reportedAt: "2026-05-15 21:15 UTC",
    summary: "Handle shear reported at carousel. Passenger compensated per policy.",
    rootCauseHint: "Mechanical carousel pressure",
  },
];

const extraIncidents: IncidentRecord[] = Array.from({ length: 9 }, (_, i) => ({
  id: `INC-24095${i}`,
  category: ["Delayed Bag", "Tag Error", "Loading Error", "Offload", "Missing Scan"][i % 5],
  status: ["Open", "Investigating", "Resolved"][i % 3] as IncidentRecord["status"],
  severity: (["Low", "Medium", "High"] as const)[i % 3],
  station: AIRPORTS[i % AIRPORTS.length],
  flightNo: MOCK_FLIGHTS[i % MOCK_FLIGHTS.length].flightNo,
  lpn: i % 2 === 0 ? MOCK_BAGS[(i * 7) % MOCK_BAGS.length].lpn : null,
  tracerRef: `WT-${AIRPORTS[i % AIRPORTS.length]}-99${100 + i}`,
  reportedAt: `2026-05-${String(14 + (i % 3)).padStart(2, "0")} ${10 + i}:22 UTC`,
  summary: "Operational review entry generated from monitoring thresholds.",
  rootCauseHint: "Automated classification — pending supervisor validation",
}));

export const ALL_INCIDENTS: IncidentRecord[] = [
  ...MOCK_INCIDENTS,
  ...extraIncidents,
];

export const MOCK_INVESTIGATIONS: InvestigationRecord[] = [
  {
    id: "INV-10041",
    caseType: "Lost in Transit",
    status: "Escalated",
    severity: "Critical",
    lpn: INV_LPNS.lost1,
    flightNo: "LH441",
    station: "FRA",
    passenger: "A. Laurent",
    assignedTeam: "FRA Ground Operations",
    reportedAt: "2026-05-16 06:02 UTC",
    lastUpdated: "2026-05-16 11:45 UTC",
    summary: "Bag not scanned post FRA transfer gate. Last telemetry: Transfer Tunnel T2.",
    lastKnownLocation: "FRA Transfer Tunnel T2",
    aiRecommendation: "Check ULD AKE-04229 loading manifest. Cross-reference with misrouted items at FRA pier C.",
    slaBreach: true,
    incidentRef: "INC-240917",
    resolutionNotes: undefined,
  },
  {
    id: "INV-10042",
    caseType: "Missing Scan",
    status: "Active",
    severity: "High",
    lpn: INV_LPNS.missing1,
    flightNo: "QF902",
    station: "SIN",
    passenger: "T. Nguyen",
    assignedTeam: "SIN Transfer Team",
    reportedAt: "2026-05-16 08:33 UTC",
    lastUpdated: "2026-05-16 12:10 UTC",
    summary: "Telemetry gap — no read after SIN sortation stage. MCT window closes in 38 minutes.",
    lastKnownLocation: "SIN Sortation — Pier B",
    aiRecommendation: "Deploy handheld scan sweep at SIN Transfer Pier B. Validate outbound ULD manifest against inbound scan list.",
    slaBreach: false,
    incidentRef: "INC-240941",
    resolutionNotes: undefined,
  },
  {
    id: "INV-10043",
    caseType: "Escalated",
    status: "Escalated",
    severity: "Critical",
    lpn: INV_LPNS.escalated1,
    flightNo: "AF229",
    station: "CDG",
    passenger: "F. Rossi",
    assignedTeam: "CDG Baggage Control",
    reportedAt: "2026-05-16 10:07 UTC",
    lastUpdated: "2026-05-16 13:22 UTC",
    summary: "Bag confirmed on manifest but not loaded. Manual override log shows unresolved note at CDG pier C.",
    lastKnownLocation: "CDG Pier C — Loading Zone",
    aiRecommendation: "Escalate to ground handling supervisor. Request CCTV review for CDG pier C loading window 09:40–10:05 local.",
    slaBreach: true,
    incidentRef: "INC-240958",
    resolutionNotes: undefined,
  },
  {
    id: "INV-10044",
    caseType: "Missing Scan",
    status: "Active",
    severity: "High",
    lpn: INV_LPNS.missing2,
    flightNo: "TK581",
    station: "IST",
    passenger: "N. Yamamoto",
    assignedTeam: "IST Ops Desk",
    reportedAt: "2026-05-16 11:22 UTC",
    lastUpdated: "2026-05-16 13:55 UTC",
    summary: "RFID reader offline at IST sorter station 4 caused telemetry gap. Bag location unconfirmed.",
    lastKnownLocation: "IST Sorter Station 4",
    aiRecommendation: "Restore RFID reader IST-SRT-04. Issue manual scan sweep at outbound ULD staging. Validate via fallback barcode scan.",
    slaBreach: false,
    incidentRef: "INC-240964",
    resolutionNotes: undefined,
  },
  {
    id: "INV-10045",
    caseType: "SLA Breach",
    status: "SLA Breach",
    severity: "High",
    lpn: INV_LPNS.sla1,
    flightNo: "QR617",
    station: "DOH",
    passenger: "D. Osei",
    assignedTeam: "DOH Transfer Ops",
    reportedAt: "2026-05-16 07:44 UTC",
    lastUpdated: "2026-05-16 12:30 UTC",
    summary: "Transfer dwell exceeded 4-hour SLA threshold. Passenger connection at ORD at risk.",
    lastKnownLocation: "DOH Transfer Pier D",
    aiRecommendation: "Fast-track bag to ORD recovery belt. Notify passenger via CRM. Consider next rotation uplift if departure imminent.",
    slaBreach: true,
    incidentRef: "INC-240971",
    resolutionNotes: undefined,
  },
  {
    id: "INV-10046",
    caseType: "Resolved & Delivered",
    status: "Resolved",
    severity: "Medium",
    lpn: INV_LPNS.resolved1,
    flightNo: "KL892",
    station: "AMS",
    passenger: "P. Kowalski",
    assignedTeam: "AMS Baggage Recovery",
    reportedAt: "2026-05-15 19:30 UTC",
    lastUpdated: "2026-05-16 07:15 UTC",
    summary: "MCT breach resolved. Bag rerouted via AMS–JFK overnight rotation. Delivered to carousel C9.",
    lastKnownLocation: "JFK Arrival Carousel C9",
    aiRecommendation: "Case closed. Update WorldTracer and notify passenger of successful delivery.",
    slaBreach: false,
    incidentRef: "INC-240982",
    resolutionNotes: "Bag delivered to JFK carousel C9 at 06:55 UTC. Passenger confirmed receipt via mobile.",
  },
  {
    id: "INV-10047",
    caseType: "Investigation Required",
    status: "Active",
    severity: "Medium",
    lpn: MOCK_BAGS.find((b) => b.flightNo === "MH307")?.lpn ?? null,
    flightNo: "MH307",
    station: "KUL",
    passenger: "C. Park",
    assignedTeam: "KUL Ground Handling",
    reportedAt: "2026-05-16 04:18 UTC",
    lastUpdated: "2026-05-16 09:40 UTC",
    summary: "Bag tagged Priority but routed through standard sortation lane — potential reconciliation mismatch.",
    lastKnownLocation: "KUL Sortation Lane 3",
    aiRecommendation: "Cross-reference priority tag manifest with sortation records. Verify ULD assignment for MH307 forward hold.",
    slaBreach: false,
    incidentRef: undefined,
    resolutionNotes: undefined,
  },
  {
    id: "INV-10048",
    caseType: "Resolved & Delivered",
    status: "Resolved",
    severity: "Low",
    lpn: MOCK_BAGS.find((b) => b.flightNo === "EY204")?.lpn ?? null,
    flightNo: "EY204",
    station: "AUH",
    passenger: "S. Patel",
    assignedTeam: "AUH Baggage Services",
    reportedAt: "2026-05-15 10:30 UTC",
    lastUpdated: "2026-05-15 14:22 UTC",
    summary: "Bag delayed at AUH check-in due to weight variance. Re-tagged and loaded on EY204 successfully.",
    lastKnownLocation: "LHR Arrival Carousel B2",
    aiRecommendation: "Resolved. Log weight variance for audit trail.",
    slaBreach: false,
    incidentRef: undefined,
    resolutionNotes: "Bag successfully loaded and delivered to LHR carousel B2. No further action required.",
  },
];

const SCAN_POINTS = [
  ["Check-in Belt", "CI-HH-01"],
  ["Security Matrix", "SEC-FXD-12"],
  ["Sorter Primary", "SRT-A-07"],
  ["ULD Loader", "ULD-L2-03"],
  ["Transfer Tunnel", "TRN-HH-04"],
  ["Arrival Carousel", "ARR-FXD-02"],
  ["RFID Tunnel", "RFID-TUN-01"],
  ["Gate Reader", "GTE-FXD-08"],
  ["Sortation Camera", "CAM-SRT-03"],
] as const;

const SCAN_RESULTS: ScanEventRecord["result"][] = [
  "Success",
  "Success",
  "Success",
  "Success",
  "No-read",
  "Exception",
  "Success",
  "Success",
  "Telemetry Gap",
  "Retry Required",
  "Success",
  "Partial Read",
];

export const MOCK_SCANS: ScanEventRecord[] = MOCK_BAGS.slice(0, 60).flatMap(
  (bag, i): ScanEventRecord[] => {
    const flight = MOCK_FLIGHTS.find((f) => f.flightNo === bag.flightNo)!;
    const baseIdx = i % SCAN_POINTS.length;
    const [point, devSuffix] = SCAN_POINTS[baseIdx];
    const types: ScanEventRecord["scanType"][] = [
      "Barcode",
      "RFID Fixed",
      "RFID Handheld",
      "ULD",
      "RFID Tunnel",
      "Gate Reader",
      "Sortation Camera",
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
        result: SCAN_RESULTS[i % SCAN_RESULTS.length],
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
        result: i % 19 === 0 ? "Missing Arrival Scan" : "Success",
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

export const STATION_PERF: StationLoad[] = [
  { code: "DXB", bagsPerHour: 3200, capacityPct: 62, mishandled24h: 8 },
  { code: "ORD", bagsPerHour: 3620, capacityPct: 79, mishandled24h: 14 },
  { code: "LHR", bagsPerHour: 4040, capacityPct: 74, mishandled24h: 11 },
  { code: "JFK", bagsPerHour: 4460, capacityPct: 68, mishandled24h: 7 },
  { code: "SIN", bagsPerHour: 4880, capacityPct: 81, mishandled24h: 16 },
  { code: "FRA", bagsPerHour: 5300, capacityPct: 71, mishandled24h: 12 },
  { code: "CDG", bagsPerHour: 3850, capacityPct: 76, mishandled24h: 18 },
  { code: "AMS", bagsPerHour: 3470, capacityPct: 65, mishandled24h: 6 },
];

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

export function investigationById(id: string): InvestigationRecord | undefined {
  return MOCK_INVESTIGATIONS.find((i) => i.id === id);
}

export function scansForLpn(lpn: string): ScanEventRecord[] {
  return MOCK_SCANS.filter((s) => s.lpn === lpn).sort((a, b) =>
    a.at.localeCompare(b.at),
  );
}

export function incidentsForLpn(lpn: string): IncidentRecord[] {
  return ALL_INCIDENTS.filter((i) => i.lpn === lpn);
}

export function investigationForLpn(lpn: string): InvestigationRecord | undefined {
  return MOCK_INVESTIGATIONS.find((i) => i.lpn === lpn);
}

// Patch LH441 bag to use investigation LPN
const lh441Bag = MOCK_BAGS.find((b) => b.flightNo === "LH441");
if (lh441Bag) {
  lh441Bag.lpn = INV_LPNS.lost1;
  lh441Bag.status = "Transfer Risk";
  lh441Bag.risk = "High";
}

/** Hour × station intensity 0–5 for heat strip */
export const HEATMAP_GRID: { station: string; hour: string; v: number }[] =
  ["DXB", "ORD", "LHR", "JFK", "SIN", "FRA", "CDG", "AMS"].flatMap((station) =>
    ["06", "10", "14", "18"].map((hour, hi) => ({
      station,
      hour: `${hour}:00`,
      v: (station.charCodeAt(0) + hi * 3) % 6,
    })),
  );

/** Export helper: convert array of objects to CSV string */
export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => {
        const v = row[h];
        const s = v == null ? "" : String(v);
        return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(","),
    ),
  ];
  return lines.join("\n");
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]): void {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
