import { Outlet } from "react-router-dom";
import CustomerNavbar from "../components/customer/CustomerNavbar";
import CustomerSidebar from "../components/customer/CustomerSidebar";
import CustomerFooter from "../components/customer/CustomerFooter";
import useSidebar from "../hooks/useSidebar";

function CustomerLayout() {
    const { collapsed, mobileOpen, toggle, close } = useSidebar();

    return (
        <div className={`customer-layout ${collapsed ? "is-collapsed" : ""} ${mobileOpen ? "is-open" : ""}`}>

            <CustomerNavbar onToggleSidebar={toggle} sidebarOpen={mobileOpen} />

            <div className="customer-layout-body">

                <CustomerSidebar onNavigate={close} />

                {/* tap outside the drawer to close it (mobile) */}
                <div className="bn-scrim" onClick={close} aria-hidden="true" />

                <main className="customer-main-content">
                    <Outlet />
                </main>

            </div>

            <CustomerFooter />

        </div>
    );
}

export default CustomerLayout;
