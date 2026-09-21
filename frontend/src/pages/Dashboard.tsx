import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";
import ReminderCard from "../components/ReminderCard";
import MedicineCard from "../components/MedicineCard";
import {
  PillIcon,
  BellIcon,
  ClockIcon,
} from "../components/icons";
import "../styles/shared.css";
import "./Dashboard.css";
import {
  getDashboard,
  type DashboardData,
} from "../services/authService";

function Dashboard() {
  const { users } = useAuth();

  const [dashboardData, setDashboardData] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const firstName =
    users?.name?.split(" ")[0] ?? "there";

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);

        const data = await getDashboard();

        setDashboardData(data);
        setError("");
      } catch (err) {
        console.error("Dashboard error:", err);
        setError("Failed to load dashboard data.");
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
    return <div className="error-banner">{error}</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Welcome back, {firstName}</h2>
          <p>
            Here's your medication overview for today.
          </p>
        </div>
      </div>

      <div className="dashboard-stats">
        <StatCard
          label="Active Medicines"
          value={
            dashboardData?.stats.activeMedicines ?? 0
          }
          icon={<PillIcon />}
          tone="blue"
        />

        <StatCard
          label="Reminders Today"
          value={
            dashboardData?.stats.remindersToday ?? 0
          }
          icon={<BellIcon />}
          tone="green"
        />

        <StatCard
          label="Missed This Week"
          value={
            dashboardData?.stats.missedThisWeek ?? 0
          }
          icon={<ClockIcon />}
          tone="red"
        />
      </div>

      <div className="dashboard-columns">
        <section className="dashboard-section">
          <h3>Today's Schedule</h3>

          {dashboardData?.todaysReminders?.length === 0 ? (
            <div className="empty-state">
              <BellIcon width={32} height={32} />

              <h3>No reminders today</h3>

              <p>
                Add a reminder to see your medication
                schedule here.
              </p>
            </div>
          ) : (
            <div className="stack">
              {dashboardData?.todaysReminders?.map(
                (reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                  />
                )
              )}
            </div>
          )}
        </section>

        <section className="dashboard-section">
          <h3>Recently Added Medicines</h3>

          {dashboardData?.recentMedicines?.length === 0 ? (
            <div className="empty-state">
              <PillIcon width={32} height={32} />

              <h3>No medicines yet</h3>

              <p>
                Add a medicine to see it here.
              </p>
            </div>
          ) : (
            <div className="stack">
              {dashboardData?.recentMedicines?.map(
                (medicine) => (
                  <MedicineCard
                    key={medicine.id}
                    medicine={{
                      ...medicine,
                      start_date:
                        medicine.start_date ?? "",
                    }}
                  />
                )
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;