import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { get } from "../../services/api";


function CustomerEventDetails() {

    const { eventId } = useParams();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {

        if (!eventId) {
            setError("Event ID is missing.");
            setLoading(false);
            return;
        }

        loadEvent();

    }, [eventId]);


    const loadEvent = async () => {

        try {

            setLoading(true);
            setError("");

            // Existing backend:
            // GET http://localhost:8888/api/events/{eventId}
            const data =
                await get(`/events/${eventId}`);

            console.log(
                "CUSTOMER EVENT DETAILS:",
                data
            );

            setEvent(data);

        } catch (err) {

            console.error(
                "Failed to load customer event:",
                err
            );

            setError(
                err?.message ||
                "Failed to load event details."
            );

        } finally {
            setLoading(false);
        }
    };


    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {

        return (

            <div className="customer-event-details-page">

                <section className="customer-event-details-state">

                    <div className="customer-details-spinner"></div>

                    <h2>
                        Loading event...
                    </h2>

                    <p>
                        Please wait while we load the event details.
                    </p>

                </section>

            </div>
        );
    }


    /* =========================================================
       ERROR
    ========================================================= */

    if (error || !event) {

        return (

            <div className="customer-event-details-page">

                <section className="customer-event-details-state">

                    <div className="customer-details-error-icon">
                        !
                    </div>

                    <h2>
                        Unable to load event
                    </h2>

                    <p>
                        {error || "Event not found."}
                    </p>

                    <div className="customer-details-error-actions">

                        <button
                            type="button"
                            onClick={loadEvent}
                            className="customer-details-retry"
                        >
                            Try Again
                        </button>

                        <Link
                            to="/customer/events"
                            className="customer-details-back-button"
                        >
                            Back to Events
                        </Link>

                    </div>

                </section>

            </div>
        );
    }


    /* =========================================================
       NORMALIZE BACKEND RESPONSE

       Current backend EventService maps:
       id
       name
       eventDate
       startTime
       endTime
       status
       stadiumId
       stadiumName
       stadiumLocation
    ========================================================= */

    const eventName =
        event?.name ??
        event?.eventName ??
        event?.title ??
        "Event";

    const eventCategory =
        event?.category ??
        event?.eventType ??
        event?.type ??
        "EVENT";

    const stadiumName =
        event?.stadiumName ??
        event?.stadium?.name ??
        "Stadium";

    const location =
        event?.stadiumLocation ??
        event?.location ??
        event?.stadium?.location ??
        "—";

    const eventDate =
        event?.eventDate ??
        event?.date ??
        null;

    const startTime =
        event?.startTime ??
        event?.time ??
        null;

    const endTime =
        event?.endTime ??
        null;

    const status =
        event?.status ??
        "UPCOMING";

    const description =
        event?.description ??
        "Experience this event live from the stadium. Choose your preferred seats and book your tickets securely with BookNow.";


    return (

        <div className="customer-event-details-page">

            {/* =================================================
                HERO
            ================================================= */}

            <section className="customer-event-details-hero">

                <div className="customer-event-details-overlay"></div>

                <div className="customer-event-details-hero-content">

                    <div className="customer-event-details-breadcrumb">

                        <Link
                            to="/customer/events"
                        >
                            ← Events
                        </Link>

                    </div>

                    <span className="customer-event-details-category">
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

            <section className="customer-event-details-content">

                <div className="customer-event-details-main">

                    {/* EVENT DESCRIPTION */}

                    <article className="customer-event-details-card">

                        <p className="customer-event-details-tag">
                            EVENT DETAILS
                        </p>

                        <h2>
                            About This Event
                        </h2>

                        <p className="customer-event-details-description">
                            {description}
                        </p>

                        <div className="customer-event-details-divider"></div>


                        {/* INFO GRID */}

                        <div className="customer-event-details-info-grid">

                            <div className="customer-event-detail-item">

                                <span className="customer-detail-icon">
                                    📅
                                </span>

                                <div>
                                    <small>
                                        DATE
                                    </small>

                                    <strong>
                                        {formatDate(eventDate)}
                                    </strong>
                                </div>

                            </div>


                            <div className="customer-event-detail-item">

                                <span className="customer-detail-icon">
                                    🕐
                                </span>

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


                            <div className="customer-event-detail-item">

                                <span className="customer-detail-icon">
                                    🏟️
                                </span>

                                <div>
                                    <small>
                                        STADIUM
                                    </small>

                                    <strong>
                                        {stadiumName}
                                    </strong>
                                </div>

                            </div>


                            <div className="customer-event-detail-item">

                                <span className="customer-detail-icon">
                                    📍
                                </span>

                                <div>
                                    <small>
                                        LOCATION
                                    </small>

                                    <strong>
                                        {location}
                                    </strong>
                                </div>

                            </div>

                        </div>


                        {/* STATUS */}

                        <div className="customer-event-status-row">

                            <span>
                                Event Status
                            </span>

                            <strong>
                                {status}
                            </strong>

                        </div>

                    </article>

                </div>


                {/* =================================================
                    BOOKING CARD
                ================================================= */}

                <aside className="customer-event-booking-card">

                    <p>
                        READY TO EXPERIENCE IT?
                    </p>

                    <h2>
                        Book Your Seats
                    </h2>

                    <span>
                        Select your preferred seats and continue
                        to booking.
                    </span>


                    <Link
                        to={`/customer/seats/${eventId}`}
                        className="customer-event-select-seats"
                    >
                        Select Seats
                    </Link>


                    <Link
                        to="/customer/events"
                        className="customer-event-back-events"
                    >
                        ← Back to Events
                    </Link>

                </aside>

            </section>

        </div>
    );
}


/* =============================================================
   HELPERS
============================================================= */

function formatDate(date) {

    if (!date) {
        return "—";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
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

    const suffix = hour >= 12 ? "PM" : "AM";

    hour = hour % 12 || 12;

    return `${hour}:${minute} ${suffix}`;
}


export default CustomerEventDetails;
