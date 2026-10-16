import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../../services/api";

function CustomerDashboard() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await get("/bookings/my");

            setBookings(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load dashboard bookings:", err);
            setError(err.message || "Failed to load your bookings.");
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // HELPERS (same logic as MyBookings.jsx)
    // =========================

    const getBookingRouteId = (booking) => {
        if (booking.id !== undefined && booking.id !== null) return booking.id;
        if (booking.bookingId !== undefined && booking.bookingId !== null) return booking.bookingId;
        if (booking.bookingID !== undefined && booking.bookingID !== null) return booking.bookingID;
        return null;
    };

    const getBookingNumber = (booking) => {
        if (booking.bookingNumber) return booking.bookingNumber;
        if (booking.bookingId) return booking.bookingId;
        if (booking.id) return `BK${String(booking.id).padStart(8, "0")}`;
        return "—";
    };

    const getSeats = (booking) => {
        if (!booking.seats || booking.seats.length === 0) return "—";

        return booking.seats
            .map((seat) => {
                if (typeof seat === "string") return seat;
                return seat.seatNumber || seat.seatName || seat.number || "Seat";
            })
            .join(", ");
    };

    const formatDate = (date) => {
        if (!date) return "—";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) return date;

        return parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
    };

    const formatTime = (time) => {
        if (!time) return "—";

        const parts = time.split(":");
        if (parts.length < 2) return time;

        let hour = Number(parts[0]);
        const minute = parts[1];
        const suffix = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;

        return `${hour}:${minute} ${suffix}`;
    };

    // =========================
    // STATS (computed from real bookings)
    // =========================

    const confirmedCount = bookings.filter((b) => b.status === "CONFIRMED").length;

    const activeTicketsCount = bookings.filter(
        (b) => b.status === "CONFIRMED"
    ).length;

    const totalSpent = bookings
        .filter((b) => b.status !== "CANCELLED")
        .reduce((total, b) => total + Number(b.totalAmount || 0), 0);

    const stats = [
        { icon: "🎟️", label: "Total Bookings", value: String(bookings.length) },
        { icon: "✓", label: "Confirmed", value: String(confirmedCount) },
        { icon: "🎫", label: "Active Tickets", value: String(activeTicketsCount) },
        { icon: "₹", label: "Total Spent", value: `₹${totalSpent.toLocaleString("en-IN")}` }
    ];

    // =========================
    // UPCOMING EVENT (soonest future confirmed/pending booking)
    // =========================

    const now = new Date();

    const upcomingEvent = bookings
        .filter((b) => b.status !== "CANCELLED" && b.eventDate)
        .filter((b) => new Date(b.eventDate) >= now)
        .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))[0];

    // =========================
    // RECENT BOOKINGS (latest 3)
    // =========================

    const recentBookings = [...bookings]
        .sort((a, b) => {
            const idA = getBookingRouteId(a) || 0;
            const idB = getBookingRouteId(b) || 0;
            return idB - idA;
        })
        .slice(0, 3);

    // =========================
    // LOADING / ERROR
    // =========================

    if (loading) {
        return (
            <div className="customer-dashboard-page">
                <div style={{ padding: "60px", textAlign: "center" }}>
                    <h2>Loading your dashboard...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="customer-dashboard-page">
                <div style={{ padding: "60px", textAlign: "center" }}>
                    <h2>Unable to load dashboard</h2>
                    <p>{error}</p>
                    <button type="button" onClick={loadBookings} className="primary-btn">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="customer-dashboard-page">

            <section className="dashboard-welcome">
                <div>
                    <p className="page-tag">WELCOME BACK</p>
                    <h1>Ready for your next experience?</h1>
                    <p>
                        Discover upcoming stadium events, manage your bookings,
                        and access your digital tickets from one place.
                    </p>
                </div>

                <Link to="/customer/events" className="dashboard-book-button">
                    Explore Events →
                </Link>
            </section>

            <section className="dashboard-stats">
                {stats.map((stat, index) => (
                    <div className="dashboard-stat-card" key={index}>
                        <div className="dashboard-stat-icon">{stat.icon}</div>
                        <div>
                            <span>{stat.label}</span>
                            <strong>{stat.value}</strong>
                        </div>
                    </div>
                ))}
            </section>

            <section className="dashboard-main-grid">

                <div className="dashboard-card">
                    <div className="dashboard-card-heading">
                        <div>
                            <p className="page-tag">NEXT EXPERIENCE</p>
                            <h2>Your Upcoming Event</h2>
                        </div>
                        {upcomingEvent && <span className="dashboard-live-badge">UPCOMING</span>}
                    </div>

                    {upcomingEvent ? (
                        <div className="dashboard-event">
                            <div className="dashboard-event-image">
                                {upcomingEvent.category || "EVENT"}
                            </div>

                            <div className="dashboard-event-info">
                                <h3>{upcomingEvent.eventName || upcomingEvent.event || "Event"}</h3>
                                <p>📍 {upcomingEvent.stadiumName || upcomingEvent.stadium || "—"}</p>

                                <div className="dashboard-event-meta">
                                    <span>📅 {formatDate(upcomingEvent.eventDate)}</span>
                                    <span>🕐 {formatTime(upcomingEvent.startTime)}</span>
                                    <span>🎫 {getSeats(upcomingEvent)}</span>
                                </div>

                                <Link to="/customer/tickets" className="dashboard-view-ticket">
                                    🎟️ View Ticket →
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: "20px" }}>
                            <p>You have no upcoming events booked yet.</p>
                            <Link to="/customer/events" className="dashboard-view-ticket">
                                Explore Events →
                            </Link>
                        </div>
                    )}
                </div>

                <div className="dashboard-card">
                    <div className="dashboard-card-heading">
                        <div>
                            <p className="page-tag">QUICK ACCESS</p>
                            <h2>Quick Actions</h2>
                        </div>
                    </div>

                    <div className="dashboard-actions">
                        <Link to="/customer/events" className="dashboard-action">
                            <span>🔍</span>
                            <div>
                                <strong>Explore Events</strong>
                                <small>Find upcoming stadium events</small>
                            </div>
                            <b>→</b>
                        </Link>

                        <Link to="/customer/bookings" className="dashboard-action">
                            <span>📋</span>
                            <div>
                                <strong>My Bookings</strong>
                                <small>View your booking history</small>
                            </div>
                            <b>→</b>
                        </Link>

                        <Link to="/customer/tickets" className="dashboard-action">
                            <span>🎫</span>
                            <div>
                                <strong>My Tickets</strong>
                                <small>Access your QR tickets</small>
                            </div>
                            <b>→</b>
                        </Link>
                    </div>
                </div>

            </section>

            <section className="dashboard-card dashboard-recent-booking">
                <div className="dashboard-card-heading">
                    <div>
                        <p className="page-tag">BOOKING ACTIVITY</p>
                        <h2>Recent Bookings</h2>
                    </div>
                    <Link to="/customer/bookings" className="dashboard-see-all">
                        View All →
                    </Link>
                </div>

                <div>
                    {recentBookings.length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center" }}>
                            <p>No bookings yet. Explore events to make your first booking.</p>
                        </div>
                    ) : (
                        recentBookings.map((booking) => {
                            const routeId = getBookingRouteId(booking);

                            return (
                                <div className="recent-booking-row" key={routeId}>
                                    <div>
                                        <span>🎟️</span>
                                        <div>
                                            <strong>{booking.eventName || booking.event || "Event"}</strong>
                                            <small>{getBookingNumber(booking)}</small>
                                        </div>
                                    </div>

                                    <div>
                                        <span>DATE</span>
                                        <strong>{formatDate(booking.eventDate)}</strong>
                                    </div>

                                    <div>
                                        <span>SEATS</span>
                                        <strong>{getSeats(booking)}</strong>
                                    </div>

                                    <div>
                                        <span>AMOUNT</span>
                                        <strong>₹{Number(booking.totalAmount || 0).toLocaleString("en-IN")}</strong>
                                    </div>

                                    <span
                                        className={`booking-status-pill ${(booking.status || "").toLowerCase()}`}
                                    >
                                        {booking.status || "UNKNOWN"}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

        </div>
    );
}

export default CustomerDashboard;