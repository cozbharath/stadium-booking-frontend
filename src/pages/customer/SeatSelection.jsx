import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { formatDate, formatTime, normalizeEvent } from "../../components/common/eventUtils";
import StadiumMap from "../../components/customer/StadiumMap";
import { buildRows, standAbbr } from "../../components/customer/stadiumLayout";
import { get, post } from "../../services/api";

const STAND_COLORS = [
    "#7c3aed",
    "#dc2626",
    "#2563eb",
    "#16a34a",
    "#ea580c",
    "#0891b2",
    "#db2777",
    "#65a30d"
];

function SeatSelection() {
    const { eventId } = useParams();
    const navigate = useNavigate();

    const [seats, setSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [event, setEvent] = useState(null);
    const [selectedStand, setSelectedStand] = useState(null);

    const [loading, setLoading] = useState(true);
    const [holding, setHolding] = useState(false);

    const [error, setError] = useState("");
    const [holdError, setHoldError] = useState("");
    const mapRef = useRef(null);
    const [payOpen, setPayOpen] = useState(false);

    // Esc closes the pay popup (not while seats are being held)
    useEffect(() => {
        if (!payOpen) return undefined;
        const onKey = (e) => { if (e.key === "Escape" && !holding) setPayOpen(false); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [payOpen, holding]);

    // =========================================================
    // LOAD EVENT + SEATS
    // =========================================================

    function normalizeSeat(seat) {
        const eventSeatId =
            seat?.id ??
            seat?.eventSeatId ??
            seat?.eventSeatID;

        const nestedSeat = seat?.seat || {};

        const rawNumber =
            seat?.seatNumber ??
            seat?.seatName ??
            seat?.number ??
            nestedSeat?.seatNumber ??
            nestedSeat?.seatName ??
            nestedSeat?.number ??
            eventSeatId;

        const seatNumber = String(rawNumber);

        const numericSeatNumber = Number(
            String(rawNumber).replace(/\D/g, "")
        );

        const price = Number(
            seat?.price ??
                seat?.ticketPrice ??
                seat?.seatPrice ??
                nestedSeat?.price ??
                0
        );

        const standName =
            seat?.standName ??
            seat?.stand?.name ??
            nestedSeat?.standName ??
            nestedSeat?.stand?.name ??
            "General Stand";

        /*
         * Backend may return different availability fields.
         */
        const rawStatus =
            seat?.status ??
            seat?.seatStatus ??
            seat?.bookingStatus ??
            seat?.availabilityStatus ??
            nestedSeat?.status ??
            "";

        const statusText = String(rawStatus).toUpperCase();

        /*
         * Check all common backend representations.
         */
        const explicitlyUnavailable =
            seat?.available === false ||
            seat?.isAvailable === false ||
            seat?.booked === true ||
            seat?.isBooked === true ||
            seat?.reserved === true ||
            seat?.isReserved === true;

        const bookedStatus =
            statusText === "BOOKED" ||
            statusText === "SOLD" ||
            statusText === "UNAVAILABLE" ||
            statusText === "CONFIRMED" ||
            statusText === "RESERVED" ||
            statusText === "HELD" ||
            statusText === "HOLD" ||
            statusText === "PENDING";

        const availableStatus =
            statusText === "AVAILABLE" ||
            statusText === "FREE" ||
            statusText === "OPEN";

        let status = "available";

        if (explicitlyUnavailable || bookedStatus) {
            status = "booked";
        } else if (availableStatus) {
            status = "available";
        }

        /*
         * Try to obtain row/column if backend provides them.
         */
        const rowValue =
            seat?.row ??
            seat?.rowNumber ??
            seat?.seatRow ??
            nestedSeat?.row ??
            nestedSeat?.rowNumber ??
            null;

        const columnValue =
            seat?.column ??
            seat?.columnNumber ??
            seat?.seatColumn ??
            nestedSeat?.column ??
            nestedSeat?.columnNumber ??
            null;

        return {
            id: eventSeatId,
            number: seatNumber,
            sortNumber: Number.isNaN(numericSeatNumber)
                ? Number.MAX_SAFE_INTEGER
                : numericSeatNumber,
            price,
            standName,
            status,
            row: rowValue,
            column: columnValue,
            original: seat
        };
    };

    const loadEventAndSeats = async () => {
        try {
            setLoading(true);
            setError("");
            setHoldError("");

            // booking-service tells us which seats someone else already holds or has booked
            const [eventData, eventSeatsData, unavailableIds] = await Promise.all([
                get(`/events/${eventId}`),
                get(`/event-seats/event/${eventId}`),
                get(`/seat-holds/event/${eventId}/unavailable`).catch(() => [])
            ]);

            console.log("EVENT:", eventData);
            console.log("EVENT SEATS:", eventSeatsData);

            setEvent(eventData);

            const takenIds = Array.isArray(unavailableIds)
                ? unavailableIds
                : [];

            const backendSeats = Array.isArray(eventSeatsData)
                ? eventSeatsData.map((eventSeat) =>
                      takenIds.includes(eventSeat.id)
                          ? { ...eventSeat, available: false }
                          : eventSeat
                  )
                : [];

            const normalizedSeats = backendSeats
                .map(normalizeSeat)
                .filter((seat) => seat.id !== null)
                .sort((a, b) => a.sortNumber - b.sortNumber);

            console.log("NORMALIZED SEATS:", normalizedSeats);

            setSeats(normalizedSeats);
        } catch (err) {
            console.error("Failed to load event seats:", err);

            setError(
                err?.message ||
                    "Failed to load seats. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        queueMicrotask(() => {
            if (!eventId) {
                setError("Event ID is missing.");
                setLoading(false);
                return;
            }

            loadEventAndSeats();
        });
    }, [eventId]);

    // =========================================================
    // GROUP SEATS BY STAND
    // =========================================================

    const stands = useMemo(() => {
        if (!seats.length) {
            return [];
        }

        const grouped = {};

        seats.forEach((seat) => {
            const name = seat.standName || "General Stand";

            if (!grouped[name]) {
                grouped[name] = [];
            }

            grouped[name].push(seat);
        });

        return Object.entries(grouped)
            .map(([name, standSeats], index) => {
                const prices = standSeats
                    .map((seat) => Number(seat.price || 0))
                    .filter((price) => price > 0);

                const minPrice = prices.length
                    ? Math.min(...prices)
                    : 0;

                const maxPrice = prices.length
                    ? Math.max(...prices)
                    : 0;

                const availableCount = standSeats.filter(
                    (seat) => seat.status === "available"
                ).length;

                return {
                    name,
                    seats: standSeats,
                    minPrice,
                    maxPrice,
                    totalCount: standSeats.length,
                    availableCount,
                    color: STAND_COLORS[index % STAND_COLORS.length]
                };
            })
            .sort((a, b) => b.maxPrice - a.maxPrice);

    }, [seats]);

    /*
     * If there is only one stand, skip the stand-selection
     * step and go straight to the seat grid.
     */
    useEffect(() => {
        if (
            !selectedStand &&
            stands.length === 1
        ) {
            queueMicrotask(() => setSelectedStand(stands[0].name));
        }
    }, [stands, selectedStand]);

    const activeStand = useMemo(() => {
        return stands.find(
            (stand) => stand.name === selectedStand
        ) || null;
    }, [stands, selectedStand]);

    // =========================================================
    // ROWS OF EVERY STAND (the map draws all stands at once)
    // =========================================================

    const rowsByStand = useMemo(() => {
        const map = {};
        stands.forEach((stand) => {
            map[stand.name] = buildRows(stand.seats);
        });
        return map;
    }, [stands]);

    // "A5", "B12" … label for every seat (used in the selection summary)
    const seatLabelById = useMemo(() => {
        const map = {};
        Object.values(rowsByStand).forEach((standRows) => {
            standRows.forEach(([rowName, rowSeats]) => {
                rowSeats.forEach((seat, col) => {
                    map[seat.id] = `${rowName}${col + 1}`;
                });
            });
        });
        return map;
    }, [rowsByStand]);

    // =========================================================
    // HANDLE SEAT CLICK
    // =========================================================

    const handleSeatClick = (seat) => {
        if (
            seat.status === "booked" ||
            !seat.id ||
            holding
        ) {
            return;
        }

        setHoldError("");

        setSelectedSeats((previous) => {
            if (previous.includes(seat.id)) {
                return previous.filter(
                    (id) => id !== seat.id
                );
            }

            return [...previous, seat.id];
        });
    };

    // =========================================================
    // STAND SELECT / CHANGE
    // =========================================================

    // the map tells us which stand is open (null = whole stadium).
    // Seats picked in other stands stay picked, so one booking can mix stands.
    const handleActiveChange = (standName) => {
        setSelectedStand(standName);
        setHoldError("");
    };

    const handleClearSelection = () => {
        setSelectedSeats([]);
        setHoldError("");
    };

    // =========================================================
    // SELECTED SEAT DETAILS
    // =========================================================

    const selectedSeatDetails = useMemo(() => {
        return seats.filter((seat) =>
            selectedSeats.includes(seat.id)
        );
    }, [seats, selectedSeats]);

    // =========================================================
    // TOTAL
    // =========================================================

    const totalAmount = useMemo(() => {
        return selectedSeatDetails.reduce(
            (total, seat) =>
                total + Number(seat.price || 0),
            0
        );
    }, [selectedSeatDetails]);

    // =========================================================
    // CREATE SEAT HOLD
    // =========================================================

    const handleContinue = async () => {
        if (selectedSeats.length === 0) {
            setHoldError(
                "Please select at least one seat."
            );
            return;
        }

        try {
            setHolding(true);
            setHoldError("");

            const request = {
                eventId: Number(eventId),
                eventSeatIds: selectedSeats
            };

            console.log(
                "CREATE SEAT HOLD REQUEST:",
                request
            );

            const holdResponse = await post(
                "/seat-holds",
                request
            );

            console.log(
                "SEAT HOLD RESPONSE:",
                holdResponse
            );

            if (
                !holdResponse ||
                !holdResponse.holdToken
            ) {
                throw new Error(
                    "Seat hold was not created. Hold token is missing."
                );
            }

            const bookingData = {
                eventId: Number(eventId),

                event: event,

                selectedSeats: selectedSeatDetails,

                eventSeatIds: selectedSeats,

                holdToken:
                    holdResponse.holdToken,

                heldSeatIds:
                    holdResponse.eventSeatIds ||
                    selectedSeats,

                heldAt:
                    holdResponse.heldAt,

                expiresAt:
                    holdResponse.expiresAt,

                holdStatus:
                    holdResponse.status,

                totalAmount
            };

            sessionStorage.setItem(
                "bookingData",
                JSON.stringify(bookingData)
            );

            navigate("/customer/booking");
        } catch (err) {
            console.error(
                "Seat hold failed:",
                err
            );

            const holdMessage =
                err?.message ||
                "Unable to hold selected seats.";

            // someone else may have taken a seat first: refresh the map so it shows as booked,
            // clear the choice, then show the message (the reload clears old messages)
            setSelectedSeats([]);
            await loadEventAndSeats();
            setHoldError(holdMessage);
        } finally {
            setHolding(false);
        }
    };


    // =========================================================
    // LOADING / ERROR
    // =========================================================

    if (loading) {
        return (
            <div className="ss">
                <div className="bn-skel" style={{ height: 40, width: 260, marginBottom: 16 }} />
                <div className="ss-layout">
                    <div className="bn-skel" style={{ height: 520, borderRadius: 20 }} />
                    <div className="bn-skel" style={{ height: 360, borderRadius: 20 }} />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="ss">
                <div className="bn-state">
                    <div className="ico">⚠️</div>
                    <h2>Unable to load seats</h2>
                    <p>{error}</p>
                    <button type="button" className="bn-btn bn-btn-primary" onClick={loadEventAndSeats}>Try Again</button>
                </div>
            </div>
        );
    }

    // =========================================================
    // MAIN UI
    // =========================================================

    const ev = normalizeEvent(event);
    const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

    return (
        <div className={`ss ${selectedSeats.length > 0 ? "has-dock" : ""}`}>

            {/* TOP BAR */}
            <div className="ss-top">
                <Link to={`/customer/events/${eventId}`} className="ss-back" aria-label="Back to event">←</Link>
                <div>
                    <h1>{ev.name}</h1>
                    <p>{ev.stadium} • {formatDate(ev.date)} • {formatTime(ev.start)}</p>
                </div>
            </div>

            <div className="sm-page">

                {/* ================= STADIUM ================= */}
                <div ref={mapRef}>
                    {stands.length === 0 ? (
                        <div className="sm-empty">
                            <span>🏟️</span>No seats have been configured for this event yet.
                        </div>
                    ) : (
                        <StadiumMap
                            stands={stands}
                            rowsByStand={rowsByStand}
                            activeName={selectedStand}
                            onActiveChange={handleActiveChange}
                            selectedIds={selectedSeats}
                            onSeatClick={handleSeatClick}
                            holding={holding}
                            canChangeStand={stands.length > 1}
                        />
                    )}
                </div>

            </div>

            {/* ================= YOUR SELECTION (bottom dock, only when seats are selected) ================= */}
            {selectedSeats.length > 0 && (
                <div className="ss-dock" role="region" aria-label="Your selection">
                    <div className="ss-dock-in">

                        <div className="ss-dock-head">
                            <div>
                                <h3>Your selection</h3>
                                <small>{ev.name}</small>
                            </div>
                            <button type="button" className="ss-clear" onClick={handleClearSelection}>Clear all</button>
                        </div>

                        <div className="ss-dock-seats">
                            {selectedSeatDetails.map((seat) => (
                                <span key={seat.id} className="ss-chip">
                                    <small>{standAbbr(seat.standName)}</small>
                                    <b>{seatLabelById[seat.id] || `Seat ${seat.number}`}</b>
                                    <em>{money(seat.price)}</em>
                                    <button type="button" aria-label="Remove seat" onClick={() => handleSeatClick(seat)}>×</button>
                                </span>
                            ))}
                        </div>

                        {holdError && <div className="ss-error" style={{ marginTop: 10, marginBottom: 0 }}>{holdError}</div>}

                        <div className="ss-dock-foot">
                            <div className="tot">
                                <small>Total • {selectedSeats.length} seat{selectedSeats.length === 1 ? "" : "s"}</small>
                                <strong>{money(totalAmount)}</strong>
                            </div>
                            <button
                                type="button"
                                className="bn-btn bn-btn-primary"
                                onClick={() => setPayOpen(true)}
                                disabled={holding}
                            >
                                Pay {money(totalAmount)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= PAY POPUP ================= */}
            {payOpen && selectedSeats.length > 0 && (
                <div
                    className="ss-modal-back"
                    onClick={() => { if (!holding) setPayOpen(false); }}
                    role="presentation"
                >
                    <div
                        className="ss-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Confirm and pay"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="ss-modal-x"
                            aria-label="Close"
                            disabled={holding}
                            onClick={() => setPayOpen(false)}
                        >
                            ×
                        </button>

                        <h3>Confirm &amp; Pay</h3>

                        <div className="ss-ev">
                            <div className="th">{ev.image && <img src={ev.image} alt="" />}</div>
                            <div>
                                <strong>{ev.name}</strong>
                                <small>{formatDate(ev.date)} • {formatTime(ev.start)}</small>
                                <br />
                                <small>{ev.stadium}</small>
                            </div>
                        </div>

                        <div className="ss-modal-list">
                            {selectedSeatDetails.map((seat) => (
                                <div key={seat.id} className="ss-modal-row">
                                    <span>
                                        <b>{seatLabelById[seat.id] || `Seat ${seat.number}`}</b>
                                        <small> · {seat.standName}</small>
                                    </span>
                                    <span>{money(seat.price)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="ss-total">
                            <span>Total amount ({selectedSeats.length} seat{selectedSeats.length === 1 ? "" : "s"})</span>
                            <strong>{money(totalAmount)}</strong>
                        </div>

                        {holdError && <div className="ss-error">{holdError}</div>}

                        <div className="ss-modal-actions">
                            <button
                                type="button"
                                className="bn-btn bn-btn-ghost"
                                disabled={holding}
                                onClick={() => setPayOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="bn-btn bn-btn-primary"
                                disabled={holding}
                                onClick={handleContinue}
                            >
                                {holding ? "Holding seats…" : `Pay ${money(totalAmount)}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {holdError && selectedSeats.length === 0 && (
                <div className="ss-error" style={{ marginTop: 12 }}>{holdError}</div>
            )}

        </div>
    );
}

export default SeatSelection;