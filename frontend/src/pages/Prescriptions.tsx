import { useState, useEffect, type ChangeEvent } from "react";
import Modal from "../components/Modal";
import { PlusIcon, FileIcon, UploadIcon } from "../components/icons";
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

function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<Prescription["prescription_type"]>("scanned_physical");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
  }

  async function handleDelete(id: number) {
    const prescription = prescriptions.find((p) => p.id === id);
    if (!prescription) return;

    const confirmed = window.confirm(`Delete this prescription from ${prescription.doctor_name}?`);
    if (!confirmed) return;

    try {
      await deletePrescription(id);
      setPrescriptions((prev) => prev.filter((p) => p.id !== id));
      setError("");
    } catch (err) {
      console.error("Failed to delete prescription:", err);
      setError("Failed to delete prescription.");
    }
  }

  async function handleUpload() {
    if (!doctorName || !date || !file) {
      setError("Please fill in all fields and choose a PDF file.");
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
      setIsModalOpen(false);
      setDoctorName("");
      setDate("");
      setFile(null);
      setType("scanned_physical");
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
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <PlusIcon width={16} height={16} />
          Upload Prescription
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

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
            <div className="prescription-card" key={p.id}>
              <a
                href={`http://localhost:5000${p.file_url}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", gap: 14, textDecoration: "none", flex: 1 }}
              >
                <div className="prescription-card-icon">
                  <FileIcon />
                </div>
                <div className="prescription-card-body">
                  <h3>{p.doctor_name}</h3>
                  <p>{p.prescription_date}</p>
                  <span className="prescription-card-file">{typeLabels[p.prescription_type]}</span>
                </div>
              </a>
              <button
                className="btn btn-secondary"
                onClick={() => handleDelete(p.id)}
                style={{ alignSelf: "flex-start" }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <Modal title="Upload Prescription" onClose={() => setIsModalOpen(false)}>
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
            <label htmlFor="rx-file">File (PDF only)</label>
            <label className="prescription-upload-box" htmlFor="rx-file">
              <UploadIcon width={20} height={20} />
              <span>{file?.name || "Click to choose a PDF file"}</span>
            </label>
            <input
              id="rx-file"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={uploading}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Prescriptions;