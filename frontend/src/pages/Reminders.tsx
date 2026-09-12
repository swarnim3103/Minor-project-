import { useState, type FormEvent } from "react";
import ReminderCard, { type Reminder } from "../components/ReminderCard";
import Modal from "../components/Modal";
import { PlusIcon, BellIcon } from "../components/icons";
import "../styles/shared.css";

// TODO: wire to GET/POST /api/reminders + the medicine list from /api/medicines
const medicineOptions = ["Metformin", "Atorvastatin", "Vitamin D3"];

const initialReminders: Reminder[] = [
  { id: 1, medicine_name: "Metformin", reminder_time: "08:00", status: "active", dosage: "500mg after breakfast" },
  { id: 2, medicine_name: "Atorvastatin", reminder_time: "13:00", status: "active", dosage: "10mg after lunch" },
  { id: 3, medicine_name: "Vitamin D3", reminder_time: "21:00", status: "inactive", dosage: "1 tablet before bed" },
];

function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [medicine, setMedicine] = useState(medicineOptions[0]);
  const [time, setTime] = useState("08:00");

  function toggleReminder(id: number) {
    setReminders((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: r.status === "active" ? "inactive" : "active" }
          : r
      )
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setReminders((prev) => [
      ...prev,
      { id: Date.now(), medicine_name: medicine, reminder_time: time, status: "active" },
    ]);
    setIsModalOpen(false);
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

      {sorted.length === 0 ? (
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
                value={medicine}
                onChange={(e) => setMedicine(e.target.value)}
              >
                {medicineOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
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
          </form>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" form="reminder-form">
              Add Reminder
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Reminders;
