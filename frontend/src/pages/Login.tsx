import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const data = await loginUser(email, password);

      // Save auth state through context, so ProtectedRoute picks it up
      // immediately without needing a page reload.
      login(data.token, data.user);

      navigate("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong during login.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Ambient background effects */}
      <div className="ambient-glow ambient-glow-one"></div>
      <div className="ambient-glow ambient-glow-two"></div>

      {/* ================= TOP BRAND ================= */}
      <header className="login-header">
        <div className="login-brand">
          <div className="login-brand-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5S10.5 4.17 10.5 5v5.5H5c-.83 0-1.5.67-1.5 1.5S4.17 13.5 5 13.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5S19.83 10.5 19 10.5z" />
            </svg>
          </div>

          <span>MedCare</span>
        </div>
      </header>

      {/* ================= MAIN CARD ================= */}
      <main className="login-main">
        <div className="login-card">
          {/* ================= LEFT SHOWCASE ================= */}
          <section className="login-showcase">
            <div className="showcase-content">
              <div className="showcase-badge">
                <span className="badge-dot"></span>
                <span>Smart Health Ecosystem</span>
              </div>

              <h1>
                Your health,
                <br />
                <span>our priority.</span>
              </h1>

              <p className="showcase-description">
                Manage your medicines, prescriptions, and health reminders
                seamlessly all in one secure platform.
              </p>

              <div className="feature-list">
                <div className="feature-item">
                  <span className="feature-check">✓</span>
                  <span>Never miss a scheduled medication</span>
                </div>

                <div className="feature-item">
                  <span className="feature-check">✓</span>
                  <span>Track your full medication history &amp; logs</span>
                </div>

                <div className="feature-item">
                  <span className="feature-check">✓</span>
                  <span>Get personalized health &amp; safety assistance</span>
                </div>
              </div>
            </div>

            {/* ================= FLOATING MEDICAL CARDS ================= */}
            <div className="medical-visual">
              {/* Main medicine card */}
              <div className="medicine-card">
                <div className="medicine-card-top">
                  <div className="medicine-info">
                    <div className="medicine-icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M7.5 3.5a4 4 0 0 1 5.66 0l7.34 7.34a4 4 0 0 1 0 5.66l-1 1a4 4 0 0 1-5.66 0L6.5 10.16a4 4 0 0 1 0-5.66l1-1Zm1.41 1.41-1 1a2 2 0 0 0 0 2.83l2.13 2.13 3.83-3.83-2.13-2.13a2 2 0 0 0-2.83 0Zm6.37 3.54-3.83 3.83 3.83 3.83a2 2 0 0 0 2.83 0l1-1a2 2 0 0 0 0-2.83l-3.83-3.83Z" />
                      </svg>
                    </div>

                    <div>
                      <h3>Amoxicillin 500mg</h3>
                      <p>1 Capsule • After Meal</p>
                    </div>
                  </div>

                  <span className="medicine-time">08:00 AM</span>
                </div>

                <div className="dose-progress">
                  <div className="dose-progress-label">
                    <span>Daily Dose Progress</span>
                    <strong>2 / 3 Taken</strong>
                  </div>

                  <div className="progress-track">
                    <div className="progress-fill"></div>
                  </div>
                </div>
              </div>

              {/* Heart rate floating card */}
              <div className="floating-card heart-card">
                <div className="floating-icon heart-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Zm-1.41 6.37L12 18.41l-7.43-7.43a3.5 3.5 0 0 1 4.95-4.95L12 8.5l2.48-2.47a3.5 3.5 0 0 1 4.95 4.95Z" />
                  </svg>
                </div>

                <div>
                  <span className="floating-label">Heart Rate</span>
                  <strong>
                    72 <small>BPM</small>
                  </strong>
                </div>
              </div>

              {/* Adherence floating card */}
              <div className="floating-card streak-card">
                <div className="floating-icon streak-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M13.5 2.5c.22 2.05-.38 3.45-1.44 4.54-.76.78-1.59 1.25-2.26 1.98-.8.86-1.3 1.91-1.3 3.28 0 1.03.4 1.95 1.05 2.64-.08-.36-.06-.75.08-1.15.25-.73.77-1.31 1.4-1.85.63-.54 1.29-1.03 1.72-1.77.34-.59.46-1.24.4-1.94 2.08 1.7 3.35 4.06 3.35 6.63 0 2.06-.75 3.93-2 5.38 3.35-.72 5.5-3.68 5.5-7.08 0-4.53-2.86-8.54-6.5-10.66ZM8.9 18.86a5.43 5.43 0 0 1-2.4-4.52c0-1.47.53-2.78 1.52-3.91-.16 1.42.1 2.58.79 3.53.58.8 1.36 1.28 1.78 2.04.45.82.39 1.72-.02 2.86-.49.06-.98.06-1.67 0Z" />
                  </svg>
                </div>

                <div>
                  <span className="floating-label">Adherence Streak</span>
                  <strong>14 Days 🔥</strong>
                </div>
              </div>
            </div>

            <div className="showcase-footer">
              © 2026 MedCare Systems Inc. All rights reserved.
            </div>
          </section>

          {/* ================= RIGHT LOGIN FORM ================= */}
          <section className="login-form-section">
            <div className="login-form-container">
              <div className="form-heading">
                <h2>Welcome Back!</h2>

                <p>
                  Don&apos;t have an account yet?{" "}
                  <Link to="/register">Sign Up</Link>
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Email */}
                <div className="input-group">
                  <label htmlFor="email">Email Address</label>

                  <div className="input-wrapper">
                    <span className="input-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z" />
                      </svg>
                    </span>

                    <input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="input-group">
                  <div className="password-label">
                    <label htmlFor="password">Password</label>

                    <button
                      type="button"
                      className="forgot-password"
                      onClick={() => {
                        // Forgot password functionality can be added later
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <div className="input-wrapper password-wrapper">
                    <span className="input-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-7a3 3 0 0 0-3-3Zm-7-2a2 2 0 0 1 4 0v2h-4V6Zm7 12H7v-7h10v7Z" />
                      </svg>
                    </span>

                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      disabled={loading}
                      autoComplete="current-password"
                    />

                    <button
                      type="button"
                      className="show-password"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <div className="login-options">
                  <label className="remember-me">
                    <input type="checkbox" disabled={loading} />
                    <span>Keep me logged in</span>
                  </label>
                </div>

                {/* Error */}
                {error && (
                  <div className="login-error" role="alert">
                    <span className="error-icon">!</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Login button */}
                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Login</span>
                  )}
                </button>
              </form>

              {/* Security */}
              <div className="security-note">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2 4 5v6c0 5.25 3.4 10.16 8 11 4.6-.84 8-5.75 8-11V5l-8-3Zm0 17.92C8.95 19.05 6 15.3 6 11V6.38l6-2.25 6 2.25V11c0 4.3-2.95 8.05-6 8.92ZM10.5 12.5 9 11l-1 1 2.5 2.5L16 9l-1-1-4.5 4.5Z" />
                </svg>

                <span>Your information is securely protected</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Login;