
import { ClockIcon } from "./icons";
import "./ReminderCard.css";

export interface Reminder {
  id: number;
  medicine_id: number;
  medicine_name: string;
  reminder_time: string;
  status: "active" | "inactive";
  dosage?: string;
  frequency?: string;
  day_of_week?: number | null;
}

interface ReminderCardProps {
  reminder: Reminder;
  onToggle?: (id: number) => void;
  onEdit?: (reminder: Reminder) => void;
  onDelete?: (reminder: Reminder) => void;
}

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;

  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function ReminderCard({
  reminder,
  onToggle,
  onEdit,
  onDelete,
}: ReminderCardProps) {
  return (
    <div
      className={`reminder-card ${
        reminder.status === "inactive" ? "reminder-card-inactive" : ""
      }`}
    >
      <div className="reminder-card-time">
        <ClockIcon width={17} height={17} />
        <span>{formatTime(reminder.reminder_time)}</span>
      </div>

      <div className="reminder-card-body">
        <h4>{reminder.medicine_name}</h4>
        {reminder.dosage && <p>{reminder.dosage}</p>}
      </div>

      <div className="reminder-card-actions">
        <button
          type="button"
          className="reminder-action-button reminder-edit-button"
          onClick={() => onEdit?.(reminder)}
          aria-label={`Edit reminder for ${reminder.medicine_name}`}
        >
          Edit
        </button>

        <button
          type="button"
          className="reminder-action-button reminder-delete-button"
          onClick={() => onDelete?.(reminder)}
          aria-label={`Delete reminder for ${reminder.medicine_name}`}
        >
          Delete
        </button>

        <button
          type="button"
          className={`reminder-toggle ${
            reminder.status === "active" ? "reminder-toggle-on" : ""
          }`}
          onClick={() => onToggle?.(reminder.id)}
          aria-label={
            reminder.status === "active"
              ? "Deactivate reminder"
              : "Activate reminder"
          }
          role="switch"
          aria-checked={reminder.status === "active"}
        >
          <span className="reminder-toggle-knob" />
        </button>
      </div>
    </div>
  );
}

export default ReminderCard;
