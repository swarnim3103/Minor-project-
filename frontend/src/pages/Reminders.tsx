
import { useState, useEffect, type FormEvent } from "react";
import ReminderCard, { type Reminder } from "../components/ReminderCard";
import Modal from "../components/Modal";
import { PlusIcon, BellIcon } from "../components/icons";
import "../styles/shared.css";

const API_BASE = "http://localhost:5000/api";

type Medicine = {
  id: number;
  name: string;
  dosage?: string;
  frequency: string;
  start_date: string;
  end_date?: string | null;
};

type ScheduleStatus = "missing" | "incomplete" | "complete";

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function getRequiredTimeCount(frequency: string): number {
  switch (frequency) {
    case "Once daily":
      return 1;
    case "Twice daily":
      return 2;
    case "Three times daily":
      return 3;
    case "Four times daily":
      return 4;
    case "Weekly":
      return 1;
    default:
      return 1;
  }
}

function getRecurrenceText(frequency: string): string {
  switch (frequency) {
    case "Once daily":
    case "Twice daily":
    case "Three times daily":
    case "Four times daily":
      return "Every day";
    case "Weekly":
      return "Every week";
    default:
      return frequency;
  }
}

function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  const [loading, setLoading] = useState(true);
  const [medicinesLoaded, setMedicinesLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add reminder modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [medicineId, setMedicineId] = useState<number | null>(null);
  const [reminderTimes, setReminderTimes] = useState<string[]>(["08:00"]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit reminder modal
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(
    null
  );
  const [editTime, setEditTime] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete operation
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const medicineIdsWithReminders = new Set(
    reminders.map((reminder) => Number(reminder.medicine_id))
  );

  const availableMedicines = medicines.filter(
    (medicine) => !medicineIdsWithReminders.has(Number(medicine.id))
  );

  useEffect(() => {
    loadReminders();
    loadMedicines();
  }, []);

  // =========================
  // LOAD REMINDERS
  // =========================

  async function loadReminders(showLoading = true) {
    try {
      if (showLoading) setLoading(true);

      const res = await fetch(`${API_BASE}/reminders`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error("Failed to load reminders");
      }

      const data = await res.json();

      const reminderList = Array.isArray(data)
        ? data
        : data.reminders || [];

      const mapped: Reminder[] = reminderList.map((r: any) => ({
        id: Number(r.id),
        medicine_id: Number(r.medicine_id),
        medicine_name: r.medicine_name,
        reminder_time: String(r.reminder_time ?? "").slice(0, 5),
        status: r.status,
        dosage: r.dosage || "",
        frequency: r.frequency || r.medicine_frequency || "",
        day_of_week: r.day_of_week ?? null,
      }));

      setReminders(mapped);
      setError(null);
    } catch (err) {
      console.error("Failed to load reminders:", err);
      setError("Could not load reminders. Is the backend running?");
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  // =========================
  // LOAD MEDICINES
  // =========================

  async function loadMedicines() {
    try {
      const res = await fetch(`${API_BASE}/medicines`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error("Failed to load medicines");
      }

      const data = await res.json();

      const medicineList: Medicine[] = Array.isArray(data)
        ? data
        : data.medicines || [];

      setMedicines(medicineList);

      if (medicineList.length > 0) {
        const firstMedicine = medicineList[0];

        setMedicineId(firstMedicine.id);
        setStartDate(String(firstMedicine.start_date).slice(0, 10));
        setEndDate(
          firstMedicine.end_date
            ? String(firstMedicine.end_date).slice(0, 10)
            : ""
        );

        setReminderTimes(
          Array(getRequiredTimeCount(firstMedicine.frequency)).fill("08:00")
        );
      } else {
        setMedicineId(null);
        setStartDate("");
        setEndDate("");
        setReminderTimes(["08:00"]);
      }
    } catch (err) {
      console.error("Failed to load medicines:", err);
      setMedicines([]);
      setMedicineId(null);
      setStartDate("");
      setEndDate("");
    } finally {
      setMedicinesLoaded(true);
    }
  }

  // =========================
  // CHECK MEDICINE SCHEDULE
  // =========================

  function getScheduleStatus(medicine: Medicine): ScheduleStatus {
    const medicineReminders = reminders.filter(
      (reminder) =>
        Number(reminder.medicine_id) === Number(medicine.id)
    );

    if (medicineReminders.length === 0) {
      return "missing";
    }

    const activeReminders = medicineReminders.filter(
      (reminder) => reminder.status === "active"
    );

    const requiredCount = getRequiredTimeCount(medicine.frequency);

    const uniqueActiveTimes = new Set(
      activeReminders.map((reminder) =>
        String(reminder.reminder_time || "").slice(0, 5)
      )
    );

    return uniqueActiveTimes.size < requiredCount
      ? "incomplete"
      : "complete";
  }

  function getActiveTimeCount(medicineId: number): number {
    const uniqueTimes = new Set(
      reminders
        .filter(
          (reminder) =>
            Number(reminder.medicine_id) === Number(medicineId) &&
            reminder.status === "active"
        )
        .map((reminder) =>
          String(reminder.reminder_time || "").slice(0, 5)
        )
    );

    return uniqueTimes.size;
  }

  const medicinesNeedingAttention = medicines.filter(
    (medicine) => getScheduleStatus(medicine) !== "complete"
  );

  // =========================
  // SELECT MEDICINE
  // =========================

  function handleMedicineChange(selectedId: number) {
    const selectedMedicine = medicines.find(
      (medicine) => medicine.id === selectedId
    );

    if (!selectedMedicine) return;

    setMedicineId(selectedId);
    setStartDate(String(selectedMedicine.start_date).slice(0, 10));
    setEndDate(
      selectedMedicine.end_date
        ? String(selectedMedicine.end_date).slice(0, 10)
        : ""
    );

    setReminderTimes(
      Array(getRequiredTimeCount(selectedMedicine.frequency)).fill("08:00")
    );
  }

  function handleTimeChange(index: number, value: string) {
    setReminderTimes((previous) =>
      previous.map((time, i) => (i === index ? value : time))
    );
  }

  // =========================
  // TOGGLE REMINDER
  // =========================

  async function toggleReminder(id: number) {
    const target = reminders.find((reminder) => reminder.id === id);
    if (!target) return;

    const newStatus =
      target.status === "active" ? "inactive" : "active";

    setReminders((prev) =>
      prev.map((reminder) =>
        reminder.id === id
          ? { ...reminder, status: newStatus }
          : reminder
      )
    );

    try {
      const res = await fetch(`${API_BASE}/reminders/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update reminder status");
      }

      setError(null);
    } catch (err) {
      console.error("Failed to update reminder:", err);

      setReminders((prev) =>
        prev.map((reminder) =>
          reminder.id === id
            ? { ...reminder, status: target.status }
            : reminder
        )
      );

      setError("Could not update reminder status. Please try again.");
    }
  }

  // =========================
  // OPEN EDIT REMINDER
  // =========================

  function openEditReminder(reminder: Reminder) {
    setError(null);
    setEditTime(reminder.reminder_time.slice(0, 5));
    setEditingReminder(reminder);
  }

  // =========================
  // SAVE EDITED REMINDER
  // =========================

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault();

    if (!editingReminder) return;

    if (!editTime) {
      setError("Please select a reminder time.");
      return;
    }

    setEditSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/reminders/${editingReminder.id}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            reminder_time: editTime,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.error || data.message || "Failed to edit reminder"
        );
      }

      // Refresh the reminders and schedule overview.
      await loadReminders(false);

      setEditingReminder(null);
      setEditTime("");
      setError(null);
    } catch (err) {
      console.error("Failed to edit reminder:", err);

      setError(
        err instanceof Error ? err.message : "Could not edit reminder."
      );
    } finally {
      setEditSubmitting(false);
    }
  }

  // =========================
  // DELETE REMINDER
  // =========================

  async function deleteReminder(reminder: Reminder) {
    const confirmed = window.confirm(
      `Delete the ${reminder.reminder_time} reminder for ${reminder.medicine_name}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(reminder.id);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/reminders/${reminder.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.error || data.message || "Failed to delete reminder"
        );
      }

      // Refresh the list and schedule overview from the database.
      await loadReminders(false);
      setError(null);
    } catch (err) {
      console.error("Failed to delete reminder:", err);

      setError(
        err instanceof Error ? err.message : "Could not delete reminder."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // =========================
  // CREATE REMINDERS
  // =========================

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!medicineId) {
      setError("Please add a medicine before creating a reminder.");
      return;
    }

    const selectedMedicine = medicines.find(
      (medicine) => medicine.id === medicineId
    );

    if (!selectedMedicine) {
      setError("Selected medicine was not found.");
      return;
    }

    if (reminderTimes.some((time) => !time)) {
      setError("Please enter all reminder times.");
      return;
    }

    if (new Set(reminderTimes).size !== reminderTimes.length) {
      setError("Please choose different times for each reminder.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/reminders`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          medicine_id: medicineId,
          reminder_times: reminderTimes.map((time) => `${time}:00`),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || data.error || "Failed to create reminder"
        );
      }

      await loadReminders(false);
      setIsModalOpen(false);
      setError(null);
    } catch (err) {
      console.error("Failed to create reminder:", err);

      setError(
        err instanceof Error ? err.message : "Failed to create reminder"
      );
    } finally {
      setSubmitting(false);
    }
  }

  // =========================
  // OPEN ADD REMINDER
  // =========================

  function openAddReminder() {
    setError(null);

    if (medicines.length === 0) {
      setError("Please add a medicine before creating a reminder.");
      return;
    }

    if (availableMedicines.length === 0) {
      setError(
        "All your medicines already have reminder records. Edit, activate, or delete existing reminders to manage their schedules."
      );
      return;
    }

    const firstMedicine = availableMedicines[0];

    setMedicineId(firstMedicine.id);
    setStartDate(String(firstMedicine.start_date).slice(0, 10));
    setEndDate(
      firstMedicine.end_date
        ? String(firstMedicine.end_date).slice(0, 10)
        : ""
    );

    setReminderTimes(
      Array(getRequiredTimeCount(firstMedicine.frequency)).fill("08:00")
    );

    setIsModalOpen(true);
  }

  const sorted = [...reminders].sort((a, b) =>
    a.reminder_time.localeCompare(b.reminder_time)
  );

  const selectedMedicine = medicines.find(
    (medicine) => medicine.id === medicineId
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Set Reminders</h2>
          <p>Set reminder times according to your medicine schedule.</p>
        </div>

        <button className="btn btn-primary" onClick={openAddReminder}>
          <PlusIcon width={16} height={16} />
          Add Reminder
        </button>
      </div>

      {error && !isModalOpen && !editingReminder && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      {/* MEDICINE SCHEDULE OVERVIEW */}
      {!loading && medicinesLoaded && medicines.length > 0 && (
        <section
          aria-labelledby="schedule-summary-title"
          style={{
            marginBottom: 24,
            padding: 16,
            border: "1px solid var(--border-color, #e5e7eb)",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            <h3
              id="schedule-summary-title"
              style={{ margin: 0, fontSize: 16 }}
            >
              Medicine schedule overview
            </h3>

            <span style={{ fontSize: 13, color: "#6b7280" }}>
              {medicinesNeedingAttention.length === 0
                ? "All schedules complete"
                : `${medicinesNeedingAttention.length} need${
                    medicinesNeedingAttention.length === 1 ? "s" : ""
                  } attention`}
            </span>
          </div>

          {medicinesNeedingAttention.length === 0 ? (
            <p style={{ margin: 0, fontSize: 14 }}>
              All medicines have the required number of active reminder times.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {medicinesNeedingAttention.map((medicine) => {
                const status = getScheduleStatus(medicine);
                const required = getRequiredTimeCount(medicine.frequency);
                const activeCount = getActiveTimeCount(medicine.id);

                return (
                  <div
                    key={medicine.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "var(--surface-muted, #f9fafb)",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {medicine.name}
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        {medicine.frequency}
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign: "right",
                        fontSize: 12,
                        color: "#92400e",
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>
                        {status === "missing"
                          ? "Reminder not set"
                          : "Reminder schedule incomplete"}
                      </div>
                      <div>
                        {activeCount} of {required} active time
                        {required === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* REMINDER LIST */}
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
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onToggle={toggleReminder}
              onEdit={openEditReminder}
              onDelete={deleteReminder}
            />
          ))}
        </div>
      )}

      {/* ADD REMINDER MODAL */}
      {isModalOpen && (
        <Modal
          title="Add Reminder"
          onClose={() => {
            if (submitting) return;
            setIsModalOpen(false);
            setError(null);
          }}
        >
          <form id="reminder-form" onSubmit={handleSubmit}>
            {error && (
              <div className="error-banner modal-error" role="alert">
                {error}
              </div>
            )}

            <div className="form-field">
              <label htmlFor="rem-medicine">Medicine</label>
              <select
                id="rem-medicine"
                value={medicineId ?? ""}
                onChange={(e) =>
                  handleMedicineChange(Number(e.target.value))
                }
                required
              >
                {medicines.map((medicine) => {
                  const alreadyHasReminder = medicineIdsWithReminders.has(
                    Number(medicine.id)
                  );

                  return (
                    <option
                      key={medicine.id}
                      value={medicine.id}
                      disabled={alreadyHasReminder}
                    >
                      {medicine.name}
                      {medicine.dosage ? ` - ${medicine.dosage}` : ""}
                      {alreadyHasReminder
                        ? " (Reminder already set)"
                        : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="rem-frequency">Frequency</label>
              <input
                id="rem-frequency"
                type="text"
                value={selectedMedicine?.frequency ?? ""}
                readOnly
              />
            </div>

            <div className="form-field">
              <label htmlFor="rem-recurrence">Repeat</label>
              <input
                id="rem-recurrence"
                type="text"
                value={
                  selectedMedicine
                    ? getRecurrenceText(selectedMedicine.frequency)
                    : ""
                }
                readOnly
              />
            </div>

            {reminderTimes.map((time, index) => (
              <div className="form-field" key={index}>
                <label htmlFor={`rem-time-${index}`}>
                  Reminder time{" "}
                  {reminderTimes.length > 1 ? index + 1 : ""}
                </label>
                <input
                  id={`rem-time-${index}`}
                  type="time"
                  value={time}
                  onChange={(e) =>
                    handleTimeChange(index, e.target.value)
                  }
                  required
                />
              </div>
            ))}

            <div className="form-field">
              <label htmlFor="rem-start">Start date</label>
              <input
                id="rem-start"
                type="date"
                value={startDate}
                readOnly
              />
            </div>

            <div className="form-field">
              <label htmlFor="rem-end">End date</label>
              <input
                id="rem-end"
                type="date"
                value={endDate}
                readOnly
              />
              {!endDate && (
                <small>No end date was set for this medicine.</small>
              )}
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
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setError(null);
              }}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              className="btn btn-primary"
              type="submit"
              form="reminder-form"
              disabled={submitting}
            >
              {submitting ? "Adding..." : "Add Reminder"}
            </button>
          </div>
        </Modal>
      )}

      {/* EDIT REMINDER MODAL */}
      {editingReminder && (
        <Modal
          title="Edit Reminder"
          onClose={() => {
            if (editSubmitting) return;
            setEditingReminder(null);
            setEditTime("");
            setError(null);
          }}
        >
          <form id="edit-reminder-form" onSubmit={handleEditSubmit}>
            {error && (
              <div className="error-banner modal-error" role="alert">
                {error}
              </div>
            )}

            <div className="form-field">
              <label>Medicine</label>
              <input
                type="text"
                value={editingReminder.medicine_name}
                readOnly
              />
            </div>

            {editingReminder.dosage && (
              <div className="form-field">
                <label>Dosage</label>
                <input
                  type="text"
                  value={editingReminder.dosage}
                  readOnly
                />
              </div>
            )}

            <div className="form-field">
              <label htmlFor="edit-reminder-time">Reminder time</label>
              <input
                id="edit-reminder-time"
                type="time"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                required
              />
            </div>

            <p style={{ fontSize: 12, color: "#6b7280" }}>
              This changes only this reminder's time. The medicine frequency
              and schedule dates remain unchanged.
            </p>
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
              type="button"
              onClick={() => {
                setEditingReminder(null);
                setEditTime("");
                setError(null);
              }}
              disabled={editSubmitting}
            >
              Cancel
            </button>

            <button
              className="btn btn-primary"
              type="submit"
              form="edit-reminder-form"
              disabled={editSubmitting}
            >
              {editSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {/* DELETE LOADING INDICATOR */}
      {deletingId !== null && (
        <p role="status" style={{ fontSize: 13, color: "#6b7280" }}>
          Deleting reminder...
        </p>
      )}
    </div>
  );
}

export default Reminders;
