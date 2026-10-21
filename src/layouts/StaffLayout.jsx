import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import useSidebar from "../hooks/useSidebar";

import StaffNavbar from "../components/staff/StaffNavbar";
import StaffSidebar from "../components/staff/StaffSidebar";
import StaffFooter from "../components/staff/StaffFooter";

function StaffLayout() {
    const { collapsed, mobileOpen, toggle, close } = useSidebar();
    const location = useLocation();

    // close the mobile drawer whenever the route changes
    useEffect(() => { close(); }, [location.pathname, close]);

    return (
        <div className={`staff-layout ${collapsed ? "is-collapsed" : ""} ${mobileOpen ? "is-open" : ""}`}>

            <StaffNavbar onToggleSidebar={toggle} sidebarOpen={mobileOpen} />

            <div className="staff-layout-body">

                <StaffSidebar />

                <div className="bn-scrim" onClick={close} aria-hidden="true" />

                <main className="staff-main-content">
                    <Outlet />
                </main>

            </div>

            <StaffFooter />

        </div>
    );
}

export default StaffLayout;