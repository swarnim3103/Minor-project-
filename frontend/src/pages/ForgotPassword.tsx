import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword, resetPassword } from "../services/authService";
import "./ForgotPassword.css";

type Step = "request" | "reset" | "done";

function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      await forgotPassword(trimmedEmail);
      setStep("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!otp.trim()) {
      setError("Please enter the code sent to your email.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email.trim(), otp.trim(), newPassword);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-card">
        {step === "request" && (
          <>
            <h2>Forgot your password?</h2>
            <p className="forgot-password-subtitle">
              Enter the email linked to your account and we&apos;ll send you a
              reset code.
            </p>

            <form onSubmit={handleRequestOtp}>
              <div className="forgot-password-input-group">
                <label htmlFor="fp-email">Email Address</label>
                <input
                  id="fp-email"
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

              {error && <div className="forgot-password-error">{error}</div>}

              <button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Code"}
              </button>
            </form>
          </>
        )}

        {step === "reset" && (
          <>
            <h2>Enter reset code</h2>
            <p className="forgot-password-subtitle">
              We sent a 6-digit code to <strong>{email}</strong>.
            </p>

            <form onSubmit={handleResetPassword}>
              <div className="forgot-password-input-group">
                <label htmlFor="fp-otp">Reset Code</label>
                <input
                  id="fp-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ""));
                    setError("");
                  }}
                  disabled={loading}
                />
              </div>

              <div className="forgot-password-input-group">
                <label htmlFor="fp-new-password">New Password</label>
                <input
                  id="fp-new-password"
                  type="password"
                  placeholder="Create a new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError("");
                  }}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              <div className="forgot-password-input-group">
                <label htmlFor="fp-confirm-password">Confirm Password</label>
                <input
                  id="fp-confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              {error && <div className="forgot-password-error">{error}</div>}

              <button type="submit" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              <button
                type="button"
                className="forgot-password-secondary"
                onClick={async () => {
                  setError("");
                  try {
                    setLoading(true);
                    await forgotPassword(email);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to resend code.");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                Resend code
              </button>
            </form>
          </>
        )}

        {step === "done" && (
          <>
            <h2>Password reset!</h2>
            <p className="forgot-password-subtitle">
              Your password has been updated. You can now log in with your
              new password.
            </p>
            <button type="button" onClick={() => navigate("/login")}>
              Back to Login
            </button>
          </>
        )}

        {step !== "done" && (
          <p className="forgot-password-back">
            <Link to="/login">Back to Login</Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;