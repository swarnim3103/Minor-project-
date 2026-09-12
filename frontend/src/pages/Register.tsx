import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    if (!name || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const data = await registerUser({
        name,
        email,
        password,
        role: "patient",
        phone_number: phoneNumber || null,
      });

      // Save auth state through context, so ProtectedRoute picks it up
      // immediately without needing a page reload.
      login(data.token, data.user);

      navigate("/dashboard");
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
    // Reuses Login.css's classes (login-page / login-left / login-right)
    // instead of the old undefined .login-container/.login-info classes,
    // so Register now actually gets the same styling as Login.
    <div className="login-page">

      {/* ================= LEFT SIDE ================= */}
      <section className="login-left">

        <div className="brand">
          <div className="brand-icon">+</div>
          <span>MedCare</span>
        </div>

        <div className="illustration-container">
          <img
            src="/medication-login.png"
            alt="Medication and healthcare illustration"
            className="login-illustration"
          />
        </div>

        <div className="left-content">
          <h1>
            Your health,
            <br />
            <span>our priority.</span>
          </h1>

          <p>
            Create your account and manage your medicines,
            <br />
            prescriptions and reminders in one place.
          </p>

          <div className="feature-list">
            <div className="feature-item">
              <span className="check-icon">✓</span>
              <span>Manage your medications</span>
            </div>
            <div className="feature-item">
              <span className="check-icon">✓</span>
              <span>Track your medication history</span>
            </div>
            <div className="feature-item">
              <span className="check-icon">✓</span>
              <span>Get personalized health assistance</span>
            </div>
          </div>
        </div>

      </section>


      {/* ================= RIGHT SIDE ================= */}
      <section className="login-right">

        <div className="login-form-container">

          <div className="form-heading">
            <h2>Create your account</h2>
            <p>
              Already have an account?{" "}
              <Link to="/login">Sign in</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="input-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoComplete="name"
              />
            </div>

            <div className="input-group">
              <label htmlFor="register-email">Email Address</label>
              <input
                id="register-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label htmlFor="phone">Phone Number (optional)</label>
              <input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
                autoComplete="tel"
              />
            </div>

            <div className="input-group">
              <label htmlFor="register-password">Password</label>
              <div className="password-input">
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <div className="password-input">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

          </form>

          <div className="security-note">
            <span>🔒</span>
            <span>Your information is securely protected</span>
          </div>

        </div>

      </section>

    </div>
  );
}

export default Register;
