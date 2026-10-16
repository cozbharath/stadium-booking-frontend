import { Outlet, useLocation } from "react-router-dom";

import PublicNavbar from "../components/public/PublicNavbar";
import PublicFooter from "../components/public/PublicFooter";

function PublicLayout() {

    const location = useLocation();

    const isLoginPage = location.pathname === "/login";

    return (
        <>
            <PublicNavbar />

            <main>
                <Outlet />
            </main>

            {!isLoginPage && <PublicFooter />}
        </>
    );
}

export default PublicLayout;