import { useEffect, useRef, useState } from "react";
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
  "/profile": "My Profile",
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

  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  const title = pageTitles[location.pathname] ?? "MedCare";

  function handleLogout() {
    setProfileOpen(false);
    logout();
    navigate("/login");
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

        <div
          className="navbar-profile"
          ref={profileRef}
        >

          {/* User button */}
          <button
            className="navbar-user"
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-label="Open user profile"
            aria-expanded={profileOpen}
          >

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

            <span
              className={`profile-chevron ${
                profileOpen ? "profile-chevron-open" : ""
              }`}
            >
              ▴
            </span>

          </button>


          {/* Profile dropdown */}
          {profileOpen && (
            <div className="profile-dropdown">

              {/* Profile information */}
              <div className="profile-dropdown-header">

                <div className="profile-dropdown-avatar">
                  {user ? initials(user.name) : "?"}
                </div>

                <div className="profile-dropdown-info">

                  <strong>
                    {user?.name ?? "User"}
                  </strong>

                  <span>
                    {user?.email ?? ""}
                  </span>

                </div>

              </div>


              <div className="profile-dropdown-divider" />


              {/* My Profile */}
              <button
                className="profile-dropdown-item"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/profile");
                }}
              >
                <span className="profile-dropdown-icon">
                  👤
                </span>

                <span>
                  My Profile
                </span>
              </button>


              {/* Logout */}
              <button
                className="profile-dropdown-item profile-logout-item"
                onClick={handleLogout}
              >
                <span className="profile-dropdown-icon">
                  <LogoutIcon width={16} height={16} />
                </span>

                <span>
                  Log out
                </span>
              </button>

            </div>
          )}

        </div>

      </div>

    </header>
  );
}

export default Navbar;