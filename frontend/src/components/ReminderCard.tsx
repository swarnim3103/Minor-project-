import { ClockIcon } from "./icons";
import "./ReminderCard.css";

export interface Reminder {
  id: number;
  medicine_name: string;
  reminder_time: string; // "08:00"
  status: "active" | "inactive";
  dosage?: string;
}

interface ReminderCardProps {
  reminder: Reminder;
  onToggle?: (id: number) => void;
}

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function ReminderCard({ reminder, onToggle }: ReminderCardProps) {
  return (
    <div className={`reminder-card ${reminder.status === "inactive" ? "reminder-card-inactive" : ""}`}>
      <div className="reminder-card-time">
        <ClockIcon width={17} height={17} />
        <span>{formatTime(reminder.reminder_time)}</span>
      </div>

      <div className="reminder-card-body">
        <h4>{reminder.medicine_name}</h4>
        {reminder.dosage && <p>{reminder.dosage}</p>}
      </div>

      <button
        className={`reminder-toggle ${reminder.status === "active" ? "reminder-toggle-on" : ""}`}
        onClick={() => onToggle?.(reminder.id)}
        aria-label={reminder.status === "active" ? "Deactivate reminder" : "Activate reminder"}
        role="switch"
        aria-checked={reminder.status === "active"}
      >
        <span className="reminder-toggle-knob" />
      </button>
    </div>
  );
}

export default ReminderCard;
