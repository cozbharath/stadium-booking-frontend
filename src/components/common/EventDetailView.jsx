import { Link } from "react-router-dom";
import { EventSkeletons } from "./EventCard";
import { formatDate, formatTime, normalizeEvent } from "./eventUtils";

/**
 * BookMyShow-style event page shared by the public and customer routes.
 *  - backTo : listing route
 *  - bookTo : where "Book Tickets" goes (seat selection, or /login for guests)
 */
export default function EventDetailView({ event, loading, error, onRetry, backTo, bookTo, bookLabel = "Book Tickets" }) {
    if (loading) {
        return (
            <div className="bn-wrap" style={{ paddingTop: 24 }}>
                <div className="bn-skel" style={{ height: 320, borderRadius: 20 }} />
                <div className="bn-grid" style={{ marginTop: 24 }}><EventSkeletons count={3} /></div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="bn-wrap" style={{ paddingTop: 40 }}>
                <div className="bn-state">
                    <div className="ico">⚠️</div>
                    <h2>Unable to load event</h2>
                    <p>{error || "Event not found."}</p>
                    <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                        {onRetry && <button type="button" className="bn-btn bn-btn-primary" onClick={onRetry}>Try Again</button>}
                        <Link to={backTo} className="bn-btn bn-btn-ghost">Back to Events</Link>
                    </div>
                </div>
            </div>
        );
    }

    const e = normalizeEvent(event);
    const description =
        event?.description ??
        "Experience this event live from the stadium. Pick your stand, choose your exact seats and get a QR ticket instantly.";

    return (
        <div className="bn-wrap" style={{ paddingTop: 16, paddingBottom: 30 }}>

            <Link to={backTo} className="bn-seeall" style={{ display: "inline-block", marginBottom: 12 }}>← Back to events</Link>

            <section className="bn-detail-hero">
                {e.image && <div className="bg" style={{ backgroundImage: `url(${e.image})` }} />}
                <div className="bn-detail-hero-in">
                    <div className="bn-detail-poster">
                        {e.image ? <img src={e.image} alt={e.name} /> : <div className="bn-poster-fallback" style={{ position: "static", height: "100%" }}>🏟️</div>}
                    </div>
                    <div>
                        <span className="bn-pill">{e.category}</span>
                        <span className="bn-pill">{e.status}</span>
                        <h1>{e.name}</h1>
                        <div className="bn-detail-meta">
                            <span>📅 {formatDate(e.date)}</span>
                            <span>⏰ {formatTime(e.start)}{e.end ? ` – ${formatTime(e.end)}` : ""}</span>
                            <span>📍 {e.stadium}{e.location ? `, ${e.location}` : ""}</span>
                        </div>
                        <Link to={bookTo} className="bn-btn bn-btn-primary">🎟️ {bookLabel}</Link>
                    </div>
                </div>
            </section>

            <div className="bn-detail-body">
                <div className="bn-panel bn-reveal in">
                    <h3>About the event</h3>
                    <p>{description}</p>

                    <h3 style={{ marginTop: 22 }}>How it works</h3>
                    <div className="bn-steps" style={{ marginTop: 10 }}>
                        <div className="bn-step"><div className="n">1</div><h4>Pick a stand</h4><p>Compare prices and availability per stand.</p></div>
                        <div className="bn-step"><div className="n">2</div><h4>Choose seats</h4><p>Select exact seats on the stadium map.</p></div>
                        <div className="bn-step"><div className="n">3</div><h4>Pay &amp; enter</h4><p>Get a QR ticket and walk right in.</p></div>
                    </div>
                </div>

                <aside className="bn-panel bn-sticky">
                    <h3>Event details</h3>
                    <div className="bn-info-list">
                        <div><span className="i">📅</span><span><small>Date</small><strong>{formatDate(e.date)}</strong></span></div>
                        <div><span className="i">⏰</span><span><small>Time</small><strong>{formatTime(e.start)}{e.end ? ` – ${formatTime(e.end)}` : ""}</strong></span></div>
                        <div><span className="i">🏟️</span><span><small>Stadium</small><strong>{e.stadium}</strong></span></div>
                        {e.location && <div><span className="i">📍</span><span><small>Location</small><strong>{e.location}</strong></span></div>}
                    </div>
                    <Link to={bookTo} className="bn-btn bn-btn-primary" style={{ width: "100%", marginTop: 18 }}>{bookLabel}</Link>
                </aside>
            </div>
        </div>
    );
}
