import { Link } from "react-router-dom";

function PublicFooter() {
    return (
        <footer className="bn-footer">
            <div className="bn-footer-in">
                <div>
                    <h3>Your<span>Turn</span></h3>
                    <p>Book stadium matches, concerts and live events in a few taps. Pick your stand, choose your seats, and walk in with a QR ticket.</p>
                </div>
                <div>
                    <h4>Explore</h4>
                    <Link to="/events">All Events</Link>
                    <Link to="/events?q=cricket">Cricket</Link>
                    <Link to="/events?q=concert">Concerts</Link>
                </div>
                <div>
                    <h4>Account</h4>
                    <Link to="/login">Login</Link>
                    <Link to="/register">Register</Link>
                </div>
                <div>
                    <h4>Help</h4>
                    <Link to="/events">How booking works</Link>
                    <Link to="/login">Support</Link>
                </div>
            </div>
            <div className="bn-footer-bottom">© 2026 YourTurn. All rights reserved.</div>
        </footer>
    );
}

export default PublicFooter;
