import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../../services/api";

function Events() {

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    // =========================================================
    // LOAD EVENTS FROM BACKEND
    // =========================================================

    const loadEvents = async () => {

        try {

            setLoading(true);
            setError("");

            const data = await get("/events");

            const eventList =
                Array.isArray(data)
                    ? data
                    : [];

            console.log(
                "ALL EVENTS:",
                eventList
            );

            setEvents(eventList);

        } catch (err) {

            console.error(
                "Failed to load events:",
                err
            );

            setError(
                err.message ||
                "Failed to load events."
            );

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {

        queueMicrotask(() => {
            loadEvents();
        });

    }, []);


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (

            <div className="events-page">

                <section className="events-header">

                    <div>

                        <p className="page-tag">
                            UPCOMING EVENTS
                        </p>

                        <h1>
                            Find Your Next
                            <br />
                            Stadium Experience
                        </h1>

                        <p>
                            Explore upcoming events and
                            choose the experience you want
                            to attend.
                        </p>

                    </div>

                </section>


                <section className="events-section">

                    <div
                        style={{
                            padding: "70px",
                            textAlign: "center"
                        }}
                    >

                        <h2>
                            Loading events...
                        </h2>

                        <p>
                            Please wait while we load
                            the latest events.
                        </p>

                    </div>

                </section>

            </div>
        );
    }


    // =========================================================
    // ERROR
    // =========================================================

    if (error) {

        return (

            <div className="events-page">

                <section className="events-header">

                    <div>

                        <p className="page-tag">
                            UPCOMING EVENTS
                        </p>

                        <h1>
                            Find Your Next
                            <br />
                            Stadium Experience
                        </h1>

                        <p>
                            Explore upcoming events and
                            choose the experience you want
                            to attend.
                        </p>

                    </div>

                </section>


                <section className="events-section">

                    <div
                        style={{
                            padding: "60px",
                            textAlign: "center"
                        }}
                    >

                        <h2>
                            Unable to load events
                        </h2>

                        <p>
                            {error}
                        </p>

                        <button
                            type="button"
                            className="primary-btn"
                            onClick={loadEvents}
                        >
                            Try Again
                        </button>

                    </div>

                </section>

            </div>
        );
    }


    // =========================================================
    // MAIN PAGE
    // =========================================================

    return (

        <div className="events-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <section className="events-header">

                <div>

                    <p className="page-tag">
                        UPCOMING EVENTS
                    </p>

                    <h1>
                        Find Your Next
                        <br />
                        Stadium Experience
                    </h1>

                    <p>
                        Explore upcoming events and choose
                        the experience you want to attend.
                    </p>

                </div>

            </section>


            {/* =================================================
                EVENTS
            ================================================= */}

            <section className="events-section">

                <div className="events-section-title">

                    <div>

                        <p className="page-tag">
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
                    NO EVENTS
                ================================================= */}

                {events.length === 0 ? (

                    <div
                        style={{
                            padding: "60px",
                            textAlign: "center"
                        }}
                    >

                        <h2>
                            No events available
                        </h2>

                        <p>
                            There are currently no events
                            available for booking.
                        </p>

                    </div>

                ) : (

                    <div className="events-grid">

                        {events.map((event) => {

                            const eventId =
                                getEventId(event);


                            /*
                             * IMAGE COMES ONLY FROM BACKEND
                             *
                             * Expected backend field:
                             *
                             * imageUrl
                             */

                            const imageUrl =
                                event?.imageUrl ?? "";


                            console.log(
                                `Event "${getEventName(event)}" image:`,
                                imageUrl
                            );


                            return (

                                <div
                                    className="event-card"
                                    key={eventId}
                                >


                                    {/* =================================================
                                        EVENT IMAGE
                                    ================================================= */}

                                    <div
                                        className="event-card-image"
                                        style={{
                                            position: "relative",
                                            overflow: "hidden"
                                        }}
                                    >

                                        {/* IMAGE FROM BACKEND ONLY */}

                                        {imageUrl && (

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

                                                onLoad={() => {

                                                    console.log(
                                                        "IMAGE LOADED:",
                                                        getEventName(event),
                                                        imageUrl
                                                    );

                                                }}

                                                onError={(e) => {

                                                    console.error(
                                                        "BACKEND IMAGE FAILED:",
                                                        getEventName(event),
                                                        imageUrl
                                                    );

                                                    /*
                                                     * Do NOT replace the image
                                                     * with a manually written URL.
                                                     */

                                                    e.currentTarget.style.display =
                                                        "none";

                                                }}
                                            />

                                        )}


                                        {/* =================================================
                                            IMAGE OVERLAY
                                        ================================================= */}

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


                                        {/* =================================================
                                            CATEGORY
                                        ================================================= */}

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


                                    {/* =================================================
                                        EVENT CONTENT
                                    ================================================= */}

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
                                            to={`/events/${eventId}`}
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

        </div>
    );
}


// =============================================================
// EVENT ID
// =============================================================

function getEventId(event) {

    return (
        event?.id ??
        event?.eventId ??
        event?.eventID
    );
}


// =============================================================
// EVENT NAME
// =============================================================

function getEventName(event) {

    return (
        event?.name ??
        event?.eventName ??
        event?.title ??
        "Event"
    );
}


// =============================================================
// STADIUM NAME
// =============================================================

function getStadiumName(event) {

    return (
        event?.stadiumName ??
        event?.stadium?.name ??
        event?.stadium ??
        "Stadium"
    );
}


// =============================================================
// EVENT DATE
// =============================================================

function getEventDate(event) {

    return (
        event?.eventDate ??
        event?.date ??
        null
    );
}


// =============================================================
// EVENT TIME
// =============================================================

function getEventTime(event) {

    return (
        event?.startTime ??
        event?.time ??
        null
    );
}


// =============================================================
// EVENT CATEGORY
// =============================================================

function getEventCategory(event) {

    return (
        event?.category ??
        event?.eventType ??
        event?.type ??
        "EVENT"
    );
}


// =============================================================
// EVENT IMAGE
// =============================================================

function getEventImage(event) {

    /*
     * IMAGE COMES ONLY FROM BACKEND.
     *
     * No manual URL.
     * No Unsplash.
     * No event-name based image.
     * No fallback image.
     */

    return event?.imageUrl ?? "";
}


// =============================================================
// FORMAT DATE
// =============================================================

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
            month: "long",
            year: "numeric"
        }
    );
}


// =============================================================
// FORMAT TIME
// =============================================================

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


export default Events;