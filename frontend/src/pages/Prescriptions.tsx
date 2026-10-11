import { useState, useEffect, type ChangeEvent } from "react";
import Modal from "../components/Modal";
import ScanCapture from "../components/ScanCapture";
import { PlusIcon, FileIcon, UploadIcon } from "../components/icons";
import { convertImageFileToPdf } from "../utils/imageToPdf";
import SummaryView, { summaryPreview, parseSummary } from "../components/SummaryView";
import AddToMedicinesModal from "../components/AddToMedicinesModal";
import "../styles/shared.css";
import "./Prescriptions.css";
import {
  getPrescriptions,
  uploadPrescription,
  deletePrescription,
  type Prescription,
} from "../services/authService";

const typeLabels: Record<string, string> = {
  online: "Online / E-Prescription",
  scanned_physical: "Scanned (Printed)",
  handwritten_scanned: "Scanned (Handwritten)",
};

function canAddToMedicines(p: Prescription) {
  if (p.ai_summary_status !== "completed") return false;
  const parsed = parseSummary(p.ai_summary);
  return !!parsed && !parsed.unclear && parsed.medications.length > 0;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type UploadMode = "choose" | "file" | "scan";

function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>("choose");
  const [doctorName, setDoctorName] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<Prescription["prescription_type"]>("scanned_physical");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [addingFrom, setAddingFrom] = useState<Prescription | null>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    loadPrescriptions();
  }, []);

  async function loadPrescriptions() {
    try {
      setLoading(true);
      const data = await getPrescriptions();
      setPrescriptions(data);
      setError("");
    } catch (err) {
      console.error("Failed to fetch prescriptions:", err);
      setError("Could not load prescriptions.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
  const selected = e.target.files?.[0];
  if (!selected) {
    setFile(null);
    return;
  }

  if (selected.type === "application/pdf") {
    setFile(selected);
    return;
  }

  if (selected.type.startsWith("image/")) {
    try {
      setError("");
      const converted = await convertImageFileToPdf(selected);
      setFile(converted);
    } catch (err) {
      console.error("Image to PDF conversion failed:", err);
      setError("Could not convert the image to PDF. Please try a different file.");
    }
    return;
  }

  setError("Please choose a PDF or an image file (JPG, PNG).");
}

  function handleScanCapture(scannedFile: File) {
    setFile(scannedFile);
    setUploadMode("file"); // reuse the same form fields (doctor, date, type) after scanning
  }

  function resetUploadModal() {
    setIsUploadModalOpen(false);
    setUploadMode("choose");
    setDoctorName("");
    setDate("");
    setFile(null);
    setType("scanned_physical");
  }

  async function handleDelete(id: number) {
    const prescription = prescriptions.find((p) => p.id === id);
    if (!prescription) return;

    const confirmed = window.confirm(`Delete this prescription from ${prescription.doctor_name}?`);
    if (!confirmed) return;

    try {
      await deletePrescription(id);
      setPrescriptions((prev) => prev.filter((p) => p.id !== id));
      if (selectedPrescription?.id === id) setSelectedPrescription(null);
      setError("");
    } catch (err) {
      console.error("Failed to delete prescription:", err);
      setError("Failed to delete prescription.");
    }
  }

  async function handleUpload() {
    if (!doctorName || !date || !file) {
      setError("Please fill in all fields and choose or scan a file.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      await uploadPrescription({
        file,
        doctor_name: doctorName,
        prescription_date: date,
        prescription_type: type,
      });

      await loadPrescriptions();
      resetUploadModal();
    } catch (err) {
      console.error("Prescription upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload prescription.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Prescriptions</h2>
          <p>Keep digital copies of your prescriptions in one secure place.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsUploadModalOpen(true)}>
          <PlusIcon width={16} height={16} />
          Upload Prescription
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {notice && (
  <div
    style={{
      background: "#e8f6ec",
      color: "#1e7a3c",
      padding: "10px 14px",
      borderRadius: 8,
      marginBottom: 12,
      fontSize: 14,
    }}
  >
    {notice}
  </div>
)}

      {loading ? (
        <p>Loading prescriptions...</p>
      ) : prescriptions.length === 0 ? (
        <div className="empty-state">
          <FileIcon width={32} height={32} />
          <h3>No prescriptions uploaded</h3>
          <p>Upload a prescription file to keep it on hand.</p>
        </div>
      ) : (
        <div className="card-grid">
          {prescriptions.map((p) => (
            <div
              className="prescription-card"
              key={p.id}
              onClick={() => setSelectedPrescription(p)}
              style={{ cursor: "pointer", flexDirection: "column", alignItems: "stretch" }}
            >
              <div style={{ display: "flex", gap: 14 }}>
                <div className="prescription-card-icon">
                  <FileIcon />
                </div>
                <div className="prescription-card-body" style={{ flex: 1 }}>
                  <h3>{p.doctor_name}</h3>
                  <p>{formatDate(p.prescription_date)}</p>
                  <span className="prescription-card-file">{typeLabels[p.prescription_type]}</span>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(p.id);
                  }}
                  style={{ alignSelf: "flex-start" }}
                >
                  Delete
                </button>
              </div>

              {summaryPreview(p) && (
  <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 10 }}>
    {summaryPreview(p)}
  </p>
)}
              {p.ai_summary_status === "failed" && (
                <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginTop: 10, fontStyle: "italic" }}>
                  Summary unavailable
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {isUploadModalOpen && (
        <Modal title="Upload Prescription" onClose={resetUploadModal}>
          {uploadMode === "choose" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ color: "var(--color-text-muted)", marginBottom: 4 }}>
                How would you like to add this prescription?
              </p>
              <button className="btn btn-primary" onClick={() => setUploadMode("file")}>
                <UploadIcon width={16} height={16} />
                Upload a PDF File
              </button>
              <button className="btn btn-secondary" onClick={() => setUploadMode("scan")}>
                Scan with Camera
              </button>
            </div>
          )}

          {uploadMode === "scan" && (
            <ScanCapture onCapture={handleScanCapture} onClose={() => setUploadMode("choose")} />
          )}

          {uploadMode === "file" && (
            <>
              <div className="form-field">
                <label htmlFor="doc-name">Doctor's name</label>
                <input
                  id="doc-name"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="e.g. Dr. Ananya Sharma"
                />
              </div>

              <div className="form-field">
                <label htmlFor="rx-date">Prescription date</label>
                <input
                  id="rx-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="rx-type">Prescription type</label>
                <select
                  id="rx-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as Prescription["prescription_type"])}
                >
                  <option value="online">Online / E-Prescription</option>
                  <option value="scanned_physical">Scanned (Printed)</option>
                  <option value="handwritten_scanned">Scanned (Handwritten)</option>
                </select>
              </div>

              <div className="form-field">
  <label htmlFor="rx-file">File (PDF or image — images convert to PDF automatically)</label>
  <label className="prescription-upload-box" htmlFor="rx-file">
    <UploadIcon width={20} height={20} />
    <span>{file?.name || "Click to choose a PDF or image file"}</span>
  </label>
  <input
    id="rx-file"
    type="file"
    accept="application/pdf,image/jpeg,image/png"
    onChange={handleFileChange}
    style={{ display: "none" }}
  />
</div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button className="btn btn-secondary" onClick={() => setUploadMode("choose")} disabled={uploading}>
                  Back
                </button>
                <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
                  {uploading ? "Uploading & summarizing..." : "Upload"}
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

      {selectedPrescription && (
        <Modal title={selectedPrescription.doctor_name} onClose={() => setSelectedPrescription(null)}>
          <p style={{ color: "var(--color-text-muted)", marginBottom: 12 }}>
            {formatDate(selectedPrescription.prescription_date)} &middot;{" "}
            {typeLabels[selectedPrescription.prescription_type]}
          </p>

          <div style={{ marginBottom: 16 }}>
            <SummaryView prescription={selectedPrescription} />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a
              href={`http://localhost:5000${selectedPrescription.file_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ display: "inline-flex" }}
            >
              View Prescription
            </a>

            {canAddToMedicines(selectedPrescription) && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setAddingFrom(selectedPrescription);
                  setSelectedPrescription(null);
                }}
              >
                Add to Medicines
              </button>
            )}
          </div>
        </Modal>
      )}
      {addingFrom && (
        <AddToMedicinesModal
          prescription={addingFrom}
          onClose={() => setAddingFrom(null)}
          onAdded={(count) =>
            setNotice(
              `${count} medicine${count === 1 ? "" : "s"} added to your Medicines section.`
            )
          }
        />
      )}
    </div>
  );
}

export default Prescriptions;