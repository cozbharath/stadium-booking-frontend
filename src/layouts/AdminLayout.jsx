import { Outlet } from "react-router-dom";

import AdminNavbar from "../components/admin/AdminNavbar";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminFooter from "../components/admin/AdminFooter";

function AdminLayout() {
    return (
        <div className="admin-layout">

            {/* Top Navbar */}
            <AdminNavbar />


            {/* Sidebar + Main Content */}
            <div className="admin-layout-body">

                <AdminSidebar />

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