import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Profile from "./pages/Profile";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Medicines from "./pages/Medicines";
import Reminders from "./pages/Reminders";
import Prescriptions from "./pages/Prescriptions";
import History from "./pages/History";
import Chatbot from "./pages/Chatbot";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Default route */}
          <Route
            path="/"
            element={<Navigate to="/login" replace />}
          />

          {/* Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />


          {/* Authenticated application pages */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/medicines"
              element={<Medicines />}
            />

            <Route
              path="/reminders"
              element={<Reminders />}
            />

            <Route
              path="/prescriptions"
              element={<Prescriptions />}
            />

            <Route
              path="/history"
              element={<History />}
            />

            <Route
              path="/chatbot"
              element={<Chatbot />}
            />

            {/* Profile */}
            <Route
              path="/profile"
              element={<Profile />}
            />
          </Route>


          {/* Fallback */}
          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;