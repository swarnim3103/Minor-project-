import { useState, type ChangeEvent } from "react";
import Modal from "../components/Modal";
import { PlusIcon, FileIcon, UploadIcon } from "../components/icons";
import "../styles/shared.css";
import "./Prescriptions.css";

interface Prescription {
  id: number;
  doctor_name: string;
  prescription_date: string;
  file_name: string;
}

// TODO: replace with GET /api/prescriptions; wire the upload modal to
// POST /api/prescriptions (multipart) once that route exists.
const initialPrescriptions: Prescription[] = [
  { id: 1, doctor_name: "Dr. Ananya Sharma", prescription_date: "2026-06-01", file_name: "prescription_june.pdf" },
  { id: 2, doctor_name: "Dr. Ravi Mehta", prescription_date: "2026-03-18", file_name: "prescription_march.pdf" },
];

function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(initialPrescriptions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const [date, setDate] = useState("");
  const [fileName, setFileName] = useState("");

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFileName(e.target.files?.[0]?.name ?? "");
  }

  function handleUpload() {
    if (!doctorName || !date || !fileName) return;
    setPrescriptions((prev) => [
      ...prev,
      { id: Date.now(), doctor_name: doctorName, prescription_date: date, file_name: fileName },
    ]);
    setIsModalOpen(false);
    setDoctorName("");
    setDate("");
    setFileName("");
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

      {prescriptions.length === 0 ? (
        <div className="empty-state">
          <FileIcon width={32} height={32} />
          <h3>No prescriptions uploaded</h3>
          <p>Upload a prescription file to keep it on hand.</p>
        </div>
      ) : (
        <div className="card-grid">
          {prescriptions.map((p) => (
            <div className="prescription-card" key={p.id}>
              <div className="prescription-card-icon">
                <FileIcon />
              </div>
              <div className="prescription-card-body">
                <h3>{p.doctor_name}</h3>
                <p>{p.prescription_date}</p>
                <span className="prescription-card-file">{p.file_name}</span>
              </div>
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
            <label htmlFor="rx-file">File</label>
            <label className="prescription-upload-box" htmlFor="rx-file">
              <UploadIcon width={20} height={20} />
              <span>{fileName || "Click to choose a file (PDF or image)"}</span>
            </label>
            <input
              id="rx-file"
              type="file"
              accept="application/pdf,image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleUpload}>
              Upload
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Prescriptions;
