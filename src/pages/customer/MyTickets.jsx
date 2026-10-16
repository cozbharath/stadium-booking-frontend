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
            <div style={pageStyle}>
                <div style={centeredMessageStyle}>
                    <h2>Loading your tickets...</h2>
                    <p>Please wait while we fetch your digital tickets.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={pageStyle}>
                <section style={headerStyle}>
                    <div>
                        <p style={pageTagStyle}>YOUR DIGITAL TICKETS</p>
                        <h1 style={pageTitleStyle}>My Tickets</h1>
                        <p style={pageSubStyle}>
                            Your confirmed event tickets are available here.
                        </p>
                    </div>

                    <Link to="/customer/events" style={headerButtonStyle}>
                        + Book Another Event
                    </Link>
                </section>

                <div style={centeredMessageStyle}>
                    <h2>Unable to load tickets</h2>
                    <p>{error}</p>
                    <button type="button" onClick={loadTickets} style={primaryButtonStyle}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={pageStyle}>
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }

                    .mt-ticket-card, .mt-ticket-card * {
                        visibility: visible;
                    }

                    .mt-ticket-card {
                        position: relative;
                        box-shadow: none !important;
                        page-break-after: always;
                        margin: 0 auto 0 !important;
                    }

                    .no-print {
                        display: none !important;
                    }

                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }

                @media (max-width: 760px) {
                    .mt-ticket-card {
                        grid-template-columns: 1fr !important;
                    }

                    .mt-ticket-stub {
                        border-left: none !important;
                        border-top: 2px dashed #cbd5e1 !important;
                    }
                }
            `}</style>

            <section style={headerStyle} className="no-print">
                <div>
                    <p style={pageTagStyle}>YOUR DIGITAL TICKETS</p>
                    <h1 style={pageTitleStyle}>My Tickets</h1>
                    <p style={pageSubStyle}>
                        Your confirmed event tickets are available here.
                        Show the QR code at the stadium entrance.
                    </p>
                </div>

                <Link to="/customer/events" style={headerButtonStyle}>
                    + Book Another Event
                </Link>
            </section>

            {tickets.length === 0 ? (
                <div style={emptyStyle}>
                    <div style={{ fontSize: "48px" }}>🎟️</div>
                    <h2>No Tickets Available</h2>
                    <p>
                        Your confirmed tickets will appear here after
                        successful payment.
                    </p>
                    <Link to="/customer/events" style={primaryButtonStyle}>
                        Explore Events
                    </Link>
                </div>
            ) : (
                <div style={ticketListStyle}>
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
        <div className="mt-ticket-card" style={ticketCardStyle}>
            {/* ===== MAIN TICKET ===== */}
            <div style={mainSectionStyle}>
                <div style={heroStyle}>
                    <div style={heroOverlayStyle}></div>

                    <div style={statusBadgeStyle(ticket.status)}>
                        ✓ {ticket.status}
                    </div>

                    {teams ? (
                        <div style={matchupStyle}>
                            <div style={teamStyle}>
                                <div style={teamLogoStyle}>🏏</div>
                                <div style={teamNameStyle}>{teams.teamA}</div>
                            </div>

                            <div style={vsStyle}>VS</div>

                            <div style={teamStyle}>
                                <div style={teamLogoStyle}>🏏</div>
                                <div style={teamNameStyle}>{teams.teamB}</div>
                            </div>
                        </div>
                    ) : (
                        <div style={singleEventTitleStyle}>{ticket.event}</div>
                    )}

                    <div style={categoryTagStyle}>{ticket.category}</div>
                </div>

                <div style={infoRowStyle}>
                    <InfoItem icon="🏟️" main={ticket.stadium} sub={ticket.location} />
                    <InfoItem
                        icon="📅"
                        main={formatDate(ticket.date)}
                        sub={formatTime(ticket.time)}
                    />
                </div>

                <div style={detailsGridStyle}>
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

                <div style={seatsSectionStyle}>
                    <div style={seatsSectionHeaderStyle}>
                        <span>YOUR SEATS</span>
                        <strong>
                            {getSeatCount(ticket)}{" "}
                            {getSeatCount(ticket) === 1 ? "Seat" : "Seats"}
                        </strong>
                    </div>

                    <div style={seatListStyle}>
                        {ticket.seats.length > 0 ? (
                            ticket.seats.map((seat, seatIndex) => (
                                <div
                                    key={`${getSeatName(seat)}-${seatIndex}`}
                                    style={seatChipStyle}
                                >
                                    <span>{getSeatName(seat)}</span>
                                    <small>Confirmed</small>
                                </div>
                            ))
                        ) : (
                            <div style={seatChipStyle}>
                                <span>No seat information</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="no-print" style={actionsStyle}>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        style={printButtonStyle}
                    >
                        🖨 Print Ticket
                    </button>

                    {ticket.bookingDatabaseId !== null &&
                    ticket.bookingDatabaseId !== undefined ? (
                        <Link
                            to={`/customer/bookings/${ticket.bookingDatabaseId}`}
                            style={viewBookingButtonStyle}
                        >
                            View Booking
                        </Link>
                    ) : (
                        <span
                            style={{
                                ...viewBookingButtonStyle,
                                opacity: 0.5,
                                cursor: "not-allowed"
                            }}
                        >
                            Booking Unavailable
                        </span>
                    )}
                </div>
            </div>

            {/* ===== PERFORATION ===== */}
            <div style={perforationStyle}>
                <span style={{ ...perforationDotStyle, top: "-8px" }}></span>
                <span style={{ ...perforationDotStyle, bottom: "-8px" }}></span>
            </div>

            {/* ===== STUB ===== */}
            <div className="mt-ticket-stub" style={stubStyle}>
                <div style={stubLabelStyle}>SCAN TO ENTER</div>

                <div style={qrWrapperStyle}>
                    <QRCodeSVG value={qrValue} size={140} level="M" />
                </div>

                <strong style={stubTicketNumberStyle}>{ticket.ticketNumber}</strong>

                <p style={stubHelpTextStyle}>
                    Present this QR code at the stadium entrance for
                    verification.
                </p>

                <div style={barcodeWrapperStyle}>
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

                <div style={securityTagStyle}>🔒 Secure Digital Ticket</div>
            </div>
        </div>
    );
}

function InfoItem({ icon, main, sub }) {
    return (
        <div style={infoItemStyle}>
            <span style={infoIconStyle}>{icon}</span>
            <div>
                <strong style={infoMainStyle}>{main}</strong>
                {sub && <div style={infoSubStyle}>{sub}</div>}
            </div>
        </div>
    );
}

function DetailBox({ label, value }) {
    return (
        <div style={detailBoxStyle}>
            <div style={detailLabelStyle}>{label}</div>
            <strong style={detailValueStyle}>{value}</strong>
        </div>
    );
}

/* ============================================================
   STYLES
   ============================================================ */

const pageStyle = {
    minHeight: "100vh",
    width: "100%",
    background: "#eef2f7",
    boxSizing: "border-box",
    padding: "32px 40px 60px"
};

const headerStyle = {
    maxWidth: "1000px",
    margin: "0 auto 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px"
};

const pageTagStyle = {
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "1.8px",
    color: "#2563eb",
    margin: "0 0 8px"
};

const pageTitleStyle = {
    margin: 0,
    fontSize: "28px",
    fontWeight: "800",
    color: "#0f172a"
};

const pageSubStyle = {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "14px",
    maxWidth: "480px"
};

const headerButtonStyle = {
    padding: "12px 20px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "14px",
    textDecoration: "none",
    boxShadow: "0 8px 18px rgba(37, 99, 235, 0.25)"
};

const centeredMessageStyle = {
    maxWidth: "520px",
    margin: "60px auto",
    textAlign: "center",
    color: "#475569"
};

const emptyStyle = {
    maxWidth: "520px",
    margin: "60px auto",
    textAlign: "center",
    color: "#475569",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "50px 30px",
    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)"
};

const primaryButtonStyle = {
    marginTop: "16px",
    padding: "12px 24px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block"
};

const ticketListStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "28px",
    maxWidth: "1000px",
    margin: "0 auto"
};

const ticketCardStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 260px",
    background: "#ffffff",
    borderRadius: "18px",
    overflow: "hidden",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
    position: "relative"
};

const mainSectionStyle = {
    display: "flex",
    flexDirection: "column"
};

const heroStyle = {
    position: "relative",
    padding: "22px 24px",
    background:
        "radial-gradient(circle at 20% 20%, rgba(96,165,250,0.35), transparent 40%)," +
        "linear-gradient(180deg, #1e293b 0%, #0f172a 70%, #1e3a8a 100%)",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    overflow: "hidden"
};

const heroOverlayStyle = {
    position: "absolute",
    inset: 0,
    background:
        "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 6px)"
};

function statusBadgeStyle(status) {
    const isActive = String(status || "").toUpperCase() === "ACTIVE";

    return {
        alignSelf: "flex-start",
        position: "relative",
        padding: "5px 12px",
        borderRadius: "999px",
        background: isActive ? "rgba(34,197,94,0.18)" : "rgba(148,163,184,0.2)",
        color: isActive ? "#4ade80" : "#cbd5e1",
        fontSize: "11px",
        fontWeight: "800",
        letterSpacing: "0.5px"
    };
}

const matchupStyle = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "22px",
    padding: "6px 0"
};

const teamStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px"
};

const teamLogoStyle = {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "17px"
};

const teamNameStyle = {
    fontSize: "14px",
    fontWeight: "800",
    letterSpacing: "0.3px",
    textAlign: "center"
};

const vsStyle = {
    fontSize: "15px",
    fontWeight: "700",
    color: "#cbd5e1"
};

const singleEventTitleStyle = {
    position: "relative",
    fontSize: "22px",
    fontWeight: "800",
    textAlign: "center",
    padding: "6px 0"
};

const categoryTagStyle = {
    position: "relative",
    alignSelf: "center",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "1px",
    color: "#bfdbfe"
};

const infoRowStyle = {
    display: "flex",
    gap: "28px",
    padding: "16px 24px",
    borderBottom: "1px solid #eef1f5",
    flexWrap: "wrap"
};

const infoItemStyle = {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px"
};

const infoIconStyle = {
    fontSize: "15px"
};

const infoMainStyle = {
    display: "block",
    fontSize: "13.5px",
    color: "#0f172a"
};

const infoSubStyle = {
    fontSize: "12.5px",
    color: "#64748b"
};

const detailsGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    padding: "16px 24px",
    background: "#f8fafc",
    margin: "0 24px",
    borderRadius: "10px"
};

const detailBoxStyle = {
    padding: "4px 10px",
    borderRight: "1px solid #e2e8f0"
};

const detailLabelStyle = {
    fontSize: "10px",
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: "0.5px",
    marginBottom: "4px"
};

const detailValueStyle = {
    display: "block",
    fontSize: "14px",
    color: "#0f172a",
    wordBreak: "break-word"
};

const seatsSectionStyle = {
    padding: "16px 24px"
};

const seatsSectionHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "11px",
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: "0.5px",
    marginBottom: "10px"
};

const seatListStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px"
};

const seatChipStyle = {
    display: "flex",
    flexDirection: "column",
    padding: "8px 14px",
    borderRadius: "8px",
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    color: "#1e40af",
    fontSize: "13px",
    fontWeight: "700"
};

const actionsStyle = {
    display: "flex",
    gap: "12px",
    padding: "16px 24px 22px",
    borderTop: "1px solid #eef1f5",
    flexWrap: "wrap"
};

const printButtonStyle = {
    border: "none",
    borderRadius: "9px",
    padding: "11px 18px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer"
};

const viewBookingButtonStyle = {
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    padding: "11px 18px",
    background: "#ffffff",
    color: "#334155",
    fontWeight: "700",
    fontSize: "13px",
    textDecoration: "none"
};

const perforationStyle = {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "calc(100% - 260px)",
    width: "0",
    borderLeft: "2px dashed #cbd5e1"
};

const perforationDotStyle = {
    position: "absolute",
    left: "-8px",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    background: "#eef2f7"
};

const stubStyle = {
    background: "#ffffff",
    borderLeft: "2px dashed #cbd5e1",
    padding: "22px 18px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "8px"
};

const stubLabelStyle = {
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "1px",
    color: "#1e3a8a"
};

const qrWrapperStyle = {
    padding: "10px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    margin: "4px 0"
};

const stubTicketNumberStyle = {
    fontSize: "13px",
    color: "#0f172a"
};

const stubHelpTextStyle = {
    fontSize: "11px",
    color: "#64748b",
    margin: 0
};

const barcodeWrapperStyle = {
    marginTop: "6px"
};

const securityTagStyle = {
    marginTop: "6px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#16a34a"
};

export default MyTickets;