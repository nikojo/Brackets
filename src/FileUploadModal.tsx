import { useState, useRef, useCallback, useEffect } from "react";
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
        resolve({ headers, rows, fileName: file.name, fileType: "csv", rowCount: rows.length });
      },
      error: (err) => reject(err),
    });
  });
}

async function parseXLS(file: File): Promise<ParsedData> {
  const buffer = await file.arrayBuffer();
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const headers = raw.length > 0 ? Object.keys(raw[0]) : [];
  const ext = file.name.split(".").pop()?.toLowerCase() as "xls" | "xlsx";
  return { headers, rows: raw, fileName: file.name, fileType: ext, rowCount: raw.length };
}

async function parseFile(file: File): Promise<ParsedData> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") return parseCSV(file);
  if (ext === "xls" || ext === "xlsx") return parseXLS(file);
  throw new Error(`Unsupported file type: .${ext}`);
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const SYS_FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO_FONT = "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";

// ─── SelectionTable ───────────────────────────────────────────────────────────

type SelectionTableProps = {
  data: ParsedData;
  selectedCols: Set<string>;
  selectedRows: Set<number>;
  onToggleCol: (col: string) => void;
  onToggleRow: (idx: number) => void;
  onToggleAllCols: () => void;
  onToggleAllRows: () => void;
};

function SelectionTable({
  data,
  selectedCols,
  selectedRows,
  onToggleCol,
  onToggleRow,
  onToggleAllCols,
  onToggleAllRows,
}: SelectionTableProps) {
  const allColsSelected = selectedCols.size === data.headers.length;
  const allRowsSelected = selectedRows.size === data.rows.length;
  const someRowsSelected = selectedRows.size > 0 && !allRowsSelected;

  const cellStyle = (selected: boolean): React.CSSProperties => ({
    padding: "6px 10px",
    borderBottom: "1px solid #efefef",
    whiteSpace: "nowrap",
    maxWidth: 160,
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontFamily: MONO_FONT,
    fontSize: 12,
    color: selected ? "#111" : "#bbb",
    background: selected ? "#fff" : "#fafafa",
    transition: "color 0.1s, background 0.1s",
  });

  return (
    <div style={{ overflowX: "auto", borderRadius: 6, border: "1px solid #e0e0e0", marginTop: 4 }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          {/* Column toggle row */}
          <tr style={{ background: "#f5f5f5" }}>
            {/* top-left corner: toggle all rows */}
            <th style={{ padding: "6px 10px", borderBottom: "1px solid #e0e0e0", width: 36, textAlign: "center" }}>
              <input
                type="checkbox"
                checked={allRowsSelected}
                ref={(el) => { if (el) el.indeterminate = someRowsSelected; }}
                onChange={onToggleAllRows}
                title="Select / deselect all rows"
                style={{ cursor: "pointer", accentColor: "#0066cc" }}
              />
            </th>
            {data.headers.map((h) => (
              <th
                key={h}
                onClick={() => onToggleCol(h)}
                title={`${selectedCols.has(h) ? "Deselect" : "Select"} column "${h}"`}
                style={{
                  padding: "6px 10px",
                  textAlign: "left",
                  fontWeight: 600,
                  color: selectedCols.has(h) ? "#111" : "#bbb",
                  whiteSpace: "nowrap",
                  borderBottom: "1px solid #e0e0e0",
                  fontFamily: SYS_FONT,
                  fontSize: 12,
                  cursor: "pointer",
                  userSelect: "none",
                  background: selectedCols.has(h) ? "#f5f5f5" : "#fafafa",
                  transition: "color 0.1s, background 0.1s",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <input
                    type="checkbox"
                    checked={selectedCols.has(h)}
                    onChange={() => onToggleCol(h)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ cursor: "pointer", accentColor: "#0066cc", flexShrink: 0 }}
                  />
                  {h}
                </span>
              </th>
            ))}
          </tr>
          {/* Select-all columns helper row */}
          <tr style={{ background: "#fafafa", borderBottom: "1px solid #e8e8e8" }}>
            <td style={{ padding: "4px 10px", textAlign: "center" }} />
            <td
              colSpan={data.headers.length}
              style={{ padding: "4px 10px", fontFamily: SYS_FONT, fontSize: 11, color: "#888" }}
            >
              <span
                onClick={onToggleAllCols}
                style={{ cursor: "pointer", color: "#0066cc", textDecoration: "underline" }}
              >
                {allColsSelected ? "Deselect all columns" : "Select all columns"}
              </span>
              <span style={{ margin: "0 6px", color: "#ccc" }}>·</span>
              <span style={{ color: "#555" }}>
                {selectedCols.size} of {data.headers.length} columns selected
              </span>
            </td>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => {
            const selected = selectedRows.has(i);
            return (
              <tr
                key={i}
                onClick={() => onToggleRow(i)}
                style={{
                  cursor: "pointer",
                  background: selected ? "#f0f7ff" : i % 2 === 0 ? "#fff" : "#fafafa",
                  transition: "background 0.1s",
                }}
              >
                <td style={{ padding: "6px 10px", borderBottom: "1px solid #efefef", textAlign: "center", width: 36 }}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggleRow(i)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ cursor: "pointer", accentColor: "#0066cc" }}
                  />
                </td>
                {data.headers.map((h) => (
                  <td key={h} style={cellStyle(selectedCols.has(h))}>
                    {String(row[h] ?? "")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {/* Row selection summary footer */}
      <div style={{
        padding: "6px 12px",
        background: "#fafafa",
        borderTop: "1px solid #efefef",
        fontFamily: SYS_FONT,
        fontSize: 11,
        color: "#888",
        display: "flex",
        gap: 12,
        alignItems: "center",
      }}>
        <span>
          <span
            onClick={onToggleAllRows}
            style={{ cursor: "pointer", color: "#0066cc", textDecoration: "underline" }}
          >
            {allRowsSelected ? "Deselect all rows" : "Select all rows"}
          </span>
        </span>
        <span style={{ color: "#ccc" }}>·</span>
        <span>{selectedRows.size} of {data.rows.length} rows selected</span>
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

  // Selection state
  const [selectedCols, setSelectedCols] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setLoading(true);
    setParsed(null);
    setSelectedCols(new Set());
    setSelectedRows(new Set());
    try {
      const data = await parseFile(file);
      setParsed(data);
      // Default: first column andall rows selected
      if (data.headers.length > 0) {setSelectedCols(new Set([data.headers[0]])); }
      setSelectedRows(new Set(data.rows.map((_, i) => i)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to parse file.");
    } finally {
      setLoading(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) setOpen(false);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Column toggle helpers
  const toggleCol = (col: string) => {
    setSelectedCols((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col); else next.add(col);
      return next;
    });
  };
  const toggleAllCols = () => {
    if (!parsed) return;
    setSelectedCols(
      selectedCols.size === parsed.headers.length ? new Set() : new Set(parsed.headers)
    );
  };

  // Row toggle helpers
  const toggleRow = (idx: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };
  const toggleAllRows = () => {
    if (!parsed) return;
    setSelectedRows(
      selectedRows.size === parsed.rows.length
        ? new Set()
        : new Set(parsed.rows.map((_, i) => i))
    );
  };

  const clear = () => {
    setParsed(null); 
    setError(null); 
    setSelectedCols(new Set()); 
    setSelectedRows(new Set());
  }

  const handleDone = () => {
    if (!parsed) return;
    const headers = parsed.headers.filter((h) => selectedCols.has(h));
    const rows = parsed.rows
      .filter((_, i) => selectedRows.has(i))
      .map((row) => {
        const filtered: Record<string, unknown> = {};
        headers.forEach((h) => { filtered[h] = row[h]; });
        return filtered;
      });
    onDataParsed?.({
      headers,
      rows,
      fileName: parsed.fileName,
      fileType: parsed.fileType,
      rowCount: rows.length,
    });
    setOpen(false);
    clear();
  };

  const canConfirm = parsed && selectedCols.size > 0 && selectedRows.size > 0;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
      >
        Import File
      </button>

      {/* Backdrop + Modal */}
      {open && (
        <div
          ref={overlayRef}
          onClick={onOverlayClick}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            animation: "fadeIn 0.15s ease",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              padding: 28,
              width: "min(820px, 96vw)",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)",
              animation: "slideUp 0.18s ease",
              fontFamily: SYS_FONT,
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#111" }}>
                  Import Data File
                </h2>
                <p style={{ margin: "3px 0 0", fontSize: 13, color: "#888" }}>
                  {parsed
                    ? "Check rows and columns to include, then press Done."
                    : "Supported formats: .csv, .xls, .xlsx"}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                title="Close"
                style={{
                  background: "none",
                  border: "1px solid #ddd",
                  color: "#666",
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "border-color 0.15s, background 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f5f5f5";
                  e.currentTarget.style.borderColor = "#bbb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.borderColor = "#ddd";
                }}
              >
                ×
              </button>
            </div>

            {/* Drop Zone — always visible so user can re-upload */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? "#0066cc" : parsed ? "#d0e4f7" : "#ccc"}`,
                borderRadius: 8,
                padding: parsed ? "14px 20px" : "36px 24px",
                textAlign: "center",
                cursor: "pointer",
                background: dragging ? "#f0f7ff" : parsed ? "#f8fbff" : "#fafafa",
                transition: "border-color 0.15s, background 0.15s, padding 0.2s",
              }}
            >
              {parsed ? (
                <div style={{ fontSize: 13, color: "#555" }}>
                  <strong style={{ color: "#111" }}>📄 {parsed.fileName}</strong>
                  <span style={{ color: "#888", marginLeft: 8 }}>
                    — {parsed.rowCount.toLocaleString()} rows · {parsed.headers.length} columns
                  </span>
                  <span style={{ color: "#0066cc", marginLeft: 12, textDecoration: "underline" }}>
                    Replace file
                  </span>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 32, marginBottom: 10, userSelect: "none" }}>📂</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#222", marginBottom: 4 }}>
                    Drag and drop a file here
                  </div>
                  <div style={{ fontSize: 13, color: "#888" }}>
                    or{" "}
                    <span style={{ color: "#0066cc", textDecoration: "underline" }}>click to browse</span>
                    {" — .csv, .xls, .xlsx"}
                  </div>
                </>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={onInputChange}
              style={{ display: "none" }}
            />

            {/* Loading */}
            {loading && (
              <div style={{ textAlign: "center", padding: "20px 0", fontSize: 13, color: "#666" }}>
                <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite", marginRight: 6 }}>⟳</span>
                Parsing file…
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                marginTop: 14,
                padding: "10px 14px",
                background: "#fff5f5",
                border: "1px solid #fca5a5",
                borderRadius: 6,
                fontSize: 13,
                color: "#b91c1c",
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Selection table */}
            {parsed && !loading && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#333", marginBottom: 6 }}>
                  Select rows and columns to import
                </div>
                <SelectionTable
                  data={parsed}
                  selectedCols={selectedCols}
                  selectedRows={selectedRows}
                  onToggleCol={toggleCol}
                  onToggleRow={toggleRow}
                  onToggleAllCols={toggleAllCols}
                  onToggleAllRows={toggleAllRows}
                />
              </div>
            )}

            {/* No-selection warning */}
            {parsed && !loading && (selectedCols.size === 0 || selectedRows.size === 0) && (
              <div style={{
                marginTop: 10,
                padding: "8px 12px",
                background: "#fffbeb",
                border: "1px solid #fcd34d",
                borderRadius: 6,
                fontSize: 13,
                color: "#92400e",
              }}>
                ⚠ Please select at least one {selectedCols.size === 0 ? "column" : "row"} to continue.
              </div>
            )}

            {/* Footer */}
            <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#999" }}>
                {parsed && !loading && (
                  <>{selectedRows.size} row{selectedRows.size !== 1 ? "s" : ""} · {selectedCols.size} column{selectedCols.size !== 1 ? "s" : ""} selected</>
                )}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                {parsed && (
                  <button
                    onClick={() => { clear(); }}
                    style={{
                      background: "none",
                      border: "1px solid #ddd",
                      color: "#555",
                      padding: "8px 16px",
                      borderRadius: 6,
                      fontFamily: SYS_FONT,
                      fontSize: 14,
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={canConfirm ? handleDone : () => setOpen(false)}
                  disabled={!!parsed && !canConfirm}
                  style={{
                    background: canConfirm ? "#0066cc" : parsed ? "#e0e0e0" : "#f0f0f0",
                    border: "none",
                    color: canConfirm ? "#fff" : "#999",
                    padding: "8px 20px",
                    borderRadius: 6,
                    fontFamily: SYS_FONT,
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: canConfirm ? "pointer" : parsed ? "not-allowed" : "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { if (canConfirm) e.currentTarget.style.background = "#0052a3"; }}
                  onMouseLeave={(e) => { if (canConfirm) e.currentTarget.style.background = "#0066cc"; }}
                >
                  {parsed ? "Done" : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </>
  );
}

