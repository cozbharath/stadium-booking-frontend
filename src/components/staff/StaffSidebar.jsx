import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function StaffSidebar() {

    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (

        <aside className="staff-sidebar">

            {/* =================================================
                SIDEBAR HEADING
            ================================================= */}

            <div className="staff-sidebar-heading">

                <p className="staff-sidebar-section-title">
                    MAIN MENU
                </p>

            </div>


            {/* =================================================
                SIDEBAR MENU
            ================================================= */}

            <div className="staff-sidebar-menu">

                {/* DASHBOARD */}

                <NavLink
                    to="/staff/dashboard"
                    className={({ isActive }) =>
                        `staff-sidebar-link ${
                            isActive ? "active" : ""
                        }`
                    }
                >

                    <span className="staff-sidebar-icon">
                        🏠
                    </span>

                    <span>
                        Dashboard
                    </span>

                </NavLink>


                {/* =================================================
                    BOOKING MANAGEMENT
                ================================================= */}

                <div className="staff-sidebar-section">

                    <p className="staff-sidebar-section-title">
                        BOOKING MANAGEMENT
                    </p>


                    {/* BOOKINGS */}

                    <NavLink
                        to="/staff/bookings"
                        className={({ isActive }) =>
                            `staff-sidebar-link ${
                                isActive ? "active" : ""
                            }`
                        }
                    >

                        <span className="staff-sidebar-icon">
                            📋
                        </span>

                        <span>
                            Bookings
                        </span>

                    </NavLink>


                    {/* EVENTS */}

                    <NavLink
                        to="/staff/events"
                        className={({ isActive }) =>
                            `staff-sidebar-link ${
                                isActive ? "active" : ""
                            }`
                        }
                    >

                        <span className="staff-sidebar-icon">
                            📅
                        </span>

                        <span>
                            Events
                        </span>

                    </NavLink>

                </div>


                {/* =================================================
                    TICKET MANAGEMENT
                ================================================= */}

                <div className="staff-sidebar-section">

                    <p className="staff-sidebar-section-title">
                        TICKET MANAGEMENT
                    </p>


                    {/* VALIDATE TICKETS */}

                    <NavLink
                        to="/staff/tickets/validate"
                        className={({ isActive }) =>
                            `staff-sidebar-link ${
                                isActive ? "active" : ""
                            }`
                        }
                    >

                        <span className="staff-sidebar-icon">
                            🎫
                        </span>

                        <span>
                            Validate Tickets
                        </span>

                    </NavLink>

                </div>

            </div>


            {/* =================================================
                SIDEBAR BOTTOM
            ================================================= */}

            <div className="staff-sidebar-bottom">

                {/* STAFF SUPPORT */}

                <div className="staff-sidebar-help">

                    <div className="staff-sidebar-help-icon">
                        ?
                    </div>

                    <div>

                        <strong>
                            Staff Support
                        </strong>

                        <span>
                            Contact YourTurn support
                        </span>

                    </div>

                </div>


                {/* LOGOUT */}

                <button
                    type="button"
                    className="staff-sidebar-logout"
                    onClick={handleLogout}
                >

                    <span className="staff-sidebar-icon">
                        🚪
                    </span>

                    Logout

                </button>

            </div>

        </aside>
    );
}

export default StaffSidebar;