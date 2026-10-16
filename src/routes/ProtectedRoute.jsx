import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function ProtectedRoute({ allowedRoles }) {

    const {
        user,
        isAuthenticated
    } = useAuth();

    const location = useLocation();


    // =========================================================
    // NOT LOGGED IN
    // =========================================================

    if (!isAuthenticated || !user) {

        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location.pathname
                }}
            />
        );
    }


    // =========================================================
    // USER ROLE NOT ALLOWED
    // =========================================================

    if (!allowedRoles.includes(user.role)) {


        // =====================================================
        // ADMIN
        // =====================================================

        if (user.role === "ADMIN") {

            return (
                <Navigate
                    to="/admin/dashboard"
                    replace
                />
            );
        }


        // =====================================================
        // STAFF
        // =====================================================

        if (user.role === "STAFF") {

            return (
                <Navigate
                    to="/staff/dashboard"
                    replace
                />
            );
        }


        // =====================================================
        // CUSTOMER
        // =====================================================

        if (user.role === "CUSTOMER") {

            return (
                <Navigate
                    to="/customer/dashboard"
                    replace
                />
            );
        }


        // =====================================================
        // UNKNOWN ROLE
        // =====================================================

        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }


    // =========================================================
    // AUTHORIZED
    // =========================================================

    return <Outlet />;
}

export default ProtectedRoute;