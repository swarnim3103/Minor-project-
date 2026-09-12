import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  PillIcon,
  BellIcon,
  FileIcon,
  ChartIcon,
  SparkleIcon,
} from "./icons";
import "./Sidebar.css";

const navItems = [
  { to: "/dashboard", label: "Dashboard", Icon: HomeIcon },
  { to: "/medicines", label: "Medicines", Icon: PillIcon },
  { to: "/reminders", label: "Reminders", Icon: BellIcon },
  { to: "/prescriptions", label: "Prescriptions", Icon: FileIcon },
  { to: "/history", label: "History & Reports", Icon: ChartIcon },
  { to: "/chatbot", label: "AI Chatbot", Icon: SparkleIcon },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">+</div>
        <span>MedCare</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              "sidebar-link" + (isActive ? " sidebar-link-active" : "")
            }
          >
            <Icon className="sidebar-link-icon" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        Educational information only — always confirm with a doctor.
      </div>
    </aside>
  );
}

export default Sidebar;
