import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { get } from "../../services/api";

function StaffDashboard() {

    const [events, setEvents] = useState([]);
    const [bookings, setBookings] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =========================================================
    // LOAD DASHBOARD DATA
    // =========================================================

    const loadDashboardData = async () => {

        try {

            setLoading(true);
            setError("");

            const [eventsData, bookingsData] = await Promise.all([
                get("/events"),
                get("/bookings/all")
            ]);

            setEvents(
                Array.isArray(eventsData)
                    ? eventsData
                    : []
            );

            setBookings(
                Array.isArray(bookingsData)
                    ? bookingsData
                    : []
            );

        } catch (err) {

            console.error(
                "Staff dashboard error:",
                err
            );

            setError(
                err.message ||
                "Failed to load dashboard data."
            );

        } finally {

            setLoading(false);

        }
    };

    useEffect(() => {
        queueMicrotask(() => {
            loadDashboardData();
        });
    }, []);

    // =========================================================
    // TODAY
    // =========================================================

    const today = new Date();

    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();


    // =========================================================
    // DATE HELPER
    // =========================================================

    function getDateValue(value) {

        if (!value) {
            return null;
        }

        const parsedDate = new Date(value);

        if (Number.isNaN(parsedDate.getTime())) {
            return null;
        }

        return parsedDate;
    }


    // =========================================================
    // EVENT DATE
    // =========================================================

    function getEventDate(event) {

        const dateValue =
            event.eventDate ||
            event.date ||
            event.startDate;

        return getDateValue(dateValue);
    }


    // =========================================================
    // BOOKING DATE
    // =========================================================

    function getBookingDate(booking) {

        const dateValue =
            booking.bookingDate ||
            booking.date ||
            booking.eventDate;

        return getDateValue(dateValue);
    }


    // =========================================================
    // CHECK WHETHER DATE IS TODAY
    // =========================================================

    function isToday(date) {

        if (!date) {
            return false;
        }

        return (
            date.getFullYear() === todayYear &&
            date.getMonth() === todayMonth &&
            date.getDate() === todayDate
        );
    }


    // =========================================================
    // TODAY'S EVENTS
    // =========================================================

    const todayEvents = useMemo(() => {

        return events
            .filter((event) => {

                const eventDate =
                    getEventDate(event);

                return isToday(eventDate);

            })
            .sort((a, b) => {

                const dateA =
                    getEventDate(a);

                const dateB =
                    getEventDate(b);

                return (
                    (dateA?.getTime() || 0) -
                    (dateB?.getTime() || 0)
                );

            })
            .slice(0, 5);

    }, [events]);


    // =========================================================
    // TODAY'S BOOKINGS
    // =========================================================

    const todayBookings = useMemo(() => {

        return bookings.filter((booking) => {

            const bookingDate =
                getBookingDate(booking);

            return isToday(bookingDate);

        });

    }, [bookings]);


    // =========================================================
    // RECENT BOOKINGS
    // =========================================================

    const recentBookings = useMemo(() => {

        return [...bookings]
            .sort((a, b) => {

                const dateA =
                    getBookingDate(a);

                const dateB =
                    getBookingDate(b);

                return (
                    (dateB?.getTime() || 0) -
                    (dateA?.getTime() || 0)
                );

            })
            .slice(0, 4);

    }, [bookings]);


    // =========================================================
    // BOOKING STATISTICS
    // =========================================================

    const pendingBookings = bookings.filter(
        (booking) =>
            booking.status === "PENDING"
    ).length;


    // =========================================================
    // DASHBOARD STATS
    // =========================================================

    const dashboardStats = [
        {
            label: "Today's Bookings",
            value: loading
                ? "..."
                : todayBookings.length,
            icon: "📋",
        },
        {
            label: "Tickets Checked",
            value: "—",
            icon: "🎫",
        },
        {
            label: "Pending Bookings",
            value: loading
                ? "..."
                : pendingBookings,
            icon: "⏳",
        },
        {
            label: "Events Today",
            value: loading
                ? "..."
                : todayEvents.length,
            icon: "🏟️",
        },
    ];


    // =========================================================
    // EVENT NAME
    // =========================================================

    function getEventName(event) {

        return (
            event.name ||
            event.eventName ||
            "Unnamed Event"
        );
    }


    // =========================================================
    // STADIUM NAME
    // =========================================================

    function getStadiumName(event) {

        if (event.stadium?.name) {
            return event.stadium.name;
        }

        if (event.stadiumName) {
            return event.stadiumName;
        }

        return "Stadium not available";
    }


    // =========================================================
    // EVENT TIME
    // =========================================================

    function getEventTime(event) {

        if (event.startTime) {
            return event.startTime;
        }

        if (event.time) {
            return event.time;
        }

        return "Time not available";
    }


    // =========================================================
    // EVENT STATUS
    // =========================================================

    function getEventStatus(event) {

        return event.status || "UPCOMING";
    }


    // =========================================================
    // BOOKING EVENT NAME
    // =========================================================

    function getBookingEventName(booking) {

        return (
            booking.eventName ||
            booking.event ||
            "Event"
        );
    }


    // =========================================================
    // BOOKING SEATS
    // =========================================================

    function getBookingSeats(booking) {

        if (!booking.seats) {
            return "—";
        }

        if (Array.isArray(booking.seats)) {
            return booking.seats.join(", ");
        }

        return booking.seats;
    }


    // =========================================================
    // BOOKING AMOUNT
    // =========================================================

    function getBookingAmount(booking) {

        return Number(
            booking.totalAmount ||
            booking.amount ||
            0
        );
    }


    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="staff-dashboard-page">

            {/* HEADER */}

            <div className="staff-dashboard-header">

                <div>

                    <p className="page-tag">
                        STAFF DASHBOARD
                    </p>

                    <h1>
                        Welcome Back, Staff 👋
                    </h1>

                    <p>
                        Manage bookings and validate customer tickets
                        from one place.
                    </p>

                </div>

                <Link
                    to="/staff/tickets/validate"
                    className="staff-dashboard-primary-button"
                >
                    🎫 Validate Ticket
                </Link>

            </div>


            {/* ERROR */}

            {error && (

                <div
                    style={{
                        padding: "12px 16px",
                        marginBottom: "20px",
                        borderRadius: "8px",
                        background: "#fff1f2",
                        color: "#b91c1c",
                        border: "1px solid #fecdd3"
                    }}
                >
                    {error}
                </div>

            )}


            {/* STATS */}

            <div className="staff-dashboard-stats">

                {dashboardStats.map((stat) => (

                    <div
                        className="staff-stat-card"
                        key={stat.label}
                    >

                        <div className="staff-stat-icon">
                            {stat.icon}
                        </div>

                        <div className="staff-stat-content">

                            <span>
                                {stat.label}
                            </span>

                            <strong>
                                {stat.value}
                            </strong>

                        </div>

                    </div>

                ))}

            </div>


            {/* MAIN GRID */}

            <div className="staff-dashboard-grid">


                {/* RECENT BOOKINGS */}

                <div className="staff-dashboard-card staff-recent-bookings">

                    <div className="staff-dashboard-card-header">

                        <div>

                            <p className="page-tag">
                                BOOKINGS
                            </p>

                            <h2>
                                Recent Bookings
                            </h2>

                        </div>

                        <Link
                            to="/staff/bookings"
                            className="staff-view-all"
                        >
                            View All →
                        </Link>

                    </div>


                    <div className="staff-booking-list">

                        {loading ? (

                            <div className="staff-booking-row">

                                <div className="staff-booking-avatar">
                                    ⏳
                                </div>

                                <div className="staff-booking-info">

                                    <strong>
                                        Loading bookings...
                                    </strong>

                                    <span>
                                        Please wait
                                    </span>

                                </div>

                            </div>

                        ) : recentBookings.length === 0 ? (

                            <div className="staff-booking-row">

                                <div className="staff-booking-avatar">
                                    📋
                                </div>

                                <div className="staff-booking-info">

                                    <strong>
                                        No bookings found
                                    </strong>

                                    <span>
                                        No customer bookings are available.
                                    </span>

                                </div>

                            </div>

                        ) : (

                            recentBookings.map((booking) => {

                                const eventName =
                                    getBookingEventName(
                                        booking
                                    );

                                const seats =
                                    getBookingSeats(
                                        booking
                                    );

                                const amount =
                                    getBookingAmount(
                                        booking
                                    );

                                return (

                                    <div
                                        className="staff-booking-row"
                                        key={booking.id}
                                    >

                                        <div className="staff-booking-avatar">

                                            {eventName
                                                .charAt(0)
                                                .toUpperCase()}

                                        </div>


                                        <div className="staff-booking-info">

                                            <strong>
                                                Booking #{booking.id}
                                            </strong>

                                            <span>
                                                {eventName}
                                            </span>

                                        </div>


                                        <div className="staff-booking-event">

                                            <strong>
                                                {eventName}
                                            </strong>

                                            <span>
                                                Seats: {seats}
                                            </span>

                                        </div>


                                        <div className="staff-booking-amount">

                                            ₹
                                            {amount.toLocaleString(
                                                "en-IN"
                                            )}

                                        </div>


                                        <span
                                            className={`staff-booking-status ${
                                                String(
                                                    booking.status ||
                                                    ""
                                                ).toLowerCase()
                                            }`}
                                        >

                                            <span className="staff-status-dot"></span>

                                            {booking.status ||
                                                "UNKNOWN"}

                                        </span>

                                    </div>

                                );

                            })

                        )}

                    </div>

                </div>


                {/* TODAY'S EVENTS */}

                <div className="staff-dashboard-card staff-today-events">

                    <div className="staff-dashboard-card-header">

                        <div>

                            <p className="page-tag">
                                SCHEDULE
                            </p>

                            <h2>
                                Today's Events
                            </h2>

                        </div>

                    </div>


                    <div className="staff-event-list">

                        {loading ? (

                            <div className="staff-event-item">

                                <div className="staff-event-icon">
                                    ⏳
                                </div>

                                <div className="staff-event-info">

                                    <strong>
                                        Loading events...
                                    </strong>

                                </div>

                            </div>

                        ) : todayEvents.length === 0 ? (

                            <div className="staff-event-item">

                                <div className="staff-event-icon">
                                    📅
                                </div>

                                <div className="staff-event-info">

                                    <strong>
                                        No events today
                                    </strong>

                                    <span>
                                        There are no events scheduled
                                        for today.
                                    </span>

                                </div>

                            </div>

                        ) : (

                            todayEvents.map((event) => (

                                <div
                                    className="staff-event-item"
                                    key={
                                        event.id ||
                                        getEventName(event)
                                    }
                                >

                                    <div className="staff-event-icon">
                                        🏟️
                                    </div>


                                    <div className="staff-event-info">

                                        <strong>
                                            {getEventName(event)}
                                        </strong>

                                        <span>
                                            {getStadiumName(event)}
                                        </span>

                                        <small>
                                            🕐{" "}
                                            {getEventTime(event)}
                                        </small>

                                    </div>


                                    <span className="staff-event-status">

                                        {getEventStatus(event)}

                                    </span>

                                </div>

                            ))

                        )}

                    </div>

                </div>

            </div>


            {/* QUICK ACTIONS */}

            <div className="staff-dashboard-card staff-quick-actions-card">

                <div className="staff-dashboard-card-header">

                    <div>

                        <p className="page-tag">
                            QUICK ACTIONS
                        </p>

                        <h2>
                            Staff Tools
                        </h2>

                    </div>

                </div>


                <div className="staff-quick-actions">

                    <Link
                        to="/staff/tickets/validate"
                        className="staff-quick-action"
                    >

                        <div className="staff-quick-action-icon">
                            🎫
                        </div>

                        <div className="staff-quick-action-text">

                            <strong>
                                Validate Ticket
                            </strong>

                            <span>
                                Check customer ticket
                            </span>

                        </div>

                        <span className="staff-quick-action-arrow">
                            →
                        </span>

                    </Link>


                    <Link
                        to="/staff/bookings"
                        className="staff-quick-action"
                    >

                        <div className="staff-quick-action-icon">
                            📋
                        </div>

                        <div className="staff-quick-action-text">

                            <strong>
                                View Bookings
                            </strong>

                            <span>
                                Check customer bookings
                            </span>

                        </div>

                        <span className="staff-quick-action-arrow">
                            →
                        </span>

                    </Link>

                </div>

            </div>

        </div>
    );
}

export default StaffDashboard;