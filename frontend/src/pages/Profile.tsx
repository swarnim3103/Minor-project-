import { useAuth } from "../context/AuthContext";
import "../styles/shared.css";

function Profile() {
  const { user } = useAuth();

  if (!user) {
  return (
    <div className="page-header">
      <div>
        <h2>My Profile</h2>
        <p>Unable to load your profile information.</p>
      </div>
    </div>
  );
}

  const userInitials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="profile-page">

      <div className="page-header">
        <div>
          <h2>My Profile</h2>
          <p>View your MedCare account information.</p>
        </div>
      </div>


      <div
        className="profile-card"
        style={{
          maxWidth: 650,
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: 24,
        }}
      >

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 28,
          }}
        >

          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "#e8f0ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            {userInitials}
          </div>

          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 20,
                color: "#1e293b",
              }}
            >
              {user.name}
            </h3>

            <p
              style={{
                margin: "5px 0 0",
                color: "#64748b",
                fontSize: 14,
              }}
            >
              {user.role || "User"}
            </p>
          </div>

        </div>


        <div
          style={{
            display: "grid",
            gap: 18,
          }}
        >

          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                color: "#64748b",
                marginBottom: 5,
              }}
            >
              Full name
            </label>

            <div
              style={{
                padding: "11px 13px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                color: "#1e293b",
              }}
            >
              {user.name}
            </div>
          </div>


          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                color: "#64748b",
                marginBottom: 5,
              }}
            >
              Email
            </label>

            <div
              style={{
                padding: "11px 13px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                color: "#1e293b",
              }}
            >
              {user.email}
            </div>
          </div>


          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                color: "#64748b",
                marginBottom: 5,
              }}
            >
              Account type
            </label>

            <div
              style={{
                padding: "11px 13px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                color: "#1e293b",
                textTransform: "capitalize",
              }}
            >
              {user.role || "User"}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Profile;