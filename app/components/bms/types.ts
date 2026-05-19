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

export type InvestigationStatus =
  | "Active"
  | "Under Resolution"
  | "Resolved"
  | "Escalated"
  | "SLA Breach";

export type InvestigationCaseType =
  | "Missing Scan"
  | "Lost in Transit"
  | "Under Investigation"
  | "Escalated"
  | "Resolved & Delivered"
  | "Investigation Required"
  | "SLA Breach";

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
  scanType: "RFID Fixed" | "RFID Handheld" | "Barcode" | "ULD" | "RFID Tunnel" | "Gate Reader" | "Sortation Camera";
  result: "Success" | "No-read" | "Exception" | "Retry Required" | "Partial Read" | "Telemetry Gap" | "Missing Arrival Scan" | "Delayed Read";
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

export interface InvestigationRecord {
  id: string;
  caseType: InvestigationCaseType;
  status: InvestigationStatus;
  severity: Severity;
  lpn: string | null;
  flightNo: string;
  station: string;
  passenger: string | null;
  assignedTeam: string;
  reportedAt: string;
  lastUpdated: string;
  summary: string;
  lastKnownLocation: string;
  aiRecommendation: string;
  slaBreach: boolean;
  incidentRef?: string;
  resolutionNotes?: string;
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
