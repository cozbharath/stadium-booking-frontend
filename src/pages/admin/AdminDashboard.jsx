import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { get } from "../../services/api";

function AdminDashboard() {

    // =========================================================
    // DASHBOARD STATS
    // =========================================================

    const [stats, setStats] = useState({
        users: 0,
        staff: 0,
        stadiums: 0,
        events: 0,
        bookings: null,
        revenue: null,
    });


    // =========================================================
    // RECENT EVENTS
    // =========================================================

    const [recentEvents, setRecentEvents] = useState([]);


    // =========================================================
    // LOADING / ERROR
    // =========================================================

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    // =========================================================
    // LOAD DASHBOARD DATA
    // =========================================================

    const loadDashboardData = async () => {

        try {

            setLoading(true);
            setError("");


            // -------------------------------------------------
            // Load Users, Stadiums and Events
            // -------------------------------------------------

            const [
                usersResponse,
                stadiumsResponse,
                eventsResponse
            ] = await Promise.all([
                get("/users"),
                get("/stadiums"),
                get("/events")
            ]);


            // -------------------------------------------------
            // Make sure responses are arrays
            // -------------------------------------------------

            const users = Array.isArray(usersResponse)
                ? usersResponse
                : [];


            const stadiums = Array.isArray(stadiumsResponse)
                ? stadiumsResponse
                : [];


            const events = Array.isArray(eventsResponse)
                ? eventsResponse
                : [];


            // -------------------------------------------------
            // Count Staff
            // -------------------------------------------------

            const staffCount = users.filter(
                (user) => user.role === "STAFF"
            ).length;


            // -------------------------------------------------
            // Update Statistics
            // -------------------------------------------------

            setStats({
                users: users.length,

                staff: staffCount,

                stadiums: stadiums.length,

                events: events.length,

                // Backend admin booking endpoint
                // will be connected later
                bookings: null,

                // Payment/revenue endpoint will be
                // connected later
                revenue: null,
            });


            // -------------------------------------------------
            // Recent Events
            // -------------------------------------------------

            const formattedEvents = events
                .slice(0, 5)
                .map((event) => {

                    let icon = "🎟️";

                    const eventType =
                        event.eventType ||
                        event.type ||
                        "";

                    const type =
                        String(eventType).toUpperCase();


                    if (type === "CRICKET") {
                        icon = "🏏";
                    } else if (type === "FOOTBALL") {
                        icon = "⚽";
                    } else if (type === "MUSIC") {
                        icon = "🎵";
                    } else if (type === "CONCERT") {
                        icon = "🎤";
                    } else if (type === "TENNIS") {
                        icon = "🎾";
                    }


                    // Stadium name can come in different forms
                    const stadiumName =
                        event.stadium?.name ||
                        event.stadiumName ||
                        "Stadium";


                    // Date
                    const eventDate =
                        event.eventDate ||
                        event.date ||
                        null;


                    let formattedDate = "Date not available";


                    if (eventDate) {

                        const parsedDate =
                            new Date(eventDate);


                        if (!isNaN(parsedDate.getTime())) {

                            formattedDate =
                                parsedDate.toLocaleDateString(
                                    "en-IN",
                                    {
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric",
                                    }
                                );

                        } else {

                            formattedDate = eventDate;
                        }
                    }


                    return {
                        id: event.id,

                        icon: icon,

                        name:
                            event.name ||
                            event.eventName ||
                            "Unnamed Event",

                        stadium:
                            stadiumName,

                        date:
                            formattedDate,

                        status:
                            event.status ||
                            "UPCOMING",
                    };
                });


            setRecentEvents(formattedEvents);


        } catch (err) {

            console.error(
                "Failed to load admin dashboard:",
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


    // =========================================================
    // LOAD WHEN PAGE OPENS
    // =========================================================

    useEffect(() => {

        queueMicrotask(() => {
            loadDashboardData();
        });

    }, []);


    // =========================================================
    // STATISTICS
    // =========================================================

    const statistics = [

        {
            icon: "👥",
            label: "Total Users",
            value: stats.users,
        },

        {
            icon: "🛡️",
            label: "Total Staff",
            value: stats.staff,
        },

        {
            icon: "🏟️",
            label: "Total Stadiums",
            value: stats.stadiums,
        },

        {
            icon: "🎟️",
            label: "Total Events",
            value: stats.events,
        },

        {
            icon: "📋",
            label: "Total Bookings",
            value: stats.bookings,
        },

        {
            icon: "₹",
            label: "Total Revenue",
            value: stats.revenue,
        },
    ];


    // =========================================================
    // RETURN
    // =========================================================

    return (

        <div className="admin-dashboard-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <section className="admin-dashboard-header">

                <div>

                    <p className="page-tag">
                        ADMINISTRATION
                    </p>


                    <h1>
                        Dashboard
                    </h1>


                    <p>
                        Monitor your stadiums, events, users and
                        bookings from one place.
                    </p>

                </div>


                <Link
                    to="/admin/events"
                    className="admin-dashboard-primary-button"
                >
                    + Create Event
                </Link>

            </section>



            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div className="admin-error-message">

                    {error}

                </div>

            )}



            {/* =================================================
                STATISTICS
            ================================================= */}

            <section className="admin-dashboard-stats">

                {statistics.map((stat, index) => (

                    <div
                        className="admin-stat-card"
                        key={index}
                    >

                        <div className="admin-stat-icon">
                            {stat.icon}
                        </div>


                        <div className="admin-stat-content">

                            <span>
                                {stat.label}
                            </span>


                            <strong>

                                {loading
                                    ? "..."
                                    : stat.value !== null
                                        ? stat.value
                                        : "—"
                                }

                            </strong>

                        </div>

                    </div>

                ))}

            </section>



            {/* =================================================
                QUICK ACTIONS
            ================================================= */}

            <section className="admin-dashboard-card admin-quick-actions">

                <div className="admin-dashboard-card-header">

                    <div>

                        <p className="page-tag">
                            MANAGEMENT
                        </p>


                        <h2>
                            Quick Actions
                        </h2>

                    </div>

                </div>


                <div className="admin-quick-actions">


                    {/* USERS */}

                    <Link
                        to="/admin/users"
                        className="admin-quick-action"
                    >

                        <div className="admin-quick-action-icon">
                            👥
                        </div>


                        <div className="admin-quick-action-text">

                            <strong>
                                Manage Users
                            </strong>

                            <span>
                                View and manage customers
                            </span>

                        </div>


                        <b>
                            →
                        </b>

                    </Link>



                    {/* STAFF */}

                    <Link
                        to="/admin/staff/create"
                        className="admin-quick-action"
                    >

                        <div className="admin-quick-action-icon">
                            👤
                        </div>


                        <div className="admin-quick-action-text">

                            <strong>
                                Create Staff
                            </strong>

                            <span>
                                Add a new staff account
                            </span>

                        </div>


                        <b>
                            →
                        </b>

                    </Link>



                    {/* STADIUMS */}

                    <Link
                        to="/admin/stadiums"
                        className="admin-quick-action"
                    >

                        <div className="admin-quick-action-icon">
                            🏟️
                        </div>


                        <div className="admin-quick-action-text">

                            <strong>
                                Manage Stadiums
                            </strong>

                            <span>
                                Add or update stadiums
                            </span>

                        </div>


                        <b>
                            →
                        </b>

                    </Link>



                    {/* EVENTS */}

                    <Link
                        to="/admin/events"
                        className="admin-quick-action"
                    >

                        <div className="admin-quick-action-icon">
                            🎟️
                        </div>


                        <div className="admin-quick-action-text">

                            <strong>
                                Manage Events
                            </strong>

                            <span>
                                Create and update events
                            </span>

                        </div>


                        <b>
                            →
                        </b>

                    </Link>

                </div>

            </section>



            {/* =================================================
                TWO COLUMN AREA
            ================================================= */}

            <section className="admin-dashboard-grid">


                {/* =================================================
                    RECENT EVENTS
                ================================================= */}

                <div className="admin-dashboard-card admin-recent-events">


                    <div className="admin-dashboard-card-header">

                        <div>

                            <p className="page-tag">
                                EVENT MANAGEMENT
                            </p>


                            <h2>
                                Recent Events
                            </h2>

                        </div>


                        <Link
                            to="/admin/events"
                            className="admin-view-all"
                        >
                            View All →
                        </Link>

                    </div>



                    <div>

                        {loading ? (

                            <div className="admin-dashboard-loading">
                                Loading events...
                            </div>

                        ) : recentEvents.length === 0 ? (

                            <div className="admin-dashboard-empty">
                                No events found.
                            </div>

                        ) : (

                            recentEvents.map((event, index) => (

                                <div
                                    className="admin-event-row"
                                    key={event.id || index}
                                >


                                    <div className="admin-event-icon">
                                        {event.icon}
                                    </div>


                                    <div className="admin-event-info">

                                        <strong>
                                            {event.name}
                                        </strong>


                                        <span>
                                            {event.stadium}
                                        </span>


                                        <small>
                                            📅 {event.date}
                                        </small>

                                    </div>


                                    <span className="admin-event-status">
                                        {event.status}
                                    </span>

                                </div>

                            ))

                        )}

                    </div>

                </div>



                {/* =================================================
                    RECENT BOOKINGS
                ================================================= */}

                <div className="admin-dashboard-card admin-recent-bookings">


                    <div className="admin-recent-bookings-header">

                        <div>

                            <p className="page-tag">
                                BOOKING ACTIVITY
                            </p>


                            <h2>
                                Recent Bookings
                            </h2>

                        </div>


                        <Link
                            to="/admin/users"
                            className="admin-view-all"
                        >
                            View All →
                        </Link>

                    </div>



                    <div className="admin-bookings-placeholder">

                        <div className="admin-bookings-placeholder-icon">
                            📋
                        </div>


                        <strong>
                            Booking data will appear here
                        </strong>


                        <span>
                            Admin booking API will be connected
                            in the next step.
                        </span>

                    </div>

                </div>


            </section>

        </div>
    );
}


export default AdminDashboard;