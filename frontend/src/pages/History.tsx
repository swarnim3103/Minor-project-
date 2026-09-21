import { useState, useEffect } from "react";
import { CheckIcon, ClockIcon } from "../components/icons";
import "../styles/shared.css";
import "./History.css";

const API_BASE = "http://localhost:5000/api";

type AdherenceDay = { day: string; pct: number };
type HistoryEntry = { date: string; medicine: string; time: string; status: "taken" | "missed" };

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

function History() {
  const [weeklyAdherence, setWeeklyAdherence] = useState<AdherenceDay[]>([]);
  const [historyLog, setHistoryLog] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [historyRes, adherenceRes] = await Promise.all([
        fetch(`${API_BASE}/history`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/history/adherence`, { headers: getAuthHeaders() }),
      ]);

      if (!historyRes.ok || !adherenceRes.ok) throw new Error("Failed to load history");

      const historyData = await historyRes.json();
      const adherenceData = await adherenceRes.json();

      setHistoryLog(historyData.history);
      setWeeklyAdherence(adherenceData.adherence);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Could not load history. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>History & Reports</h2>
          <p>Track your adherence over time and review past doses.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <section className="history-chart-card">
        <h3>This Week's Adherence</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
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
        )}
      </section>

      <section className="history-log">
        <h3>Recent Activity</h3>
        {loading ? (
          <p>Loading...</p>
        ) : historyLog.length === 0 ? (
          <p>No activity yet.</p>
        ) : (
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
        )}
      </section>
    </div>
  );
}

export default History;