export type FlightStatus =
  | "Scheduled"
  | "Check-in"
  | "Boarding"
  | "Departed"
  | "Arrived"
  | "Delayed"
  | "Loading"
  | "Gate Open";

export type BagStatus =
  | "Accepted"
  | "Screened"
  | "Sorted"
  | "Loaded"
  | "In Transit"
  | "Transfer Risk"
  | "Delivered"
  | "Delayed"
  | "Held Security"
  | "Short-shipped";

export type IncidentStatus =
  | "Open"
  | "Investigating"
  | "Escalated"
  | "Resolved"
  | "Closed";

export type Severity = "Low" | "Medium" | "High" | "Critical";

export interface FlightRecord {
  flightNo: string;
  airline: string;
  origin: string;
  dest: string;
  stdLocal: string;
  staLocal: string;
  aircraft: string;
  gate: string;
  terminal: string;
  status: FlightStatus;
  pax: number;
  bagsPlanned: number;
  bagsLoaded: number;
  reconciliationPct: number;
  transferRiskBags: number;
  delayedBags: number;
  shortShipped: number;
}

export interface BagRecord {
  lpn: string;
  passenger: string;
  pnr: string;
  flightNo: string;
  weightKg: number;
  tagType: "Standard" | "Priority" | "Interline";
  status: BagStatus;
  lastScanAt: string;
  scanPoint: string;
  station: string;
  risk: Severity | "Low";
  screening: "Cleared" | "Hold" | "Rescreen";
  r753Step: number;
  incidentIds: string[];
}

export interface ScanEventRecord {
  id: string;
  at: string;
  lpn: string;
  flightNo: string;
  scanPoint: string;
  station: string;
  deviceId: string;
  scanType: "RFID Fixed" | "RFID Handheld" | "Barcode" | "ULD";
  result: "Success" | "No-read" | "Exception";
}

export interface IncidentRecord {
  id: string;
  category: string;
  status: IncidentStatus;
  severity: Severity;
  station: string;
  flightNo: string;
  lpn: string | null;
  tracerRef: string;
  reportedAt: string;
  summary: string;
  rootCauseHint: string;
}

export interface StationLoad {
  code: string;
  bagsPerHour: number;
  capacityPct: number;
  mishandled24h: number;
}

export interface TrendPoint {
  time: string;
  bags: number;
  mishandled: number;
}

export interface DelayReason {
  reason: string;
  count: number;
}
