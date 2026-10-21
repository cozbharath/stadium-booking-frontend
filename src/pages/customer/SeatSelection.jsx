import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { formatDate, formatTime, normalizeEvent } from "../../components/common/eventUtils";
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
    // CREATE SEAT ROWS (for the active stand only)
    // =========================================================

    const rows = useMemo(() => {
        const standSeats = activeStand?.seats || [];

        if (!standSeats.length) {
            return [];
        }

        /*
         * If backend provides row information,
         * use that information.
         */
        const hasRealRows = standSeats.some(
            (seat) =>
                seat.row !== null &&
                seat.row !== undefined &&
                String(seat.row).trim() !== ""
        );

        if (hasRealRows) {
            const grouped = {};

            standSeats.forEach((seat) => {
                const rowName = String(
                    seat.row ?? "A"
                ).toUpperCase();

                if (!grouped[rowName]) {
                    grouped[rowName] = [];
                }

                grouped[rowName].push(seat);
            });

            return Object.entries(grouped)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(
                    ([rowName, rowSeats]) => [
                        rowName,
                        rowSeats.sort((a, b) => {
                            if (
                                a.column !== null &&
                                b.column !== null
                            ) {
                                return (
                                    Number(a.column) -
                                    Number(b.column)
                                );
                            }

                            return (
                                a.sortNumber -
                                b.sortNumber
                            );
                        })
                    ]
                );
        }

        /*
         * Backend did not provide row information for this
         * stand, so lay the seats out automatically.
         *
         * Exactly 20 seats per row (A1-A20, B1-B20 ...).
         */
        const SEATS_PER_ROW = 20;

        const generatedRows = [];

        for (
            let i = 0;
            i < standSeats.length;
            i += SEATS_PER_ROW
        ) {
            generatedRows.push([
                String.fromCharCode(
                    65 + generatedRows.length
                ),
                standSeats.slice(i, i + SEATS_PER_ROW)
            ]);
        }

        return generatedRows;
    }, [activeStand]);

    /*
     * The widest row decides how many number columns (1, 2, 3 ...)
     * are shown above the grid, so every row lines up under the
     * same column headers instead of sliding sideways.
     */
    const maxColumns = useMemo(() => {
        if (!rows.length) {
            return 0;
        }

        return Math.max(
            ...rows.map(([, rowSeats]) => rowSeats.length)
        );
    }, [rows]);


    // "A5", "B12" … label for every seat of the active stand (used in the summary)
    const seatLabelById = useMemo(() => {
        const map = {};
        rows.forEach(([rowName, rowSeats]) => {
            rowSeats.forEach((seat, col) => {
                map[seat.id] = `${rowName}${col + 1}`;
            });
        });
        return map;
    }, [rows]);

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

    const handleSelectStand = (standName) => {
        setSelectedStand(standName);
        setHoldError("");
        // scrolling effect: glide to the top of the map
        requestAnimationFrame(() => {
            mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    };

    const handleChangeStand = () => {
        setSelectedStand(null);
        setSelectedSeats([]);
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
    const priceRange = (s) =>
        s.minPrice === s.maxPrice ? money(s.minPrice) : `${money(s.minPrice)} – ${money(s.maxPrice)}`;

    const availableInStand = activeStand
        ? activeStand.seats.filter((s) => s.status === "available").length
        : 0;

    return (
        <div className={`ss ${selectedSeats.length > 0 ? "has-dock" : ""}`}>

            {/* TOP BAR */}
            <div className="ss-top">
                <Link to={`/customer/events/${eventId}`} className="ss-back" aria-label="Back to event">←</Link>
                <div>
                    <h1>{ev.name}</h1>
                    <p>{ev.stadium} • {formatDate(ev.date)} • {formatTime(ev.start)}</p>
                </div>
                <div className="ss-steps">
                    <span className={!activeStand ? "on" : ""}>1 Stand</span>
                    <span className={activeStand ? "on" : ""}>2 Seats</span>
                    <span>3 Pay</span>
                </div>
            </div>

            <div className="ss-layout">

                {/* ================= STADIUM ================= */}
                <section className="ss-stage" ref={mapRef} style={{ scrollMarginTop: "calc(var(--yt-nav-h) + 12px)" }}>
                    <div className="ss-stage-in">

                        {!activeStand ? (
                            <>
                                <div className="ss-stage-head"><h2>Select a stand</h2></div>

                                <div className="ss-pitch">
                                    <div className="ss-pitch-bar" />
                                    <span>PLAYING AREA</span>
                                </div>

                                {stands.length === 0 ? (
                                    <div className="ss-empty" style={{ color: "#c9c9dc" }}>
                                        <span>🏟️</span>No seats have been configured for this event yet.
                                    </div>
                                ) : (
                                    <div className="ss-stands">
                                        {stands.map((stand, i) => (
                                            <button
                                                key={stand.name}
                                                type="button"
                                                className="ss-stand"
                                                style={{ "--c": stand.color, "--i": i }}
                                                disabled={stand.availableCount === 0}
                                                onClick={() => handleSelectStand(stand.name)}
                                            >
                                                <strong>{stand.name}</strong>
                                                <span className="p">{priceRange(stand)} <small style={{ fontWeight: 500, color: "#b4b4cc" }}>/ seat</small></span>
                                                <span className="m">
                                                    {stand.availableCount === 0
                                                        ? "Sold out"
                                                        : `${stand.availableCount} of ${stand.totalCount} available`}
                                                </span>
                                                <div className="ss-bar">
                                                    <i style={{ width: `${(stand.availableCount / Math.max(stand.totalCount, 1)) * 100}%` }} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="ss-stage-head">
                                    <div>
                                        <h2 style={{ color: "#ffd166" }}>{activeStand.name}</h2>
                                        <span className="ss-price-badge" style={{ display: "inline-block", marginTop: 6 }}>
                                            {priceRange(activeStand)} per seat
                                        </span>
                                    </div>
                                    {stands.length > 1 && (
                                        <button type="button" className="ss-change" onClick={handleChangeStand}>← Change stand</button>
                                    )}
                                </div>

                                <div className="ss-pitch">
                                    <div className="ss-pitch-bar" />
                                    <span>PLAYING AREA / STAGE</span>
                                </div>

                                {rows.length === 0 ? (
                                    <div className="ss-empty" style={{ color: "#c9c9dc" }}>No seats configured for this stand.</div>
                                ) : (
                                    <div className="ss-scroll" role="group" aria-label="Seat map">
                                        <div className="ss-grid" style={{ "--cols": maxColumns }}>

                                            {/* column numbers 1 – 20 */}
                                            <div className="ss-colhead corner" />
                                            {Array.from({ length: maxColumns }, (_, i) => (
                                                <div key={i} className="ss-colhead">{i + 1}</div>
                                            ))}

                                            {/* rows A, B, C … each with seats 1 – 20 */}
                                            {rows.map(([rowName, rowSeats], r) => (
                                                <Row
                                                    key={rowName}
                                                    rowName={rowName}
                                                    rowSeats={rowSeats}
                                                    rowIndex={r}
                                                    maxColumns={maxColumns}
                                                    color={activeStand.color}
                                                    selectedSeats={selectedSeats}
                                                    holding={holding}
                                                    onSeatClick={handleSeatClick}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="ss-hint">↔ Swipe the map to see all 20 seats ↕</div>

                                <div className="ss-legend">
                                    <span><i style={{ background: activeStand.color }} />Available</span>
                                    <span><i style={{ background: "#f84464", boxShadow: "0 0 8px #f84464" }} />Selected</span>
                                    <span><i style={{ background: "#3a3a52" }} />Sold</span>
                                </div>

                                <div className="ss-counts">
                                    <span>Total <b>{activeStand.seats.length}</b></span>
                                    <span>Available <b>{availableInStand}</b></span>
                                    <span>Selected <b>{selectedSeats.length}</b></span>
                                </div>
                            </>
                        )}
                    </div>
                </section>

            </div>

            {/* ================= YOUR SELECTION (bottom dock, only when seats are selected) ================= */}
            {selectedSeats.length > 0 && (
                <div className="ss-dock" role="region" aria-label="Your selection">
                    <div className="ss-dock-in">

                        <div className="ss-dock-head">
                            <div>
                                <h3>Your selection</h3>
                                <small>{ev.name}{activeStand ? ` • ${activeStand.name}` : ""}</small>
                            </div>
                            <button type="button" className="ss-clear" onClick={handleClearSelection}>Clear all</button>
                        </div>

                        <div className="ss-dock-seats">
                            {selectedSeatDetails.map((seat) => (
                                <span key={seat.id} className="ss-chip">
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

/* One row of seats (row letter + up to 20 seats, labelled 1 – 20) */
function Row({ rowName, rowSeats, rowIndex, maxColumns, color, selectedSeats, holding, onSeatClick }) {
    const cells = [];

    for (let col = 0; col < maxColumns; col += 1) {
        const seat = rowSeats[col];

        if (!seat) {
            cells.push(<span key={`gap-${col}`} />);
            continue;
        }

        const selected = selectedSeats.includes(seat.id);
        const booked = seat.status === "booked";
        const label = `${rowName}${col + 1}`;
        const state = booked ? "taken" : selected ? "sel" : "free";

        cells.push(
            <button
                key={seat.id}
                type="button"
                className={`ss-seat ${state}`}
                style={{ "--c": color, "--i": rowIndex * 4 + col }}
                disabled={booked || holding}
                aria-pressed={selected}
                aria-label={`Seat ${label}${booked ? " sold" : ""}`}
                data-tip={booked ? `${label} · Sold` : `${label} · ₹${Number(seat.price || 0).toLocaleString("en-IN")}`}
                onClick={() => onSeatClick(seat)}
            >
                {col + 1}
            </button>
        );
    }

    return (
        <>
            <div className="ss-rowlabel">{rowName}</div>
            {cells}
        </>
    );
}

export default SeatSelection;