import { Link } from "react-router-dom";

function PublicNavbar() {
    return (
        <header className="login-header">

            <div className="login-logo">

                <Link to="/">
                    Your<span>Turn</span>
                </Link>

                <p>
                    Stadium Tickets, Closer to You
                </p>

            </div>


            <nav className="login-nav">

                <Link to="/">
                    Home
                </Link>

                <Link to="/events">
                    Events
                </Link>

                <Link
                    to="/login"
                    className="active"
                >
                    Login
                </Link>

                <Link
                    to="/register"
                    className="login-register-btn"
                >
                    Register
                </Link>

            </nav>

        </header>
    );
}

export default PublicNavbar;