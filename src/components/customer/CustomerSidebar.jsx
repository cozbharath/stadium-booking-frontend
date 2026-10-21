import { useState } from "react";
import { NavLink } from "react-router-dom";
import SupportChat from "./SupportChat";

function CustomerSidebar({ onNavigate }) {

    const [chatOpen, setChatOpen] = useState(false);

    return (
        <aside className="customer-sidebar">

            <div className="customer-sidebar-heading">
                <p className="sidebar-section-title">
                    MAIN MENU
                </p>
            </div>

            <div className="customer-sidebar-menu">

                <NavLink
                    to="/customer/dashboard"
                    data-tip="Dashboard"
                    onClick={onNavigate}
                    className={({ isActive }) =>
                        `sidebar-link ${isActive ? "active" : ""}`
                    }
                >
                    <span className="sidebar-icon">
                        🏠
                    </span>
                    <span className="bn-label">Dashboard</span>
                </NavLink>

                <NavLink
                    to="/customer/events"
                    data-tip="Explore Events"
                    onClick={onNavigate}
                    className={({ isActive }) =>
                        `sidebar-link ${isActive ? "active" : ""}`
                    }
                >
                    <span className="sidebar-icon">
                        🎟️
                    </span>
                    <span className="bn-label">Explore Events</span>
                </NavLink>

                <NavLink
                    to="/customer/bookings"
                    data-tip="My Bookings"
                    onClick={onNavigate}
                    className={({ isActive }) =>
                        `sidebar-link ${isActive ? "active" : ""}`
                    }
                >
                    <span className="sidebar-icon">
                        📋
                    </span>
                    <span className="bn-label">My Bookings</span>
                </NavLink>

                <NavLink
                    to="/customer/tickets"
                    data-tip="My Tickets"
                    onClick={onNavigate}
                    className={({ isActive }) =>
                        `sidebar-link ${isActive ? "active" : ""}`
                    }
                >
                    <span className="sidebar-icon">
                        🎫
                    </span>
                    <span className="bn-label">My Tickets</span>
                </NavLink>

            </div>

            <div className="customer-sidebar-bottom">

                <button
                    type="button"
                    className="sidebar-help"
                    onClick={() => setChatOpen(true)}
                >

                    <div className="sidebar-help-icon">
                        ?
                    </div>

                    <div>
                        <strong>
                            Need Help?
                        </strong>

                        <span>
                            Contact YourTurn support
                        </span>
                    </div>

                </button>

                <SupportChat
                    open={chatOpen}
                    onClose={() => setChatOpen(false)}
                />

                <NavLink
                    to="/login"
                    data-tip="Logout"
                    className="sidebar-logout"
                >
                    <span className="sidebar-icon">
                        🚪
                    </span>

                    <span className="bn-label">Logout</span>
                </NavLink>

            </div>

        </aside>
    );
}

export default CustomerSidebar;