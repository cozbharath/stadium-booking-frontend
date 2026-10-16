import { useState } from "react";
import { NavLink } from "react-router-dom";
import SupportChat from "./SupportChat";

function CustomerSidebar() {

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
                    className={({ isActive }) =>
                        `sidebar-link ${isActive ? "active" : ""}`
                    }
                >
                    <span className="sidebar-icon">
                        🏠
                    </span>
                    Dashboard
                </NavLink>

                <NavLink
                    to="/customer/events"
                    className={({ isActive }) =>
                        `sidebar-link ${isActive ? "active" : ""}`
                    }
                >
                    <span className="sidebar-icon">
                        🎟️
                    </span>
                    Explore Events
                </NavLink>

                <NavLink
                    to="/customer/bookings"
                    className={({ isActive }) =>
                        `sidebar-link ${isActive ? "active" : ""}`
                    }
                >
                    <span className="sidebar-icon">
                        📋
                    </span>
                    My Bookings
                </NavLink>

                <NavLink
                    to="/customer/tickets"
                    className={({ isActive }) =>
                        `sidebar-link ${isActive ? "active" : ""}`
                    }
                >
                    <span className="sidebar-icon">
                        🎫
                    </span>
                    My Tickets
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
                    className="sidebar-logout"
                >
                    <span className="sidebar-icon">
                        🚪
                    </span>

                    Logout
                </NavLink>

            </div>

        </aside>
    );
}

export default CustomerSidebar;