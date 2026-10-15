import { useEffect, useState } from "react";
import Modal from "./Modal";
import {
  addMedicine,
  getMedicines,
  type Prescription,
} from "../services/authService";
import { parseSummary, type SummaryMedication } from "./SummaryView";

const FREQUENCIES = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "Weekly",
];

const pad = (n: number) => String(n).padStart(2, "0");

function formatLocal(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const getTodayDate = () => formatLocal(new Date());

function addDays(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return formatLocal(new Date(y, m - 1, d + days));
}

// "Twice daily", "BD", "twice a day" -> one of the 5 allowed values
function normalizeFrequency(text: string | null): string {
  if (!text) return "";
  const exact = FREQUENCIES.find((f) => f.toLowerCase() === text.trim().toLowerCase());
  if (exact) return exact;

  const t = text.toLowerCase();
  if (/\b(four times|4 times|4x|qid)\b/.test(t)) return "Four times daily";
  if (/\b(three times|thrice|3 times|3x|tds|tid)\b/.test(t)) return "Three times daily";
  if (/\b(twice|two times|2 times|2x|bd|bid)\b/.test(t)) return "Twice daily";
  if (/\b(weekly|once a week|once per week|every week)\b/.test(t)) return "Weekly";
  if (/\b(once|one time|1 time|1x|od|daily|every day)\b/.test(t)) return "Once daily";
  return "";
}

// "5 days" -> 5, "1 week" -> 7, "2 months" -> 60
function parseDurationDays(text: string | null): number | null {
  if (!text) return null;
  const m = text.toLowerCase().match(/(\d+)\s*(day|week|month)s?/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (m[2] === "week") return n * 7;
  if (m[2] === "month") return n * 30;
  return n;
}

interface Row {
  key: number;
  selected: boolean;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  start_date: string;
  end_date: string;
  duplicate: boolean;
  status: "idle" | "added" | "failed";
  error: string;
}

function buildRow(med: SummaryMedication, key: number, existing: Set<string>): Row {
  const start = getTodayDate();
  const days = parseDurationDays(med.duration);

  const extra: string[] = [];
  if (med.timing) extra.push(med.timing);
  if (med.notes) extra.push(med.notes);
  // Duration we couldn't turn into dates (e.g. "until finished") is kept as text
  if (med.duration && days === null) extra.push(`Duration: ${med.duration}`);

  const duplicate = existing.has((med.name ?? "").trim().toLowerCase());

  return {
    key,
    selected: !duplicate,
    name: med.name ?? "",
    dosage: med.dosage ?? "",
    frequency: normalizeFrequency(med.frequency),
    instructions: extra.join(". "),
    start_date: start,
    end_date: days ? addDays(start, days - 1) : "",
    duplicate,
    status: "idle",
    error: "",
  };
}

interface Props {
  prescription: Prescription;
  onClose: () => void;
  onAdded: (count: number) => void;
}

function AddToMedicinesModal({ prescription, onClose, onAdded }: Props) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const parsed = parseSummary(prescription.ai_summary);
      const meds = parsed?.medications ?? [];

      let existing = new Set<string>();
      try {
        const current = await getMedicines();
        existing = new Set(current.map((m) => m.name.trim().toLowerCase()));
      } catch {
        // If this fails we just skip the duplicate check
      }

      if (!cancelled) setRows(meds.map((m, i) => buildRow(m, i, existing)));
    })();

    return () => {
      cancelled = true;
    };
  }, [prescription]);

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((prev) => prev && prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  const selectedCount = rows
    ? rows.filter((r) => r.selected && r.status !== "added").length
    : 0;

  async function handleAdd() {
    if (!rows) return;

    // 1. Validate every selected row first
    const today = getTodayDate();
    let hasError = false;

    const validated = rows.map((r) => {
      if (!r.selected || r.status === "added") return r;

      let error = "";
      if (!r.name.trim() || !r.dosage.trim()) error = "Name and dosage are required.";
      else if (!FREQUENCIES.includes(r.frequency)) error = "Please choose a frequency.";
      else if (!r.start_date || r.start_date < today) error = "Start date cannot be before today.";
      else if (r.end_date && r.end_date < r.start_date) error = "End date cannot be before start date.";

      if (error) hasError = true;
      return { ...r, error };
    });

    setRows(validated);
    if (hasError) return;

    // 2. Add them one by one using the existing medicines API
    setSubmitting(true);
    const next = [...validated];
    let anyFailed = false;

    for (let i = 0; i < next.length; i++) {
      const r = next[i];
      if (!r.selected || r.status === "added") continue;

      try {
        await addMedicine({
          name: r.name.trim(),
          dosage: r.dosage.trim(),
          frequency: r.frequency,
          instructions: r.instructions.trim() || undefined,
          start_date: r.start_date,
          end_date: r.end_date || undefined,
        });
        next[i] = { ...r, status: "added", error: "" };
      } catch (err) {
        anyFailed = true;
        next[i] = {
          ...r,
          status: "failed",
          error: err instanceof Error ? err.message : "Failed to add this medicine.",
        };
      }
    }

    setRows(next);
    setSubmitting(false);

    // Close only if everything went through; otherwise keep the failures visible
    if (!anyFailed) {
      onAdded(next.filter((r) => r.status === "added").length);
      onClose();
    }
  }

  const muted = { color: "var(--color-text-muted)" } as const;

  return (
    <Modal title="Add to Medicines" onClose={onClose}>
      {rows === null ? (
        <p>Preparing medicines...</p>
      ) : rows.length === 0 ? (
        <p style={muted}>No medicines were found in this prescription.</p>
      ) : (
        <>
          <p style={{ ...muted, marginBottom: 12, fontSize: 13.5 }}>
            Review the details extracted from this prescription. AI can make mistakes, so
            check each one before adding.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              maxHeight: "55vh",
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            {rows.map((r) => {
              const locked = r.status === "added" || submitting;
              return (
                <div
                  key={r.key}
                  style={{
                    border: "1px solid var(--color-border)",
                    borderRadius: 10,
                    padding: 12,
                    opacity: r.selected ? 1 : 0.6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <input
                      type="checkbox"
                      checked={r.selected}
                      disabled={locked}
                      onChange={(e) => updateRow(r.key, { selected: e.target.checked })}
                      aria-label={`Include ${r.name}`}
                    />
                    <input
                      value={r.name}
                      disabled={locked}
                      onChange={(e) => updateRow(r.key, { name: e.target.value })}
                      placeholder="Medicine name"
                      style={{ flex: 1, fontWeight: 600 }}
                    />
                    {r.status === "added" && (
                      <span style={{ fontSize: 12, color: "green", whiteSpace: "nowrap" }}>
                        Added ✓
                      </span>
                    )}
                    {r.duplicate && r.status !== "added" && (
                      <span style={{ fontSize: 12, ...muted, whiteSpace: "nowrap" }}>
                        Already in your medicines
                      </span>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label>Dosage</label>
                      <input
                        value={r.dosage}
                        disabled={locked}
                        onChange={(e) => updateRow(r.key, { dosage: e.target.value })}
                        placeholder="e.g. 500mg or As directed"
                      />
                    </div>
                    <div className="form-field">
                      <label>Frequency</label>
                      <select
                        value={r.frequency}
                        disabled={locked}
                        onChange={(e) => updateRow(r.key, { frequency: e.target.value })}
                      >
                        <option value="">Select frequency</option>
                        {FREQUENCIES.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Instructions</label>
                    <input
                      value={r.instructions}
                      disabled={locked}
                      onChange={(e) => updateRow(r.key, { instructions: e.target.value })}
                      placeholder="e.g. Take after meals"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label>Start date</label>
                      <input
                        type="date"
                        value={r.start_date}
                        min={getTodayDate()}
                        disabled={locked}
                        onChange={(e) => updateRow(r.key, { start_date: e.target.value })}
                      />
                    </div>
                    <div className="form-field">
                      <label>End date (optional)</label>
                      <input
                        type="date"
                        value={r.end_date}
                        min={r.start_date}
                        disabled={locked}
                        onChange={(e) => updateRow(r.key, { end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  {r.error && (
                    <p style={{ color: "#c0392b", fontSize: 12.5, marginTop: 6 }}>{r.error}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
            <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={submitting || selectedCount === 0}
            >
              {submitting
                ? "Adding..."
                : `Add ${selectedCount} medicine${selectedCount === 1 ? "" : "s"}`}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

export default AddToMedicinesModal;