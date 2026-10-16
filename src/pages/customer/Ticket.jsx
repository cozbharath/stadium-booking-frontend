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

const STAND_COLORS = {
    default: "#2563eb"
};

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
            <div style={pageStyle}>
                <div style={errorBoxStyle}>
                    <h2>Unable to Show Ticket</h2>
                    <p>{error}</p>
                    <button
                        type="button"
                        onClick={handleGoHome}
                        style={primaryButtonStyle}
                    >
                        Browse Events
                    </button>
                </div>
            </div>
        );
    }

    if (!bookingData || !tickets.length) {
        return (
            <div style={pageStyle}>
                <div style={errorBoxStyle}>
                    <h2>Loading your ticket...</h2>
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

                    .ticket-print-area, .ticket-print-area * {
                        visibility: visible;
                    }

                    .ticket-print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 0 !important;
                        background: #ffffff !important;
                    }

                    .ticket-card {
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
                    .ticket-card {
                        grid-template-columns: 1fr !important;
                    }

                    .ticket-stub {
                        border-left: none !important;
                        border-top: 2px dashed #cbd5e1 !important;
                    }
                }
            `}</style>

            <div className="no-print" style={topBarStyle}>
                <div>
                    <div style={successBadgeStyle}>✓ Payment Successful</div>
                    <h1 style={topTitleStyle}>Your ticket is ready</h1>
                    <p style={topSubtitleStyle}>
                        {tickets.length > 1
                            ? `${tickets.length} tickets booked for ${eventName}`
                            : `Booked for ${eventName}`}
                    </p>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                    <button
                        type="button"
                        onClick={handlePrint}
                        style={printButtonStyle}
                    >
                        🖨️ Print Ticket
                    </button>

                    <button
                        type="button"
                        onClick={handleGoHome}
                        style={secondaryButtonStyle}
                    >
                        Done
                    </button>
                </div>
            </div>

            <div className="ticket-print-area" style={ticketListStyle}>
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
        <div className="ticket-card" style={ticketCardStyle}>
            {/* ===== MAIN TICKET ===== */}
            <div style={mainSectionStyle}>
                <div style={heroStyle}>
                    <div style={heroOverlayStyle}></div>

                    <div style={leagueBadgeStyle}>
                        <div style={leagueBadgeTopStyle}>T2</div>
                        <div style={leagueBadgeBottomStyle}>CRICKET LEAGUE</div>
                    </div>

                    <div style={liveTagStyle}>LIVE THE GAME</div>

                    <div style={matchupStyle}>
                        <div style={teamStyle}>
                            <div style={teamLogoStyle}>🔥</div>
                            <div style={teamNameStyle}>HYDERABAD TITANS</div>
                        </div>

                        <div style={vsStyle}>VS</div>

                        <div style={teamStyle}>
                            <div style={teamLogoStyle}>🦁</div>
                            <div style={teamNameStyle}>BANGALORE ROYALS</div>
                        </div>
                    </div>
                </div>

                <div style={infoRowStyle}>
                    <div style={infoItemStyle}>
                        <span style={infoIconStyle}>📅</span>
                        <div>
                            <strong style={infoMainStyle}>
                                {formattedDate || "Date TBA"}
                            </strong>
                            <div style={infoSubStyle}>
                                {eventTime ? `${eventTime} (IST)` : ""}
                            </div>
                        </div>
                    </div>

                    <div style={infoItemStyle}>
                        <span style={infoIconStyle}>📍</span>
                        <div>
                            <strong style={infoMainStyle}>{venueName}</strong>
                            <div style={infoSubStyle}>{venueAddress}</div>
                        </div>
                    </div>
                </div>

                <div style={detailsGridStyle}>
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

                <div style={priceRowStyle}>
                    <div>
                        <div style={priceLabelStyle}>CATEGORY</div>
                        <strong style={priceMainStyle}>{ticket.category}</strong>
                    </div>

                    <div style={{ textAlign: "right" }}>
                        <div style={priceLabelStyle}>PRICE</div>
                        <strong style={priceMainStyle}>
                            ₹{ticket.price.toLocaleString("en-IN")}.00{" "}
                            <span style={priceSubStyle}>(Incl. of all taxes)</span>
                        </strong>
                    </div>
                </div>

                <div style={bottomBarStyle}>
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

                <div style={footerStyle}>
                    <div style={instructionsStyle}>
                        <strong style={instructionsHeadingStyle}>
                            Important Instructions:
                        </strong>

                        <ul style={instructionsListStyle}>
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

                    <div style={thankYouStyle}>
                        Thank You!
                        <div style={thankYouSubStyle}>ENJOY THE MATCH!</div>
                    </div>
                </div>
            </div>

            {/* ===== PERFORATION ===== */}
            <div style={perforationStyle}>
                <span style={{ ...perforationDotStyle, top: "-8px" }}></span>
                <span style={{ ...perforationDotStyle, bottom: "-8px" }}></span>
            </div>

            {/* ===== STUB ===== */}
            <div className="ticket-stub" style={stubStyle}>
                <div style={stubStadiumNameStyle}>
                    {venueName.toUpperCase()}
                </div>

                <div style={qrWrapperStyle}>
                    <QRCodeSVG value={qrValue} size={150} level="M" />
                </div>

                <div style={stubFieldStyle}>
                    <span>BOOKING ID</span>
                    <strong>{bookingId}</strong>
                </div>

                <div style={stubFieldStyle}>
                    <span>TICKET ID</span>
                    <strong>{ticket.ticketId}</strong>
                </div>

                <div style={barcodeWrapperStyle}>
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
                    <div style={multiSeatNoteStyle}>
                        Seat {ticket.seatNumber} of {totalSeatsInBooking}
                    </div>
                )}
            </div>
        </div>
    );
}

function DetailBox({ label, value, sub }) {
    return (
        <div style={detailBoxStyle}>
            <div style={detailLabelStyle}>{label}</div>
            <strong style={detailValueStyle}>{value}</strong>
            {sub && <div style={detailSubStyle}>{sub}</div>}
        </div>
    );
}

function BottomBarItem({ icon, label, value }) {
    return (
        <div style={bottomBarItemStyle}>
            <span style={bottomBarIconStyle}>{icon}</span>
            <div>
                <div style={bottomBarLabelStyle}>{label}</div>
                <strong style={bottomBarValueStyle}>{value}</strong>
            </div>
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
    padding: "32px 20px 60px"
};

const topBarStyle = {
    maxWidth: "1000px",
    margin: "0 auto 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px"
};

const successBadgeStyle = {
    display: "inline-block",
    padding: "6px 14px",
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#15803d",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.5px",
    marginBottom: "8px"
};

const topTitleStyle = {
    margin: 0,
    fontSize: "26px",
    fontWeight: "800",
    color: "#0f172a"
};

const topSubtitleStyle = {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "14px"
};

const printButtonStyle = {
    border: "none",
    borderRadius: "10px",
    padding: "12px 20px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(37, 99, 235, 0.25)"
};

const secondaryButtonStyle = {
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "12px 20px",
    background: "#ffffff",
    color: "#334155",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer"
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
    height: "190px",
    background:
        "radial-gradient(circle at 20% 20%, rgba(96,165,250,0.35), transparent 40%)," +
        "radial-gradient(circle at 80% 15%, rgba(248,250,252,0.25), transparent 35%)," +
        "linear-gradient(180deg, #1e293b 0%, #0f172a 70%, #1e3a8a 100%)",
    color: "#ffffff",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    overflow: "hidden"
};

const heroOverlayStyle = {
    position: "absolute",
    inset: 0,
    background:
        "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 6px)"
};

const leagueBadgeStyle = {
    position: "absolute",
    top: "16px",
    left: "20px",
    textAlign: "left",
    lineHeight: 1
};

const leagueBadgeTopStyle = {
    fontSize: "26px",
    fontWeight: "900",
    color: "#fb923c",
    letterSpacing: "1px"
};

const leagueBadgeBottomStyle = {
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "2px",
    color: "#e2e8f0"
};

const liveTagStyle = {
    position: "absolute",
    top: "18px",
    right: "22px",
    fontSize: "14px",
    fontStyle: "italic",
    fontWeight: "700",
    color: "#f8fafc"
};

const matchupStyle = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "22px",
    marginTop: "auto"
};

const teamStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px"
};

const teamLogoStyle = {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px"
};

const teamNameStyle = {
    fontSize: "14px",
    fontWeight: "800",
    letterSpacing: "0.5px",
    textAlign: "center"
};

const vsStyle = {
    fontSize: "16px",
    fontWeight: "700",
    color: "#cbd5e1"
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
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "0",
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
    fontSize: "10.5px",
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: "0.5px",
    marginBottom: "4px"
};

const detailValueStyle = {
    display: "block",
    fontSize: "15px",
    color: "#0f172a"
};

const detailSubStyle = {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "2px"
};

const priceRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    borderTop: "1px solid #eef1f5",
    marginTop: "16px"
};

const priceLabelStyle = {
    fontSize: "10.5px",
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: "0.5px",
    marginBottom: "4px"
};

const priceMainStyle = {
    fontSize: "15px",
    color: "#0f172a"
};

const priceSubStyle = {
    fontSize: "11px",
    fontWeight: "400",
    color: "#94a3b8"
};

const bottomBarStyle = {
    display: "flex",
    justifyContent: "space-between",
    padding: "16px 24px",
    background: "linear-gradient(135deg, #1e3a8a, #1e40af)",
    color: "#ffffff",
    flexWrap: "wrap",
    gap: "14px"
};

const bottomBarItemStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px"
};

const bottomBarIconStyle = {
    fontSize: "16px"
};

const bottomBarLabelStyle = {
    fontSize: "10px",
    letterSpacing: "0.5px",
    color: "#bfdbfe"
};

const bottomBarValueStyle = {
    fontSize: "13px"
};

const footerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    padding: "18px 24px",
    flexWrap: "wrap"
};

const instructionsStyle = {
    flex: 1,
    minWidth: "240px"
};

const instructionsHeadingStyle = {
    fontSize: "12px",
    color: "#0f172a"
};

const instructionsListStyle = {
    margin: "8px 0 0",
    paddingLeft: "16px",
    fontSize: "11.5px",
    color: "#64748b",
    lineHeight: 1.6,
    columns: 2,
    columnGap: "20px"
};

const thankYouStyle = {
    fontSize: "20px",
    fontStyle: "italic",
    fontWeight: "700",
    color: "#2563eb",
    textAlign: "right",
    whiteSpace: "nowrap"
};

const thankYouSubStyle = {
    fontSize: "11px",
    fontWeight: "700",
    fontStyle: "normal",
    letterSpacing: "1px",
    color: "#0f172a"
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
    padding: "24px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "10px"
};

const stubStadiumNameStyle = {
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "0.5px",
    color: "#1e3a8a",
    lineHeight: 1.4
};

const qrWrapperStyle = {
    padding: "10px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    margin: "6px 0"
};

const stubFieldStyle = {
    width: "100%",
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    fontSize: "10px",
    color: "#94a3b8",
    fontWeight: "700",
    letterSpacing: "0.5px"
};

const barcodeWrapperStyle = {
    marginTop: "10px"
};

const multiSeatNoteStyle = {
    marginTop: "8px",
    fontSize: "11px",
    color: "#2563eb",
    fontWeight: "700"
};

const errorBoxStyle = {
    maxWidth: "480px",
    margin: "80px auto",
    textAlign: "center",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "40px",
    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)"
};

const primaryButtonStyle = {
    marginTop: "16px",
    padding: "12px 24px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer"
};

export default Ticket;