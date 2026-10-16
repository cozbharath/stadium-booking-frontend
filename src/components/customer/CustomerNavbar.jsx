import { useState } from "react";
import { Link } from "react-router-dom";
import ProfileModal from "../common/ProfileModal";

function CustomerNavbar() {
    const [profileOpen, setProfileOpen] = useState(false);

    // api.js already stores a "user" object in localStorage on login and
    // clears it on 401 - reuse it here instead of introducing a new source
    // of truth just for the navbar's display name.
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    const displayName = storedUser?.name || "Customer";
    const avatarLetter = displayName.charAt(0).toUpperCase();

    return (
        <header className="customer-navbar">

            <div className="customer-navbar-brand">
                <Link to="/customer/dashboard">
                    Your<span>Turn</span>
                </Link>

                <small>
                    Stadium Tickets
                </small>
            </div>

            <div className="customer-navbar-right">

                <button
                    type="button"
                    className="customer-notification"
                >
                    🔔
                    <span className="notification-dot"></span>
                </button>

                <div
                    className="customer-user"
                    onClick={() => setProfileOpen(true)}
                    style={{ cursor: "pointer" }}
                >
                    <div className="customer-user-avatar">
                        {avatarLetter}
                    </div>

                    <div className="customer-user-info">
                        <strong>{displayName}</strong>
                        <span>Welcome back</span>
                    </div>
                </div>

                <Link
                    to="/login"
                    className="customer-logout-button"
                >
                    Logout
                </Link>

            </div>

            <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

        </header>
    );
}

export default CustomerNavbar;
