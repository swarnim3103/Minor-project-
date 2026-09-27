
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
} from "react";

import {
  getMyProfile,
  uploadProfilePicture,
  removeProfilePicture,
  deleteMyAccount,
  type UserProfile,
} from "../services/authService";

import { useAuth } from "../context/AuthContext";
import "../styles/shared.css";

function Profile() {
  const { updateUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [uploading, setUploading] = useState(false);
  const [removingPicture, setRemovingPicture] = useState(false);

  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load the user's profile.
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const data = await getMyProfile();
        setProfile(data);

        // Keep the navbar profile picture in sync
        // with the profile returned by the backend.
        updateUser({
          profile_picture_url: data.profile_picture_url ?? null,
          name: data.name,
          email: data.email,
          role: data.role,
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load your profile."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [updateUser]);

  const initials = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");

  const formatDate = (date: string) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Upload or change profile picture.
  const handlePictureUpload = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    // Allow the same file to be selected again.
    event.target.value = "";

    if (!file) return;

    setError("");
    setMessage("");

    const MAX_SIZE = 5 * 1024 * 1024;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    // Validate image format.
    if (!allowedTypes.includes(file.type)) {
      setError(
        "Unsupported image format. Please upload a JPG, PNG, or WEBP image."
      );
      return;
    }

    // Validate image size.
    if (file.size > MAX_SIZE) {
      setError(
        "Image size must be 5 MB or less. Please choose a smaller image."
      );
      return;
    }

    try {
      setUploading(true);

      const result = await uploadProfilePicture(file);

      const imageUrl = result.profile_picture_url;

      // Update the Profile page.
      setProfile((current) =>
        current
          ? {
              ...current,
              profile_picture_url: imageUrl,
            }
          : current
      );

      // Update the navbar immediately.
      updateUser({
        profile_picture_url: imageUrl,
      });

      setMessage("Profile picture updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not upload profile picture. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  // Remove profile picture.
  const handleRemovePicture = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to remove your profile picture?"
    );

    if (!confirmed) return;

    try {
      setRemovingPicture(true);
      setError("");
      setMessage("");

      await removeProfilePicture();

      // Remove picture from the Profile page.
      setProfile((current) =>
        current
          ? {
              ...current,
              profile_picture_url: null,
            }
          : current
      );

      // Remove picture from the navbar.
      updateUser({
        profile_picture_url: null,
      });

      setMessage("Profile picture removed.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not remove profile picture."
      );
    } finally {
      setRemovingPicture(false);
    }
  };

  // Delete account.
  const handleDeleteAccount = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const confirmed = window.confirm(
      "This will permanently delete your MedCare account and its associated data. This action cannot be undone. Continue?"
    );

    if (!confirmed) return;

    try {
      setDeletingAccount(true);
      setError("");

      await deleteMyAccount(deletePassword);

      // Clear the session only after the server
      // confirms that the account was deleted.
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("users");

      window.location.replace("/login");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not delete your account."
      );

      setDeletingAccount(false);
    }
  };

  if (loading) {
    return <p>Loading your profile...</p>;
  }

  if (error && !profile) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h2>My Profile</h2>
            <p>View and manage your MedCare account.</p>
          </div>
        </div>

        <div className="error-banner">{error}</div>
      </div>
    );
  }

  if (!profile) {
    return <p>Profile information is unavailable.</p>;
  }

  const cardStyle: CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  };

  const buttonStyle: CSSProperties = {
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    padding: "10px 14px",
    background: "#ffffff",
    color: "#334155",
    cursor: "pointer",
    fontSize: 14,
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <h2>My Profile</h2>
          <p>View and manage your MedCare account.</p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          className="error-banner"
          role="alert"
          style={{ marginBottom: 16 }}
        >
          {error}
        </div>
      )}

      {/* Success message */}
      {message && (
        <div
          role="status"
          style={{
            padding: 12,
            marginBottom: 16,
            borderRadius: 8,
            background: "#f0fdf4",
            color: "#166534",
            border: "1px solid #bbf7d0",
          }}
        >
          {message}
        </div>
      )}

      {/* Profile header and picture */}
      <div
        style={{
          ...cardStyle,
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        {profile.profile_picture_url ? (
          <img
            src={profile.profile_picture_url}
            alt={`${profile.name}'s profile`}
            onError={(event) => {
              // If the image cannot load, show initials.
              event.currentTarget.style.display = "none";
            }}
            style={{
              width: 90,
              height: 90,
              minWidth: 90,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #e2e8f0",
            }}
          />
        ) : (
          <div
            style={{
              width: 90,
              height: 90,
              minWidth: 90,
              borderRadius: "50%",
              background: "#e8f0ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            {initials(profile.name) || "U"}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 180 }}>
          <h3
            style={{
              margin: "0 0 6px",
              fontSize: 22,
              color: "#1e293b",
            }}
          >
            {profile.name}
          </h3>

          <p style={{ margin: 0, color: "#64748b" }}>
            {profile.email}
          </p>

          <p
            style={{
              margin: "6px 0 14px",
              fontSize: 13,
              color: "#64748b",
            }}
          >
            Member since {formatDate(profile.created_at)}
          </p>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePictureUpload}
              style={{ display: "none" }}
            />

            <button
              type="button"
              style={buttonStyle}
              disabled={uploading || removingPicture}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading
                ? "Uploading..."
                : profile.profile_picture_url
                  ? "Change picture"
                  : "Upload picture"}
            </button>

            {profile.profile_picture_url && (
              <button
                type="button"
                style={buttonStyle}
                disabled={uploading || removingPicture}
                onClick={handleRemovePicture}
              >
                {removingPicture
                  ? "Removing..."
                  : "Remove picture"}
              </button>
            )}
          </div>

          {/* Image upload instructions */}
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 12,
              color: "#64748b",
            }}
          >
            Allowed formats: JPG, PNG, WEBP. Maximum size: 5 MB.
          </p>
        </div>
      </div>

      {/* Account information */}
      <div style={{ ...cardStyle, maxWidth: 850 }}>
        <h3
          style={{
            margin: "0 0 22px",
            color: "#1e293b",
            fontSize: 18,
          }}
        >
          Account Information
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 22,
          }}
        >
          <InfoField label="Full name" value={profile.name} />

          <InfoField
            label="Email address"
            value={profile.email}
          />

          <InfoField
            label="Phone number"
            value={profile.phone_number || "Not provided"}
          />
        </div>
      </div>

      {/* Delete account */}
      <div
        style={{
          ...cardStyle,
          maxWidth: 850,
          borderColor: "#fecaca",
        }}
      >
        <h3 style={{ margin: "0 0 8px", color: "#b91c1c" }}>
          Delete Account
        </h3>

        <p
          style={{
            margin: "0 0 18px",
            color: "#64748b",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          Permanently delete your account and associated MedCare
          data. This action cannot be undone.
        </p>

        {!showDeleteForm ? (
          <button
            type="button"
            onClick={() => {
              setError("");
              setMessage("");
              setShowDeleteForm(true);
            }}
            style={{
              ...buttonStyle,
              background: "#dc2626",
              color: "#ffffff",
              borderColor: "#dc2626",
            }}
          >
            Delete Account
          </button>
        ) : (
          <form
            onSubmit={handleDeleteAccount}
            style={{
              display: "grid",
              gap: 12,
              maxWidth: 400,
            }}
          >
            <label
              htmlFor="delete-account-password"
              style={{ fontSize: 14, color: "#334155" }}
            >
              Enter your current password to confirm
            </label>

            <input
              id="delete-account-password"
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(event) =>
                setDeletePassword(event.target.value)
              }
              required
              placeholder="Current password"
              style={{
                padding: 12,
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                fontSize: 14,
              }}
            />

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <button
                type="submit"
                disabled={deletingAccount || !deletePassword}
                style={{
                  ...buttonStyle,
                  background: "#dc2626",
                  color: "#ffffff",
                  borderColor: "#dc2626",
                  opacity: deletingAccount ? 0.7 : 1,
                }}
              >
                {deletingAccount
                  ? "Deleting..."
                  : "Permanently delete"}
              </button>

              <button
                type="button"
                disabled={deletingAccount}
                onClick={() => {
                  setShowDeleteForm(false);
                  setDeletePassword("");
                }}
                style={buttonStyle}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

interface InfoFieldProps {
  label: string;
  value: string;
}

function InfoField({ label, value }: InfoFieldProps) {
  return (
    <div>
      <p
        style={{
          margin: "0 0 7px",
          fontSize: 13,
          color: "#64748b",
        }}
      >
        {label}
      </p>

      <div
        style={{
          padding: "12px 14px",
          border: "1px solid #e2e8f0",
          borderRadius: 9,
          color: "#1e293b",
          background: "#ffffff",
          overflowWrap: "anywhere",
          fontSize: 14,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default Profile;