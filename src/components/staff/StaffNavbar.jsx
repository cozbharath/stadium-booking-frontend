import { useState } from "react";
import { Link } from "react-router-dom";
import ProfileModal from "../common/ProfileModal";

function StaffNavbar({ onToggleSidebar, sidebarOpen }) {
    const [profileOpen, setProfileOpen] = useState(false);

    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    const displayName = storedUser?.name || "Staff Member";
    const avatarLetter = displayName.charAt(0).toUpperCase();

    return (
        <header className="staff-navbar">

            <button
                type="button"
                className="bn-sb-toggle"
                onClick={onToggleSidebar}
                aria-label="Toggle sidebar"
                aria-expanded={!!sidebarOpen}
            >
                ☰
            </button>

            <div className="staff-navbar-brand">
                <Link to="/staff/dashboard">
                    Your<span>Turn</span>
                </Link>

                <small>Staff Panel</small>
            </div>

            <div className="staff-navbar-right">

                <button
                    type="button"
                    className="staff-notification"
                    title="Notifications"
                >
                    🔔
                    <span className="staff-notification-dot"></span>
                </button>

                <div
                    className="staff-user"
                    onClick={() => setProfileOpen(true)}
                    style={{ cursor: "pointer" }}
                >

                    <div className="staff-user-avatar">
                        {avatarLetter}
                    </div>

                    <div className="staff-user-info">
                        <strong>{displayName}</strong>
                        <span>Service Staff</span>
                    </div>

                </div>

                <Link
                    to="/login"
                    className="staff-logout-button"
                >
                    Logout
                </Link>

            </div>

            <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

        </header>
    );
}

export default StaffNavbar;
