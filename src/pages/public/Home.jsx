import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../../services/api";

function Home() {

    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);


    // =========================================================
    // LOAD UPCOMING EVENTS
    // =========================================================

    const loadUpcomingEvents = async () => {

        try {

            setLoadingEvents(true);

            const data = await get(
                "/events/upcoming"
            );

            const eventList =
                Array.isArray(data)
                    ? data
                    : [];

            console.log(
                "UPCOMING EVENTS:",
                eventList
            );

            setEvents(eventList);

        } catch (error) {

            console.error(
                "Failed to load upcoming events:",
                error
            );

            setEvents([]);

        } finally {

            setLoadingEvents(false);

        }
    };


    useEffect(() => {

        queueMicrotask(() => {
            loadUpcomingEvents();
        });

    }, []);


    // =========================================================
    // EVENT COUNT
    // =========================================================

    const eventCount =
        events.length;


    return (

        <div className="home-page">


            {/* =================================================
                HERO
            ================================================= */}

            <section className="hero-section">

                <div className="hero-content">

                    <p className="hero-tag">
                        YOUR STADIUM • YOUR EVENT • YOUR TICKET
                    </p>

                    <h1>
                        Book Your Stadium
                        <br />
                        Experience
                    </h1>

                    <p>
                        Discover upcoming events, choose your
                        favorite seats, and book your tickets
                        quickly and securely with BookNow.
                    </p>


                    <div className="hero-actions">

                        <Link
                            to="/events"
                            className="primary-btn"
                        >
                            Explore Events
                        </Link>


                        <Link
                            to="/register"
                            className="secondary-btn"
                        >
                            Create Account
                        </Link>

                    </div>

                </div>


                {/* =================================================
                    HERO CARD
                ================================================= */}

                <div className="hero-card">

                    <div className="hero-card-top">

                        <span>
                            BOOKNOW
                        </span>

                        <span>
                            LIVE EVENTS
                        </span>

                    </div>


                    <h2>
                        Your next experience
                        starts here.
                    </h2>


                    <div className="hero-card-info">

                        <div>

                            <span>
                                Events
                            </span>

                            <strong>
                                {loadingEvents
                                    ? "..."
                                    : eventCount}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Stadiums
                            </span>

                            <strong>
                                {loadingEvents
                                    ? "..."
                                    : getUniqueStadiumCount(events)}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Tickets
                            </span>

                            <strong>
                                —
                            </strong>

                        </div>

                    </div>

                </div>

            </section>


            {/* =================================================
                UPCOMING EVENTS PREVIEW
            ================================================= */}

            <section className="events-section">

                <div className="events-section-title">

                    <div>

                        <p className="page-tag">
                            DON'T MISS OUT
                        </p>

                        <h2>
                            Upcoming Events
                        </h2>

                    </div>


                    <Link
                        to="/events"
                        className="secondary-btn"
                    >
                        View All Events
                    </Link>

                </div>


                {loadingEvents ? (

                    <div
                        style={{
                            padding: "50px",
                            textAlign: "center"
                        }}
                    >

                        <h3>
                            Loading upcoming events...
                        </h3>

                    </div>

                ) : events.length === 0 ? (

                    <div
                        style={{
                            padding: "50px",
                            textAlign: "center"
                        }}
                    >

                        <h3>
                            No upcoming events available
                        </h3>

                        <p>
                            Please check again later.
                        </p>

                    </div>

                ) : (

                    <div className="events-grid">

                        {events
                            .slice(0, 3)
                            .map((event) => {

                                const imageUrl =
                                    event?.imageUrl ?? "";

                                return (

                                    <div
                                        className="event-card"
                                        key={getEventId(event)}
                                    >

                                        {/* =================================
                                            EVENT IMAGE
                                        ================================= */}

                                        <div
                                            className="event-card-image"
                                            style={{
                                                position: "relative",
                                                overflow: "hidden"
                                            }}
                                        >

                                            {imageUrl ? (

                                                <img
                                                    src={imageUrl}
                                                    alt={getEventName(event)}

                                                    style={{
                                                        position: "absolute",
                                                        inset: 0,
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                        objectPosition: "center",
                                                        display: "block"
                                                    }}

                                                    onError={(e) => {

                                                        console.error(
                                                            "Backend image failed:",
                                                            imageUrl
                                                        );

                                                        e.currentTarget.style.display =
                                                            "none";

                                                    }}
                                                />

                                            ) : (

                                                <div
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center"
                                                    }}
                                                >
                                                    NO IMAGE
                                                </div>

                                            )}


                                            {/* IMAGE OVERLAY */}

                                            <div
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    background:
                                                        "linear-gradient(to top, rgba(0,0,0,0.48), rgba(0,0,0,0.05))",
                                                    pointerEvents: "none",
                                                    zIndex: 1
                                                }}
                                            ></div>


                                            {/* CATEGORY */}

                                            <span
                                                style={{
                                                    position: "absolute",
                                                    left: "20px",
                                                    bottom: "18px",
                                                    zIndex: 2
                                                }}
                                            >
                                                {getEventCategory(event)}
                                            </span>

                                        </div>


                                        {/* =================================
                                            EVENT CONTENT
                                        ================================= */}

                                        <div className="event-card-content">

                                            <h3>
                                                {getEventName(event)}
                                            </h3>


                                            <p className="event-stadium">
                                                📍{" "}
                                                {getStadiumName(event)}
                                            </p>


                                            <div className="event-info">

                                                {/* DATE */}

                                                <div>

                                                    <small>
                                                        Date
                                                    </small>

                                                    <strong>
                                                        {formatDate(
                                                            getEventDate(event)
                                                        )}
                                                    </strong>

                                                </div>


                                                {/* TIME */}

                                                <div>

                                                    <small>
                                                        Time
                                                    </small>

                                                    <strong>
                                                        {formatTime(
                                                            getEventTime(event)
                                                        )}
                                                    </strong>

                                                </div>

                                            </div>


                                            {/* VIEW EVENT */}

                                            <Link
                                                to={`/events/${getEventId(event)}`}
                                                className="event-button"
                                            >
                                                View Event
                                            </Link>

                                        </div>

                                    </div>

                                );

                            })}

                    </div>

                )}

            </section>


            {/* =================================================
                FEATURES
            ================================================= */}

            <section className="features-section">

                <div className="section-heading">

                    <p>
                        SIMPLE & SECURE
                    </p>

                    <h2>
                        Everything you need
                        for your next event
                    </h2>

                </div>


                <div className="feature-grid">


                    <div className="feature-card">

                        <div className="feature-icon">
                            🎟️
                        </div>

                        <h3>
                            Easy Booking
                        </h3>

                        <p>
                            Find your favorite events and
                            book your tickets in just a few
                            simple steps.
                        </p>

                    </div>


                    <div className="feature-card">

                        <div className="feature-icon">
                            💺
                        </div>

                        <h3>
                            Choose Your Seat
                        </h3>

                        <p>
                            Select the seats you want and
                            see your booking total before
                            payment.
                        </p>

                    </div>


                    <div className="feature-card">

                        <div className="feature-icon">
                            📱
                        </div>

                        <h3>
                            QR Ticket
                        </h3>

                        <p>
                            Receive your digital ticket with
                            a QR code after successful payment.
                        </p>

                    </div>

                </div>

            </section>


            {/* =================================================
                CTA
            ================================================= */}

            <section className="home-cta">

                <div>

                    <h2>
                        Ready for your next event?
                    </h2>

                    <p>
                        Browse upcoming events and reserve
                        your seats today.
                    </p>

                </div>


                <Link
                    to="/events"
                    className="primary-btn"
                >
                    View Events
                </Link>

            </section>

        </div>
    );
}


/* =============================================================
   HELPER FUNCTIONS
============================================================= */

function getEventId(event) {

    return (
        event?.id ??
        event?.eventId ??
        event?.eventID
    );
}


function getEventName(event) {

    return (
        event?.name ??
        event?.eventName ??
        event?.title ??
        "Event"
    );
}


function getStadiumName(event) {

    return (
        event?.stadiumName ??
        event?.stadium?.name ??
        event?.stadium ??
        "Stadium"
    );
}


function getEventDate(event) {

    return (
        event?.eventDate ??
        event?.date ??
        null
    );
}


function getEventTime(event) {

    return (
        event?.startTime ??
        event?.time ??
        null
    );
}


function getEventCategory(event) {

    return (
        event?.category ??
        event?.eventType ??
        event?.type ??
        "EVENT"
    );
}


/*
 * IMPORTANT:
 * Image comes ONLY from backend.
 */
function getEventImage(event) {

    return event?.imageUrl ?? "";
}


function getUniqueStadiumCount(events) {

    const stadiums =
        events
            .map(
                (event) =>
                    getStadiumName(event)
            )
            .filter(
                (stadium) =>
                    stadium &&
                    stadium !== "Stadium"
            );

    return new Set(stadiums).size;
}


function formatDate(date) {

    if (!date) {
        return "—";
    }

    const parsedDate =
        new Date(date);

    if (
        Number.isNaN(
            parsedDate.getTime()
        )
    ) {
        return String(date);
    }

    return parsedDate.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


function formatTime(time) {

    if (!time) {
        return "—";
    }

    const parts =
        String(time).split(":");

    if (parts.length < 2) {
        return String(time);
    }

    let hour =
        Number(parts[0]);

    const minute =
        parts[1];

    const suffix =
        hour >= 12
            ? "PM"
            : "AM";

    hour =
        hour % 12 || 12;

    return `${hour}:${minute} ${suffix}`;
}


export default Home;