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

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function getRequiredTimeCount(frequency: string) {
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

function getRecurrenceText(frequency: string) {
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
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [medicineId, setMedicineId] = useState<number | null>(null);

  const [reminderTimes, setReminderTimes] = useState<string[]>([
    "08:00",
  ]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReminders();
    loadMedicines();
  }, []);

  // =========================
  // LOAD REMINDERS
  // =========================

  async function loadReminders() {
    try {
      setLoading(true);

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

      const mapped: Reminder[] = reminderList.map(
        (r: any) => ({
          id: r.id,
          medicine_name: r.medicine_name,
          reminder_time:
            r.reminder_time?.slice(0, 5),
          status: r.status,
          dosage: r.dosage || "",
        })
      );

      setReminders(mapped);
      setError(null);

    } catch (err) {
      console.error(err);

      setError(
        "Could not load reminders. Is the backend running?"
      );

    } finally {
      setLoading(false);
    }
  }

  // =========================
  // LOAD MEDICINES
  // =========================

  async function loadMedicines() {
    try {
      const res = await fetch(
        `${API_BASE}/medicines`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to load medicines");
      }

      const data = await res.json();

      const medicineList: Medicine[] =
        Array.isArray(data)
          ? data
          : data.medicines || [];

      setMedicines(medicineList);

      if (medicineList.length > 0) {
        const firstMedicine = medicineList[0];

        setMedicineId(firstMedicine.id);

        setStartDate(firstMedicine.start_date);

        setEndDate(
          firstMedicine.end_date ?? ""
        );

        setReminderTimes(
          Array(
            getRequiredTimeCount(
              firstMedicine.frequency
            )
          ).fill("08:00")
        );
      }

    } catch (err) {
      console.error(
        "Failed to load medicines:",
        err
      );

      setMedicines([]);
      setMedicineId(null);
      setStartDate("");
      setEndDate("");
    }
  }

  // =========================
  // SELECT MEDICINE
  // =========================

  function handleMedicineChange(
    selectedId: number
  ) {
    const selectedMedicine =
      medicines.find(
        (medicine) =>
          medicine.id === selectedId
      );

    if (!selectedMedicine) {
      return;
    }

    setMedicineId(selectedId);

    // Automatically copy medicine dates
    setStartDate(
      selectedMedicine.start_date
    );

    setEndDate(
      selectedMedicine.end_date ?? ""
    );

    // Automatically create correct number
    // of time fields
    const count = getRequiredTimeCount(
      selectedMedicine.frequency
    );

    setReminderTimes(
      Array(count).fill("08:00")
    );
  }

  // =========================
  // CHANGE REMINDER TIME
  // =========================

  function handleTimeChange(
    index: number,
    value: string
  ) {
    setReminderTimes((previous) =>
      previous.map((time, i) =>
        i === index ? value : time
      )
    );
  }

  // =========================
  // TOGGLE REMINDER
  // =========================

  async function toggleReminder(id: number) {
    const target = reminders.find(
      (r) => r.id === id
    );

    if (!target) return;

    const newStatus =
      target.status === "active"
        ? "inactive"
        : "active";

    setReminders((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: newStatus,
            }
          : r
      )
    );

    try {
      const res = await fetch(
        `${API_BASE}/reminders/${id}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(
          "Failed to update reminder"
        );
      }

    } catch (err) {
      console.error(err);

      setReminders((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: target.status,
              }
            : r
        )
      );
    }
  }

  // =========================
  // CREATE REMINDERS
  // =========================

  async function handleSubmit(
    e: FormEvent
  ) {
    e.preventDefault();

    if (!medicineId) {
      setError(
        "Please add a medicine before creating a reminder."
      );
      return;
    }

    const selectedMedicine =
      medicines.find(
        (medicine) =>
          medicine.id === medicineId
      );

    if (!selectedMedicine) {
      setError(
        "Selected medicine was not found."
      );
      return;
    }

    // Check that all times are filled
    if (
      reminderTimes.some(
        (time) => !time
      )
    ) {
      setError(
        "Please enter all reminder times."
      );
      return;
    }

    // Check duplicate times
    const uniqueTimes =
      new Set(reminderTimes);

    if (
      uniqueTimes.size !==
      reminderTimes.length
    ) {
      setError(
        "Please choose different times for each reminder."
      );
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(
        `${API_BASE}/reminders`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            medicine_id: medicineId,
            reminder_times: reminderTimes.map(
              (time) => `${time}:00`
            ),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to create reminder"
        );
      }

      await loadReminders();

      setIsModalOpen(false);

      setError(null);

    } catch (err: any) {
      console.error(err);

      setError(
        err.message ||
          "Failed to create reminder"
      );

    } finally {
      setSubmitting(false);
    }
  }

  // =========================
  // OPEN ADD REMINDER
  // =========================

  function openAddReminder() {
    if (medicines.length === 0) {
      setError(
        "Please add a medicine before creating a reminder."
      );
      return;
    }

    const firstMedicine = medicines[0];

    setMedicineId(firstMedicine.id);

    setStartDate(
      firstMedicine.start_date
    );

    setEndDate(
      firstMedicine.end_date ?? ""
    );

    setReminderTimes(
      Array(
        getRequiredTimeCount(
          firstMedicine.frequency
        )
      ).fill("08:00")
    );

    setError(null);

    setIsModalOpen(true);
  }

  const sorted = [...reminders].sort(
    (a, b) =>
      a.reminder_time.localeCompare(
        b.reminder_time
      )
  );

  const selectedMedicine =
    medicines.find(
      (medicine) =>
        medicine.id === medicineId
    );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Set Reminders</h2>

          <p>
            Set reminder times according to
            your medicine schedule.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={openAddReminder}
        >
          <PlusIcon
            width={16}
            height={16}
          />

          Add Reminder
        </button>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading reminders...</p>
      ) : sorted.length === 0 ? (
        <div className="empty-state">
          <BellIcon
            width={32}
            height={32}
          />

          <h3>No reminders set</h3>

          <p>
            Add a reminder so you never
            miss a dose.
          </p>
        </div>
      ) : (
        <div className="stack">
          {sorted.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onToggle={toggleReminder}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <Modal
          title="Add Reminder"
          onClose={() =>
            setIsModalOpen(false)
          }
        >
          <form
            id="reminder-form"
            onSubmit={handleSubmit}
          >

            {/* MEDICINE */}

            <div className="form-field">
              <label htmlFor="rem-medicine">
                Medicine
              </label>

              <select
                id="rem-medicine"
                value={medicineId ?? ""}
                onChange={(e) =>
                  handleMedicineChange(
                    Number(
                      e.target.value
                    )
                  )
                }
              >
                {medicines.map(
                  (medicine) => (
                    <option
                      key={medicine.id}
                      value={medicine.id}
                    >
                      {medicine.name}
                      {medicine.dosage
                        ? ` - ${medicine.dosage}`
                        : ""}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* FREQUENCY */}

            <div className="form-field">
              <label>
                Frequency
              </label>

              <input
                type="text"
                value={
                  selectedMedicine
                    ? selectedMedicine.frequency
                    : ""
                }
                readOnly
              />
            </div>

            {/* RECURRENCE */}

            <div className="form-field">
              <label>
                Repeat
              </label>

              <input
                type="text"
                value={
                  selectedMedicine
                    ? getRecurrenceText(
                        selectedMedicine.frequency
                      )
                    : ""
                }
                readOnly
              />
            </div>

            {/* REMINDER TIMES */}

            {reminderTimes.map(
              (time, index) => (
                <div
                  className="form-field"
                  key={index}
                >
                  <label
                    htmlFor={`rem-time-${index}`}
                  >
                    Reminder time{" "}
                    {reminderTimes.length > 1
                      ? index + 1
                      : ""}
                  </label>

                  <input
                    id={`rem-time-${index}`}
                    type="time"
                    value={time}
                    onChange={(e) =>
                      handleTimeChange(
                        index,
                        e.target.value
                      )
                    }
                    required
                  />
                </div>
              )
            )}

            {/* START DATE */}

            <div className="form-field">
              <label htmlFor="rem-start">
                Start date
              </label>

              <input
                id="rem-start"
                type="date"
                value={startDate}
                readOnly
              />
            </div>

            {/* END DATE */}

            <div className="form-field">
              <label htmlFor="rem-end">
                End date
              </label>

              <input
                id="rem-end"
                type="date"
                value={endDate}
                readOnly
              />

              {!endDate && (
                <small>
                  No end date was set for
                  this medicine.
                </small>
              )}
            </div>

          </form>

          <div
            style={{
              display: "flex",
              justifyContent:
                "flex-end",
              gap: 10,
              marginTop: 8,
            }}
          >
            <button
              className="btn btn-secondary"
              onClick={() =>
                setIsModalOpen(false)
              }
            >
              Cancel
            </button>

            <button
              className="btn btn-primary"
              type="submit"
              form="reminder-form"
              disabled={submitting}
            >
              {submitting
                ? "Adding..."
                : "Add Reminder"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Reminders;