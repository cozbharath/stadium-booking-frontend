import { Outlet } from "react-router-dom";
import CustomerNavbar from "../components/customer/CustomerNavbar";
import CustomerSidebar from "../components/customer/CustomerSidebar";
import CustomerFooter from "../components/customer/CustomerFooter";

function CustomerLayout() {
    return (
        <div className="customer-layout">

            <CustomerNavbar />

            <div className="customer-layout-body">

                <CustomerSidebar />

                <main className="customer-main-content">
                    <Outlet />
                </main>

            </div>

            <CustomerFooter />

        </div>
    );
}

export default CustomerLayout;