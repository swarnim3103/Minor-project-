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

      {/* ================= LEFT SIDE ================= */}
      <section className="login-left">

        {/* Brand */}
        <div className="brand">
          <div className="brand-icon">
            +
          </div>

          <span>MedCare</span>
        </div>

        {/* Illustration */}
        <div className="illustration-container">
          <img
            src="/medication-login.png"
            alt="Medication and healthcare illustration"
            className="login-illustration"
          />
        </div>

        {/* Text */}
        <div className="left-content">
          <h1>
            Your health,
            <br />
            <span>our priority.</span>
          </h1>

          <p>
            Manage your medicines, prescriptions and reminders
            <br />
            all in one place.
          </p>

          <div className="feature-list">

            <div className="feature-item">
              <span className="check-icon">✓</span>
              <span>Never miss a medication</span>
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

          {/* Heading */}
          <div className="form-heading">
            <h2>Welcome Back!</h2>

            <p>
              Don't have an account yet?{" "}
              <Link to="/register">
                Sign Up
              </Link>
            </p>
          </div>


          {/* Form */}
          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div className="input-group">

              <label htmlFor="email">
                Email Address
              </label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                disabled={loading}
                autoComplete="email"
              />

            </div>


            {/* Password */}
            <div className="input-group">

              <div className="password-label">

                <label htmlFor="password">
                  Password
                </label>

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


              <div className="password-input">

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
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
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>

            </div>


            {/* Remember me */}
            <div className="login-options">

              <label className="remember-me">

                <input
                  type="checkbox"
                  disabled={loading}
                />

                <span>Keep me logged in</span>

              </label>

            </div>


            {/* Error */}
            {error && (
              <div className="login-error">
                {error}
              </div>
            )}


            {/* Login Button */}
            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login"}
            </button>

          </form>


          {/* Security message */}
          <div className="security-note">
            <span>🔒</span>
            <span>Your information is securely protected</span>
          </div>

        </div>

      </section>

    </div>
  );
}

export default Login;
