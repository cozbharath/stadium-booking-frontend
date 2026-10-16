import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../../services/api";

function MyBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadBookings();
    }, []);

    async function loadBookings() {
        try {
            setLoading(true);
            setError("");

            const data = await get("/bookings/my");

            console.log("MY BOOKINGS RESPONSE:", data);

            setBookings(Array.isArray(data) ? data : []);

        } catch (err) {
            console.error(
                "Failed to load bookings:",
                err
            );

            setError(
                err.message ||
                "Failed to load your bookings."
            );

        } finally {
            setLoading(false);
        }
    };

    // =========================
    // STATISTICS
    // =========================

    const confirmedCount = bookings.filter(
        (booking) =>
            booking.status === "CONFIRMED"
    ).length;

    const pendingCount = bookings.filter(
        (booking) =>
            booking.status === "PENDING"
    ).length;

    const totalSpent = bookings
        .filter(
            (booking) =>
                booking.status !== "CANCELLED"
        )
        .reduce(
            (total, booking) =>
                total +
                Number(
                    booking.totalAmount || 0
                ),
            0
        );

    // =========================
    // FORMAT DATE
    // =========================

    const formatDate = (date) => {
        if (!date) {
            return "—";
        }

        const parsedDate = new Date(date);

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
    // FORMAT TIME
    // =========================

    const formatTime = (time) => {
        if (!time) {
            return "—";
        }

        const parts = time.split(":");

        if (parts.length < 2) {
            return time;
        }

        let hour = Number(parts[0]);

        const minute = parts[1];

        const suffix =
            hour >= 12
                ? "PM"
                : "AM";

        hour =
            hour % 12 || 12;

        return `${hour}:${minute} ${suffix}`;
    };

    // =========================
    // DATABASE BOOKING ID
    // =========================

    /*
     * This ID is used for:
     *
     * /customer/bookings/{id}
     *
     * and therefore must be the numeric
     * database booking ID expected by:
     *
     * GET /api/bookings/my/{id}
     */
    const getBookingRouteId = (booking) => {
        if (
            booking.id !== undefined &&
            booking.id !== null
        ) {
            return booking.id;
        }

        if (
            booking.bookingId !== undefined &&
            booking.bookingId !== null
        ) {
            return booking.bookingId;
        }

        if (
            booking.bookingID !== undefined &&
            booking.bookingID !== null
        ) {
            return booking.bookingID;
        }

        return null;
    };

    // =========================
    // DISPLAY BOOKING NUMBER
    // =========================

    const getBookingNumber = (booking) => {
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
    // SEATS
    // =========================

    const getSeats = (booking) => {
        if (
            !booking.seats ||
            booking.seats.length === 0
        ) {
            return "—";
        }

        return booking.seats
            .map((seat) => {

                if (
                    typeof seat === "string"
                ) {
                    return seat;
                }

                return (
                    seat.seatNumber ||
                    seat.seatName ||
                    seat.number ||
                    "Seat"
                );
            })
            .join(", ");
    };

    // =========================
    // SEAT COUNT
    // =========================

    const getSeatCount = (booking) => {
        if (!booking.seats) {
            return 0;
        }

        return booking.seats.length;
    };

    // =========================
    // LOADING
    // =========================

    if (loading) {
        return (
            <div className="my-bookings-page">

                <section className="my-bookings-content">

                    <div className="my-bookings-list">

                        <div
                            style={{
                                padding: "60px",
                                textAlign: "center"
                            }}
                        >

                            <h2>
                                Loading your bookings...
                            </h2>

                            <p>
                                Please wait while we
                                fetch your booking history.
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

    if (error) {
        return (
            <div className="my-bookings-page">

                <section className="my-bookings-header">

                    <div>

                        <p className="page-tag">
                            YOUR BOOKINGS
                        </p>

                        <h1>
                            My Bookings
                        </h1>

                        <p>
                            View and manage all your
                            stadium event bookings
                            in one place.
                        </p>

                    </div>

                    <Link
                        to="/customer/events"
                        className="new-ticket-booking-button"
                    >
                        + Book New Events
                    </Link>

                </section>


                <section className="my-bookings-content">

                    <div className="my-bookings-list">

                        <div
                            style={{
                                padding: "60px",
                                textAlign: "center"
                            }}
                        >

                            <h2>
                                Unable to load bookings
                            </h2>

                            <p>
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={loadBookings}
                                className="primary-btn"
                            >
                                Try Again
                            </button>

                        </div>

                    </div>

                </section>

            </div>
        );
    }

    return (
        <div className="my-bookings-page">

            {/* ================= HEADER ================= */}

            <section className="my-bookings-header">

                <div>

                    <p className="page-tag">
                        YOUR BOOKINGS
                    </p>

                    <h1>
                        My Bookings
                    </h1>

                    <p>
                        View and manage all your
                        stadium event bookings
                        in one place.
                    </p>

                </div>


                <Link
                    to="/customer/events"
                    className="new-booking-button"
                >
                    + Book New Event
                </Link>

            </section>


            {/* ================= CONTENT ================= */}

            <section className="my-bookings-content">

                {/* ================= SUMMARY ================= */}

                <div className="booking-stat-grid">

                    <div className="booking-stat-card">

                        <span className="booking-stat-icon">
                            🎟️
                        </span>

                        <div>

                            <span>
                                Total Bookings
                            </span>

                            <strong>
                                {bookings.length}
                            </strong>

                        </div>

                    </div>


                    <div className="booking-stat-card">

                        <span className="booking-stat-icon">
                            ✓
                        </span>

                        <div>

                            <span>
                                Confirmed
                            </span>

                            <strong>
                                {confirmedCount}
                            </strong>

                        </div>

                    </div>


                    <div className="booking-stat-card">

                        <span className="booking-stat-icon">
                            ⏳
                        </span>

                        <div>

                            <span>
                                Pending
                            </span>

                            <strong>
                                {pendingCount}
                            </strong>

                        </div>

                    </div>


                    <div className="booking-stat-card">

                        <span className="booking-stat-icon">
                            💰
                        </span>

                        <div>

                            <span>
                                Total Spent
                            </span>

                            <strong>
                                ₹
                                {totalSpent.toLocaleString(
                                    "en-IN"
                                )}
                            </strong>

                        </div>

                    </div>

                </div>


                {/* ================= BOOKING LIST ================= */}

                <div className="my-bookings-list">

                    <div className="my-bookings-list-header">

                        <div>

                            <p className="page-tag">
                                BOOKING HISTORY
                            </p>

                            <h2>
                                Your Bookings
                            </h2>

                        </div>

                        <span>
                            {bookings.length}{" "}
                            {bookings.length === 1
                                ? "Booking"
                                : "Bookings"}
                        </span>

                    </div>


                    {/* ================= EMPTY ================= */}

                    {bookings.length === 0 ? (

                        <div className="empty-bookings">

                            <div className="empty-bookings-icon">
                                🎟️
                            </div>

                            <h3>
                                No Bookings Yet
                            </h3>

                            <p>
                                You haven't booked any
                                events yet. Explore
                                upcoming events and
                                book your first stadium
                                experience.
                            </p>

                            <Link
                                to="/customer/events"
                                className="primary-btn"
                            >
                                Explore Events
                            </Link>

                        </div>

                    ) : (

                        /* ================= BOOKINGS ================= */

                        <div className="booking-list">

                            {bookings.map(
                                (booking, index) => {

                                    const routeId =
                                        getBookingRouteId(
                                            booking
                                        );

                                    return (
                                        <div
                                            className="my-booking-card"
                                            key={
                                                routeId ||
                                                index
                                            }
                                        >

                                            {/* ================= TOP ================= */}

                                            <div className="my-booking-top">

                                                <div>

                                                    <span className="booking-id">
                                                        {getBookingNumber(
                                                            booking
                                                        )}
                                                    </span>

                                                    <h3>
                                                        {booking.eventName ||
                                                            booking.event ||
                                                            "Event"}
                                                    </h3>

                                                </div>


                                                <span
                                                    className={`booking-status-pill ${
                                                        (
                                                            booking.status ||
                                                            ""
                                                        ).toLowerCase()
                                                    }`}
                                                >
                                                    {booking.status ||
                                                        "UNKNOWN"}
                                                </span>

                                            </div>


                                            {/* ================= DETAILS ================= */}

                                            <div className="my-booking-details">

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


                                                <div>

                                                    <span>
                                                        SEATS
                                                    </span>

                                                    <strong>
                                                        {getSeats(
                                                            booking
                                                        )}
                                                    </strong>

                                                </div>


                                                <div>

                                                    <span>
                                                        AMOUNT
                                                    </span>

                                                    <strong>
                                                        ₹
                                                        {Number(
                                                            booking.totalAmount ||
                                                            0
                                                        ).toLocaleString(
                                                            "en-IN"
                                                        )}
                                                    </strong>

                                                </div>

                                            </div>


                                            {/* ================= BOTTOM ================= */}

                                            <div className="my-booking-bottom">

                                                <span>

                                                    {getSeatCount(
                                                        booking
                                                    )}{" "}

                                                    Seat
                                                    {getSeatCount(
                                                        booking
                                                    ) > 1
                                                        ? "s"
                                                        : ""}

                                                    {" "}•

                                                    {" "}₹
                                                    {Number(
                                                        booking.totalAmount ||
                                                        0
                                                    ).toLocaleString(
                                                        "en-IN"
                                                    )}

                                                </span>


                                                {routeId !==
                                                null ? (

                                                    <Link
                                                        to={`/customer/bookings/${routeId}`}
                                                        className="view-booking-button"
                                                    >
                                                        View Details →
                                                    </Link>

                                                ) : (

                                                    <span
                                                        className="view-booking-button"
                                                        style={{
                                                            opacity: 0.5,
                                                            cursor: "not-allowed"
                                                        }}
                                                    >
                                                        Booking ID
                                                        Unavailable
                                                    </span>

                                                )}

                                            </div>

                                        </div>
                                    );
                                }
                            )}

                        </div>

                    )}

                </div>

            </section>

        </div>
    );
}

export default MyBookings;