import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../../services/api";
import EventCard, { EventSkeletons } from "../../components/common/EventCard";
import { normalizeEvent } from "../../components/common/eventUtils";
import useReveal from "../../hooks/useReveal";

const CATEGORIES = [
    { label: "Cricket", icon: "🏏", cls: "c1", sub: "Matches & leagues" },
    { label: "Football", icon: "⚽", cls: "c2", sub: "Local & pro games" },
    { label: "Concert", icon: "🎤", cls: "c3", sub: "Live music nights" },
    { label: "Kabaddi", icon: "🤼", cls: "c4", sub: "Pro league action" },
    { label: "Esports", icon: "🎮", cls: "c5", sub: "Arena tournaments" }
];

function Home() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const rail = useRef(null);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const data = await get("/events/upcoming");
                if (alive) setEvents(Array.isArray(data) ? data : []);
            } catch {
                if (alive) setEvents([]);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    useReveal([loading, events.length]);

    const scrollRail = (dir) => rail.current?.scrollBy({ left: dir * 480, behavior: "smooth" });
    const stadiums = new Set(events.map((e) => normalizeEvent(e).stadium)).size;

    return (
        <div>
            {/* HERO */}
            <section className="bn-hero">
                <div className="bn-hero-in">
                    <span className="bn-hero-tag">YOUR STADIUM • YOUR EVENT • YOUR TICKET</span>
                    <h1>Live events. <em>Your seat.</em> Your turn.</h1>
                    <p className="lead">Discover matches and concerts near Hyderabad, pick exact seats on the stadium map and get a QR ticket in seconds.</p>
                    <div className="bn-hero-actions">
                        <Link to="/events" className="bn-btn bn-btn-primary">Explore Events</Link>
                        <Link to="/register" className="bn-btn" style={{ background: "rgba(255,255,255,.14)", color: "#fff", border: "1px solid rgba(255,255,255,.3)" }}>Create Account</Link>
                    </div>
                    <div className="bn-hero-stats">
                        <div><b>{loading ? "–" : events.length}</b><span>UPCOMING EVENTS</span></div>
                        <div><b>{loading ? "–" : stadiums}</b><span>STADIUMS</span></div>
                        <div><b>QR</b><span>INSTANT TICKETS</span></div>
                    </div>
                </div>
            </section>

            <div className="bn-wrap">
                {/* UPCOMING RAIL */}
                <section className="bn-section bn-reveal">
                    <div className="bn-section-head">
                        <div><h2>Upcoming events</h2><p>Don&apos;t miss out – seats fill fast</p></div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <button type="button" className="bn-iconbtn" onClick={() => scrollRail(-1)} aria-label="Scroll left">‹</button>
                            <button type="button" className="bn-iconbtn" onClick={() => scrollRail(1)} aria-label="Scroll right">›</button>
                            <Link to="/events" className="bn-seeall">See all ›</Link>
                        </div>
                    </div>

                    {loading && <div className="bn-rail"><EventSkeletons count={6} /></div>}

                    {!loading && events.length === 0 && (
                        <div className="bn-state"><div className="ico">🎟️</div><h3>No upcoming events yet</h3><p>Check back soon.</p></div>
                    )}

                    {!loading && events.length > 0 && (
                        <div className="bn-rail" ref={rail}>
                            {events.map((ev, i) => <EventCard key={normalizeEvent(ev).id ?? i} event={ev} base="/events" />)}
                        </div>
                    )}
                </section>

                {/* CATEGORIES */}
                <section className="bn-section bn-reveal">
                    <div className="bn-section-head"><div><h2>Browse by category</h2><p>Find what you love</p></div></div>
                    <div className="bn-cats">
                        {CATEGORIES.map((c) => (
                            <Link key={c.label} to={`/events?q=${c.label.toLowerCase()}`} className={`bn-cat ${c.cls}`}>
                                <span className="ico">{c.icon}</span>
                                <b>{c.label}</b><small>{c.sub}</small>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* HOW IT WORKS */}
                <section className="bn-section bn-reveal">
                    <div className="bn-section-head"><div><h2>Book in 3 steps</h2><p>Fast, simple and secure</p></div></div>
                    <div className="bn-steps">
                        <div className="bn-step"><div className="n">1</div><h4>Find an event</h4><p>Search or browse matches, concerts and live shows.</p></div>
                        <div className="bn-step"><div className="n">2</div><h4>Pick your seats</h4><p>Choose a stand and tap the exact seats on the stadium map.</p></div>
                        <div className="bn-step"><div className="n">3</div><h4>Get your QR ticket</h4><p>Pay securely and show the QR code at the gate.</p></div>
                    </div>
                </section>

                <section className="bn-cta bn-reveal">
                    <div><h3>Ready for the next big night?</h3><p>Create a free account and book your first ticket.</p></div>
                    <Link to="/register" className="bn-btn bn-btn-primary">Get started</Link>
                </section>
            </div>
        </div>
    );
}

export default Home;
