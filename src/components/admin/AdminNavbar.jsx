import { useState } from "react";
import { Link } from "react-router-dom";
import ProfileModal from "../common/ProfileModal";

function AdminNavbar({ onToggleSidebar, sidebarOpen }) {
    const [profileOpen, setProfileOpen] = useState(false);

    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    const displayName = storedUser?.name || "Administrator";
    const avatarLetter = displayName.charAt(0).toUpperCase();

    return (
        <header className="admin-navbar">

            <button
                type="button"
                className="bn-sb-toggle"
                onClick={onToggleSidebar}
                aria-label="Toggle sidebar"
                aria-expanded={!!sidebarOpen}
            >
                ☰
            </button>

            {/* Logo */}
            <div className="admin-navbar-brand">
                <Link to="/admin/dashboard">
                    Your<span>Turn</span>
                </Link>

                <small>Admin Panel</small>
            </div>


            {/* Right Side */}
            <div className="admin-navbar-right">

                {/* Notification */}
                <button
                    type="button"
                    className="admin-notification"
                    title="Notifications"
                >
                    🔔
                    <span className="admin-notification-dot"></span>
                </button>


                {/* Admin User */}
                <div
                    className="admin-user"
                    onClick={() => setProfileOpen(true)}
                    style={{ cursor: "pointer" }}
                >

                    <div className="admin-user-avatar">
                        {avatarLetter}
                    </div>

                    <div className="admin-user-info">
                        <strong>{displayName}</strong>
                        <span>System Admin</span>
                    </div>

                </div>


                {/* Logout */}
                <Link
                    to="/login"
                    className="admin-logout-button"
                >
                    Logout
                </Link>

            </div>

            <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

        </header>
    );
}

export default AdminNavbar;
