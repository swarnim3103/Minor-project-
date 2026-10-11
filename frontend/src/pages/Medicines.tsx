
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
  searchMedicineCatalogue,
  type MedicineSuggestion,
} from "../services/authService";

const API_BASE = "http://localhost:5000/api";

const FREQUENCIES = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "Weekly",
];

const REQUIRED_REMINDERS: Record<string, number> = {
  "Once daily": 1,
  "Twice daily": 2,
  "Three times daily": 3,
  "Four times daily": 4,
  Weekly: 1,
};

interface ReminderStatusRecord {
  id: number;
  medicine_id: number;
  reminder_time: string;
  status: string;
}

const emptyForm = {
  name: "",
  dosage: "",
  frequency: "",
  instructions: "",
  start_date: "",
  end_date: "",
};

const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

function Medicines() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Medicine autocomplete state
  const [suggestions, setSuggestions] = useState<MedicineSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Reminder status state
  const [remindersForStatus, setRemindersForStatus] = useState<
    ReminderStatusRecord[]
  >([]);
  const [remindersLoaded, setRemindersLoaded] = useState(false);

  // Load medicines and reminders when the page opens
  useEffect(() => {
    loadMedicines();
    loadReminderStatuses();
  }, []);

  // Search the medicine catalogue as the user types
  useEffect(() => {
    const query = form.name.trim();

    if (!isModalOpen || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);

        const results = await searchMedicineCatalogue(query);

        if (!cancelled) {
          setSuggestions(results);
          setShowSuggestions(true);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Medicine search failed:", err);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.name, isModalOpen]);

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

  async function loadReminderStatuses() {
    try {
      setRemindersLoaded(false);

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/reminders`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to load reminders");
      }

      const data = await res.json();

      const reminderList: ReminderStatusRecord[] = Array.isArray(data)
        ? data
        : data.reminders || [];

      setRemindersForStatus(reminderList);
      setRemindersLoaded(true);
    } catch (err) {
      console.error("Failed to load reminder statuses:", err);
      setRemindersLoaded(false);
    }
  }

  function getReminderStatus(
    medicine: Medicine
  ): "missing" | "incomplete" | null {
    // Do not display a warning until reminder data has loaded.
    if (!remindersLoaded) {
      return null;
    }

    const requiredCount = REQUIRED_REMINDERS[medicine.frequency];

    if (requiredCount === undefined) {
      return null;
    }

    const activeReminders = remindersForStatus.filter(
      (reminder) =>
        Number(reminder.medicine_id) === Number(medicine.id) &&
        reminder.status === "active"
    );

    const uniqueTimes = new Set(
      activeReminders.map((reminder) =>
        String(reminder.reminder_time || "").slice(0, 5)
      )
    );

    const activeCount = uniqueTimes.size;

    if (activeCount === 0) {
      return "missing";
    }

    if (activeCount < requiredCount) {
      return "incomplete";
    }

    return null;
  }

  function openAddModal() {
    setEditingId(null);

    setForm({
      ...emptyForm,
      start_date: getTodayDate(),
    });

    setSuggestions([]);
    setShowSuggestions(false);
    setSearchLoading(false);
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

    setSuggestions([]);
    setShowSuggestions(false);
    setSearchLoading(false);
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

      // Refresh reminder data after deleting the medicine.
      await loadReminderStatuses();

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

    if (form.start_date < getTodayDate()) {
      setError("Start date cannot be before today.");
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
      setSuggestions([]);
      setShowSuggestions(false);

      // Reload medicines and reminder data to keep the cards up to date.
      await loadMedicines();
      await loadReminderStatuses();
    } catch (err) {
      console.error("Medicine save error:", err);

      setError(
        err instanceof Error ? err.message : "Failed to save medicine."
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
          <p>Add your first medicine to start getting reminders.</p>
        </div>
      ) : (
        <div className="card-grid">
          {medicines.map((medicine) => (
            <MedicineCard
              key={medicine.id}
              medicine={medicine}
              onEdit={openEditModal}
              onDelete={handleDelete}
              reminderStatus={getReminderStatus(medicine)}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <Modal
          title={editingId !== null ? "Edit Medicine" : "Add Medicine"}
          onClose={() => {
            setIsModalOpen(false);
            setShowSuggestions(false);
          }}
        >
          <form id="medicine-form" onSubmit={handleSubmit}>
            {/* Medicine name with autocomplete */}
            <div className="form-field medicine-autocomplete">
              <label htmlFor="med-name">Medicine name</label>

              <input
                id="med-name"
                value={form.name}
                onChange={(e) => {
                  setForm({
                    ...form,
                    name: e.target.value,
                  });
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (form.name.trim().length >= 2) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  // Allow a suggestion click before closing.
                  setTimeout(() => {
                    setShowSuggestions(false);
                  }, 150);
                }}
                placeholder="Start typing a medicine name"
                autoComplete="off"
                required
              />

              {showSuggestions && form.name.trim().length >= 2 && (
                <div className="medicine-suggestions">
                  {searchLoading && (
                    <div className="medicine-suggestion-message">
                      Searching...
                    </div>
                  )}

                  {!searchLoading &&
                    suggestions.length > 0 &&
                    suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        className="medicine-suggestion"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          const strengthMatch = suggestion.name.match(
                            /\b\d+(?:,\d{3})*(?:\.\d+)?\s*(?:mg|mcg|μg|µg|g|kg|ml|mL|IU|units?)\b/i
                          );

                          setForm((prev) => ({
                            ...prev,
                            name: suggestion.name,
                            dosage: strengthMatch
                              ? strengthMatch[0].replace(/\s+/g, " ").trim()
                              : "",
                          }));

                          setSuggestions([]);
                          setShowSuggestions(false);
                        }}
                      >
                        <span className="medicine-suggestion-name">
                          {suggestion.name}
                        </span>

                        {(suggestion.short_composition1 ||
                          suggestion.short_composition2) && (
                          <span className="medicine-suggestion-composition">
                            {[
                              suggestion.short_composition1,
                              suggestion.short_composition2,
                            ]
                              .filter(Boolean)
                              .join(" + ")}
                          </span>
                        )}
                      </button>
                    ))}

                  {!searchLoading && suggestions.length === 0 && (
                    <div className="medicine-suggestion-message">
                      No matches found. You can enter your own medicine name.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dosage and frequency */}
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
                <label htmlFor="med-frequency">Frequency</label>
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

            {/* Instructions */}
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

            {/* Start and end dates */}
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="med-start">Start date</label>
                <input
                  id="med-start"
                  type="date"
                  value={form.start_date}
                  min={getTodayDate()}
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
                <label htmlFor="med-end">End date (optional)</label>
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

          {/* Form buttons */}
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
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setShowSuggestions(false);
              }}
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
