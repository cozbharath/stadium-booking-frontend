import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

const CATEGORIES = [
    { label: "All Events", to: "/events" },
    { label: "Cricket", to: "/events?q=cricket" },
    { label: "Football", to: "/events?q=football" },
    { label: "Concerts", to: "/events?q=concert" },
    { label: "Kabaddi", to: "/events?q=kabaddi" },
    { label: "Esports", to: "/events?q=esports" },
    { label: "Fan Zones", to: "/events?q=fan" }
];

function SearchBox({ value, onChange, onSubmit }) {
    return (
        <form className="bn-search" onSubmit={onSubmit} role="search">
            <span aria-hidden="true">🔍</span>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search for matches, concerts, stadiums…"
                aria-label="Search events"
            />
        </form>
    );
}

function PublicNavbar() {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    // close the mobile menu on navigation
    useEffect(() => { queueMicrotask(() => setOpen(false)); }, [location.pathname, location.search]);

    const submit = (e) => {
        e.preventDefault();
        navigate(q.trim() ? `/events?q=${encodeURIComponent(q.trim())}` : "/events");
    };

    return (
        <header className="bn-nav">
            <div className="bn-nav-top">
                <Link to="/" className="bn-logo">Your<span>Turn</span></Link>

                <SearchBox value={q} onChange={setQ} onSubmit={submit} />

                <div className="bn-nav-spacer" />

                <button type="button" className="bn-city" title="Change city">📍 Hyderabad ▾</button>

                <nav className={`bn-nav-links ${open ? "open" : ""}`} aria-label="Main">
                    <NavLink to="/" end>Home</NavLink>
                    <NavLink to="/events">Events</NavLink>
                    <NavLink to="/login">Login</NavLink>
                    <Link to="/register" className="bn-signin">Sign up</Link>
                </nav>

                <button
                    type="button"
                    className={`bn-burger ${open ? "open" : ""}`}
                    aria-label="Toggle menu"
                    aria-expanded={open}
                    onClick={() => setOpen((v) => !v)}
                >
                    <i /><i /><i />
                </button>
            </div>

            <div className="bn-m-search">
                <SearchBox value={q} onChange={setQ} onSubmit={submit} />
            </div>

            <div className="bn-subnav">
                <div className="bn-subnav-in">
                    {CATEGORIES.map((c) => (
                        <Link key={c.label} to={c.to}>{c.label}</Link>
                    ))}
                </div>
            </div>
        </header>
    );
}

export default PublicNavbar;
