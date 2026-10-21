import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import Barcode from "react-barcode";

/*
 * ============================================================
 * TICKET PAGE — shown right after a successful payment.
 *
 * Expects two things in sessionStorage (same place SeatSelection
 * already writes "bookingData" to before going to /customer/booking):
 *
 *   bookingData  -> { eventId, event, selectedSeats, totalAmount, ... }
 *   paymentData  -> { bookingId, paymentId, status, paidAt, ... }
 *
 * If your payment-success handler gets a response back from the
 * backend (booking confirmation, payment id, etc.), just do:
 *
 *   sessionStorage.setItem("paymentData", JSON.stringify(response));
 *   navigate("/customer/ticket");
 *
 * before navigating here — this page will pick both up automatically.
 * You can also pass the same shape in via route state instead of
 * sessionStorage if you prefer.
 *
 * REQUIRES:
 *   npm install qrcode.react react-barcode
 * ============================================================
 */

function Ticket() {
    const navigate = useNavigate();

    const [bookingData, setBookingData] = useState(null);
    const [paymentData, setPaymentData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        try {
            const rawBooking = sessionStorage.getItem("bookingData");
            const rawPayment = sessionStorage.getItem("paymentData");

            if (!rawBooking) {
                setError("No booking found. Please book your seats again.");
                return;
            }

            setBookingData(JSON.parse(rawBooking));
            setPaymentData(rawPayment ? JSON.parse(rawPayment) : {});
        } catch (err) {
            console.error("Failed to load ticket data:", err);
            setError("Something went wrong while loading your ticket.");
        }
    }, []);

    const event = bookingData?.event || {};

    const eventName =
        event?.name || event?.eventName || event?.title || "Event";

    const venueName =
        event?.venueName ||
        event?.venue?.name ||
        event?.stadiumName ||
        "Venue";

    const venueAddress =
        event?.venueAddress ||
        event?.venue?.address ||
        event?.address ||
        "";

    const eventDate =
        event?.date || event?.eventDate || event?.startDate || null;

    const eventTime =
        event?.time || event?.eventTime || event?.startTime || "";

    const formattedDate = useMemo(() => {
        if (!eventDate) {
            return "";
        }

        try {
            return new Date(eventDate).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric"
            });
        } catch {
            return String(eventDate);
        }
    }, [eventDate]);

    const bookingId =
        paymentData?.bookingId ||
        paymentData?.id ||
        bookingData?.holdToken ||
        "—";

    const seats = bookingData?.selectedSeats || [];

    const tickets = useMemo(() => {
        if (!seats.length) {
            return [];
        }

        return seats.map((seat, index) => {
            const seatLabel = seat.number ?? seat.id ?? index + 1;

            const ticketId =
                paymentData?.ticketIds?.[index] ||
                `TCKT${String(bookingId).replace(/\D/g, "").slice(-6) || index}${seat.id ?? index}`;

            return {
                ticketId,
                seat,
                gate: seat.gate || event?.gate || "3 (East Gate)",
                standName: seat.standName || "General Stand",
                block: seat.block || seat.standBlock || "—",
                row: seat.row ?? "—",
                seatNumber: seatLabel,
                category: seat.category || seat.ticketCategory || "General",
                price: Number(seat.price || 0)
            };
        });
    }, [seats, paymentData, bookingId, event]);

    const handlePrint = () => {
        window.print();
    };

    const handleGoHome = () => {
        navigate("/customer/events");
    };

    if (error) {
        return (
            <div className="tk-page">
                <div className="tk-error-box">
                    <h2>Unable to Show Ticket</h2>
                    <p>{error}</p>
                    <button
                        type="button"
                        onClick={handleGoHome}
                        className="tk-primary-button"
                    >
                        Browse Events
                    </button>
                </div>
            </div>
        );
    }

    if (!bookingData || !tickets.length) {
        return (
            <div className="tk-page">
                <div className="tk-error-box">
                    <h2>Loading your ticket...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="tk-page">

            <div className="no-print tk-top-bar">
                <div>
                    <div className="tk-success-badge">✓ Payment Successful</div>
                    <h1 className="tk-top-title">Your ticket is ready</h1>
                    <p className="tk-top-subtitle">
                        {tickets.length > 1
                            ? `${tickets.length} tickets booked for ${eventName}`
                            : `Booked for ${eventName}`}
                    </p>
                </div>

                <div className="tk-top-actions">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="tk-print-button"
                    >
                        🖨️ Print Ticket
                    </button>

                    <button
                        type="button"
                        onClick={handleGoHome}
                        className="tk-secondary-button"
                    >
                        Done
                    </button>
                </div>
            </div>

            <div className="ticket-print-area tk-ticket-list">
                {tickets.map((ticket) => (
                    <TicketCard
                        key={ticket.ticketId}
                        ticket={ticket}
                        bookingId={bookingId}
                        eventName={eventName}
                        venueName={venueName}
                        venueAddress={venueAddress}
                        formattedDate={formattedDate}
                        eventTime={eventTime}
                        totalSeatsInBooking={tickets.length}
                    />
                ))}
            </div>
        </div>
    );
}

function TicketCard({
    ticket,
    bookingId,
    eventName,
    venueName,
    venueAddress,
    formattedDate,
    eventTime,
    totalSeatsInBooking
}) {
    const qrValue = JSON.stringify({
        bookingId,
        ticketId: ticket.ticketId,
        seat: ticket.seatNumber
    });

    return (
        <div className="tk-ticket-card">
            {/* ===== MAIN TICKET ===== */}
            <div className="tk-main-section">
                <div className="tk-hero">
                    <div className="tk-hero-overlay"></div>

                    <div className="tk-league-badge">
                        <div className="tk-league-badge-top">T2</div>
                        <div className="tk-league-badge-bottom">CRICKET LEAGUE</div>
                    </div>

                    <div className="tk-live-tag">LIVE THE GAME</div>

                    <div className="tk-matchup">
                        <div className="tk-team">
                            <div className="tk-team-logo">🔥</div>
                            <div className="tk-team-name">HYDERABAD TITANS</div>
                        </div>

                        <div className="tk-vs">VS</div>

                        <div className="tk-team">
                            <div className="tk-team-logo">🦁</div>
                            <div className="tk-team-name">BANGALORE ROYALS</div>
                        </div>
                    </div>
                </div>

                <div className="tk-info-row">
                    <div className="tk-info-item">
                        <span className="tk-info-icon">📅</span>
                        <div>
                            <strong className="tk-info-main">
                                {formattedDate || "Date TBA"}
                            </strong>
                            <div className="tk-info-sub">
                                {eventTime ? `${eventTime} (IST)` : ""}
                            </div>
                        </div>
                    </div>

                    <div className="tk-info-item">
                        <span className="tk-info-icon">📍</span>
                        <div>
                            <strong className="tk-info-main">{venueName}</strong>
                            <div className="tk-info-sub">{venueAddress}</div>
                        </div>
                    </div>
                </div>

                <div className="tk-details-grid">
                    <DetailBox label="GATE" value={ticket.gate} />
                    <DetailBox
                        label="STAND"
                        value={ticket.standName}
                        sub="Level 1"
                    />
                    <DetailBox label="BLOCK" value={ticket.block} />
                    <DetailBox label="ROW" value={ticket.row} />
                    <DetailBox label="SEAT" value={ticket.seatNumber} />
                </div>

                <div className="tk-price-row">
                    <div>
                        <div className="tk-price-label">CATEGORY</div>
                        <strong className="tk-price-main">{ticket.category}</strong>
                    </div>

                    <div className="tk-price-right">
                        <div className="tk-price-label">PRICE</div>
                        <strong className="tk-price-main">
                            ₹{ticket.price.toLocaleString("en-IN")}.00{" "}
                            <span className="tk-price-sub">(Incl. of all taxes)</span>
                        </strong>
                    </div>
                </div>

                <div className="tk-bottom-bar">
                    <BottomBarItem
                        icon="👥"
                        label="ENTRY"
                        value="6:00 PM Onwards"
                    />
                    <BottomBarItem
                        icon="🚪"
                        label="GATE"
                        value={ticket.gate}
                    />
                    <BottomBarItem
                        icon="💺"
                        label="SEAT"
                        value={`${ticket.block} - ${ticket.row} - ${ticket.seatNumber}`}
                    />
                    <BottomBarItem
                        icon="🏷️"
                        label="CATEGORY"
                        value={ticket.category}
                    />
                </div>

                <div className="tk-footer">
                    <div className="tk-instructions">
                        <strong className="tk-instructions-heading">
                            Important Instructions:
                        </strong>

                        <ul className="tk-instructions-list">
                            <li>This ticket admits one person only.</li>
                            <li>Please carry a valid government ID proof.</li>
                            <li>
                                Outside food, beverages, and professional
                                cameras are not allowed.
                            </li>
                            <li>Resale of this ticket is prohibited.</li>
                            <li>Arrive early to avoid last-minute rush.</li>
                            <li>
                                Follow all COVID-19 and safety guidelines (if
                                applicable).
                            </li>
                            <li>Entry is subject to security check and stadium rules.</li>
                            <li>Event/date/time is subject to change.</li>
                            <li>
                                For support, visit www.stadiumtickets.in or
                                contact +91 1800 123 456.
                            </li>
                        </ul>
                    </div>

                    <div className="tk-thank-you">
                        Thank You!
                        <div className="tk-thank-you-sub">ENJOY THE MATCH!</div>
                    </div>
                </div>
            </div>

            {/* ===== PERFORATION ===== */}
            <div className="tk-perforation">
                <span className="tk-perforation-dot is-top"></span>
                <span className="tk-perforation-dot is-bottom"></span>
            </div>

            {/* ===== STUB ===== */}
            <div className="tk-ticket-stub">
                <div className="tk-stub-stadium-name">
                    {venueName.toUpperCase()}
                </div>

                <div className="tk-qr-wrapper">
                    <QRCodeSVG value={qrValue} size={150} level="M" />
                </div>

                <div className="tk-stub-field">
                    <span>BOOKING ID</span>
                    <strong>{bookingId}</strong>
                </div>

                <div className="tk-stub-field">
                    <span>TICKET ID</span>
                    <strong>{ticket.ticketId}</strong>
                </div>

                <div className="tk-barcode-wrapper">
                    <Barcode
                        value={String(ticket.ticketId)}
                        format="CODE128"
                        width={1.3}
                        height={45}
                        fontSize={11}
                        margin={0}
                        background="transparent"
                        lineColor="#111827"
                    />
                </div>

                {totalSeatsInBooking > 1 && (
                    <div className="tk-multi-seat-note">
                        Seat {ticket.seatNumber} of {totalSeatsInBooking}
                    </div>
                )}
            </div>
        </div>
    );
}

function DetailBox({ label, value, sub }) {
    return (
        <div className="tk-detail-box">
            <div className="tk-detail-label">{label}</div>
            <strong className="tk-detail-value">{value}</strong>
            {sub && <div className="tk-detail-sub">{sub}</div>}
        </div>
    );
}

function BottomBarItem({ icon, label, value }) {
    return (
        <div className="tk-bottom-bar-item">
            <span className="tk-bottom-bar-icon">{icon}</span>
            <div>
                <div className="tk-bottom-bar-label">{label}</div>
                <strong className="tk-bottom-bar-value">{value}</strong>
            </div>
        </div>
    );
}

export default Ticket;