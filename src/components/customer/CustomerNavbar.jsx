import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProfileModal from "../common/ProfileModal";

function CustomerNavbar({ onToggleSidebar, sidebarOpen }) {
    const [profileOpen, setProfileOpen] = useState(false);
    const [q, setQ] = useState("");
    const navigate = useNavigate();

    // api.js already stores a "user" object in localStorage on login
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    const displayName = storedUser?.name || "Customer";
    const avatarLetter = displayName.charAt(0).toUpperCase();

    const search = (e) => {
        e.preventDefault();
        navigate(`/customer/events${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
    };

    return (
        <header className="bn-appbar customer-navbar">

            <button
                type="button"
                className="bn-sb-toggle"
                onClick={onToggleSidebar}
                aria-label="Toggle sidebar"
                aria-expanded={!!sidebarOpen}
                title="Toggle sidebar"
            >
                ☰
            </button>

            <Link to="/customer/dashboard" className="bn-logo">
                Your<span>Turn</span>
            </Link>

            <form className="bn-search" onSubmit={search} role="search">
                <span aria-hidden="true">🔍</span>
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search matches, concerts, stadiums…"
                    aria-label="Search events"
                />
            </form>

            <div className="bn-appbar-right">

                <button type="button" className="bn-iconbtn" aria-label="Notifications">
                    🔔<span className="dot"></span>
                </button>

                <button type="button" className="bn-user" onClick={() => setProfileOpen(true)}>
                    <span className="bn-avatar">{avatarLetter}</span>
                    <span className="txt">
                        <strong>{displayName}</strong>
                        <small>My profile</small>
                    </span>
                </button>

                <Link to="/login" className="bn-logout">Logout</Link>

            </div>

            <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

        </header>
    );
}

export default CustomerNavbar;
