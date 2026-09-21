import { useEffect, useState, type FormEvent } from "react";
import MedicineCard, { type Medicine } from "../components/MedicineCard";
import Modal from "../components/Modal";
import { PlusIcon, PillIcon } from "../components/icons";
import "../styles/shared.css";
import {
  addMedicine,
  deleteMedicine,
  getMedicines,
  updateMedicine,
} from "../services/authService";

const FREQUENCIES = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "Weekly",
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
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMedicines();
  }, []);

  async function loadMedicines() {
    try {
      setLoading(true);
      const data = await getMedicines();
      setMedicines(data);
      setError("");
    } catch (err) {
      console.error("Failed to fetch medicines:", err);
      setError("Could not load medicines.");
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      start_date: new Date().toISOString().slice(0, 10),
    });
    setError("");
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

    setError("");
    setIsModalOpen(true);
  }

  async function handleDelete(id: number) {
    const medicine = medicines.find((m) => m.id === id);

    if (!medicine) return;

    const confirmed = window.confirm(
      `Delete ${medicine.name}? Any reminders linked to this medicine will also be removed.`
    );

    if (!confirmed) return;

    try {
      await deleteMedicine(id);

      setMedicines((prev) => prev.filter((m) => m.id !== id));
      setError("");
    } catch (err) {
      console.error("Failed to delete medicine:", err);
      setError("Failed to delete medicine.");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const name = form.name.trim();
    const dosage = form.dosage.trim();
    const instructions = form.instructions.trim();

    if (!name || !dosage || !form.frequency || !form.start_date) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!FREQUENCIES.includes(form.frequency)) {
      setError("Please select a valid medicine frequency.");
      return;
    }

    if (form.end_date && form.end_date < form.start_date) {
      setError("End date cannot be before start date.");
      return;
    }

    setSubmitting(true);
    setError("");

    const medicineData = {
      name,
      dosage,
      frequency: form.frequency,
      instructions,
      start_date: form.start_date,
      end_date: form.end_date || undefined,
    };

    try {
      if (editingId !== null) {
        await updateMedicine(editingId, medicineData);

        setMedicines((prev) =>
          prev.map((medicine) =>
            medicine.id === editingId
              ? {
                  ...medicine,
                  ...medicineData,
                }
              : medicine
          )
        );
      } else {
        const result = await addMedicine(medicineData);

        const newMedicine: Medicine = {
          id: result.medicineId,
          ...medicineData,
        };

        setMedicines((prev) => [...prev, newMedicine]);
      }

      setIsModalOpen(false);
      setForm(emptyForm);
    } catch (err) {
      console.error("Medicine save error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save medicine."
      );
    } finally {
      setSubmitting(false);
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

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Loading medicines...</p>
      ) : medicines.length === 0 ? (
        <div className="empty-state">
          <PillIcon width={32} height={32} />

          <h3>No medicines yet</h3>

          <p>
            Add your first medicine to start getting reminders.
          </p>

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
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
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
                  onChange={(e) =>
                    setForm({
                      ...form,
                      dosage: e.target.value,
                    })
                  }
                  placeholder="e.g. 500mg"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="med-frequency">
                  Frequency
                </label>

                <select
                  id="med-frequency"
                  value={form.frequency}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      frequency: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select frequency</option>

                  {FREQUENCIES.map((frequency) => (
                    <option key={frequency} value={frequency}>
                      {frequency}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="med-instructions">
                Instructions (optional)
              </label>

              <textarea
                id="med-instructions"
                rows={2}
                value={form.instructions}
                onChange={(e) =>
                  setForm({
                    ...form,
                    instructions: e.target.value,
                  })
                }
                placeholder="e.g. Take after meals"
              />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="med-start">
                  Start date
                </label>

                <input
                  id="med-start"
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      start_date: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="med-end">
                  End date (optional)
                </label>

                <input
                  id="med-end"
                  type="date"
                  value={form.end_date}
                  min={form.start_date}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      end_date: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </form>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 8,
            }}
          >
            <button
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              className="btn btn-primary"
              type="submit"
              form="medicine-form"
              disabled={submitting}
            >
              {submitting
                ? "Saving..."
                : editingId !== null
                ? "Save Changes"
                : "Add Medicine"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Medicines;