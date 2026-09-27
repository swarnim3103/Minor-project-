import { useState, useEffect, type ChangeEvent } from "react";
import Modal from "../components/Modal";
import { PlusIcon, FileIcon, UploadIcon } from "../components/icons";
import "../styles/shared.css";
import "./Prescriptions.css";

const API_BASE = "http://localhost:5000/api";

interface Prescription {
  id: number;
  doctor_name: string;
  prescription_date: string;
  prescription_type: "online" | "scanned_physical" | "handwritten_scanned";
  file_url: string;
  original_filename: string;
}

const typeLabels: Record<string, string> = {
  online: "Online / E-Prescription",
  scanned_physical: "Scanned (Printed)",
  handwritten_scanned: "Scanned (Handwritten)",
};

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const res = await fetch(`${API_BASE}/prescriptions`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load prescriptions");
      const data = await res.json();
      setPrescriptions(data.prescriptions);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Could not load prescriptions.");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
  }

  async function handleUpload() {
    if (!doctorName || !date || !file) {
      setError("Please fill in all fields and choose a PDF file.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("doctor_name", doctorName);
      formData.append("prescription_date", date);
      formData.append("prescription_type", type);

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/prescriptions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // NOTE: no Content-Type - browser sets it for FormData
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      await loadPrescriptions();
      setIsModalOpen(false);
      setDoctorName("");
      setDate("");
      setFile(null);
      setType("scanned_physical");
    } catch (err: any) {
      setError(err.message);
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
        <p>Loading...</p>
      ) : prescriptions.length === 0 ? (
        <div className="empty-state">
          <FileIcon width={32} height={32} />
          <h3>No prescriptions uploaded</h3>
          <p>Upload a prescription file to keep it on hand.</p>
        </div>
      ) : (
        <div className="card-grid">
          {prescriptions.map((p) => (
            <a
              key={p.id}
              href={`http://localhost:5000${p.file_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="prescription-card"
              style={{ textDecoration: "none" }}
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
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
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