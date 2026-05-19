"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, Download, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { downloadCsv } from "./data";

type UploadType = "flights" | "bags" | "incidents";

interface RowStatus {
  status: "valid" | "warning" | "failed";
  reason?: string;
}

interface PreviewRow {
  raw: Record<string, string>;
  rowStatus: RowStatus;
  index: number;
}

interface Props {
  type: UploadType;
  onClose: () => void;
  onImported: (count: number) => void;
}

const FLIGHT_TEMPLATE = [
  { flightNo: "XX001", airline: "Example Air", origin: "DXB", dest: "LHR", stdLocal: "2026-05-17 08:00", staLocal: "2026-05-17 12:00", aircraft: "B787", gate: "A1", terminal: "T1", status: "Scheduled", pax: "220", bagsPlanned: "240", bagsLoaded: "0", reconciliationPct: "0", transferRiskBags: "0", delayedBags: "0", shortShipped: "0" },
];

const BAG_TEMPLATE = [
  { lpn: "0199990001", passenger: "J. Example", pnr: "AB1001", flightNo: "XX001", weightKg: "22", tagType: "Standard", status: "Accepted", lastScanAt: "2026-05-17 06:30", scanPoint: "Check-in Belt", station: "DXB", risk: "Low", screening: "Cleared" },
];

const INCIDENT_TEMPLATE = [
  { flightNo: "XX001", category: "Delayed Bag", severity: "Medium", station: "DXB", lpn: "", tracerRef: "WT-DXB-00001", reportedAt: "2026-05-17 07:00 UTC", summary: "Sample delayed bag", rootCauseHint: "Tunnel congestion" },
];

function getTemplate(type: UploadType) {
  switch (type) {
    case "flights": return FLIGHT_TEMPLATE;
    case "bags": return BAG_TEMPLATE;
    case "incidents": return INCIDENT_TEMPLATE;
  }
}

function getRequiredFields(type: UploadType): string[] {
  switch (type) {
    case "flights": return ["flightNo", "origin", "dest", "status"];
    case "bags": return ["lpn", "flightNo", "status"];
    case "incidents": return ["flightNo", "category", "severity", "station"];
  }
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

function validateRow(row: Record<string, string>, required: string[], idx: number): RowStatus {
  const missing = required.filter((f) => !row[f]?.trim());
  if (missing.length > 0) {
    return { status: "failed", reason: `Missing required: ${missing.join(", ")}` };
  }
  // Simulated warnings for certain conditions
  if (row.status === "Delayed" && !row.rootCauseHint) {
    return { status: "warning", reason: "Delayed status without root cause hint" };
  }
  if (row.reconciliationPct && Number(row.reconciliationPct) > 100) {
    return { status: "failed", reason: "Reconciliation % cannot exceed 100" };
  }
  if (idx % 13 === 0 && idx > 0) {
    return { status: "warning", reason: "Duplicate flight number detected — will merge" };
  }
  return { status: "valid" };
}

const STATUS_LABEL: Record<RowStatus["status"], string> = {
  valid: "Valid",
  warning: "Warning",
  failed: "Failed",
};

const STATUS_COLOR: Record<RowStatus["status"], string> = {
  valid: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  warning: "bg-amber-50 text-amber-900 ring-amber-100",
  failed: "bg-rose-50 text-rose-800 ring-rose-100",
};

const STATUS_ICON = {
  valid: CheckCircle2,
  warning: AlertTriangle,
  failed: XCircle,
};

export function BulkUploadModal({ type, onClose, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const required = getRequiredFields(type);

  function processFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      const previewRows: PreviewRow[] = rows.slice(0, 50).map((raw, i) => ({
        raw,
        rowStatus: validateRow(raw, required, i),
        index: i + 1,
      }));
      setPreview(previewRows);
    };
    reader.readAsText(file);
  }

  const handleFile = useCallback((file: File | null) => {
    if (!file) return;
    if (!file.name.match(/\.(csv|xlsx)$/i)) {
      alert("Please upload a CSV or XLSX file.");
      return;
    }
    processFile(file);
  }, []);

  function handleImport() {
    if (!preview) return;
    setImporting(true);
    const validCount = preview.filter((r) => r.rowStatus.status !== "failed").length;
    window.setTimeout(() => {
      setImportedCount(validCount);
      setDone(true);
      setImporting(false);
      window.setTimeout(() => { onImported(validCount); onClose(); }, 1800);
    }, 1200);
  }

  function downloadTemplate() {
    const template = getTemplate(type);
    downloadCsv(`${type}_template.csv`, template as Record<string, unknown>[]);
  }

  const validCount = preview?.filter((r) => r.rowStatus.status === "valid").length ?? 0;
  const warnCount = preview?.filter((r) => r.rowStatus.status === "warning").length ?? 0;
  const failCount = preview?.filter((r) => r.rowStatus.status === "failed").length ?? 0;
  const headers = preview?.[0] ? Object.keys(preview[0].raw) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900 capitalize">
              Bulk Upload — {type}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Import {type} records from CSV. Download the template to ensure correct column format.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {done ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <CheckCircle2 className="size-12 text-emerald-500" />
              <p className="text-sm font-semibold text-slate-900">
                Import complete — {importedCount} records ingested
              </p>
              <p className="text-[11px] text-slate-500">Records are now visible in the {type} dashboard.</p>
            </div>
          ) : (
            <>
              {/* Upload zone */}
              {!preview && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFile(e.dataTransfer.files[0] ?? null);
                  }}
                  onClick={() => fileRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-12 transition-colors ${
                    dragOver ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-slate-50/60 hover:bg-slate-50"
                  }`}
                >
                  <Upload className="size-8 text-slate-400" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      Drop CSV/XLSX file here or click to browse
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Accepts .csv and .xlsx — max 5,000 rows per import
                    </p>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.xlsx"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              )}

              {/* File summary */}
              {preview && (
                <div className="flex flex-wrap items-center gap-3 rounded-md border border-slate-100 bg-slate-50/60 px-4 py-3">
                  <span className="text-xs font-semibold text-slate-800">{fileName}</span>
                  <span className="text-[11px] text-slate-500">{preview.length} rows parsed</span>
                  <div className="ml-auto flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-100">
                      <CheckCircle2 className="size-3" /> {validCount} valid
                    </span>
                    {warnCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-100">
                        <AlertTriangle className="size-3" /> {warnCount} warning
                      </span>
                    )}
                    {failCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-800 ring-1 ring-rose-100">
                        <XCircle className="size-3" /> {failCount} failed
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Validation preview table */}
              {preview && (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full text-left text-xs">
                    <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                      <tr>
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">Status</th>
                        {headers.slice(0, 5).map((h) => (
                          <th key={h} className="px-3 py-2">{h}</th>
                        ))}
                        <th className="px-3 py-2">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {preview.map((row) => {
                        const Icon = STATUS_ICON[row.rowStatus.status];
                        return (
                          <tr
                            key={row.index}
                            className={
                              row.rowStatus.status === "failed"
                                ? "bg-rose-50/40"
                                : row.rowStatus.status === "warning"
                                  ? "bg-amber-50/30"
                                  : ""
                            }
                          >
                            <td className="px-3 py-2 text-slate-500">{row.index}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${STATUS_COLOR[row.rowStatus.status]}`}>
                                <Icon className="size-3" />
                                {STATUS_LABEL[row.rowStatus.status]}
                              </span>
                            </td>
                            {headers.slice(0, 5).map((h) => (
                              <td key={h} className="max-w-[120px] truncate px-3 py-2 text-slate-700">
                                {row.raw[h] ?? "—"}
                              </td>
                            ))}
                            <td className="px-3 py-2 text-[11px] text-slate-500">
                              {row.rowStatus.reason ?? ""}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!done && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download className="size-3.5" />
              Download sample template
            </button>
            <div className="flex gap-2">
              {preview && (
                <button
                  type="button"
                  onClick={() => { setPreview(null); setFileName(null); }}
                  className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Replace file
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              {preview && (
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importing || validCount + warnCount === 0}
                  className="rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
                >
                  {importing ? "Importing…" : `Import ${validCount + warnCount} records`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
