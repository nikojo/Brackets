import { useState, useRef, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ParsedData = {
  headers: string[];
  rows: Record<string, unknown>[];
  fileName: string;
  fileType: "csv" | "xls" | "xlsx";
  rowCount: number;
};

type FileUploadModalProps = {
  onDataParsed?: (data: ParsedData) => void;
};

// ─── Utilities ────────────────────────────────────────────────────────────────

async function parseCSV(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        const rows = results.data as Record<string, unknown>[];
        resolve({
          headers,
          rows,
          fileName: file.name,
          fileType: "csv",
          rowCount: rows.length,
        });
      },
      error: (err) => reject(err),
    });
  });
}

async function parseXLS(file: File): Promise<ParsedData> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });
  const headers = raw.length > 0 ? Object.keys(raw[0]) : [];
  const ext = file.name.split(".").pop()?.toLowerCase() as "xls" | "xlsx";
  return {
    headers,
    rows: raw,
    fileName: file.name,
    fileType: ext,
    rowCount: raw.length,
  };
}

async function parseFile(file: File): Promise<ParsedData> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") return parseCSV(file);
  if (ext === "xls" || ext === "xlsx") return parseXLS(file);
  throw new Error(`Unsupported file type: .${ext}`);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DataPreview({ data }: { data: ParsedData }) {
  const previewRows = data.rows.slice(0, 8);
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#8b7355", letterSpacing: 2, textTransform: "uppercase" }}>
          preview
        </span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#c4a882" }}>
          {data.rowCount.toLocaleString()} rows · {data.headers.length} columns
        </span>
      </div>
      <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #3a2e22" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#2a1f14" }}>
              {data.headers.map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "8px 14px",
                    textAlign: "left",
                    color: "#e8c99a",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    borderBottom: "1px solid #3a2e22",
                    letterSpacing: 0.5,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, i) => (
              <tr
                key={i}
                style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}
              >
                {data.headers.map((h) => (
                  <td
                    key={h}
                    style={{
                      padding: "7px 14px",
                      color: "#c4a882",
                      borderBottom: "1px solid #2a2018",
                      whiteSpace: "nowrap",
                      maxWidth: 180,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {String(row[h] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.rowCount > 8 && (
          <div style={{ padding: "8px 14px", color: "#6b5a45", fontFamily: "'DM Mono', monospace", fontSize: 11, textAlign: "center" }}>
            +{(data.rowCount - 8).toLocaleString()} more rows
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function FileUploadModal({ onDataParsed }: FileUploadModalProps) {
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setLoading(true);
    setParsed(null);
    try {
      const data = await parseFile(file);
      setParsed(data);
      onDataParsed?.(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to parse file.");
    } finally {
      setLoading(false);
    }
  }, [onDataParsed]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  // Close on backdrop click
  const onOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) setOpen(false);
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {/* ── Trigger ── */}
      <button
        onClick={() => setOpen(true)}
        style={{
          background: "#c4893a",
          color: "#1a1208",
          border: "none",
          padding: "12px 28px",
          borderRadius: 8,
          fontFamily: "'DM Mono', monospace",
          fontWeight: 600,
          fontSize: 13,
          letterSpacing: 1,
          cursor: "pointer",
          textTransform: "uppercase",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#d9993f")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#c4893a")}
      >
        Import File
      </button>

      {/* ── Backdrop + Modal ── */}
      {open && (
        <div
          ref={overlayRef}
          onClick={onOverlayClick}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 8, 4, 0.82)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            animation: "fadeIn 0.18s ease",
          }}
        >
          <div
            style={{
              background: "#1c1409",
              border: "1px solid #3a2e22",
              borderRadius: 16,
              padding: 32,
              width: "min(680px, 94vw)",
              maxHeight: "88vh",
              overflowY: "auto",
              boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(196,136,58,0.08)",
              animation: "slideUp 0.2s ease",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: "#e8c99a", fontSize: 22, fontWeight: 700 }}>
                  Import Data File
                </h2>
                <p style={{ margin: "4px 0 0", fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6b5a45", letterSpacing: 1 }}>
                  CSV · XLS · XLSX
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "none",
                  border: "1px solid #3a2e22",
                  color: "#8b7355",
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#c4893a";
                  e.currentTarget.style.color = "#c4893a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#3a2e22";
                  e.currentTarget.style.color = "#8b7355";
                }}
              >
                ×
              </button>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? "#c4893a" : "#3a2e22"}`,
                borderRadius: 12,
                padding: "40px 24px",
                textAlign: "center",
                cursor: "pointer",
                background: dragging ? "rgba(196,137,58,0.06)" : "rgba(255,255,255,0.015)",
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
              <div style={{ fontFamily: "'Playfair Display', serif", color: "#e8c99a", fontSize: 15, marginBottom: 6 }}>
                Drop your file here
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6b5a45", letterSpacing: 0.5 }}>
                or click to browse · .csv, .xls, .xlsx
              </div>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={onInputChange}
              style={{ display: "none" }}
            />

            {/* States */}
            {loading && (
              <div style={{ textAlign: "center", padding: "24px 0", fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#8b7355", letterSpacing: 1 }}>
                <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
                {"  "}parsing file…
              </div>
            )}

            {error && (
              <div style={{
                marginTop: 16,
                padding: "12px 16px",
                background: "rgba(200,50,50,0.08)",
                border: "1px solid rgba(200,50,50,0.2)",
                borderRadius: 8,
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                color: "#d87070",
              }}>
                ⚠ {error}
              </div>
            )}

            {parsed && <DataPreview data={parsed} />}

            {/* Actions */}
            {parsed && (
              <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
                <button
                  onClick={() => { setParsed(null); setError(null); }}
                  style={{
                    background: "none",
                    border: "1px solid #3a2e22",
                    color: "#8b7355",
                    padding: "9px 18px",
                    borderRadius: 8,
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12,
                    cursor: "pointer",
                    letterSpacing: 0.5,
                    transition: "border-color 0.15s",
                  }}
                >
                  Clear
                </button>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    background: "#c4893a",
                    border: "none",
                    color: "#1a1208",
                    padding: "9px 22px",
                    borderRadius: 8,
                    fontFamily: "'DM Mono', monospace",
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: "pointer",
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#d9993f")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#c4893a")}
                >
                  Confirm
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Keyframes (injected once) ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Mono:wght@400;500;600&display=swap');
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </>
  );
}

// ─── Demo App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [result, setResult] = useState<ParsedData | null>(null);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#110d07",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 24,
      fontFamily: "'DM Mono', monospace",
      padding: 24,
    }}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#e8c99a", margin: "0 0 6px", fontSize: 28 }}>
          Data Importer
        </h1>
        <p style={{ color: "#6b5a45", fontSize: 12, margin: 0, letterSpacing: 1 }}>
          CSV · XLS · XLSX — drop, parse, preview
        </p>
      </div>

      <FileUploadModal onDataParsed={setResult} />

      {result && (
        <div style={{
          background: "#1c1409",
          border: "1px solid #3a2e22",
          borderRadius: 10,
          padding: "12px 20px",
          fontSize: 12,
          color: "#8b7355",
          letterSpacing: 0.5,
          maxWidth: 400,
          textAlign: "center",
        }}>
          ✓ <span style={{ color: "#c4a882" }}>{result.fileName}</span> loaded —{" "}
          {result.rowCount.toLocaleString()} rows, {result.headers.length} cols
        </div>
      )}
    </div>
  );
}
