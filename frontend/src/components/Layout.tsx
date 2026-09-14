import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { SparkleIcon } from "./icons";

import "./Layout.css";

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
        />
      )}

      <div className="app-main">
        <Navbar
          onMenuClick={toggleSidebar}
        />

        <main className="app-content">
          <Outlet />
        </main>

        {/* Chatbot shortcut */}
        <button
          className="chatbot-shortcut"
          onClick={() => window.location.href = "/chatbot"}
          aria-label="Open AI Chatbot"
          title="Open AI Chatbot"
        >
          <SparkleIcon />
        </button>
      </div>
    </div>
  );
}

export default Layout;