import { useState, useEffect, type FormEvent } from "react";
import ReminderCard, { type Reminder } from "../components/ReminderCard";
import Modal from "../components/Modal";
import { PlusIcon, BellIcon } from "../components/icons";
import "../styles/shared.css";

const API_BASE = "http://localhost:5000/api";

type Medicine = {
  id: number;
  name: string;
};

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [medicineId, setMedicineId] = useState<number | null>(null);
  const [time, setTime] = useState("08:00");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReminders();
    loadMedicines();
  }, []);

  async function loadReminders() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/reminders`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load reminders");
      const data = await res.json();

      const mapped: Reminder[] = data.reminders.map((r: any) => ({
        id: r.id,
        medicine_name: r.medicine_name,
        reminder_time: r.reminder_time.slice(0, 5), // "14:35:00" -> "14:35"
        status: r.status,
        dosage: r.dosage || "",
      }));

      setReminders(mapped);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Could not load reminders. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

async function loadMedicines() {
  try {
    const res = await fetch(`${API_BASE}/medicines`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load medicines");
    const data = await res.json(); // this is a raw array, not { medicines: [...] }
    setMedicines(data || []);
    if (data?.length > 0) {
      setMedicineId(data[0].id);
    }
  } catch (err) {
    console.error(err);
  }
}

  async function toggleReminder(id: number) {
    const target = reminders.find((r) => r.id === id);
    if (!target) return;

    const newStatus = target.status === "active" ? "inactive" : "active";

    // optimistic UI update
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );

    try {
      const res = await fetch(`${API_BASE}/reminders/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update reminder");
    } catch (err) {
      console.error(err);
      // revert on failure
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: target.status } : r))
      );
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!medicineId) {
      setError("Please select a medicine.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/reminders`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          medicine_id: medicineId,
          reminder_time: `${time}:00`, // "08:00" -> "08:00:00"
          start_date: startDate,
          end_date: endDate || "2099-12-31", // open-ended if not specified
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create reminder");
      }

      await loadReminders(); // refresh list from server
      setIsModalOpen(false);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const sorted = [...reminders].sort((a, b) =>
    a.reminder_time.localeCompare(b.reminder_time)
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Set Reminders</h2>
          <p>Reminders are synced to Google Calendar and trigger a voice call at the scheduled time.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <PlusIcon width={16} height={16} />
          Add Reminder
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Loading reminders...</p>
      ) : sorted.length === 0 ? (
        <div className="empty-state">
          <BellIcon width={32} height={32} />
          <h3>No reminders set</h3>
          <p>Add a reminder so you never miss a dose.</p>
        </div>
      ) : (
        <div className="stack">
          {sorted.map((reminder) => (
            <ReminderCard key={reminder.id} reminder={reminder} onToggle={toggleReminder} />
          ))}
        </div>
      )}

      {isModalOpen && (
        <Modal title="Add Reminder" onClose={() => setIsModalOpen(false)}>
          <form id="reminder-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="rem-medicine">Medicine</label>
              <select
                id="rem-medicine"
                value={medicineId ?? ""}
                onChange={(e) => setMedicineId(Number(e.target.value))}
              >
                {medicines.length === 0 ? (
                  <option value="">No medicines found - add one first</option>
                ) : (
                  medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="rem-time">Reminder time</label>
              <input
                id="rem-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="rem-start">Start date</label>
              <input
                id="rem-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="rem-end">End date (optional)</label>
              <input
                id="rem-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </form>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" form="reminder-form" disabled={submitting}>
              {submitting ? "Adding..." : "Add Reminder"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Reminders;