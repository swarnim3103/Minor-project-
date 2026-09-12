import { CheckIcon, ClockIcon } from "../components/icons";
import "../styles/shared.css";
import "./History.css";

// TODO: replace with GET /api/history and /api/history/adherence
const weeklyAdherence = [
  { day: "Mon", pct: 100 },
  { day: "Tue", pct: 100 },
  { day: "Wed", pct: 66 },
  { day: "Thu", pct: 100 },
  { day: "Fri", pct: 100 },
  { day: "Sat", pct: 33 },
  { day: "Sun", pct: 100 },
];

const historyLog = [
  { date: "2026-09-11", medicine: "Metformin", time: "08:00", status: "taken" },
  { date: "2026-09-11", medicine: "Atorvastatin", time: "13:00", status: "taken" },
  { date: "2026-09-10", medicine: "Vitamin D3", time: "21:00", status: "missed" },
  { date: "2026-09-10", medicine: "Metformin", time: "08:00", status: "taken" },
  { date: "2026-09-09", medicine: "Atorvastatin", time: "13:00", status: "taken" },
];

function History() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h2>History & Reports</h2>
          <p>Track your adherence over time and review past doses.</p>
        </div>
      </div>

      <section className="history-chart-card">
        <h3>This Week's Adherence</h3>
        <div className="history-chart">
          {weeklyAdherence.map((d) => (
            <div className="history-bar-col" key={d.day}>
              <div className="history-bar-track">
                <div
                  className="history-bar-fill"
                  style={{ height: `${d.pct}%` }}
                  title={`${d.pct}%`}
                />
              </div>
              <span>{d.day}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="history-log">
        <h3>Recent Activity</h3>
        <div className="stack">
          {historyLog.map((entry, i) => (
            <div className="history-log-row" key={i}>
              <div className={`history-log-icon ${entry.status === "taken" ? "history-log-icon-ok" : "history-log-icon-missed"}`}>
                {entry.status === "taken" ? <CheckIcon width={15} height={15} /> : <ClockIcon width={15} height={15} />}
              </div>
              <div className="history-log-body">
                <span className="history-log-medicine">{entry.medicine}</span>
                <span className="history-log-meta">{entry.date} &middot; {entry.time}</span>
              </div>
              <span className={`badge ${entry.status === "taken" ? "badge-green" : "badge-red"}`}>
                {entry.status === "taken" ? "Taken" : "Missed"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default History;
