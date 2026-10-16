import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { put } from "../../services/api";

function StaffProfile() {

    const { user } = useAuth();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    // =========================================================
    // CHANGE PASSWORD
    // =========================================================

    const handleChangePassword = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("All password fields are required.");
            return;
        }

        if (newPassword.length < 6) {
            setError("New password must be at least 6 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("New password and confirm password do not match.");
            return;
        }

        try {

            setSaving(true);

            await put("/users/me/password", {
                currentPassword,
                newPassword,
            });

            setSuccess("Password updated successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

        } catch (err) {

            console.error("Change password error:", err);

            setError(
                err.message ||
                "Failed to update password."
            );

        } finally {
            setSaving(false);
        }
    };


    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="staff-dashboard-page">

            {/* HEADER */}

            <div className="staff-dashboard-header">
                <div>
                    <p className="page-tag">STAFF PROFILE</p>
                    <h1>My Profile</h1>
                    <p>View your account details and update your password.</p>
                </div>
            </div>


            <div className="staff-dashboard-grid">

                {/* ACCOUNT INFO */}

                <div className="staff-dashboard-card">

                    <div className="staff-dashboard-card-header">
                        <div>
                            <p className="page-tag">ACCOUNT</p>
                            <h2>Account Details</h2>
                        </div>
                    </div>

                    <div style={{ padding: "8px 4px", display: "flex", flexDirection: "column", gap: "14px" }}>

                        <div>
                            <span style={{ display: "block", fontSize: "13px", color: "#64748b" }}>Name</span>
                            <strong>{user?.name || "—"}</strong>
                        </div>

                        <div>
                            <span style={{ display: "block", fontSize: "13px", color: "#64748b" }}>Email</span>
                            <strong>{user?.email || "—"}</strong>
                        </div>

                        <div>
                            <span style={{ display: "block", fontSize: "13px", color: "#64748b" }}>Role</span>
                            <strong>{user?.role || "—"}</strong>
                        </div>

                    </div>

                </div>


                {/* CHANGE PASSWORD */}

                <div className="staff-dashboard-card">

                    <div className="staff-dashboard-card-header">
                        <div>
                            <p className="page-tag">SECURITY</p>
                            <h2>Change Password</h2>
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            padding: "12px 16px",
                            marginBottom: "16px",
                            borderRadius: "8px",
                            background: "#fff1f2",
                            color: "#b91c1c",
                            border: "1px solid #fecdd3"
                        }}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{
                            padding: "12px 16px",
                            marginBottom: "16px",
                            borderRadius: "8px",
                            background: "#f0fdf4",
                            color: "#15803d",
                            border: "1px solid #bbf7d0"
                        }}>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                        <div>
                            <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#64748b" }}>
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#64748b" }}>
                                New Password
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#64748b" }}>
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="staff-dashboard-primary-button"
                            style={{ border: "none", cursor: saving ? "not-allowed" : "pointer" }}
                        >
                            {saving ? "Saving..." : "Update Password"}
                        </button>

                    </form>

                </div>

            </div>

        </div>
    );
}

export default StaffProfile;