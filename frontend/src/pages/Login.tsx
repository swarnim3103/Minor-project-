import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    // Temporary authentication for prototype
    setTimeout(() => {
      if (email === "test@gmail.com" && password === "123456") {
        navigate("/dashboard");
      } else {
        setError("Invalid email or password.");
      }

      setLoading(false);
    }, 800);
  };

  return (
    <div className="login-page">
      <div className="login-container">

        {/* Left Section */}
        <div className="login-info">
          <div className="brand">
            <div className="brand-icon">+</div>
            <span>MedCare</span>
          </div>

          <div className="login-info-content">
            <h1>
              Your health,
              <br />
              <span>our priority.</span>
            </h1>

            <p>
              Manage your medicines, prescriptions and reminders
              all in one place.
            </p>

            <div className="feature-list">
              <div className="feature-item">
                <span>✓</span>
                <p>Never miss a medication</p>
              </div>

              <div className="feature-item">
                <span>✓</span>
                <p>Track your medication history</p>
              </div>

              <div className="feature-item">
                <span>✓</span>
                <p>Get personalized health assistance</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="login-form-section">
          <div className="login-form-container">

            <div className="form-heading">
              <h2>Welcome back</h2>
              <p>Sign in to continue to your account</p>
            </div>

            <form onSubmit={handleSubmit}>

              {/* Email */}
              <div className="input-group">
                <label htmlFor="email">Email Address</label>

                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div className="input-group">
                <div className="password-label">
                  <label htmlFor="password">Password</label>

                  <button
                    type="button"
                    className="forgot-password"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="password-input">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <button
                    type="button"
                    className="show-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="login-error">
                  {error}
                </div>
              )}

              {/* Login button */}
              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>

            </form>

            <div className="register-link">
              Don't have an account?{" "}
              <Link to="/register">Create an account</Link>
            </div>

            <div className="security-note">
              🔒 Your information is securely protected
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;