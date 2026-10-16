import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../../services/api";


function CustomerEvents() {

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {
        loadEvents();
    }, []);


    const loadEvents = async () => {

        try {

            setLoading(true);
            setError("");

            // GET /api/events
            const data = await get("/events");

            console.log(
                "CUSTOMER EVENTS RESPONSE:",
                data
            );

            setEvents(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (err) {

            console.error(
                "Failed to load customer events:",
                err
            );

            setError(
                err?.message ||
                "Failed to load events."
            );

        } finally {

            setLoading(false);

        }
    };


    return (

        <div className="customer-events-page">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <section className="customer-events-header">

                <div>

                    <p className="customer-events-tag">
                        UPCOMING EVENTS
                    </p>

                    <h1>
                        Find Your Next
                        <br />
                        Stadium Experience
                    </h1>

                    <p>
                        Explore upcoming events and choose the
                        experience you want to attend.
                    </p>

                </div>

            </section>


            {/* =====================================================
                EVENT LIST
            ===================================================== */}

            <section className="customer-events-section">

                <div className="customer-events-heading">

                    <div>

                        <p className="customer-events-tag">
                            BOOK YOUR TICKET
                        </p>

                        <h2>
                            Upcoming Events
                        </h2>

                    </div>

                    <span>
                        {events.length}{" "}
                        {events.length === 1
                            ? "Event"
                            : "Events"}{" "}
                        Available
                    </span>

                </div>


                {/* =================================================
                    LOADING
                ================================================= */}

                {loading && (

                    <div className="customer-events-state">

                        <div className="customer-events-spinner"></div>

                        <h3>
                            Loading events...
                        </h3>

                        <p>
                            Please wait while we load the latest events.
                        </p>

                    </div>

                )}


                {/* =================================================
                    ERROR
                ================================================= */}

                {!loading && error && (

                    <div className="customer-events-state customer-events-error">

                        <div className="customer-events-state-icon">
                            !
                        </div>

                        <h3>
                            Unable to load events
                        </h3>

                        <p>
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={loadEvents}
                            className="customer-events-retry"
                        >
                            Try Again
                        </button>

                    </div>

                )}


                {/* =================================================
                    EMPTY
                ================================================= */}

                {!loading &&
                    !error &&
                    events.length === 0 && (

                        <div className="customer-events-state">

                            <div className="customer-events-state-icon">
                                🎟️
                            </div>

                            <h3>
                                No events available
                            </h3>

                            <p>
                                There are currently no events available
                                for booking.
                            </p>

                        </div>

                    )}


                {/* =================================================
                    EVENTS
                ================================================= */}

                {!loading &&
                    !error &&
                    events.length > 0 && (

                        <div className="customer-events-grid">

                            {events.map((event) => {

                                const eventId =
                                    event?.id ??
                                    event?.eventId ??
                                    event?.eventID;


                                const eventName =
                                    event?.name ??
                                    event?.eventName ??
                                    event?.title ??
                                    "Event";


                                const stadiumName =
                                    event?.stadiumName ??
                                    event?.stadium?.name ??
                                    event?.stadium ??
                                    "Stadium";


                                const location =
                                    event?.stadiumLocation ??
                                    event?.location ??
                                    event?.stadium?.location ??
                                    "—";


                                const eventDate =
                                    event?.eventDate ??
                                    event?.date;


                                const startTime =
                                    event?.startTime ??
                                    event?.time;


                                const endTime =
                                    event?.endTime;


                                const status =
                                    event?.status ??
                                    "UPCOMING";


                                /*
                                 * IMPORTANT:
                                 * Image comes ONLY from backend.
                                 */
                                const imageUrl =
                                    event?.imageUrl ?? "";


                                console.log(
                                    `Customer event image - ${eventName}:`,
                                    imageUrl
                                );


                                return (

                                    <article
                                        className="customer-event-card"
                                        key={eventId}
                                    >

                                        {/* =================================
                                            EVENT IMAGE
                                        ================================= */}

                                        <div
                                            className="customer-event-image"
                                            style={{
                                                position: "relative",
                                                overflow: "hidden"
                                            }}
                                        >

                                            {imageUrl ? (

                                                <img
                                                    src={imageUrl}
                                                    alt={eventName}

                                                    className="customer-event-image-img"

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
                                                    className="customer-event-image-placeholder"
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


                                            {/* EVENT LABEL */}

                                            <span
                                                style={{
                                                    position: "absolute",
                                                    left: "20px",
                                                    bottom: "18px",
                                                    zIndex: 2
                                                }}
                                            >
                                                EVENT
                                            </span>

                                        </div>


                                        {/* =================================
                                            EVENT CONTENT
                                        ================================= */}

                                        <div className="customer-event-content">

                                            <div className="customer-event-top">

                                                <span className="customer-event-status">
                                                    {status}
                                                </span>

                                            </div>


                                            <h3>
                                                {eventName}
                                            </h3>


                                            <p className="customer-event-stadium">
                                                📍 {stadiumName}
                                            </p>


                                            <p className="customer-event-location">
                                                {location}
                                            </p>


                                            {/* =================================
                                                DATE / TIME
                                            ================================= */}

                                            <div className="customer-event-info">

                                                <div>

                                                    <small>
                                                        DATE
                                                    </small>

                                                    <strong>
                                                        {formatDate(eventDate)}
                                                    </strong>

                                                </div>


                                                <div>

                                                    <small>
                                                        TIME
                                                    </small>

                                                    <strong>

                                                        {formatTime(startTime)}

                                                        {endTime
                                                            ? ` - ${formatTime(endTime)}`
                                                            : ""}

                                                    </strong>

                                                </div>

                                            </div>


                                            {/* =================================
                                                VIEW EVENT
                                            ================================= */}

                                            <Link
                                                to={`/customer/events/${eventId}`}
                                                className="customer-event-button"
                                            >
                                                View Event
                                                <span>→</span>
                                            </Link>

                                        </div>

                                    </article>

                                );

                            })}

                        </div>

                    )}

            </section>

        </div>
    );
}


/* =============================================================
   DATE FORMAT
============================================================= */

function formatDate(date) {

    if (!date) {
        return "—";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return String(date);
    }

    return parsed.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


/* =============================================================
   TIME FORMAT
============================================================= */

function formatTime(time) {

    if (!time) {
        return "—";
    }

    const value = String(time);

    const parts = value.split(":");

    if (parts.length < 2) {
        return value;
    }

    let hour = Number(parts[0]);

    const minute = parts[1];

    if (Number.isNaN(hour)) {
        return value;
    }

    const suffix =
        hour >= 12
            ? "PM"
            : "AM";

    hour =
        hour % 12 || 12;

    return `${hour}:${minute} ${suffix}`;
}


export default CustomerEvents;