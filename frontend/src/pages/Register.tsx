import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import "./Register.css";

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // PASSWORD VALIDATION
  // =========================

  const passwordChecks = {
    minLength: password.length >= 8,
    maxLength: password.length <= 64,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9\s]/.test(password),
    noSpaces: !/\s/.test(password),
  };

  const isPasswordValid =
    passwordChecks.minLength &&
    passwordChecks.maxLength &&
    passwordChecks.uppercase &&
    passwordChecks.lowercase &&
    passwordChecks.number &&
    passwordChecks.special &&
    passwordChecks.noSpaces;

  // =========================
  // EMAIL VALIDATION
  // =========================

  const isValidEmail = (value: string): boolean => {
    const trimmedEmail = value.trim();

    /*
     * This checks for a normal email structure:
     * something@example.com
     *
     * It also prevents:
     * - spaces
     * - multiple @
     * - missing domain
     * - missing domain extension
     * - consecutive dots
     */
    const emailRegex =
      /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

    if (!trimmedEmail) {
      return false;
    }

    if (trimmedEmail.includes(" ")) {
      return false;
    }

    if (trimmedEmail.includes("..")) {
      return false;
    }

    return emailRegex.test(trimmedEmail);
  };

  // =========================
  // NAME VALIDATION
  // =========================

  const isValidName = (value: string): boolean => {
    const trimmedName = value.trim();

    // Minimum and maximum length
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return false;
    }

    /*
     * Allows:
     * - English letters
     * - spaces
     * - hyphen
     * - apostrophe
     *
     * Examples:
     * Vaishnavi Sharma
     * Mary-Jane
     * O'Connor
     */
    const nameRegex = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;

    return nameRegex.test(trimmedName);
  };

  // =========================
  // PHONE VALIDATION
  // =========================

  const isValidPhone = (value: string): boolean => {
    /*
     * Indian mobile number:
     * - exactly 10 digits
     * - starts with 6, 7, 8 or 9
     */
    const phoneRegex = /^[6-9][0-9]{9}$/;

    return phoneRegex.test(value);
  };

  // =========================
  // FORM SUBMIT
  // =========================

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    // Trim values that should not contain accidental spaces
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phoneNumber.trim();

    // =========================
    // REQUIRED FIELD CHECK
    // =========================

    if (!trimmedName) {
      setError("Please enter your full name.");
      return;
    }

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!trimmedPhone) {
      setError("Please enter your phone number.");
      return;
    }

    if (!password) {
      setError("Please create a password.");
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your password.");
      return;
    }

    // =========================
    // NAME CHECK
    // =========================

    if (trimmedName.length < 2) {
      setError("Full name must contain at least 2 characters.");
      return;
    }

    if (trimmedName.length > 100) {
      setError("Full name must not exceed 100 characters.");
      return;
    }

    if (!isValidName(trimmedName)) {
      setError(
        "Full name can only contain letters, spaces, hyphens, and apostrophes."
      );
      return;
    }

    // =========================
    // EMAIL CHECK
    // =========================

    if (!isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    // =========================
    // PHONE CHECK
    // =========================

    if (!isValidPhone(trimmedPhone)) {
      setError(
        "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9."
      );
      return;
    }

    // =========================
    // PASSWORD CHECKS
    // =========================

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password.length > 64) {
      setError("Password must not exceed 64 characters.");
      return;
    }

    if (/\s/.test(password)) {
      setError("Password must not contain spaces.");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError("Password must contain at least one lowercase letter.");
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number.");
      return;
    }

    if (!/[^A-Za-z0-9\s]/.test(password)) {
      setError("Password must contain at least one special character.");
      return;
    }

    // =========================
    // WEAK PASSWORD CHECKS
    // =========================

    const normalizedName = trimmedName
      .toLowerCase()
      .replace(/[^a-z]/g, "");

    const normalizedEmail = trimmedEmail
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    const normalizedPassword = password.toLowerCase();

    if (
      normalizedPassword === "password" ||
      normalizedPassword === "password123" ||
      normalizedPassword === "12345678" ||
      normalizedPassword === "123456789" ||
      normalizedPassword === "qwerty123"
    ) {
      setError("Please choose a stronger password.");
      return;
    }

    if (
      normalizedName.length >= 3 &&
      normalizedPassword.includes(normalizedName)
    ) {
      setError("Password should not contain your name.");
      return;
    }

    if (
      normalizedEmail.length >= 3 &&
      normalizedPassword.includes(normalizedEmail)
    ) {
      setError("Password should not contain your email address.");
      return;
    }

    // =========================
    // CONFIRM PASSWORD
    // =========================

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // =========================
    // API REQUEST
    // =========================

    try {
      setLoading(true);

      const data = await registerUser({
        name: trimmedName,
        email: trimmedEmail,
        password,
        role: "patient",
        phone_number: trimmedPhone,
      });

      // Save auth state through context
      // so ProtectedRoute picks it up immediately.
      login(data.token, data.user);

      // ---- CHANGED: go to OTP verification instead of straight to dashboard ----
      navigate("/verify-otp", {
        state: { email: trimmedEmail, phone_number: trimmedPhone },
      });
      // ---------------------------------------------------------------------
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong during registration.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      {/* Ambient background effects */}
      <div className="register-ambient-glow register-glow-one"></div>
      <div className="register-ambient-glow register-glow-two"></div>

      {/* ================= TOP BRAND ================= */}
      <header className="register-header">
        <div className="register-brand">
          <div className="register-brand-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5S10.5 4.17 10.5 5v5.5H5c-.83 0-1.5.67-1.5 1.5S4.17 13.5 5 13.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5S19.83 10.5 19 10.5z" />
            </svg>
          </div>

          <span>MedCare</span>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="register-main">
        <div className="register-card">

          {/* ================= LEFT SHOWCASE ================= */}
          <section className="register-showcase">
            <div className="register-showcase-content">

              <div className="register-showcase-badge">
                <span className="register-badge-dot"></span>
                <span>Smart Health Ecosystem</span>
              </div>

              <h1>
                Your health,
                <br />
                <span>our priority.</span>
              </h1>

              <p className="register-showcase-description">
                Create your account and manage your medicines,
                prescriptions, and health reminders seamlessly
                in one secure platform.
              </p>

              <div className="register-feature-list">

                <div className="register-feature-item">
                  <span className="register-feature-check">✓</span>
                  <span>Manage your medications</span>
                </div>

                <div className="register-feature-item">
                  <span className="register-feature-check">✓</span>
                  <span>Track your medication history &amp; logs</span>
                </div>

                <div className="register-feature-item">
                  <span className="register-feature-check">✓</span>
                  <span>Get personalized health assistance</span>
                </div>

              </div>
            </div>

            {/* ================= MEDICAL VISUAL ================= */}
            <div className="register-medical-visual">

              {/* Main card */}
              <div className="register-medicine-card">

                <div className="register-medicine-top">

                  <div className="register-medicine-info">

                    <div className="register-medicine-icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M7.5 3.5a4 4 0 0 1 5.66 0l7.34 7.34a4 4 0 0 1 0 5.66l-1 1a4 4 0 0 1-5.66 0L6.5 10.16a4 4 0 0 1 0-5.66l1-1a4 4 0 0 1 5.66 0Zm1.41 1.41-1 1a2 2 0 0 0 0 2.83l2.13 2.13 3.83-3.83-2.13-2.13a2 2 0 0 0-2.83 0Zm6.37 3.54-3.83 3.83 3.83 3.83a2 2 0 0 0 2.83 0l1-1a2 2 0 0 0 0-2.83l-3.83-3.83Z" />
                      </svg>
                    </div>

                    <div>
                      <h3>Daily Medication</h3>
                      <p>Medication Reminder</p>
                    </div>

                  </div>

                  <span className="register-medicine-time">
                    08:00 AM
                  </span>

                </div>

                <div className="register-dose-progress">

                  <div className="register-dose-label">
                    <span>Reminder Progress</span>
                    <strong>2 / 3</strong>
                  </div>

                  <div className="register-progress-track">
                    <div className="register-progress-fill"></div>
                  </div>

                </div>

              </div>

              {/* Health card */}
              <div className="register-floating-card register-health-card">

                <div className="register-floating-icon register-heart-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Zm-1.41 6.37L12 18.41l-7.43-7.43a3.5 3.5 0 0 1 4.95-4.95L12 8.5l2.48-2.47a3.5 3.5 0 0 1 4.95 4.95Z" />
                  </svg>
                </div>

                <div>
                  <span className="register-floating-label">
                    Health Tracking
                  </span>

                  <strong>Active</strong>
                </div>

              </div>

              {/* Streak card */}
              <div className="register-floating-card register-streak-card">

                <div className="register-floating-icon register-streak-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M13.5 2.5c.22 2.05-.38 3.45-1.44 4.54-.76.78-1.59 1.25-2.26 1.98-.8.86-1.3 1.91-1.3 3.28 0 1.03.4 1.95 1.05 2.64-.08-.36-.06-.75.08-1.15.25-.73.77-1.31 1.4-1.85.63-.54 1.29-1.03 1.72-1.77.34-.59.46-1.24.4-1.94 2.08 1.7 3.35 4.06 3.35 6.63 0 2.06-.75 3.93-2 5.38 3.35-.72 5.5-3.68 5.5-7.08 0-4.53-2.86-8.54-6.5-10.66ZM8.9 18.86a5.43 5.43 0 0 1-2.4-4.52c0-1.47.53-2.78 1.52-3.91-.16 1.42.1 2.58.79 3.53.58.8 1.36 1.28 1.78 2.04.45.82.39 1.72-.02 2.86-.49.06-.98.06-1.67 0Z" />
                  </svg>
                </div>

                <div>
                  <span className="register-floating-label">
                    Medication Support
                  </span>

                  <strong>24 / 7</strong>
                </div>

              </div>

            </div>

            <div className="register-showcase-footer">
              © 2026 MedCare Systems Inc. All rights reserved.
            </div>
          </section>

          {/* ================= RIGHT REGISTER FORM ================= */}
          <section className="register-form-section">

            <div className="register-form-container">

              <div className="register-form-heading">
                <h2>Create your account</h2>

                <p>
                  Already have an account?{" "}
                  <Link to="/login">Sign in</Link>
                </p>
              </div>

              <form onSubmit={handleSubmit}>

                {/* Full Name */}
                <div className="register-input-group">

                  <label htmlFor="name">
                    Full Name <span className="register-required">*</span>
                  </label>

                  <div className="register-input-wrapper">

                    <span className="register-input-icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v2h16v-2c0-2.76-3.58-5-8-5Z" />
                      </svg>
                    </span>

                    <input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setError("");
                      }}
                      disabled={loading}
                      autoComplete="name"
                    />

                  </div>

                </div>

                {/* Email */}
                <div className="register-input-group">

                  <label htmlFor="register-email">
                    Email Address <span className="register-required">*</span>
                  </label>

                  <div className="register-input-wrapper">

                    <span className="register-input-icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z" />
                      </svg>
                    </span>

                    <input
                      id="register-email"
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

                {/* Phone */}
                <div className="register-input-group">

                  <label htmlFor="phone">
                    Phone Number <span className="register-required">*</span>
                  </label>

                  <div className="register-input-wrapper">

                    <span className="register-input-icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6.62 10.79a15.46 15.46 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.61 21 3 13.39 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2Z" />
                      </svg>
                    </span>

                    <input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        setError("");
                      }}
                      disabled={loading}
                      autoComplete="tel"
                      inputMode="numeric"
                      maxLength={10}
                    />

                  </div>

                </div>

                {/* Password */}
                <div className="register-input-group">

                  <label htmlFor="register-password">
                    Password <span className="register-required">*</span>
                  </label>

                  <div className="register-input-wrapper register-password-wrapper">

                    <span className="register-input-icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-7a3 3 0 0 0-3-3Zm-7-2a2 2 0 0 1 4 0v2h-4V6Zm7 12H7v-7h10v7Z" />
                      </svg>
                    </span>

                    <input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      disabled={loading}
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      className="register-show-password"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>

                  </div>

                  {/* Password requirements */}
                  {password && (
                    <div className="register-password-requirements">

                      <div
                        className={
                          passwordChecks.minLength
                            ? "password-check valid"
                            : "password-check"
                        }
                      >
                        <span>
                          {passwordChecks.minLength ? "✓" : "○"}
                        </span>
                        <span>At least 8 characters</span>
                      </div>

                      <div
                        className={
                          passwordChecks.uppercase
                            ? "password-check valid"
                            : "password-check"
                        }
                      >
                        <span>
                          {passwordChecks.uppercase ? "✓" : "○"}
                        </span>
                        <span>One uppercase letter</span>
                      </div>

                      <div
                        className={
                          passwordChecks.lowercase
                            ? "password-check valid"
                            : "password-check"
                        }
                      >
                        <span>
                          {passwordChecks.lowercase ? "✓" : "○"}
                        </span>
                        <span>One lowercase letter</span>
                      </div>

                      <div
                        className={
                          passwordChecks.number
                            ? "password-check valid"
                            : "password-check"
                        }
                      >
                        <span>
                          {passwordChecks.number ? "✓" : "○"}
                        </span>
                        <span>One number</span>
                      </div>

                      <div
                        className={
                          passwordChecks.special
                            ? "password-check valid"
                            : "password-check"
                        }
                      >
                        <span>
                          {passwordChecks.special ? "✓" : "○"}
                        </span>
                        <span>One special character</span>
                      </div>

                      <div
                        className={
                          passwordChecks.noSpaces
                            ? "password-check valid"
                            : "password-check"
                        }
                      >
                        <span>
                          {passwordChecks.noSpaces ? "✓" : "○"}
                        </span>
                        <span>No spaces</span>
                      </div>

                    </div>
                  )}

                </div>

                {/* Confirm Password */}
                <div className="register-input-group">

                  <label htmlFor="confirm-password">
                    Confirm Password <span className="register-required">*</span>
                  </label>

                  <div className="register-input-wrapper register-password-wrapper">

                    <span className="register-input-icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-7a3 3 0 0 0-3-3Zm-7-2a2 2 0 0 1 4 0v2h-4V6Zm7 12H7v-7h10v7Z" />
                      </svg>
                    </span>

                    <input
                      id="confirm-password"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError("");
                      }}
                      disabled={loading}
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      className="register-show-password"
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
                      }
                      disabled={loading}
                      aria-label={
                        showConfirmPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>

                  </div>

                  {/* Confirm password live status */}
                  {confirmPassword && (
                    <div
                      className={
                        password === confirmPassword
                          ? "register-password-match valid"
                          : "register-password-match"
                      }
                    >
                      {password === confirmPassword
                        ? "✓ Passwords match"
                        : "Passwords do not match"}
                    </div>
                  )}

                </div>

                {/* Error */}
                {error && (
                  <div className="register-error" role="alert">
                    <span className="register-error-icon">
                      !
                    </span>

                    <span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  className="register-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="register-loading-spinner"></span>
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>

              </form>

              {/* Security */}
              <div className="register-security-note">

                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2 4 5v6c0 5.25 3.4 10.16 8 11 4.6-.84 8-5.75 8-11V5l-8-3Zm0 17.92C8.95 19.05 6 15.3 6 11V6.38l6-2.25 6 2.25V11c0 4.3-2.95 8.05-6 8.92ZM10.5 12.5 9 11l-1 1 2.5 2.5L16 9l-1-1-4.5 4.5-4.5 4.5Z" />
                </svg>

                <span>
                  Your information is securely protected
                </span>

              </div>

            </div>

          </section>

        </div>
      </main>
    </div>
  );
}

export default Register;