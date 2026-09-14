import { useEffect, useState, type FormEvent } from "react";
import MedicineCard, { type Medicine } from "../components/MedicineCard";
import Modal from "../components/Modal";
import { PlusIcon, PillIcon } from "../components/icons";
import "../styles/shared.css";
import { addMedicine ,getMedicines } from "../services/authService";

// TODO: replace mock state with GET/POST/PUT/DELETE calls to
// /api/medicines once the backend medicine routes exist.
const initialMedicines: Medicine[] = [
  {
    id: 1,
    name: "Metformin",
    dosage: "500mg",
    frequency: "Twice daily",
    instructions: "Take after meals with a full glass of water.",
    start_date: "2026-06-01",
  },
  {
    id: 2,
    name: "Atorvastatin",
    dosage: "10mg",
    frequency: "Once daily",
    instructions: "Take at night.",
    start_date: "2026-05-12",
  },
  {
    id: 3,
    name: "Vitamin D3",
    dosage: "60000 IU",
    frequency: "Weekly",
    start_date: "2026-04-20",
    end_date: "2026-10-20",
  },
];

const emptyForm = {
  name: "",
  dosage: "",
  frequency: "",
  instructions: "",
  start_date: "",
  end_date: "",
};

function Medicines() {
  const [medicines, setMedicines] = useState<Medicine[]>(initialMedicines);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
useEffect(() => {
  const fetchMedicines = async () => {
    try {
      const data = await getMedicines();
      setMedicines(data);
    } catch (error) {
      console.error("Failed to fetch medicines:", error);
    }
  };

  fetchMedicines();
}, []);
  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  }

  function openEditModal(medicine: Medicine) {
    setEditingId(medicine.id);
    setForm({
      name: medicine.name,
      dosage: medicine.dosage,
      frequency: medicine.frequency,
      instructions: medicine.instructions ?? "",
      start_date: medicine.start_date,
      end_date: medicine.end_date ?? "",
    });
    setIsModalOpen(true);
  }

  function handleDelete(id: number) {
    setMedicines((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleSubmit(e: FormEvent) {
  e.preventDefault();

  if (!form.name || !form.dosage || !form.frequency || !form.start_date) {
    return;
  }

  try {
    if (editingId !== null) {
      // Edit functionality baad mein API se connect karenge
      setMedicines((prev) =>
        prev.map((m) => (m.id === editingId ? { ...m, ...form } : m))
      );
    } else {
      await addMedicine({
        name: form.name,
        dosage: form.dosage,
        frequency: form.frequency,
        instructions: form.instructions,
        start_date: form.start_date,
        end_date: form.end_date || undefined,
      });

      // Add successful hone ke baad local UI update
      setMedicines((prev) => [
        ...prev,
        {
          id: Date.now(),
          ...form,
        },
      ]);
    }

    setIsModalOpen(false);
  } catch (error) {
    console.error("Failed to add medicine:", error);
    alert("Failed to add medicine");
  }
}

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Manage Medicines</h2>
          <p>Add and track every medicine in your regimen.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <PlusIcon width={16} height={16} />
          Add Medicine
        </button>
      </div>

      {medicines.length === 0 ? (
        <div className="empty-state">
          <PillIcon width={32} height={32} />
          <h3>No medicines yet</h3>
          <p>Add your first medicine to start getting reminders.</p>
          <button className="btn btn-primary" onClick={openAddModal}>
            <PlusIcon width={16} height={16} />
            Add Medicine
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {medicines.map((medicine) => (
            <MedicineCard
              key={medicine.id}
              medicine={medicine}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <Modal
          title={editingId !== null ? "Edit Medicine" : "Add Medicine"}
          onClose={() => setIsModalOpen(false)}
        >
          <form id="medicine-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="med-name">Medicine name</label>
              <input
                id="med-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Metformin"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="med-dosage">Dosage</label>
                <input
                  id="med-dosage"
                  value={form.dosage}
                  onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                  placeholder="e.g. 500mg"
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="med-frequency">Frequency</label>
                <input
                  id="med-frequency"
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  placeholder="e.g. Twice daily"
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="med-instructions">Instructions (optional)</label>
              <textarea
                id="med-instructions"
                rows={2}
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                placeholder="e.g. Take after meals"
              />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="med-start">Start date</label>
                <input
                  id="med-start"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="med-end">End date (optional)</label>
                <input
                  id="med-end"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
            </div>
          </form>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" form="medicine-form">
              {editingId !== null ? "Save Changes" : "Add Medicine"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Medicines;
