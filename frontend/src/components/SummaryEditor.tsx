import { useState } from "react";
import type { ParsedSummary } from "./SummaryView";
import type { SummaryPayload } from "../services/authService";

interface EditableMed {
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  duration: string;
  notes: string;
}

const emptyMed = (): EditableMed => ({
  name: "",
  dosage: "",
  frequency: "",
  timing: "",
  duration: "",
  notes: "",
});

interface Props {
  initial: ParsedSummary | null;
  legacyText: string | null; // old plain-text summary, shown for reference only
  saving: boolean;
  onSave: (payload: SummaryPayload) => void;
  onCancel: () => void;
}

function SummaryEditor({ initial, legacyText, saving, onSave, onCancel }: Props) {
  const [meds, setMeds] = useState<EditableMed[]>(() =>
    initial && initial.medications.length > 0
      ? initial.medications.map((m) => ({
          name: m.name ?? "",
          dosage: m.dosage ?? "",
          frequency: m.frequency ?? "",
          timing: m.timing ?? "",
          duration: m.duration ?? "",
          notes: m.notes ?? "",
        }))
      : [emptyMed()]
  );
  const [instructions, setInstructions] = useState<string[]>(
    () => initial?.other_instructions ?? []
  );
  const [localError, setLocalError] = useState("");

  function updateMed(index: number, patch: Partial<EditableMed>) {
    setMeds((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
    setLocalError("");
  }

  function handleSave() {
    const cleanedMeds = meds
      .map((m) => ({
        name: m.name.trim(),
        dosage: m.dosage.trim(),
        frequency: m.frequency.trim(),
        timing: m.timing.trim(),
        duration: m.duration.trim(),
        notes: m.notes.trim(),
      }))
      .filter((m) => Object.values(m).some(Boolean)); // drop fully empty rows

    if (cleanedMeds.some((m) => !m.name)) {
      setLocalError("Every medicine needs a name.");
      return;
    }

    const cleanedInstructions = instructions.map((s) => s.trim()).filter(Boolean);

    if (cleanedMeds.length === 0 && cleanedInstructions.length === 0) {
      setLocalError("Add at least one medicine or instruction.");
      return;
    }

    onSave({
      medications: cleanedMeds.map((m) => ({
        name: m.name,
        dosage: m.dosage || null,
        frequency: m.frequency || null,
        timing: m.timing || null,
        duration: m.duration || null,
        notes: m.notes || null,
      })),
      other_instructions: cleanedInstructions,
    });
  }

  return (
    <div>
      {legacyText && !initial && (
        <div
          style={{
            background: "var(--color-accent-bg)",
            borderRadius: 8,
            padding: "8px 10px",
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          <strong style={{ display: "block", marginBottom: 4 }}>
            Previous summary (for reference)
          </strong>
          <span style={{ whiteSpace: "pre-wrap" }}>{legacyText}</span>
        </div>
      )}

      <div
        style={{
          maxHeight: "50vh",
          overflowY: "auto",
          paddingRight: 4,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {meds.map((m, i) => (
          <div
            key={i}
            style={{ border: "1px solid var(--color-border)", borderRadius: 10, padding: 12 }}
          >
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                value={m.name}
                disabled={saving}
                onChange={(e) => updateMed(i, { name: e.target.value })}
                placeholder="Medicine name"
                style={{ flex: 1, fontWeight: 600 }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving}
                onClick={() => setMeds((prev) => prev.filter((_, idx) => idx !== i))}
              >
                Remove
              </button>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Dosage</label>
                <input
                  value={m.dosage}
                  disabled={saving}
                  onChange={(e) => updateMed(i, { dosage: e.target.value })}
                  placeholder="e.g. 500 mg"
                />
              </div>
              <div className="form-field">
                <label>How often</label>
                <input
                  value={m.frequency}
                  disabled={saving}
                  onChange={(e) => updateMed(i, { frequency: e.target.value })}
                  placeholder="e.g. Twice daily"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>When</label>
                <input
                  value={m.timing}
                  disabled={saving}
                  onChange={(e) => updateMed(i, { timing: e.target.value })}
                  placeholder="e.g. Morning and night, after meals"
                />
              </div>
              <div className="form-field">
                <label>For how long</label>
                <input
                  value={m.duration}
                  disabled={saving}
                  onChange={(e) => updateMed(i, { duration: e.target.value })}
                  placeholder="e.g. 5 days"
                />
              </div>
            </div>

            <div className="form-field">
              <label>Notes</label>
              <input
                value={m.notes}
                disabled={saving}
                onChange={(e) => updateMed(i, { notes: e.target.value })}
                placeholder="Anything else written for this medicine"
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          className="btn btn-secondary"
          disabled={saving}
          onClick={() => setMeds((prev) => [...prev, emptyMed()])}
        >
          + Add medicine
        </button>

        <div>
          <p
            style={{
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: 0.5,
              color: "var(--color-text-muted)",
              marginBottom: 6,
            }}
          >
            OTHER INSTRUCTIONS
          </p>

          {instructions.map((line, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <input
                value={line}
                disabled={saving}
                onChange={(e) =>
                  setInstructions((prev) => prev.map((s, idx) => (idx === i ? e.target.value : s)))
                }
                placeholder="e.g. Get a CBC test done"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving}
                onClick={() => setInstructions((prev) => prev.filter((_, idx) => idx !== i))}
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-secondary"
            disabled={saving}
            onClick={() => setInstructions((prev) => [...prev, ""])}
          >
            + Add instruction
          </button>
        </div>
      </div>

      {localError && (
        <p style={{ color: "#c0392b", fontSize: 13, marginTop: 8 }}>{localError}</p>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
        <button className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Summary"}
        </button>
      </div>
    </div>
  );
}

export default SummaryEditor;