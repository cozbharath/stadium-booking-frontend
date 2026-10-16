import { Outlet } from "react-router-dom";

import StaffNavbar from "../components/staff/StaffNavbar";
import StaffSidebar from "../components/staff/StaffSidebar";
import StaffFooter from "../components/staff/StaffFooter";

function StaffLayout() {
    return (
        <div className="staff-layout">

            <StaffNavbar />

            <div className="staff-layout-body">

                <StaffSidebar />

                <main className="staff-main-content">
                    <Outlet />
                </main>

            </div>

            <StaffFooter />

        </div>
    );
}

export default StaffLayout;