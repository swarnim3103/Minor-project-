import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";
import ReminderCard, { type Reminder } from "../components/ReminderCard";
import MedicineCard, { type Medicine } from "../components/MedicineCard";
import { PillIcon, BellIcon, ChartIcon, ClockIcon } from "../components/icons";
import "../styles/shared.css";
import "./Dashboard.css";
import {
  getDashboard,
  type DashboardData,
} from "../services/authService";
// TODO: replace with real data from GET /api/medicines, /api/reminders,
// /api/history/adherence once those backend routes exist.
const todaysReminders: Reminder[] = [
  { id: 1, medicine_name: "Metformin", reminder_time: "08:00", status: "active", dosage: "500mg after breakfast" },
  { id: 2, medicine_name: "Atorvastatin", reminder_time: "13:00", status: "active", dosage: "10mg after lunch" },
  { id: 3, medicine_name: "Vitamin D3", reminder_time: "21:00", status: "active", dosage: "1 tablet before bed" },
];

const recentMedicines: Medicine[] = [
  { id: 1, name: "Metformin", dosage: "500mg", frequency: "Twice daily", start_date: "2026-06-01" },
  { id: 2, name: "Atorvastatin", dosage: "10mg", frequency: "Once daily", start_date: "2026-05-12" },
];

function Dashboard() {
  const { users } = useAuth();
const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

const firstName = users?.name?.split(" ")[0] ?? "there";
useEffect(() => {
  const fetchDashboard = async () => {
    try {
      const data = await getDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  fetchDashboard();
}, []);
if (loading) {
  return <div>Loading dashboard...</div>;
}

if (error) {
  return <div>{error}</div>;
}
  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Welcome back, {firstName}</h2>
          <p>Here's your medication overview for today.</p>
        </div>
      </div>

<div className="dashboard-stats">
  <StatCard
    label="Active Medicines"
    value={dashboardData?.stats.activeMedicines ?? 0}
    icon={<PillIcon />}
    tone="blue"
  />

  <StatCard
    label="Reminders Today"
    value={dashboardData?.stats.remindersToday ?? 0}
    icon={<BellIcon />}
    tone="green"
  />
{/* 
  <StatCard
    label="Adherence Rate"
    value={`${dashboardData?.stats.adherence ?? 0}%`}
    icon={<ChartIcon />}
    tone="orange"
    hint="Last 30 days"
  /> */}

  <StatCard
    label="Missed This Week"
    value={dashboardData?.stats.missedThisWeek ?? 0}
    icon={<ClockIcon />}
    tone="red"
  />
</div>-

      <div className="dashboard-columns">
        <section className="dashboard-section">
          <h3>Today's Schedule</h3>
          <div className="stack">
            {todaysReminders.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} />
            ))}
          </div>
        </section>

        <section className="dashboard-section">
          <h3>Recently Added Medicines</h3>
          <div className="stack">
            {recentMedicines.map((medicine) => (
              <MedicineCard key={medicine.id} medicine={medicine} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
