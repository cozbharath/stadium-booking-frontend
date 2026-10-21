import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import useSidebar from "../hooks/useSidebar";

import AdminNavbar from "../components/admin/AdminNavbar";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminFooter from "../components/admin/AdminFooter";

function AdminLayout() {
    const { collapsed, mobileOpen, toggle, close } = useSidebar();
    const location = useLocation();

    // close the mobile drawer whenever the route changes
    useEffect(() => { close(); }, [location.pathname, close]);

    return (
        <div className={`admin-layout ${collapsed ? "is-collapsed" : ""} ${mobileOpen ? "is-open" : ""}`}>

            {/* Top Navbar */}
            <AdminNavbar onToggleSidebar={toggle} sidebarOpen={mobileOpen} />


            {/* Sidebar + Main Content */}
            <div className="admin-layout-body">

                <AdminSidebar />

                <div className="bn-scrim" onClick={close} aria-hidden="true" />

                <main className="admin-main-content">
                    <Outlet />
                </main>

            </div>


            {/* Footer */}
            <AdminFooter />

        </div>
    );
}

export default AdminLayout;