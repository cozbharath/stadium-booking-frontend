import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { get } from "../../services/api";

function EventDetails() {

    const { eventId } = useParams();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    // =========================================================
    // LOAD EVENT
    // =========================================================

    const loadEvent = async () => {

        try {

            setLoading(true);
            setError("");

            const data =
                await get(
                    `/events/${eventId}`
                );

            console.log(
                "EVENT DETAILS:",
                data
            );

            setEvent(data);

        } catch (err) {

            console.error(
                "Failed to load event:",
                err
            );

            setError(
                err.message ||
                "Failed to load event details."
            );

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {

        queueMicrotask(() => {

            if (!eventId) {

                setError(
                    "Event ID is missing."
                );

                setLoading(false);

                return;
            }

            loadEvent();
        });

    }, [eventId]);


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (
            <div className="event-details-page">

                <section
                    className="event-details-content"
                >

                    <div
                        style={{
                            width: "100%",
                            padding: "80px",
                            textAlign: "center"
                        }}
                    >

                        <h2>
                            Loading event...
                        </h2>

                        <p>
                            Please wait while we load
                            the event details.
                        </p>

                    </div>

                </section>

            </div>
        );
    }


    // =========================================================
    // ERROR
    // =========================================================

    if (error || !event) {

        return (
            <div className="event-details-page">

                <section
                    className="event-details-content"
                >

                    <div
                        style={{
                            width: "100%",
                            padding: "80px",
                            textAlign: "center"
                        }}
                    >

                        <h2>
                            Unable to load event
                        </h2>

                        <p>
                            {error ||
                                "Event not found."}
                        </p>

                        <button
                            type="button"
                            className="primary-btn"
                            onClick={loadEvent}
                        >
                            Try Again
                        </button>

                    </div>

                </section>

            </div>
        );
    }


    // =========================================================
    // NORMALIZE EVENT DATA
    // =========================================================

    const eventName =
        event.name ??
        event.eventName ??
        event.title ??
        "Event";


    const eventCategory =
        event.category ??
        event.eventType ??
        event.type ??
        "EVENT";


    const stadiumName =
        event.stadiumName ??
        event.stadium?.name ??
        event.stadium ??
        "—";


    const location =
        event.location ??
        event.stadiumLocation ??
        event.stadium?.location ??
        "—";


    const eventDate =
        event.eventDate ??
        event.date ??
        null;


    const eventTime =
        event.startTime ??
        event.time ??
        null;


    const description =
        event.description ??
        "Experience this event live from the stadium. Choose your preferred seats and book your tickets securely with BookNow.";


    return (

        <div className="event-details-page">


            {/* =================================================
                HERO
            ================================================= */}

            <section className="event-details-hero">

                <div className="event-details-overlay"></div>


                <div className="event-details-hero-content">

                    <span className="event-category">

                        {eventCategory}

                    </span>


                    <h1>

                        {eventName}

                    </h1>


                    <p>

                        📍 {stadiumName}

                    </p>

                </div>

            </section>


            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <section className="event-details-content">


                {/* =================================================
                    EVENT INFORMATION
                ================================================= */}

                <div className="event-details-main">


                    {/* DESCRIPTION */}

                    <div className="event-description">

                        <p className="page-tag">
                            EVENT DETAILS
                        </p>

                        <h2>
                            About This Event
                        </h2>

                        <p>
                            {description}
                        </p>

                    </div>


                    {/* =================================================
                        EVENT INFORMATION
                    ================================================= */}

                    <div className="event-information">


                        {/* DATE */}

                        <div className="event-detail-item">

                            <span>
                                DATE
                            </span>

                            <strong>
                                {formatDate(
                                    eventDate
                                )}
                            </strong>

                        </div>


                        {/* TIME */}

                        <div className="event-detail-item">

                            <span>
                                TIME
                            </span>

                            <strong>
                                {formatTime(
                                    eventTime
                                )}
                            </strong>

                        </div>


                        {/* STADIUM */}

                        <div className="event-detail-item">

                            <span>
                                STADIUM
                            </span>

                            <strong>
                                {stadiumName}
                            </strong>

                        </div>


                        {/* LOCATION */}

                        <div className="event-detail-item">

                            <span>
                                LOCATION
                            </span>

                            <strong>
                                {location}
                            </strong>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    BOOKING CARD
                ================================================= */}

                <div className="event-booking-card">

                    <p>
                        READY TO EXPERIENCE IT?
                    </p>

                    <h2>
                        Book Your Seats
                    </h2>

                    <span>
                        Select your preferred seats
                        and continue to booking.
                    </span>


                    <Link
                        to={`/customer/seats/${eventId}`}
                        className="event-book-now"
                    >
                        Select Seats
                    </Link>

                </div>

            </section>

        </div>
    );
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


export default EventDetails;