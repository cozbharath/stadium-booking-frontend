import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { get } from "../../services/api";

function BookingDetails() {
    const { bookingId } = useParams();

    const [booking, setBooking] = useState(null);
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadBookingDetails();
    }, [bookingId]);

    // =========================
    // LOAD BOOKING
    // =========================

    async function loadBookingDetails() {

        try {

            setLoading(true);
            setError("");

            // Prevent /undefined request
            if (
                !bookingId ||
                bookingId === "undefined" ||
                bookingId === "null"
            ) {
                setError(
                    "Invalid booking ID."
                );

                return;
            }

            console.log(
                "Loading booking:",
                bookingId
            );

            // =========================
            // BOOKING
            // =========================

            const bookingData = await get(
                `/bookings/my/${bookingId}`
            );

            console.log(
                "BOOKING RESPONSE:",
                bookingData
            );

            setBooking(bookingData);


            // =========================
            // PAYMENT
            // =========================

            /*
             * Payment is optional.
             *
             * A booking should still display even
             * when payment information is unavailable.
             */

            try {

                const paymentData =
                    await get(
                        `/payments/booking/${bookingId}`
                    );

                console.log(
                    "PAYMENT RESPONSE:",
                    paymentData
                );

                /*
                 * Some APIs may return a single payment
                 * object while others may return an array.
                 *
                 * Handle both.
                 */

                if (
                    Array.isArray(paymentData)
                ) {

                    setPayment(
                        paymentData.length > 0
                            ? paymentData[
                                  paymentData.length - 1
                              ]
                            : null
                    );

                } else {

                    setPayment(
                        paymentData
                    );

                }

            } catch (paymentError) {

                console.log(
                    "Payment information unavailable:",
                    paymentError.message
                );

                setPayment(null);
            }

        } catch (err) {

            console.error(
                "FAILED TO LOAD BOOKING:",
                err
            );

            setError(
                err.message ||
                "Failed to load booking details."
            );

        } finally {

            setLoading(false);

        }
    };


    // =========================
    // DATE FORMAT
    // =========================

    const formatDate = (date) => {

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
            return date;
        }

        return parsedDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );
    };


    // =========================
    // TIME FORMAT
    // =========================

    const formatTime = (time) => {

        if (!time) {
            return "—";
        }

        const parts =
            String(time).split(":");

        if (parts.length < 2) {
            return time;
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
    };


    // =========================
    // BOOKING NUMBER
    // =========================

    const getBookingNumber = () => {

        if (booking.bookingNumber) {
            return booking.bookingNumber;
        }

        if (booking.bookingId) {
            return booking.bookingId;
        }

        if (booking.id) {
            return `BK${String(
                booking.id
            ).padStart(8, "0")}`;
        }

        return "—";
    };


    // =========================
    // SEAT NUMBER
    // =========================

    const getSeatNumber = (seat) => {

        if (
            typeof seat === "string"
        ) {
            return seat;
        }

        return (
            seat?.seatNumber ||
            seat?.seatName ||
            seat?.number ||
            "Seat"
        );
    };


    // =========================
    // SEAT TYPE
    // =========================

    const getSeatType = (seat) => {

        if (
            typeof seat === "string"
        ) {
            return "Regular";
        }

        return (
            seat?.type ||
            seat?.standType ||
            seat?.seatType ||
            "Regular"
        );
    };


    // =========================
    // SEAT PRICE
    // =========================

    const getSeatPrice = (seat) => {

        if (
            typeof seat === "string"
        ) {
            return null;
        }

        return (
            seat?.price ??
            seat?.amount ??
            null
        );
    };


    // =========================
    // LOADING
    // =========================

    if (loading) {

        return (
            <div className="booking-details-page">

                <section className="booking-details-content">

                    <div className="booking-details-main">

                        <div
                            className="booking-details-card"
                            style={{
                                padding: "60px",
                                textAlign: "center"
                            }}
                        >

                            <h2>
                                Loading booking details...
                            </h2>

                            <p>
                                Please wait while we
                                fetch your booking
                                information.
                            </p>

                        </div>

                    </div>

                </section>

            </div>
        );
    }


    // =========================
    // ERROR
    // =========================

    if (
        error ||
        !booking
    ) {

        return (
            <div className="booking-details-page">

                <section className="booking-details-header">

                    <div>

                        <p className="page-tag">
                            BOOKING DETAILS
                        </p>

                        <h1>
                            Booking Not Found
                        </h1>

                        <p>
                            We couldn't load the
                            requested booking details.
                        </p>

                    </div>

                </section>


                <section className="booking-details-content">

                    <div className="booking-details-main">

                        <div
                            className="booking-details-card"
                            style={{
                                padding: "50px",
                                textAlign: "center"
                            }}
                        >

                            <h2>
                                Unable to load booking
                            </h2>

                            <p>
                                {error ||
                                    "The booking could not be found."}
                            </p>

                            <div
                                style={{
                                    marginTop: "20px"
                                }}
                            >

                                <button
                                    type="button"
                                    onClick={
                                        loadBookingDetails
                                    }
                                    className="view-ticket-button"
                                >
                                    Try Again
                                </button>

                            </div>

                        </div>

                    </div>

                </section>

            </div>
        );
    }


    // =========================
    // BOOKING VALUES
    // =========================

    const seats =
        Array.isArray(
            booking.seats
        )
            ? booking.seats
            : [];


    const bookingStatus =
        booking.status ||
        booking.bookingStatus ||
        "UNKNOWN";


    const paymentStatus =
        payment?.status ||
        payment?.paymentStatus ||
        "NOT PAID";


    const paymentMethod =
        payment?.paymentMethod ||
        payment?.method ||
        "—";


    const transactionId =
        payment?.transactionId ||
        payment?.transactionNumber ||
        "—";


    const seatCharges =
        Number(
            booking.totalAmount ||
            booking.amount ||
            0
        );


    const bookingFee =
        Number(
            booking.bookingFee ||
            0
        );


    const total =
        Number(
            booking.totalAmount ||
            booking.total ||
            seatCharges
        );


    return (
        <div className="booking-details-page">

            {/* ================= HEADER ================= */}

            <section className="booking-details-header">

                <div>

                    <p className="page-tag">
                        BOOKING DETAILS
                    </p>

                    <h1>
                        Booking #{getBookingNumber()}
                    </h1>

                    <p>
                        View complete information
                        about your booking, payment
                        and selected seats.
                    </p>

                </div>


                <span className="booking-details-status">
                    ✓ {bookingStatus}
                </span>

            </section>


            {/* ================= CONTENT ================= */}

            <section className="booking-details-content">

                <div className="booking-details-main">

                    {/* ================= EVENT ================= */}

                    <div className="booking-details-card">

                        <div className="booking-details-card-header">

                            <div>

                                <p className="page-tag">
                                    EVENT
                                </p>

                                <h2>
                                    {booking.eventName ||
                                        booking.event ||
                                        "Event"}
                                </h2>

                            </div>


                            <span className="event-category-badge">
                                {booking.category ||
                                    "EVENT"}
                            </span>

                        </div>


                        <div className="booking-event-info-grid">

                            <div>

                                <span>
                                    STADIUM
                                </span>

                                <strong>
                                    {booking.stadiumName ||
                                        booking.stadium ||
                                        "—"}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    LOCATION
                                </span>

                                <strong>
                                    {booking.location ||
                                        booking.stadiumLocation ||
                                        "—"}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    DATE
                                </span>

                                <strong>
                                    {formatDate(
                                        booking.eventDate
                                    )}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    TIME
                                </span>

                                <strong>
                                    {formatTime(
                                        booking.startTime
                                    )}
                                </strong>

                            </div>

                        </div>

                    </div>


                    {/* ================= STATUS ================= */}

                    <div className="booking-details-card">

                        <div className="booking-details-card-header">

                            <div>

                                <p className="page-tag">
                                    BOOKING STATUS
                                </p>

                                <h2>
                                    Booking Progress
                                </h2>

                            </div>

                        </div>


                        <div className="booking-timeline">

                            {/* CREATED */}

                            <div className="timeline-item completed">

                                <div className="timeline-icon">
                                    ✓
                                </div>

                                <div className="timeline-content">

                                    <strong>
                                        Booking Created
                                    </strong>

                                    <span>
                                        Your booking was
                                        created successfully.
                                    </span>

                                </div>

                            </div>


                            <div className="timeline-line completed-line">
                            </div>


                            {/* PAYMENT */}

                            <div
                                className={`timeline-item ${
                                    paymentStatus ===
                                    "SUCCESS"
                                        ? "completed"
                                        : ""
                                }`}
                            >

                                <div className="timeline-icon">

                                    {paymentStatus ===
                                    "SUCCESS"
                                        ? "✓"
                                        : "2"}

                                </div>


                                <div className="timeline-content">

                                    <strong>
                                        Payment Completed
                                    </strong>

                                    <span>

                                        {paymentStatus ===
                                        "SUCCESS"
                                            ? "Payment was successfully received."
                                            : "Payment is pending."}

                                    </span>

                                </div>

                            </div>


                            <div
                                className={`timeline-line ${
                                    paymentStatus ===
                                    "SUCCESS"
                                        ? "completed-line"
                                        : ""
                                }`}
                            >
                            </div>


                            {/* CONFIRMED */}

                            <div
                                className={`timeline-item ${
                                    bookingStatus ===
                                    "CONFIRMED"
                                        ? "completed"
                                        : ""
                                }`}
                            >

                                <div className="timeline-icon">

                                    {bookingStatus ===
                                    "CONFIRMED"
                                        ? "✓"
                                        : "3"}

                                </div>


                                <div className="timeline-content">

                                    <strong>
                                        Booking Confirmed
                                    </strong>

                                    <span>

                                        {bookingStatus ===
                                        "CONFIRMED"
                                            ? "Your seats are confirmed."
                                            : "Your booking is not confirmed yet."}

                                    </span>

                                </div>

                            </div>


                            <div className="timeline-line">
                            </div>


                            {/* EVENT DAY */}

                            <div className="timeline-item">

                                <div className="timeline-icon">
                                    4
                                </div>

                                <div className="timeline-content">

                                    <strong>
                                        Event Day
                                    </strong>

                                    <span>
                                        Show your QR ticket
                                        at the entrance.
                                    </span>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* ================= SEATS ================= */}

                    <div className="booking-details-card">

                        <div className="booking-details-card-header">

                            <div>

                                <p className="page-tag">
                                    SEAT DETAILS
                                </p>

                                <h2>
                                    Your Seats
                                </h2>

                            </div>


                            <span className="seat-count-badge">

                                {seats.length}{" "}

                                {seats.length === 1
                                    ? "Seat"
                                    : "Seats"}

                            </span>

                        </div>


                        <div className="details-seat-list">

                            {seats.length === 0 ? (

                                <div
                                    style={{
                                        padding: "20px",
                                        textAlign: "center"
                                    }}
                                >
                                    No seat information
                                    available.
                                </div>

                            ) : (

                                seats.map(
                                    (seat, index) => {

                                        const seatNumber =
                                            getSeatNumber(
                                                seat
                                            );

                                        const seatType =
                                            getSeatType(
                                                seat
                                            );

                                        const seatPrice =
                                            getSeatPrice(
                                                seat
                                            );

                                        return (

                                            <div
                                                className="details-seat-item"
                                                key={`${seatNumber}-${index}`}
                                            >

                                                <div className="details-seat-number">
                                                    {seatNumber}
                                                </div>


                                                <div className="details-seat-info">

                                                    <strong>
                                                        Seat{" "}
                                                        {seatNumber}
                                                    </strong>

                                                    <span>
                                                        {seatType}
                                                        {" "}
                                                        Seat
                                                    </span>

                                                </div>


                                                <strong className="details-seat-price">

                                                    {seatPrice !==
                                                    null
                                                        ? `₹${Number(
                                                              seatPrice
                                                          ).toLocaleString(
                                                              "en-IN"
                                                          )}`
                                                        : "—"}

                                                </strong>

                                            </div>

                                        );
                                    }
                                )

                            )}

                        </div>

                    </div>


                    {/* ================= PAYMENT ================= */}

                    <div className="booking-details-card">

                        <div className="booking-details-card-header">

                            <div>

                                <p className="page-tag">
                                    PAYMENT
                                </p>

                                <h2>
                                    Payment Information
                                </h2>

                            </div>


                            <span className="payment-success-badge">

                                {paymentStatus ===
                                "SUCCESS"
                                    ? "✓ PAID"
                                    : paymentStatus}

                            </span>

                        </div>


                        <div className="payment-details-grid">

                            <div>

                                <span>
                                    PAYMENT STATUS
                                </span>

                                <strong>
                                    {paymentStatus}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    PAYMENT METHOD
                                </span>

                                <strong>
                                    {paymentMethod}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    TRANSACTION ID
                                </span>

                                <strong>
                                    {transactionId}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    BOOKED ON
                                </span>

                                <strong>

                                    {booking.createdAt
                                        ? new Date(
                                              booking.createdAt
                                          ).toLocaleString(
                                              "en-IN"
                                          )
                                        : "—"}

                                </strong>

                            </div>

                        </div>

                    </div>

                </div>


                {/* ================= RIGHT SUMMARY ================= */}

                <aside className="booking-details-summary">

                    <p className="page-tag">
                        ORDER SUMMARY
                    </p>

                    <h2>
                        Booking Summary
                    </h2>


                    <div className="details-summary-event">

                        <strong>
                            {booking.eventName ||
                                booking.event ||
                                "Event"}
                        </strong>

                        <span>
                            {formatDate(
                                booking.eventDate
                            )}
                        </span>

                        <span>
                            {formatTime(
                                booking.startTime
                            )}
                        </span>

                    </div>


                    <div className="details-summary-rows">

                        <div>

                            <span>
                                Seats
                            </span>

                            <strong>
                                {seats.length}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Seat Charges
                            </span>

                            <strong>
                                ₹
                                {seatCharges.toLocaleString(
                                    "en-IN"
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Booking Fee
                            </span>

                            <strong>
                                ₹
                                {bookingFee.toLocaleString(
                                    "en-IN"
                                )}
                            </strong>

                        </div>

                    </div>


                    <div className="summary-divider">
                    </div>


                    <div className="details-total-row">

                        <span>
                            Total Paid
                        </span>

                        <strong>
                            ₹
                            {total.toLocaleString(
                                "en-IN"
                            )}
                        </strong>

                    </div>


                    {/* ================= ACTIONS ================= */}

                    <div className="booking-details-actions">

                        <Link
                            to="/customer/tickets"
                            className="view-ticket-button"
                        >
                            🎟️ View My Ticket
                        </Link>


                        <Link
                            to="/customer/bookings"
                            className="back-bookings-button"
                        >
                            ← Back to My Bookings
                        </Link>

                    </div>


                    {/* ================= HELP ================= */}

                    <div className="booking-help-box">

                        <strong>
                            Need Help?
                        </strong>

                        <p>
                            If you have any issue with
                            your booking, please contact
                            the support team.
                        </p>

                    </div>

                </aside>

            </section>

        </div>
    );
}

export default BookingDetails;