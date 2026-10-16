import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
            setSelectedStand(stands[0].name);
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
         * Maximum 10 seats per row.
         */
        const SEATS_PER_ROW = 10;

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
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div style={pageStyle}>
                <div style={loadingStyle}>
                    <div style={spinnerStyle}></div>

                    <h2>Loading Seats...</h2>

                    <p>
                        Please wait while we load the
                        available seats.
                    </p>
                </div>
            </div>
        );
    }

    // =========================================================
    // ERROR
    // =========================================================

    if (error) {
        return (
            <div style={pageStyle}>
                <div style={errorStyle}>
                    <div style={errorIconStyle}>
                        !
                    </div>

                    <h2>Unable to Load Seats</h2>

                    <p>{error}</p>

                    <button
                        type="button"
                        onClick={loadEventAndSeats}
                        style={primaryButtonStyle}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // =========================================================
    // MAIN UI
    // =========================================================

    return (
        <div style={pageStyle}>
            {/* RESPONSIVE OVERRIDES FOR SMALL SCREENS */}
            <style>{`
                @media (max-width: 900px) {
                    .ss-header {
                        padding: 18px 16px !important;
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 10px !important;
                    }

                    .ss-content {
                        grid-template-columns: 1fr !important;
                        padding: 14px !important;
                        gap: 14px !important;
                    }

                    .ss-seat-area {
                        padding: 14px !important;
                    }

                    .ss-summary {
                        position: static !important;
                        top: auto !important;
                    }

                    .ss-title {
                        font-size: 24px !important;
                    }

                    .ss-stand-grid {
                        grid-template-columns: 1fr !important;
                    }
                }

                @media (max-width: 480px) {
                    .ss-title {
                        font-size: 20px !important;
                    }

                    .ss-row-seats {
                        gap: 6px !important;
                    }
                }
            `}</style>

            {/* HEADER */}
            <section style={headerStyle} className="ss-header">
                <div>
                    <div style={tagStyle}>
                        BOOK YOUR TICKET
                    </div>

                    <h1 style={titleStyle} className="ss-title">
                        Select Your Seats
                    </h1>

                    <p style={subtitleStyle}>
                        {activeStand
                            ? `Choose seats in ${activeStand.name}.`
                            : "Choose a stand, then pick your seats."}
                    </p>
                </div>

                <div style={eventBadgeStyle}>
                    Event #{eventId}
                </div>
            </section>

            {/* MAIN CONTENT */}
            <section style={contentStyle} className="ss-content">
                {/* LEFT - STAND SELECTION OR SEAT MAP */}
                <div style={seatAreaStyle} className="ss-seat-area">

                    {!activeStand ? (

                        /* =========================================
                           STEP: SELECT STAND
                        ========================================= */

                        <div>
                            <div style={stadiumTitleStyle}>
                                SELECT A STAND
                            </div>

                            {stands.length === 0 ? (
                                <div style={emptyStyle}>
                                    <h3>No Seats Available</h3>
                                    <p>
                                        There are no seats
                                        configured for this
                                        event yet.
                                    </p>
                                </div>
                            ) : (
                                <div style={standGridStyle} className="ss-stand-grid">
                                    {stands.map((stand) => (
                                        <button
                                            key={stand.name}
                                            type="button"
                                            onClick={() =>
                                                handleSelectStand(
                                                    stand.name
                                                )
                                            }
                                            disabled={
                                                stand.availableCount === 0
                                            }
                                            style={getStandCardStyle(
                                                stand
                                            )}
                                        >
                                            <span
                                                style={{
                                                    ...standDotStyle,
                                                    background:
                                                        stand.color
                                                }}
                                            ></span>

                                            <strong style={standNameStyle}>
                                                {stand.name}
                                            </strong>

                                            <span style={standPriceStyle}>
                                                {stand.minPrice ===
                                                stand.maxPrice
                                                    ? `₹${stand.minPrice.toLocaleString("en-IN")}`
                                                    : `₹${stand.minPrice.toLocaleString("en-IN")} - ₹${stand.maxPrice.toLocaleString("en-IN")}`}
                                                {" "}per seat
                                            </span>

                                            <span style={standMetaStyle}>
                                                {stand.availableCount === 0
                                                    ? "Sold Out"
                                                    : `${stand.availableCount} of ${stand.totalCount} available`}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                    ) : (

                        /* =========================================
                           STEP: PICK SEATS (within chosen stand)
                        ========================================= */

                        <div>
                            <div style={standHeaderRowStyle}>
                                <div>
                                    <div style={stadiumTitleStyle}>
                                        {activeStand.name.toUpperCase()}
                                    </div>

                                    <div style={standPriceBadgeStyle}>
                                        {activeStand.minPrice === activeStand.maxPrice
                                            ? `₹${activeStand.minPrice.toLocaleString("en-IN")} per seat`
                                            : `₹${activeStand.minPrice.toLocaleString("en-IN")} - ₹${activeStand.maxPrice.toLocaleString("en-IN")} per seat`}
                                    </div>
                                </div>

                                {stands.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={handleChangeStand}
                                        style={changeStandButtonStyle}
                                    >
                                        ← Change Stand
                                    </button>
                                )}
                            </div>

                            {/* STAGE */}
                            <div style={stageWrapperStyle}>
                                <div style={stageStyle}>
                                    STAGE / PLAYING AREA
                                </div>
                            </div>

                            {/* SEAT MAP */}
                            <div style={seatMapContainerStyle}>
                                {rows.length === 0 ? (
                                    <div style={emptyStyle}>
                                        <h3>
                                            No Seats Available
                                        </h3>

                                        <p>
                                            There are no seats
                                            configured for this
                                            stand.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {/* COLUMN HEADER NUMBERS */}
                                        <div style={seatRowStyle}>
                                            <div style={rowLabelStyle}></div>

                                            <div
                                                style={{
                                                    ...seatGroupStyle,
                                                    gridTemplateColumns: `repeat(${maxColumns}, 34px)`
                                                }}
                                            >
                                                {Array.from(
                                                    { length: maxColumns },
                                                    (_, index) => (
                                                        <div
                                                            key={index}
                                                            style={columnNumberStyle}
                                                        >
                                                            {index + 1}
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {rows.map(
                                            ([rowName, rowSeats]) => (
                                                <div
                                                    key={rowName}
                                                    style={seatRowStyle}
                                                >
                                                    {/* ROW LABEL */}
                                                    <div
                                                        style={
                                                            rowLabelStyle
                                                        }
                                                    >
                                                        {rowName}
                                                    </div>

                                                    {/* SEATS */}
                                                    <div
                                                        style={{
                                                            ...seatGroupStyle,
                                                            gridTemplateColumns: `repeat(${maxColumns}, 34px)`
                                                        }}
                                                    >
                                                        {rowSeats.map(
                                                            (seat) => {
                                                                const selected =
                                                                    selectedSeats.includes(
                                                                        seat.id
                                                                    );

                                                                const booked =
                                                                    seat.status ===
                                                                    "booked";

                                                                return (
                                                                    <button
                                                                        key={
                                                                            seat.id
                                                                        }
                                                                        type="button"
                                                                        disabled={
                                                                            booked ||
                                                                            holding
                                                                        }
                                                                        onClick={() =>
                                                                            handleSeatClick(
                                                                                seat
                                                                            )
                                                                        }
                                                                        title={
                                                                            booked
                                                                                ? `Seat ${seat.number} is booked`
                                                                                : `Seat ${seat.number} - ₹${seat.price}`
                                                                        }
                                                                        style={getSeatStyle(
                                                                            {
                                                                                selected,
                                                                                booked
                                                                            }
                                                                        )}
                                                                    >
                                                                    </button>
                                                                );
                                                            }
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </>
                                )}
                            </div>

                            {/* LEGEND */}
                            <div style={legendStyle}>
                                <LegendItem
                                    type="available"
                                    label="Available"
                                />

                                <LegendItem
                                    type="selected"
                                    label="Selected"
                                />

                                <LegendItem
                                    type="booked"
                                    label="Booked"
                                />
                            </div>

                            {/* SEAT COUNT */}
                            <div style={seatCountStyle}>
                                <span>
                                    Total Seats:{" "}
                                    <strong>
                                        {activeStand.seats.length}
                                    </strong>
                                </span>

                                <span>
                                    Available:{" "}
                                    <strong>
                                        {
                                            activeStand.seats.filter(
                                                (seat) =>
                                                    seat.status ===
                                                    "available"
                                            ).length
                                        }
                                    </strong>
                                </span>

                                <span>
                                    Selected:{" "}
                                    <strong>
                                        {selectedSeats.length}
                                    </strong>
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT - BOOKING SESSION / SUMMARY */}
                <aside style={summaryStyle} className="ss-summary">
                    <div style={tagStyle}>
                        BOOKING SUMMARY
                    </div>

                    <h2 style={summaryTitleStyle}>
                        Your Selection
                    </h2>

                    {/* EVENT */}
                    <div style={eventInfoStyle}>
                        <span>EVENT</span>

                        <strong>
                            {event?.name ||
                                event?.eventName ||
                                event?.title ||
                                "Selected Event"}
                        </strong>
                    </div>

                    {/* STAND */}
                    {activeStand && (
                        <div style={eventInfoStyle}>
                            <span>STAND</span>

                            <strong>
                                {activeStand.name}
                            </strong>
                        </div>
                    )}

                    {/* SELECTED SEATS */}
                    <div style={summarySectionStyle}>
                        <div
                            style={
                                summarySectionHeaderStyle
                            }
                        >
                            <span>
                                Selected Seats
                            </span>

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px"
                                }}
                            >
                                <strong>
                                    {selectedSeats.length}
                                </strong>

                                {selectedSeats.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleClearSelection}
                                        style={clearAllButtonStyle}
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                        </div>

                        {selectedSeatDetails.length ===
                        0 ? (
                            <div
                                style={
                                    noSelectionStyle
                                }
                            >
                                <span>
                                    🎟️
                                </span>

                                <p>
                                    No seats selected
                                    yet.
                                </p>

                                <small>
                                    {activeStand
                                        ? "Select seats from the stadium map."
                                        : "Select a stand to view seats."}
                                </small>
                            </div>
                        ) : (
                            <div
                                style={
                                    selectedListStyle
                                }
                            >
                                {selectedSeatDetails.map(
                                    (seat) => (
                                        <div
                                            key={
                                                seat.id
                                            }
                                            style={
                                                selectedSeatStyle
                                            }
                                        >
                                            <div>
                                                <strong>
                                                    Seat{" "}
                                                    {
                                                        seat.number
                                                    }
                                                </strong>

                                                <small>
                                                    {seat.standName}
                                                </small>
                                            </div>

                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "10px"
                                                }}
                                            >
                                                <strong>
                                                    ₹
                                                    {
                                                        seat.price
                                                    }
                                                </strong>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleSeatClick(seat)
                                                    }
                                                    style={removeSeatButtonStyle}
                                                    title="Remove seat"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </div>

                    {/* TOTAL */}
                    <div style={totalStyle}>
                        <span>
                            Total Amount
                        </span>

                        <strong>
                            ₹{totalAmount.toLocaleString(
                                "en-IN"
                            )}
                        </strong>
                    </div>

                    {/* HOLD ERROR */}
                    {holdError && (
                        <div
                            style={
                                holdErrorStyle
                            }
                        >
                            ⚠️ {holdError}
                        </div>
                    )}

                    {/* CONTINUE */}
                    <button
                        type="button"
                        disabled={
                            selectedSeats.length ===
                                0 || holding
                        }
                        onClick={handleContinue}
                        style={{
                            ...continueButtonStyle,
                            opacity:
                                selectedSeats.length ===
                                    0 || holding
                                    ? 0.5
                                    : 1,
                            cursor:
                                selectedSeats.length ===
                                    0 || holding
                                    ? "not-allowed"
                                    : "pointer"
                        }}
                    >
                        {holding
                            ? "Holding Seats..."
                            : "Continue to Booking →"}
                    </button>

                    {/* BACK */}
                    <Link
                        to={`/customer/events/${eventId}`}
                        style={backButtonStyle}
                    >
                        ← Back to Event
                    </Link>

                    {/* HOLD INFO */}
                    <div style={holdInfoStyle}>
                        🔒 Selected seats will be
                        held for <strong>10 minutes</strong>.
                    </div>
                </aside>
            </section>
        </div>
    );
}

// =========================================================
// LEGEND COMPONENT
// =========================================================

function LegendItem({ type, label }) {
    return (
        <div style={legendItemStyle}>
            <span
                style={getLegendBoxStyle(type)}
            ></span>

            <span>{label}</span>
        </div>
    );
}

// =========================================================
// SEAT STYLE
// =========================================================

function getSeatStyle({ selected, booked }) {
    let background = "#ffffff";
    let border = "#2563eb";
    let color = "#1d4ed8";
    let shadow =
        "0 2px 6px rgba(37, 99, 235, 0.15)";

    if (booked) {
        background = "#e5e7eb";
        border = "#9ca3af";
        color = "#6b7280";
        shadow = "none";
    }

    if (selected) {
        background = "#2563eb";
        border = "#1d4ed8";
        color = "#ffffff";
        shadow =
            "0 5px 15px rgba(37, 99, 235, 0.35)";
    }

    return {
        width: "26px",
        height: "26px",
        minWidth: "26px",
        borderRadius: "50%",
        border: `2px solid ${border}`,
        background,
        color,
        fontSize: "0",
        fontWeight: "700",
        cursor: booked
            ? "not-allowed"
            : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition:
            "all 0.18s ease",
        boxShadow: shadow,
        position: "relative",
        padding: 0
    };
}

// =========================================================
// STAND CARD STYLE
// =========================================================

function getStandCardStyle(stand) {
    const soldOut = stand.availableCount === 0;

    return {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "6px",
        padding: "18px",
        borderRadius: "14px",
        border: `2px solid ${soldOut ? "#e5e7eb" : stand.color}33`,
        background: soldOut ? "#f8fafc" : "#ffffff",
        cursor: soldOut ? "not-allowed" : "pointer",
        opacity: soldOut ? 0.6 : 1,
        textAlign: "left",
        transition: "all 0.18s ease",
        boxShadow: soldOut
            ? "none"
            : "0 4px 14px rgba(15, 23, 42, 0.06)"
    };
}

// =========================================================
// STYLES
// =========================================================

const pageStyle = {
    minHeight: "100vh",
    width: "100%",
    background: "#f3f8fc",
    color: "#172033",
    boxSizing: "border-box"
};

const headerStyle = {
    padding: "32px 40px",
    background:
        "linear-gradient(135deg, #ffffff, #eef6ff)",
    borderBottom:
        "1px solid #dbe7f3",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px"
};

const tagStyle = {
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "1.8px",
    color: "#2563eb",
    marginBottom: "8px"
};

const titleStyle = {
    margin: 0,
    fontSize: "32px",
    fontWeight: "800",
    color: "#111827"
};

const subtitleStyle = {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "15px"
};

const eventBadgeStyle = {
    padding: "12px 18px",
    borderRadius: "10px",
    background: "#ffffff",
    border: "1px solid #dbe7f3",
    color: "#2563eb",
    fontWeight: "700",
    whiteSpace: "nowrap"
};

const contentStyle = {
    display: "grid",
    gridTemplateColumns:
        "minmax(0, 1fr) 350px",
    gap: "24px",
    padding: "28px 40px 40px",
    boxSizing: "border-box",
    alignItems: "start"
};

const seatAreaStyle = {
    background: "#ffffff",
    borderRadius: "18px",
    border: "1px solid #dbe7f3",
    padding: "28px",
    boxShadow:
        "0 5px 20px rgba(15, 23, 42, 0.05)",
    minWidth: 0,
    overflowX: "auto"
};

const stadiumTitleStyle = {
    textAlign: "center",
    fontSize: "13px",
    fontWeight: "800",
    letterSpacing: "2px",
    color: "#64748b",
    marginBottom: "18px"
};

const standGridStyle = {
    display: "grid",
    gridTemplateColumns:
        "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "16px"
};

const standDotStyle = {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    display: "inline-block"
};

const standNameStyle = {
    fontSize: "16px",
    color: "#111827"
};

const standPriceStyle = {
    fontSize: "14px",
    color: "#2563eb",
    fontWeight: "700"
};

const standMetaStyle = {
    fontSize: "12px",
    color: "#64748b"
};

const standHeaderRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "10px"
};

const standPriceBadgeStyle = {
    display: "inline-block",
    padding: "6px 14px",
    borderRadius: "999px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "13px",
    fontWeight: "700",
    marginBottom: "10px"
};

const changeStandButtonStyle = {
    border: "1px solid #dbe7f3",
    background: "#ffffff",
    color: "#2563eb",
    padding: "9px 16px",
    borderRadius: "9px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    whiteSpace: "nowrap"
};

const stageWrapperStyle = {
    display: "flex",
    justifyContent: "center",
    marginBottom: "38px"
};

const stageStyle = {
    width: "70%",
    maxWidth: "650px",
    minWidth: "280px",
    height: "58px",
    borderRadius:
        "0 0 50% 50%",
    background:
        "linear-gradient(180deg, #dbeafe, #bfdbfe)",
    border:
        "2px solid #93c5fd",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#1d4ed8",
    fontSize: "13px",
    fontWeight: "800",
    letterSpacing: "1px",
    boxShadow:
        "0 8px 20px rgba(37, 99, 235, 0.10)"
};

const seatMapContainerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    alignItems: "flex-start",
    width: "100%",
    padding: "10px 0 25px"
};

const seatRowStyle = {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    width: "100%"
};

const rowLabelStyle = {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "#eff6ff",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "800",
    flexShrink: 0
};

const seatGroupStyle = {
    display: "grid",
    gap: "10px",
    justifyItems: "center"
};

const columnNumberStyle = {
    fontSize: "11px",
    fontWeight: "700",
    color: "#94a3b8",
    textAlign: "center"
};

const legendStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "28px",
    borderTop: "1px solid #e5edf5",
    paddingTop: "22px",
    marginTop: "10px",
    flexWrap: "wrap"
};

const legendItemStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#475569"
};

function getLegendBoxStyle(type) {
    const styles = {
        available: {
            background: "#ffffff",
            border: "2px solid #2563eb"
        },
        selected: {
            background: "#2563eb",
            border: "2px solid #1d4ed8"
        },
        booked: {
            background: "#e5e7eb",
            border: "2px solid #9ca3af"
        }
    };

    return {
        width: "18px",
        height: "18px",
        borderRadius: "5px",
        display: "inline-block",
        boxSizing: "border-box",
        ...styles[type]
    };
}

const seatCountStyle = {
    display: "flex",
    justifyContent: "center",
    gap: "28px",
    flexWrap: "wrap",
    marginTop: "20px",
    padding: "14px",
    background: "#f8fafc",
    borderRadius: "10px",
    fontSize: "13px",
    color: "#64748b"
};

const summaryStyle = {
    background: "#ffffff",
    borderRadius: "18px",
    border: "1px solid #dbe7f3",
    padding: "25px",
    boxShadow:
        "0 5px 20px rgba(15, 23, 42, 0.05)",
    position: "sticky",
    top: "90px"
};

const summaryTitleStyle = {
    margin: "0 0 22px",
    fontSize: "25px",
    color: "#111827"
};

const eventInfoStyle = {
    padding: "14px",
    borderRadius: "10px",
    background: "#f8fafc",
    border: "1px solid #e5edf5",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    marginBottom: "16px"
};

const summarySectionStyle = {
    borderTop:
        "1px solid #e5edf5",
    borderBottom:
        "1px solid #e5edf5",
    padding: "20px 0"
};

const summarySectionHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: "700",
    marginBottom: "15px"
};

const clearAllButtonStyle = {
    border: "none",
    background: "none",
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    padding: 0
};

const noSelectionStyle = {
    textAlign: "center",
    padding: "25px 10px",
    color: "#64748b"
};

const selectedListStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxHeight: "230px",
    overflowY: "auto"
};

const selectedSeatStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "11px 12px",
    background: "#eff6ff",
    border:
        "1px solid #dbeafe",
    borderRadius: "9px",
    color: "#1e40af"
};

const removeSeatButtonStyle = {
    border: "none",
    background: "none",
    color: "#1e40af",
    fontSize: "18px",
    lineHeight: 1,
    cursor: "pointer",
    padding: 0
};

const totalStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "22px 0",
    fontSize: "15px"
};

const holdErrorStyle = {
    padding: "12px",
    borderRadius: "9px",
    background: "#fef2f2",
    color: "#b91c1c",
    border:
        "1px solid #fecaca",
    fontSize: "13px",
    marginBottom: "15px"
};

const continueButtonStyle = {
    width: "100%",
    border: "none",
    borderRadius: "10px",
    padding: "15px",
    background:
        "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    fontWeight: "800",
    fontSize: "14px",
    boxShadow:
        "0 8px 18px rgba(37, 99, 235, 0.25)"
};

const backButtonStyle = {
    display: "block",
    textAlign: "center",
    marginTop: "14px",
    padding: "12px",
    borderRadius: "9px",
    border:
        "1px solid #dbe7f3",
    color: "#475569",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "600"
};

const holdInfoStyle = {
    marginTop: "16px",
    padding: "11px",
    background: "#fffbeb",
    color: "#92400e",
    borderRadius: "8px",
    fontSize: "12px",
    textAlign: "center"
};

const loadingStyle = {
    minHeight: "70vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#475569"
};

const spinnerStyle = {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    border: "4px solid #dbeafe",
    borderTopColor: "#2563eb",
    marginBottom: "20px",
    animation: "spin 1s linear infinite"
};

const errorStyle = {
    minHeight: "70vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "30px"
};

const errorIconStyle = {
    width: "55px",
    height: "55px",
    borderRadius: "50%",
    background: "#fee2e2",
    color: "#dc2626",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
    fontWeight: "800",
    marginBottom: "15px"
};

const primaryButtonStyle = {
    marginTop: "15px",
    padding: "12px 24px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer"
};

const emptyStyle = {
    padding: "60px 20px",
    textAlign: "center",
    color: "#64748b"
};

export default SeatSelection;