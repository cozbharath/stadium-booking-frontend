import { NavLink } from "react-router-dom";

function AdminSidebar() {
    return (
        <aside className="admin-sidebar">

            {/* Sidebar Header */}
            <div className="admin-sidebar-heading">
                <p className="admin-sidebar-section-title">
                    MAIN MENU
                </p>
            </div>


            <div className="admin-sidebar-menu">

                {/* Dashboard */}
                <NavLink
                    to="/admin/dashboard"
                    className={({ isActive }) =>
                        `admin-sidebar-link ${isActive ? "active" : ""}`
                    }
                >
                    <span className="admin-sidebar-icon">
                        🏠
                    </span>

                    <span>
                        Dashboard
                    </span>
                </NavLink>


                {/* ================= USER MANAGEMENT ================= */}
                <div className="admin-sidebar-section">

                    <p className="admin-sidebar-section-title">
                        USER MANAGEMENT
                    </p>


                    <NavLink
                        to="/admin/users"
                        className={({ isActive }) =>
                            `admin-sidebar-link ${isActive ? "active" : ""}`
                        }
                    >
                        <span className="admin-sidebar-icon">
                            👥
                        </span>

                        <span>
                            Users
                        </span>
                    </NavLink>


                    <NavLink
                        to="/admin/staff/create"
                        className={({ isActive }) =>
                            `admin-sidebar-link ${isActive ? "active" : ""}`
                        }
                    >
                        <span className="admin-sidebar-icon">
                            👤
                        </span>

                        <span>
                            Staff
                        </span>
                    </NavLink>

                </div>


                {/* ================= STADIUM MANAGEMENT ================= */}
                <div className="admin-sidebar-section">

                    <p className="admin-sidebar-section-title">
                        STADIUM MANAGEMENT
                    </p>


                    <NavLink
                        to="/admin/stadiums"
                        className={({ isActive }) =>
                            `admin-sidebar-link ${isActive ? "active" : ""}`
                        }
                    >
                        <span className="admin-sidebar-icon">
                            🏟️
                        </span>

                        <span>
                            Stadiums
                        </span>
                    </NavLink>


                    <NavLink
                        to="/admin/stand-types"
                        className={({ isActive }) =>
                            `admin-sidebar-link ${isActive ? "active" : ""}`
                        }
                    >
                        <span className="admin-sidebar-icon">
                            🏷️
                        </span>

                        <span>
                            Stand Types
                        </span>
                    </NavLink>


                    <NavLink
                        to="/admin/stands"
                        className={({ isActive }) =>
                            `admin-sidebar-link ${isActive ? "active" : ""}`
                        }
                    >
                        <span className="admin-sidebar-icon">
                            🪑
                        </span>

                        <span>
                            Stands
                        </span>
                    </NavLink>


                    <NavLink
                        to="/admin/seats"
                        className={({ isActive }) =>
                            `admin-sidebar-link ${isActive ? "active" : ""}`
                        }
                    >
                        <span className="admin-sidebar-icon">
                            💺
                        </span>

                        <span>
                            Seats
                        </span>
                    </NavLink>

                </div>


                {/* ================= EVENT MANAGEMENT ================= */}
                <div className="admin-sidebar-section">

                    <p className="admin-sidebar-section-title">
                        EVENT MANAGEMENT
                    </p>


                    <NavLink
                        to="/admin/events"
                        className={({ isActive }) =>
                            `admin-sidebar-link ${isActive ? "active" : ""}`
                        }
                    >
                        <span className="admin-sidebar-icon">
                            🎟️
                        </span>

                        <span>
                            Events
                        </span>
                    </NavLink>


                    <NavLink
                        to="/admin/event-seats"
                        className={({ isActive }) =>
                            `admin-sidebar-link ${isActive ? "active" : ""}`
                        }
                    >
                        <span className="admin-sidebar-icon">
                            🎫
                        </span>

                        <span>
                            Event Seats
                        </span>
                    </NavLink>

                </div>

            </div>


            {/* ================= BOTTOM ================= */}
            <div className="admin-sidebar-bottom">

                <div className="admin-sidebar-help">

                    <div className="admin-sidebar-help-icon">
                        ?
                    </div>

                    <div>
                        <strong>
                            Admin Support
                        </strong>

                        <span>
                            Contact YourTurn support
                        </span>
                    </div>

                </div>


                <NavLink
                    to="/login"
                    className="admin-sidebar-logout"
                >
                    <span className="admin-sidebar-icon">
                        🚪
                    </span>

                    Logout
                </NavLink>

            </div>

        </aside>
    );
}

export default AdminSidebar;