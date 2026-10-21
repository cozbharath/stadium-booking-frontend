import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../../services/api";
import { QRCodeSVG } from "qrcode.react";
import Barcode from "react-barcode";

/*
 * REQUIRES:
 *   npm install qrcode.react react-barcode
 */

function MyTickets() {

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    function getBookingId(booking) {

        if (booking?.id !== undefined && booking?.id !== null) {
            return booking.id;
        }

        if (booking?.bookingId !== undefined && booking?.bookingId !== null) {
            return booking.bookingId;
        }

        if (booking?.bookingID !== undefined && booking?.bookingID !== null) {
            return booking.bookingID;
        }

        return null;
    };

    function normalizeTicket(ticket, booking) {

        if (!ticket) {
            return null;
        }

        const bookingDatabaseId =
            booking?.id ??
            booking?.bookingId ??
            booking?.bookingID ??
            ticket?.bookingId ??
            ticket?.bookingID ??
            null;

        return {

            id:
                ticket.id ??
                ticket.ticketId ??
                ticket.ticketID ??
                ticket.ticketNumber,

            ticketNumber:
                ticket.ticketNumber ??
                ticket.number ??
                "—",

            bookingId:
                ticket.bookingId ??
                ticket.bookingID ??
                booking?.bookingId ??
                booking?.bookingID ??
                booking?.id ??
                "—",

            bookingDatabaseId,

            event:
                ticket.eventName ??
                ticket.event ??
                booking?.eventName ??
                booking?.event ??
                "Event",

            category:
                ticket.category ??
                booking?.category ??
                "EVENT",

            stadium:
                ticket.stadiumName ??
                ticket.stadium ??
                booking?.stadiumName ??
                booking?.stadium ??
                "—",

            location:
                ticket.location ??
                ticket.stadiumLocation ??
                booking?.location ??
                booking?.stadiumLocation ??
                "—",

            date:
                ticket.eventDate ??
                ticket.date ??
                booking?.eventDate ??
                null,

            time:
                ticket.startTime ??
                ticket.time ??
                booking?.startTime ??
                null,

            seats:
                Array.isArray(ticket.seats)
                    ? ticket.seats
                    : Array.isArray(booking?.seats)
                        ? booking.seats
                        : [],

            amount:
                ticket.amount ??
                ticket.totalAmount ??
                booking?.totalAmount ??
                0,

            status:
                ticket.status ??
                ticket.ticketStatus ??
                "ACTIVE",

            qrCode:
                ticket.qrCode ??
                ticket.qrCodeData ??
                ticket.qrCodeUrl ??
                null
        };
    };

    const loadTickets = async () => {

        try {
            setLoading(true);
            setError("");

            const bookingsData = await get("/bookings/my");

            const bookings = Array.isArray(bookingsData) ? bookingsData : [];

            const confirmedBookings = bookings.filter(
                (booking) =>
                    String(booking.status || "").toUpperCase() === "CONFIRMED"
            );

            const ticketRequests = confirmedBookings.map(async (booking) => {

                const bookingId = getBookingId(booking);

                if (bookingId === null || bookingId === undefined) {
                    return null;
                }

                try {
                    const ticketData = await get(`/tickets/booking/${bookingId}`);

                    if (Array.isArray(ticketData)) {
                        return ticketData.map((ticket) =>
                            normalizeTicket(ticket, booking)
                        );
                    }

                    return normalizeTicket(ticketData, booking);

                } catch (ticketError) {
                    console.log(
                        `No ticket found for booking ${bookingId}:`,
                        ticketError.message
                    );
                    return null;
                }
            });

            const results = await Promise.all(ticketRequests);

            const loadedTickets = results
                .flat()
                .filter((ticket) => ticket !== null);

            setTickets(loadedTickets);

        } catch (err) {
            console.error("Failed to load tickets:", err);

            setError(err.message || "Failed to load your tickets.");

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        queueMicrotask(() => {
            loadTickets();
        });
    }, []);

    const formatDate = (date) => {
        if (!date) {
            return "—";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return date;
        }

        return parsedDate.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const formatTime = (time) => {
        if (!time) {
            return "—";
        }

        const parts = String(time).split(":");

        if (parts.length < 2) {
            return time;
        }

        let hour = Number(parts[0]);
        const minute = parts[1];
        const suffix = hour >= 12 ? "PM" : "AM";

        hour = hour % 12 || 12;

        return `${hour}:${minute} ${suffix}`;
    };

    const getSeatName = (seat) => {
        if (typeof seat === "string") {
            return seat;
        }

        return (
            seat?.seatNumber ||
            seat?.seatName ||
            seat?.number ||
            seat?.name ||
            "Seat"
        );
    };

    const getSeatCount = (ticket) => {
        if (!Array.isArray(ticket?.seats)) {
            return 0;
        }

        return ticket.seats.length;
    };

    /*
     * Many event names come through as "Team A vs Team B".
     * Split that for the hero banner; if it doesn't match,
     * just show the whole thing as a single title.
     */
    const splitTeams = (eventName) => {
        const match = String(eventName || "").split(/\s+vs\.?\s+/i);

        if (match.length === 2) {
            return { teamA: match[0].trim(), teamB: match[1].trim() };
        }

        return null;
    };

    if (loading) {
        return (
            <div className="mt-page">
                <div className="mt-centered-message">
                    <h2>Loading your tickets...</h2>
                    <p>Please wait while we fetch your digital tickets.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-page">
                <section className="mt-header">
                    <div>
                        <p className="mt-page-tag">YOUR DIGITAL TICKETS</p>
                        <h1 className="mt-page-title">My Tickets</h1>
                        <p className="mt-page-sub">
                            Your confirmed event tickets are available here.
                        </p>
                    </div>

                    <Link to="/customer/events" className="mt-header-button">
                        + Book Another Event
                    </Link>
                </section>

                <div className="mt-centered-message">
                    <h2>Unable to load tickets</h2>
                    <p>{error}</p>
                    <button type="button" onClick={loadTickets} className="mt-primary-button">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-page">

            <section className="no-print mt-header">
                <div>
                    <p className="mt-page-tag">YOUR DIGITAL TICKETS</p>
                    <h1 className="mt-page-title">My Tickets</h1>
                    <p className="mt-page-sub">
                        Your confirmed event tickets are available here.
                        Show the QR code at the stadium entrance.
                    </p>
                </div>

                <Link to="/customer/events" className="mt-header-button">
                    + Book Another Event
                </Link>
            </section>

            {tickets.length === 0 ? (
                <div className="mt-empty">
                    <div className="mt-empty-icon">🎟️</div>
                    <h2>No Tickets Available</h2>
                    <p>
                        Your confirmed tickets will appear here after
                        successful payment.
                    </p>
                    <Link to="/customer/events" className="mt-primary-button">
                        Explore Events
                    </Link>
                </div>
            ) : (
                <div className="mt-ticket-list">
                    {tickets.map((ticket, index) => (
                        <TicketCard
                            key={ticket.id || ticket.ticketNumber || index}
                            ticket={ticket}
                            teams={splitTeams(ticket.event)}
                            formatDate={formatDate}
                            formatTime={formatTime}
                            getSeatName={getSeatName}
                            getSeatCount={getSeatCount}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function TicketCard({
    ticket,
    teams,
    formatDate,
    formatTime,
    getSeatName,
    getSeatCount
}) {
    const qrValue =
        ticket.qrCode ||
        JSON.stringify({
            bookingId: ticket.bookingId,
            ticketNumber: ticket.ticketNumber
        });

    return (
        <div className="mt-ticket-card">
            {/* ===== MAIN TICKET ===== */}
            <div className="mt-main-section">
                <div className="mt-hero">
                    <div className="mt-hero-overlay"></div>

                    <div
                        className={`mt-status ${
                            String(ticket.status || "").toUpperCase() === "ACTIVE" ? "is-active" : "is-inactive"
                        }`}
                    >
                        ✓ {ticket.status}
                    </div>

                    {teams ? (
                        <div className="mt-matchup">
                            <div className="mt-team">
                                <div className="mt-team-logo">🏏</div>
                                <div className="mt-team-name">{teams.teamA}</div>
                            </div>

                            <div className="mt-vs">VS</div>

                            <div className="mt-team">
                                <div className="mt-team-logo">🏏</div>
                                <div className="mt-team-name">{teams.teamB}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-single-event-title">{ticket.event}</div>
                    )}

                    <div className="mt-category-tag">{ticket.category}</div>
                </div>

                <div className="mt-info-row">
                    <InfoItem icon="🏟️" main={ticket.stadium} sub={ticket.location} />
                    <InfoItem
                        icon="📅"
                        main={formatDate(ticket.date)}
                        sub={formatTime(ticket.time)}
                    />
                </div>

                <div className="mt-details-grid">
                    <DetailBox label="TICKET NUMBER" value={ticket.ticketNumber} />
                    <DetailBox label="BOOKING ID" value={ticket.bookingId} />
                    <DetailBox
                        label="SEATS"
                        value={
                            ticket.seats.length > 0
                                ? ticket.seats.map((seat) => getSeatName(seat)).join(", ")
                                : "—"
                        }
                    />
                    <DetailBox
                        label="AMOUNT PAID"
                        value={`₹${Number(ticket.amount || 0).toLocaleString("en-IN")}`}
                    />
                </div>

                <div className="mt-seats-section">
                    <div className="mt-seats-section-header">
                        <span>YOUR SEATS</span>
                        <strong>
                            {getSeatCount(ticket)}{" "}
                            {getSeatCount(ticket) === 1 ? "Seat" : "Seats"}
                        </strong>
                    </div>

                    <div className="mt-seat-list">
                        {ticket.seats.length > 0 ? (
                            ticket.seats.map((seat, seatIndex) => (
                                <div
                                    key={`${getSeatName(seat)}-${seatIndex}`}
                                    className="mt-seat-chip"
                                >
                                    <span>{getSeatName(seat)}</span>
                                    <small>Confirmed</small>
                                </div>
                            ))
                        ) : (
                            <div className="mt-seat-chip">
                                <span>No seat information</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="no-print mt-actions">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="mt-print-button"
                    >
                        🖨 Print Ticket
                    </button>

                    {ticket.bookingDatabaseId !== null &&
                    ticket.bookingDatabaseId !== undefined ? (
                        <Link
                            to={`/customer/bookings/${ticket.bookingDatabaseId}`}
                            className="mt-view-booking-button"
                        >
                            View Booking
                        </Link>
                    ) : (
                        <span className="mt-view-booking-button is-disabled">
                            Booking Unavailable
                        </span>
                    )}
                </div>
            </div>

            {/* ===== PERFORATION ===== */}
            <div className="mt-perforation">
                <span className="mt-perforation-dot is-top"></span>
                <span className="mt-perforation-dot is-bottom"></span>
            </div>

            {/* ===== STUB ===== */}
            <div className="mt-ticket-stub">
                <div className="mt-stub-label">SCAN TO ENTER</div>

                <div className="mt-qr-wrapper">
                    <QRCodeSVG value={qrValue} size={140} level="M" />
                </div>

                <strong className="mt-stub-ticket-number">{ticket.ticketNumber}</strong>

                <p className="mt-stub-help-text">
                    Present this QR code at the stadium entrance for
                    verification.
                </p>

                <div className="mt-barcode-wrapper">
                    <Barcode
                        value={String(ticket.ticketNumber || ticket.id || "0")}
                        format="CODE128"
                        width={1.2}
                        height={40}
                        fontSize={10}
                        margin={0}
                        background="transparent"
                        lineColor="#111827"
                    />
                </div>

                <div className="mt-security-tag">🔒 Secure Digital Ticket</div>
            </div>
        </div>
    );
}

function InfoItem({ icon, main, sub }) {
    return (
        <div className="mt-info-item">
            <span className="mt-info-icon">{icon}</span>
            <div>
                <strong className="mt-info-main">{main}</strong>
                {sub && <div className="mt-info-sub">{sub}</div>}
            </div>
        </div>
    );
}

function DetailBox({ label, value }) {
    return (
        <div className="mt-detail-box">
            <div className="mt-detail-label">{label}</div>
            <strong className="mt-detail-value">{value}</strong>
        </div>
    );
}

export default MyTickets;