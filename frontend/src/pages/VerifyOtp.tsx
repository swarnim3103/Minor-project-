import { useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  sendEmailOtp,
  verifyEmailOtp,
  sendPhoneOtp,
  verifyPhoneOtp,
} from "../services/authService";
import "./VerifyOtp.css";

interface LocationState {
  email?: string;
  phone_number?: string | null;
}

function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  const email = state.email || "";
  const phoneNumber = state.phone_number || "";

  // If someone lands here directly without registering first, send them back.
  if (!email) {
    return (
      <div className="verify-otp-page">
        <div className="verify-otp-card">
          <h2>Session expired</h2>
          <p>We couldn&apos;t find your registration details.</p>
          <Link to="/register" className="verify-otp-link-button">
            Back to Register
          </Link>
        </div>
      </div>
    );
  }

  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailResending, setEmailResending] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailInfo, setEmailInfo] = useState(
    "We've sent a 6-digit code to " + email
  );

  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(!phoneNumber); // no phone provided -> treat as not required
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneResending, setPhoneResending] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneInfo, setPhoneInfo] = useState(
    phoneNumber ? "We've sent a 6-digit code to " + phoneNumber : ""
  );

  const handleVerifyEmail = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailError("");

    if (!emailOtp.trim()) {
      setEmailError("Please enter the code sent to your email.");
      return;
    }

    try {
      setEmailLoading(true);
      await verifyEmailOtp(email, emailOtp.trim());
      setEmailVerified(true);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setEmailError("");
    setEmailInfo("");
    try {
      setEmailResending(true);
      await sendEmailOtp(email);
      setEmailInfo("A new code has been sent to " + email);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setEmailResending(false);
    }
  };

  const handleVerifyPhone = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPhoneError("");

    if (!phoneOtp.trim()) {
      setPhoneError("Please enter the code sent to your phone.");
      return;
    }

    try {
      setPhoneLoading(true);
      await verifyPhoneOtp(phoneNumber, phoneOtp.trim());
      setPhoneVerified(true);
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleResendPhone = async () => {
    setPhoneError("");
    setPhoneInfo("");
    try {
      setPhoneResending(true);
      await sendPhoneOtp(phoneNumber);
      setPhoneInfo("A new code has been sent to " + phoneNumber);
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setPhoneResending(false);
    }
  };

  const allVerified = emailVerified && phoneVerified;

  return (
    <div className="verify-otp-page">
      <div className="verify-otp-card">
        <h2>Verify your account</h2>
        <p className="verify-otp-subtitle">
          One quick step before you get started.
        </p>

        {/* EMAIL OTP */}
        <div className="verify-otp-section">
          <div className="verify-otp-section-header">
            <span>Email verification</span>
            {emailVerified && <span className="verify-otp-badge">Verified</span>}
          </div>

          {!emailVerified ? (
            <form onSubmit={handleVerifyEmail} className="verify-otp-form">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit code"
                value={emailOtp}
                onChange={(e) => {
                  setEmailOtp(e.target.value.replace(/\D/g, ""));
                  setEmailError("");
                }}
                disabled={emailLoading}
              />
              <button type="submit" disabled={emailLoading}>
                {emailLoading ? "Verifying..." : "Verify Email"}
              </button>
            </form>
          ) : (
            <p className="verify-otp-success">✓ Email verified</p>
          )}

          {!emailVerified && (
            <div className="verify-otp-meta">
              {emailInfo && <span className="verify-otp-info">{emailInfo}</span>}
              {emailError && <span className="verify-otp-error">{emailError}</span>}
              <button
                type="button"
                className="verify-otp-resend"
                onClick={handleResendEmail}
                disabled={emailResending}
              >
                {emailResending ? "Resending..." : "Resend code"}
              </button>
            </div>
          )}
        </div>

        {/* PHONE OTP */}
        {phoneNumber && (
          <div className="verify-otp-section">
            <div className="verify-otp-section-header">
              <span>Phone verification</span>
              {phoneVerified && <span className="verify-otp-badge">Verified</span>}
            </div>

            {!phoneVerified ? (
              <form onSubmit={handleVerifyPhone} className="verify-otp-form">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={phoneOtp}
                  onChange={(e) => {
                    setPhoneOtp(e.target.value.replace(/\D/g, ""));
                    setPhoneError("");
                  }}
                  disabled={phoneLoading}
                />
                <button type="submit" disabled={phoneLoading}>
                  {phoneLoading ? "Verifying..." : "Verify Phone"}
                </button>
              </form>
            ) : (
              <p className="verify-otp-success">✓ Phone verified</p>
            )}

            {!phoneVerified && (
              <div className="verify-otp-meta">
                {phoneInfo && <span className="verify-otp-info">{phoneInfo}</span>}
                {phoneError && <span className="verify-otp-error">{phoneError}</span>}
                <button
                  type="button"
                  className="verify-otp-resend"
                  onClick={handleResendPhone}
                  disabled={phoneResending}
                >
                  {phoneResending ? "Resending..." : "Resend code"}
                </button>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          className="verify-otp-continue"
          disabled={!allVerified}
          onClick={() => navigate("/dashboard")}
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  );
}

export default VerifyOtp;