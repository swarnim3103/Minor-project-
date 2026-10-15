import type { Prescription } from "../services/authService";

export interface SummaryMedication {
  name: string;
  dosage: string | null;
  frequency: string | null;
  timing: string | null;
  duration: string | null;
  notes: string | null;
  confidence?: "high" | "medium" | "low" | null;
}

export interface ParsedSummary {
  medications: SummaryMedication[];
  other_instructions: string[];
  unclear: boolean;
  legibility?: "clear" | "partly_legible" | "hard_to_read" | null;
}

export function parseSummary(raw: string | null): ParsedSummary | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.medications)) {
      return {
        medications: parsed.medications,
        other_instructions: Array.isArray(parsed.other_instructions)
          ? parsed.other_instructions
          : [],
        unclear: Boolean(parsed.unclear),
        legibility: parsed.legibility ?? null,
      };
    }
    return null;
  } catch {
    return null; // older prescriptions stored plain text, not JSON
  }
}

// Short text for the card preview, e.g. "Augmentin, Enzoflam, Pan-D +1 more"
export function summaryPreview(p: Prescription): string | null {
  if (p.ai_summary_status !== "completed" || !p.ai_summary) return null;
  const parsed = parseSummary(p.ai_summary);
  if (!parsed) return p.ai_summary.length > 100 ? p.ai_summary.slice(0, 100) + "…" : p.ai_summary;
  if (parsed.unclear || parsed.medications.length === 0) return null;
  const names = parsed.medications.map((m) => m.name);
  return names.length > 3
    ? `${names.slice(0, 3).join(", ")} +${names.length - 3} more`
    : names.join(", ");
}

const mutedText = { color: "var(--color-text-muted)" } as const;

function legibilityWarning(level: ParsedSummary["legibility"]): string | null {
  if (level === "hard_to_read") {
    return "This prescription was hard to read. Some details may be missing or wrong, so please check them against the original.";
  }
  if (level === "partly_legible") {
    return "Some of this handwriting was unclear. Please check the details against the original.";
  }
  return null;
}

function ConfidenceBadge({ level }: { level?: string | null }) {
  if (level !== "low" && level !== "medium") return null;
  return (
    <span
      style={{
        fontSize: 11.5,
        padding: "2px 8px",
        borderRadius: 6,
        background: "#fff4e0",
        color: "#9a5b00",
      }}
    >
      {level === "low" ? "Unsure - please verify" : "Double-check"}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", gap: 8, fontSize: 13.5, marginTop: 4 }}>
      <span style={{ ...mutedText, minWidth: 78 }}>{label}</span>
      <span style={{ flex: 1 }}>{value}</span>
    </div>
  );
}

function SummaryView({ prescription }: { prescription: Prescription }) {
  if (prescription.ai_summary_status !== "completed" || !prescription.ai_summary) {
    return (
      <p style={{ ...mutedText, fontStyle: "italic" }}>
        A summary could not be generated for this prescription. You can add one manually
        or try the AI again.
      </p>
    );
  }

  const summary = parseSummary(prescription.ai_summary);

  // Older prescriptions saved plain text - show it as-is
  if (!summary) return <p>{prescription.ai_summary}</p>;

  if (summary.unclear) {
    return (
      <p style={{ ...mutedText, fontStyle: "italic" }}>
        The document was unclear or didn't look like a readable prescription.
      </p>
    );
  }

  const warning = legibilityWarning(summary.legibility);

  if (summary.medications.length === 0 && summary.other_instructions.length === 0) {
    return (
      <p style={{ ...mutedText, fontStyle: "italic" }}>
        No medicines or instructions could be read from this prescription.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {warning && (
        <div
          style={{
            background: "#fff4e0",
            color: "#9a5b00",
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          {warning}
        </div>
      )}

      {summary.medications.length > 0 && (
        <div>
          <p style={{ fontWeight: 700, fontSize: 12, letterSpacing: 0.5, ...mutedText, marginBottom: 8 }}>
            MEDICATIONS
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {summary.medications.map((med, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  padding: "10px 12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 15 }}>{med.name}</strong>
                  {med.dosage && (
                    <span
                      style={{
                        fontSize: 12,
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: "var(--color-accent-bg)",
                        color: "var(--color-primary)",
                      }}
                    >
                      {med.dosage}
                    </span>
                  )}
                  <ConfidenceBadge level={med.confidence} />
                </div>
                <Detail label="How often" value={med.frequency} />
                <Detail label="When" value={med.timing} />
                <Detail label="For" value={med.duration} />
                <Detail label="Note" value={med.notes} />
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.other_instructions.length > 0 && (
        <div>
          <p style={{ fontWeight: 700, fontSize: 12, letterSpacing: 0.5, ...mutedText, marginBottom: 6 }}>
            OTHER INSTRUCTIONS
          </p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {summary.other_instructions.map((note, i) => (
              <li key={i} style={{ fontSize: 14, marginBottom: 3 }}>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default SummaryView;