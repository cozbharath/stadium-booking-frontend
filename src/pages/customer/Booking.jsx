import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { post } from "../../services/api";

function Booking() {

    const navigate = useNavigate();

    const [bookingData, setBookingData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [creatingBooking, setCreatingBooking] = useState(false);
    const [error, setError] = useState("");


    // =========================================================
    // LOAD BOOKING DATA
    // =========================================================

    useEffect(() => {
        queueMicrotask(() => {

            const storedData =
                sessionStorage.getItem("bookingData");

            if (!storedData) {

                setError(
                    "No seat selection found. Please select your seats again."
                );

                setLoading(false);

                return;
            }

            try {

                const parsedData =
                    JSON.parse(storedData);

                if (
                    !parsedData.eventId ||
                    !parsedData.holdToken ||
                    !Array.isArray(
                        parsedData.selectedSeats
                    ) ||
                    parsedData.selectedSeats.length === 0
                ) {

                    setError(
                        "Your seat selection is incomplete. Please select your seats again."
                    );

                    setLoading(false);

                    return;
                }

                setBookingData(parsedData);

            } catch (err) {

                console.error(
                    "Invalid booking data:",
                    err
                );

                setError(
                    "Unable to read your booking information."
                );

            } finally {

                setLoading(false);

            }

        });
    }, []);


    // =========================================================
    // CONFIRM BOOKING
    // =========================================================

    const handleConfirmBooking = async () => {

        if (!bookingData) {
            return;
        }

        if (!bookingData.holdToken) {

            setError(
                "Seat hold has expired or is unavailable. Please select seats again."
            );

            return;
        }

        try {

            setCreatingBooking(true);
            setError("");

            /*
             * Backend BookingService expects the hold token.
             *
             * Example:
             *
             * {
             *     "holdToken": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
             * }
             */

            const request = {
    eventId: bookingData.eventId,
    eventSeatIds: bookingData.selectedSeats.map(
        seat => seat.eventSeatId ?? seat.id
    ),
    holdToken: bookingData.holdToken
};

            console.log(
                "CREATE BOOKING REQUEST:",
                request
            );


            const response =
                await post(
                    "/bookings",
                    request
                );


            console.log(
                "BOOKING RESPONSE:",
                response
            );


            if (!response) {

                throw new Error(
                    "Booking was not created."
                );

            }


            /*
             * Store the booking response together
             * with the existing booking information.
             *
             * Payment.jsx can use this information.
             */

            const updatedBookingData = {

                ...bookingData,

                booking: response,

                bookingId:
                    response.id ??
                    response.bookingId ??
                    response.bookingID ??
                    null,

                bookingStatus:
                    response.status ??
                    "PENDING",

                totalAmount:
                    response.totalAmount ??
                    bookingData.totalAmount ??
                    0

            };


            sessionStorage.setItem(
                "bookingData",
                JSON.stringify(
                    updatedBookingData
                )
            );


            /*
             * Continue to payment.
             */

            navigate(
                "/customer/payment"
            );

        } catch (err) {

            console.error(
                "Booking creation failed:",
                err
            );

            setError(
                err.message ||
                "Unable to create your booking."
            );

        } finally {

            setCreatingBooking(false);

        }

    };


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (
            <div className="booking-page">

                <section className="booking-content">

                    <div
                        style={{
                            width: "100%",
                            padding: "70px",
                            textAlign: "center"
                        }}
                    >

                        <h2>
                            Loading your booking...
                        </h2>

                        <p>
                            Please wait while we
                            prepare your booking.
                        </p>

                    </div>

                </section>

            </div>
        );
    }


    // =========================================================
    // ERROR / NO BOOKING DATA
    // =========================================================

    if (error && !bookingData) {

        return (
            <div className="booking-page">

                <section className="booking-header">

                    <div>

                        <p className="page-tag">
                            BOOK YOUR TICKET
                        </p>

                        <h1>
                            Review Your Booking
                        </h1>

                        <p>
                            {error}
                        </p>

                    </div>

                </section>


                <section className="booking-content">

                    <div
                        className="booking-card"
                        style={{
                            width: "100%",
                            textAlign: "center",
                            padding: "60px"
                        }}
                    >

                        <h2>
                            Booking Information Unavailable
                        </h2>

                        <p>
                            Please go back and select
                            your seats again.
                        </p>

                        <Link
                            to="/events"
                            className="confirm-booking-button"
                        >
                            Browse Events
                        </Link>

                    </div>

                </section>

            </div>
        );
    }


    // =========================================================
    // DATA
    // =========================================================

    const selectedSeats =
        bookingData?.selectedSeats || [];

    const eventData =
        bookingData?.event || {};

    const event = {

        name:
            eventData.name ??
            eventData.eventName ??
            eventData.title ??
            "Event",

        stadium:
            eventData.stadiumName ??
            eventData.stadium ??
            "—",

        location:
            eventData.location ??
            eventData.stadiumLocation ??
            "—",

        date:
            eventData.eventDate ??
            eventData.date ??
            "—",

        time:
            eventData.startTime ??
            eventData.time ??
            "—"

    };


    const totalAmount =
        selectedSeats.reduce(
            (total, seat) =>
                total +
                Number(
                    seat.price ||
                    seat.ticketPrice ||
                    seat.seatPrice ||
                    0
                ),
            0
        );


    // =========================================================
    // MAIN UI
    // =========================================================

    return (

        <div className="booking-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <section className="booking-header">

                <div>

                    <p className="page-tag">
                        BOOK YOUR TICKET
                    </p>

                    <h1>
                        Review Your Booking
                    </h1>

                    <p>
                        Check your event and seat details
                        before confirming your booking.
                    </p>

                </div>

            </section>


            {/* =================================================
                CONTENT
            ================================================= */}

            <section className="booking-content">


                {/* =================================================
                    MAIN CONTENT
                ================================================= */}

                <div className="booking-main">


                    {/* =================================================
                        EVENT CARD
                    ================================================= */}

                    <div className="booking-card">

                        <div className="booking-card-title">

                            <div>

                                <p className="page-tag">
                                    EVENT
                                </p>

                                <h2>
                                    {event.name}
                                </h2>

                            </div>


                            <span className="booking-status">
                                READY TO BOOK
                            </span>

                        </div>


                        <div className="event-summary-details">

                            <div>

                                <span>
                                    STADIUM
                                </span>

                                <strong>
                                    {event.stadium}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    DATE
                                </span>

                                <strong>
                                    {formatDate(event.date)}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    TIME
                                </span>

                                <strong>
                                    {formatTime(event.time)}
                                </strong>

                            </div>

                        </div>


                        <div className="event-summary-details">

                            <div>

                                <span>
                                    LOCATION
                                </span>

                                <strong>
                                    {event.location}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    SEATS
                                </span>

                                <strong>
                                    {selectedSeats.length} Seats
                                </strong>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        SELECTED SEATS
                    ================================================= */}

                    <div className="booking-card">

                        <div className="booking-card-title">

                            <div>

                                <p className="page-tag">
                                    YOUR SELECTION
                                </p>

                                <h2>
                                    Selected Seats
                                </h2>

                            </div>


                            <span className="seat-count">

                                {selectedSeats.length} SEATS

                            </span>

                        </div>


                        <div className="booking-seat-list">

                            {selectedSeats.map(
                                (seat, index) => (

                                    <div
                                        className="booking-seat-item"
                                        key={
                                            seat.id ??
                                            seat.eventSeatId ??
                                            index
                                        }
                                    >

                                        <div className="booking-seat-number">

                                            {getSeatName(seat)}

                                        </div>


                                        <div className="booking-seat-info">

                                            <strong>
                                                Seat {getSeatName(seat)}
                                            </strong>

                                            <span>
                                                {seat.type ??
                                                    seat.seatType ??
                                                    "Regular"}{" "}
                                                Seat
                                            </span>

                                        </div>


                                        <strong className="booking-seat-price">

                                            ₹
                                            {Number(
                                                seat.price ??
                                                seat.ticketPrice ??
                                                seat.seatPrice ??
                                                0
                                            ).toLocaleString(
                                                "en-IN"
                                            )}

                                        </strong>

                                    </div>

                                )
                            )}

                        </div>

                    </div>


                    {/* =================================================
                        BOOKING INFORMATION
                    ================================================= */}

                    <div className="booking-card booking-info-card">

                        <p className="page-tag">
                            IMPORTANT
                        </p>

                        <h2>
                            Before You Confirm
                        </h2>

                        <ul>

                            <li>
                                Please verify your event,
                                date and seat selection.
                            </li>

                            <li>
                                Selected seats are currently
                                held for your booking.
                            </li>

                            <li>
                                You will proceed to payment
                                after confirming the booking.
                            </li>

                            <li>
                                Your digital ticket will be
                                generated after successful payment.
                            </li>

                            <li>
                                Your seat hold is valid for
                                10 minutes.
                            </li>

                        </ul>

                    </div>

                </div>


                {/* =================================================
                    SUMMARY
                ================================================= */}

                <aside className="booking-summary-card">

                    <p className="page-tag">
                        BOOKING SUMMARY
                    </p>

                    <h2>
                        Order Summary
                    </h2>


                    <div
                        style={{
                            marginTop: "25px"
                        }}
                    >

                        <div className="summary-row">

                            <span>
                                Event
                            </span>

                            <strong>
                                {event.name}
                            </strong>

                        </div>


                        <div className="summary-row">

                            <span>
                                Seats
                            </span>

                            <strong>
                                {selectedSeats.length}
                            </strong>

                        </div>


                        <div className="summary-row">

                            <span>
                                Seat Charges
                            </span>

                            <strong>
                                ₹
                                {totalAmount.toLocaleString(
                                    "en-IN"
                                )}
                            </strong>

                        </div>

                    </div>


                    <div className="summary-divider"></div>


                    <div className="summary-row">

                        <span>
                            Subtotal
                        </span>

                        <strong>
                            ₹
                            {totalAmount.toLocaleString(
                                "en-IN"
                            )}
                        </strong>

                    </div>


                    <div className="summary-row">

                        <span>
                            Booking Fee
                        </span>

                        <strong>
                            ₹0
                        </strong>

                    </div>


                    <div className="summary-divider"></div>


                    <div className="summary-row">

                        <span>
                            Total Amount
                        </span>

                        <strong
                            style={{
                                fontSize: "22px",
                                color: "#2563eb"
                            }}
                        >
                            ₹
                            {totalAmount.toLocaleString(
                                "en-IN"
                            )}
                        </strong>

                    </div>


                    {/* =================================================
                        ERROR
                    ================================================= */}

                    {error && (

                        <div
                            style={{
                                marginTop: "15px",
                                padding: "12px",
                                borderRadius: "8px",
                                background: "#fee2e2",
                                color: "#b91c1c",
                                fontSize: "14px"
                            }}
                        >
                            {error}
                        </div>

                    )}


                    {/* =================================================
                        CONFIRM BUTTON
                    ================================================= */}

                    <button
                        type="button"
                        className={
                            creatingBooking
                                ? "confirm-booking-button disabled"
                                : "confirm-booking-button"
                        }
                        disabled={creatingBooking}
                        onClick={
                            handleConfirmBooking
                        }
                    >

                        {creatingBooking
                            ? "Creating Booking..."
                            : "Confirm & Continue to Payment"
                        }

                    </button>


                    {/* =================================================
                        CHANGE SEATS
                    ================================================= */}

                    <Link
                        to={`/customer/seats/${bookingData.eventId}`}
                        className="back-seats-button"
                    >
                        ← Change Seats
                    </Link>


                    {/* =================================================
                        HOLD INFORMATION
                    ================================================= */}

                    {bookingData.expiresAt && (

                        <p
                            style={{
                                marginTop: "15px",
                                fontSize: "12px",
                                textAlign: "center",
                                opacity: 0.7
                            }}
                        >
                            Seats held until{" "}
                            {formatDateTime(
                                bookingData.expiresAt
                            )}
                        </p>

                    )}

                </aside>

            </section>

        </div>
    );
}


// =============================================================
// HELPER FUNCTIONS
// =============================================================

function getSeatName(seat) {

    if (typeof seat === "string") {
        return seat;
    }

    return (
        seat?.number ??
        seat?.seatNumber ??
        seat?.seatName ??
        seat?.name ??
        "Seat"
    );
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
            month: "long",
            year: "numeric"
        }
    );
}


function formatTime(time) {

    if (!time) {
        return "—";
    }

    const value =
        String(time);

    const parts =
        value.split(":");

    if (parts.length < 2) {
        return value;
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


function formatDateTime(dateTime) {

    if (!dateTime) {
        return "—";
    }

    const parsedDate =
        new Date(dateTime);

    if (
        Number.isNaN(
            parsedDate.getTime()
        )
    ) {
        return String(dateTime);
    }

    return parsedDate.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


export default Booking;