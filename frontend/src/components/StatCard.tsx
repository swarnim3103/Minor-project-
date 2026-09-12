import type { ReactNode } from "react";
import "./StatCard.css";

export type StatTone = "blue" | "green" | "orange" | "red";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: StatTone;
  hint?: string;
}

function StatCard({ label, value, icon, tone = "blue", hint }: StatCardProps) {
  return (
    <div className={`stat-card stat-card-${tone}`}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-body">
        <span className="stat-card-value">{value}</span>
        <span className="stat-card-label">{label}</span>
        {hint && <span className="stat-card-hint">{hint}</span>}
      </div>
    </div>
  );
}

export default StatCard;
