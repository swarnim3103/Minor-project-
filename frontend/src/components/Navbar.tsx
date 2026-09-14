import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogoutIcon } from "./icons";
import "./Navbar.css";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/medicines": "Manage Medicines",
  "/reminders": "Set Reminders",
  "/prescriptions": "Prescriptions",
  "/history": "History & Reports",
  "/chatbot": "AI Chatbot",
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

interface NavbarProps {
  onMenuClick: () => void;
}

function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const title = pageTitles[location.pathname] ?? "MedCare";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="navbar">

      {/* Left side */}
      <div className="navbar-left">

        <button
          className="navbar-menu-button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <h1 className="navbar-title">
          {title}
        </h1>

      </div>

      {/* Right side */}
      <div className="navbar-actions">

        <div className="navbar-user">

          <div className="navbar-avatar">
            {user ? initials(user.name) : "?"}
          </div>

          <div className="navbar-user-info">
            <span className="navbar-user-name">
              {user?.name ?? "User"}
            </span>

            <span className="navbar-user-role">
              {user?.role ?? ""}
            </span>
          </div>

        </div>

        <button
          className="navbar-logout"
          onClick={handleLogout}
        >
          <LogoutIcon width={17} height={17} />
          <span>Log out</span>
        </button>

      </div>

    </header>
  );
}

export default Navbar;