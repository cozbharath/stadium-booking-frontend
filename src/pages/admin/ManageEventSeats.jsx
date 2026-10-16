import { useEffect, useMemo, useState } from "react";
import { get, post, put, remove } from "../../services/api";

function ManageEventSeats() {
    const [eventSeats, setEventSeats] = useState([]);
    const [events, setEvents] = useState([]);
    const [seats, setSeats] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [editingSeat, setEditingSeat] = useState(null);
    const [bulkMode, setBulkMode] = useState(false);

    const [search, setSearch] = useState("");
    const [eventFilter, setEventFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [loading, setLoading] = useState(true);
    const [loadingSeats, setLoadingSeats] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [formData, setFormData] = useState({
        eventId: "",
        seatId: "",
        price: ""
    });

    const [bulkFormData, setBulkFormData] = useState({
        eventId: "",
        price: ""
    });

    const [selectedSeatIds, setSelectedSeatIds] = useState(new Set());


    // =========================================================
    // SUCCESS BANNER
    // =========================================================

    const showSuccess = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(""), 2500);
    };


    // =========================================================
    // LOAD EVENTS + SEATS
    // =========================================================

    const loadBaseData = async () => {
        try {
            setLoading(true);
            setError("");

            const [eventData, seatData] = await Promise.all([
                get("/events"),
                get("/seats")
            ]);

            setEvents(
                Array.isArray(eventData)
                    ? eventData
                    : []
            );

            setSeats(
                Array.isArray(seatData)
                    ? seatData
                    : []
            );

        } catch (err) {
            console.error(
                "Load events/seats error:",
                err
            );

            setError(
                err.message ||
                "Failed to load events and seats."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        queueMicrotask(() => {
            loadBaseData();
        });
    }, []);

    // =========================================================
    // LOAD EVENT SEATS
    // =========================================================

    function mapEventSeat(
        eventSeat,
        event
    ) {

        const backendSeat =
            seats.find(
                (seat) =>
                    Number(seat.id) ===
                    Number(eventSeat.seatId)
            );

        const seatNumber =
            backendSeat?.seatNumber ??
            eventSeat.seatNumber;

        const rowNumber =
            backendSeat?.rowNumber ??
            eventSeat.rowNumber;

        const displaySeat =
            rowNumber
                ? `${rowNumber}-${seatNumber}`
                : String(seatNumber ?? "—");

        return {
            id: eventSeat.id,

            eventId:
                eventSeat.eventId ??
                event?.id,

            event:
                eventSeat.eventName ??
                event?.name ??
                "—",

            stadium:
                eventSeat.stadiumName ??
                "—",

            seat:
                displaySeat,

            seatId:
                eventSeat.seatId ??
                backendSeat?.id,

            stand:
                eventSeat.standName ??
                backendSeat?.standName ??
                "—",

            type:
                eventSeat.type ??
                "REGULAR",

            price:
                Number(
                    eventSeat.price ?? 0
                ),

            status:
                eventSeat.status ??
                "AVAILABLE"
        };
    };

    const loadEventSeats = async () => {
        try {
            setLoadingSeats(true);

            if (events.length === 0) {
                setEventSeats([]);
                return;
            }

            const responses = await Promise.all(
                events.map(async (event) => {
                    try {
                        const data = await get(
                            `/event-seats/event/${event.id}`
                        );

                        return {
                            event,
                            seats: Array.isArray(data)
                                ? data
                                : []
                        };

                    } catch (err) {
                        console.error(
                            `Failed to load event seats for event ${event.id}:`,
                            err
                        );

                        return {
                            event,
                            seats: []
                        };
                    }
                })
            );

            const combined = [];

            responses.forEach(
                ({ event, seats: seatsForEvent }) => {

                    seatsForEvent.forEach(
                        (eventSeat) => {

                            combined.push(
                                mapEventSeat(
                                    eventSeat,
                                    event
                                )
                            );
                        }
                    );
                }
            );

            setEventSeats(combined);

        } catch (err) {
            console.error(
                "Load event seats error:",
                err
            );

            setError(
                err.message ||
                "Failed to load event seats."
            );
        } finally {
            setLoadingSeats(false);
        }
    };

    useEffect(() => {

        queueMicrotask(() => {
            if (events.length > 0) {
                loadEventSeats();
            }
        });

    }, [events]);

    // =========================================================
    // GET SEAT BY ID
    // =========================================================

    const getSeat = (seatId) => {

        return seats.find(
            (seat) =>
                Number(seat.id) ===
                Number(seatId)
        );
    };

    // =========================================================
    // GET SEAT DISPLAY NAME
    // =========================================================

    const getSeatDisplayName = (seat) => {

        if (!seat) {
            return "—";
        }

        if (
            seat.rowNumber !== undefined &&
            seat.rowNumber !== null &&
            seat.rowNumber !== ""
        ) {
            return `${seat.rowNumber}-${seat.seatNumber}`;
        }

        return String(
            seat.seatNumber ?? seat.id
        );
    };

    // =========================================================
    // FILTER AVAILABLE SEATS (SINGLE FORM)
    // =========================================================

    const getAssignedSeatIds = (eventId, excludeEventSeatId) => {

        return eventSeats
            .filter(
                (eventSeat) =>
                    Number(eventSeat.eventId) === Number(eventId) &&
                    eventSeat.id !== excludeEventSeatId
            )
            .map(
                (eventSeat) =>
                    Number(eventSeat.seatId)
            );
    };

    const availableFormSeats = useMemo(() => {

        if (!formData.eventId) {
            return [];
        }

        const assignedSeatIds = getAssignedSeatIds(
            formData.eventId,
            editingSeat?.id
        );

        return seats.filter(
            (seat) => !assignedSeatIds.includes(Number(seat.id))
        );

    }, [
        seats,
        eventSeats,
        formData.eventId,
        editingSeat
    ]);

    // =========================================================
    // AVAILABLE SEATS FOR BULK MODE, GROUPED BY STAND > ROW
    // =========================================================

    const groupedBulkSeats = useMemo(() => {

        if (!bulkFormData.eventId) {
            return [];
        }

        const assignedSeatIds = getAssignedSeatIds(
            bulkFormData.eventId,
            null
        );

        const available = seats.filter(
            (seat) => !assignedSeatIds.includes(Number(seat.id))
        );

        const standsMap = new Map();

        available.forEach((seat) => {

            const standName = seat.standName || "Unassigned Stand";

            if (!standsMap.has(standName)) {
                standsMap.set(standName, new Map());
            }

            const rowsMap = standsMap.get(standName);
            const rowKey = seat.rowNumber ?? "—";

            if (!rowsMap.has(rowKey)) {
                rowsMap.set(rowKey, []);
            }

            rowsMap.get(rowKey).push(seat);
        });

        const result = [];

        standsMap.forEach((rowsMap, standName) => {

            const rows = [];

            rowsMap.forEach((seatList, rowKey) => {

                seatList.sort(
                    (a, b) => Number(a.seatNumber) - Number(b.seatNumber)
                );

                rows.push({ rowKey, seats: seatList });
            });

            rows.sort((a, b) =>
                String(a.rowKey).localeCompare(String(b.rowKey))
            );

            result.push({ standName, rows });
        });

        result.sort((a, b) => a.standName.localeCompare(b.standName));

        return result;

    }, [
        seats,
        eventSeats,
        bulkFormData.eventId
    ]);

    // =========================================================
    // SELECTION HELPERS (BULK MODE)
    // =========================================================

    const toggleSeat = (seatId) => {

        setSelectedSeatIds((previous) => {

            const next = new Set(previous);

            if (next.has(seatId)) {
                next.delete(seatId);
            } else {
                next.add(seatId);
            }

            return next;
        });
    };

    const toggleRow = (rowSeats) => {

        const rowIds = rowSeats.map((seat) => seat.id);
        const allSelected = rowIds.every((id) => selectedSeatIds.has(id));

        setSelectedSeatIds((previous) => {

            const next = new Set(previous);

            rowIds.forEach((id) => {
                if (allSelected) {
                    next.delete(id);
                } else {
                    next.add(id);
                }
            });

            return next;
        });
    };

    const clearSelection = () => {
        setSelectedSeatIds(new Set());
    };

    // =========================================================
    // FILTER TABLE
    // =========================================================

    const filteredSeats = useMemo(() => {

        const searchValue =
            search.toLowerCase().trim();

        return eventSeats.filter(
            (seat) => {

                const matchesSearch =
                    !searchValue ||
                    seat.seat
                        .toLowerCase()
                        .includes(searchValue) ||
                    seat.stand
                        .toLowerCase()
                        .includes(searchValue) ||
                    seat.event
                        .toLowerCase()
                        .includes(searchValue) ||
                    seat.stadium
                        .toLowerCase()
                        .includes(searchValue);

                const matchesEvent =
                    eventFilter === "ALL" ||
                    Number(seat.eventId) ===
                    Number(eventFilter);

                const matchesStatus =
                    statusFilter === "ALL" ||
                    seat.status === statusFilter;

                return (
                    matchesSearch &&
                    matchesEvent &&
                    matchesStatus
                );
            }
        );

    }, [
        eventSeats,
        search,
        eventFilter,
        statusFilter
    ]);

    // =========================================================
    // STATS
    // =========================================================

    const totalSeats =
        eventSeats.length;

    const availableSeats =
        eventSeats.filter(
            (seat) =>
                seat.status === "AVAILABLE"
        ).length;

    const bookedSeats =
        eventSeats.filter(
            (seat) =>
                seat.status === "BOOKED"
        ).length;

    const heldSeats =
        eventSeats.filter(
            (seat) =>
                seat.status === "HELD"
        ).length;

    // =========================================================
    // ADD MODAL (SINGLE)
    // =========================================================

    const openAddModal = () => {

        setEditingSeat(null);
        setBulkMode(false);

        setFormData({
            eventId: "",
            seatId: "",
            price: ""
        });

        setError("");

        setShowModal(true);
    };

    // =========================================================
    // ADD MODAL (BULK)
    // =========================================================

    const openBulkModal = () => {

        setEditingSeat(null);
        setBulkMode(true);

        setBulkFormData({
            eventId: "",
            price: ""
        });

        clearSelection();

        setError("");

        setShowModal(true);
    };

    // =========================================================
    // EDIT MODAL
    // =========================================================

    const openEditModal = (eventSeat) => {

        setEditingSeat(eventSeat);
        setBulkMode(false);

        setFormData({
            eventId:
                eventSeat.eventId ?? "",

            seatId:
                eventSeat.seatId ?? "",

            price:
                eventSeat.price ?? ""
        });

        setError("");

        setShowModal(true);
    };

    // =========================================================
    // CLOSE MODAL
    // =========================================================

    const closeModal = () => {

        if (submitting) {
            return;
        }

        setShowModal(false);
        setEditingSeat(null);
        setBulkMode(false);
        clearSelection();
        setError("");
    };

    // =========================================================
    // CHANGE (SINGLE)
    // =========================================================

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setFormData(
            (previous) => ({
                ...previous,
                [name]: value
            })
        );

        if (name === "eventId") {

            setFormData(
                (previous) => ({
                    ...previous,
                    eventId: value,
                    seatId: ""
                })
            );
        }
    };

    // =========================================================
    // CHANGE (BULK)
    // =========================================================

    const handleBulkChange = (e) => {

        const { name, value } = e.target;

        setBulkFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        if (name === "eventId") {
            clearSelection();
        }
    };

    // =========================================================
    // SUBMIT (SINGLE)
    // =========================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        if (
            !formData.eventId ||
            !formData.seatId ||
            !formData.price
        ) {
            setError(
                "Please select an event, seat and enter a price."
            );

            return;
        }

        try {

            setSubmitting(true);

            const eventSeatData = {
                eventId:
                    Number(formData.eventId),

                seatId:
                    Number(formData.seatId),

                price:
                    Number(formData.price)
            };

            if (editingSeat) {

                await put(
                    `/event-seats/${editingSeat.id}`,
                    eventSeatData
                );

                showSuccess(
                    "Event seat updated successfully."
                );

            } else {

                await post(
                    "/event-seats",
                    eventSeatData
                );

                showSuccess(
                    "Event seat created successfully."
                );
            }

            closeModal();

            await loadEventSeats();

        } catch (err) {

            console.error(
                "Save event seat error:",
                err
            );

            setError(
                err.message ||
                "Failed to save event seat."
            );

        } finally {

            setSubmitting(false);
        }
    };

    // =========================================================
    // SUBMIT (BULK)
    // =========================================================

    const handleBulkSubmit = async (e) => {

        e.preventDefault();

        setError("");

        if (!bulkFormData.eventId) {
            setError("Please select an event.");
            return;
        }

        if (selectedSeatIds.size === 0) {
            setError("Select at least one seat.");
            return;
        }

        if (
            bulkFormData.price === "" ||
            Number(bulkFormData.price) < 0
        ) {
            setError("Enter a valid price.");
            return;
        }

        try {

            setSubmitting(true);

            const bulkData = {
                eventId: Number(bulkFormData.eventId),
                seatIds: Array.from(selectedSeatIds),
                price: Number(bulkFormData.price)
            };

            const result = await post("/event-seats/bulk", bulkData);

            const count = Array.isArray(result) ? result.length : selectedSeatIds.size;

            showSuccess(`${count} seat(s) priced successfully.`);

            closeModal();

            await loadEventSeats();

        } catch (err) {

            console.error(
                "Bulk event seat save error:",
                err
            );

            setError(
                err.message ||
                "Failed to set prices for selected seats."
            );

        } finally {

            setSubmitting(false);
        }
    };

    // =========================================================
    // DELETE
    // =========================================================

    const handleDelete = async (id) => {

        const confirmDelete =
            window.confirm(
                "Are you sure you want to remove this event seat?"
            );

        if (!confirmDelete) {
            return;
        }

        try {

            setError("");

            await remove(
                `/event-seats/${id}`
            );

            showSuccess(
                "Event seat removed successfully."
            );

            await loadEventSeats();

        } catch (err) {

            console.error(
                "Delete event seat error:",
                err
            );

            setError(
                err.message ||
                "Failed to remove event seat."
            );
        }
    };

    // =========================================================
    // SELECTED FORM SEAT (SINGLE)
    // =========================================================

    const selectedFormSeat =
        getSeat(formData.seatId);

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="admin-management-page">

            {/* HEADER */}

            <div className="admin-page-header">

                <div>

                    <p className="page-tag">
                        EVENT SEAT MANAGEMENT
                    </p>

                    <h1>
                        Manage Event Seats
                    </h1>

                    <p>
                        Assign and manage seats for individual events.
                    </p>

                </div>

                <div style={{ display: "flex", gap: "10px" }}>

                    <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={openBulkModal}
                    >
                        + Bulk Set Price
                    </button>

                    <button
                        type="button"
                        className="admin-primary-button"
                        onClick={openAddModal}
                    >
                        + Add Event Seat
                    </button>

                </div>

            </div>


            {/* SUCCESS */}

            {successMessage && !showModal && (
                <div
                    style={{
                        marginBottom: "20px",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        background: "#dcfce7",
                        color: "#166534"
                    }}
                >
                    {successMessage}
                </div>
            )}


            {/* ERROR */}

            {error && !showModal && (

                <div
                    style={{
                        marginBottom: "20px",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        background: "#fee2e2",
                        color: "#991b1b"
                    }}
                >
                    {error}
                </div>

            )}


            {/* STATS */}

            <div className="admin-management-stats">

                <div className="admin-management-stat">
                    <div className="admin-stat-icon">💺</div>
                    <div>
                        <span>Total Seats</span>
                        <strong>{totalSeats}</strong>
                    </div>
                </div>

                <div className="admin-management-stat">
                    <div className="admin-stat-icon">🟢</div>
                    <div>
                        <span>Available</span>
                        <strong>{availableSeats}</strong>
                    </div>
                </div>

                <div className="admin-management-stat">
                    <div className="admin-stat-icon">🎟️</div>
                    <div>
                        <span>Booked</span>
                        <strong>{bookedSeats}</strong>
                    </div>
                </div>

                <div className="admin-management-stat">
                    <div className="admin-stat-icon">⏳</div>
                    <div>
                        <span>Held</span>
                        <strong>{heldSeats}</strong>
                    </div>
                </div>

            </div>


            {/* TABLE */}

            <div className="admin-table-card">

                <div className="admin-table-header">

                    <div>
                        <h2>Event Seats</h2>
                        <p>Manage seat availability for each event.</p>
                    </div>

                    <div className="admin-table-tools">

                        <input
                            type="text"
                            placeholder="Search seats..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="admin-search-input"
                        />

                        <select
                            value={eventFilter}
                            onChange={(e) => setEventFilter(e.target.value)}
                            className="admin-filter-select"
                        >
                            <option value="ALL">All Events</option>
                            {events.map((event) => (
                                <option key={event.id} value={event.id}>
                                    {event.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="admin-filter-select"
                        >
                            <option value="ALL">All Status</option>
                            <option value="AVAILABLE">Available</option>
                            <option value="BOOKED">Booked</option>
                            <option value="HELD">Held</option>
                            <option value="BLOCKED">Blocked</option>
                        </select>

                    </div>

                </div>


                <div className="admin-table-wrapper">

                    <table className="admin-users-table admin-event-seats-table">

                        <thead>
                            <tr>
                                <th>EVENT</th>
                                <th>SEAT</th>
                                <th>STAND</th>
                                <th>TYPE</th>
                                <th>PRICE</th>
                                <th>STATUS</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>

                        <tbody>

                            {loading || loadingSeats ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: "center", padding: "30px" }}>
                                        Loading event seats...
                                    </td>
                                </tr>
                            ) : filteredSeats.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="admin-empty-state">
                                        No event seats found.
                                    </td>
                                </tr>
                            ) : (
                                filteredSeats.map((seat) => (
                                    <tr key={seat.id}>

                                        <td>
                                            <div className="admin-event-seat-event">
                                                <div className="admin-event-seat-icon">🎟️</div>
                                                <div>
                                                    <strong>{seat.event}</strong>
                                                    <span>{seat.stadium}</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="admin-seat-number">{seat.seat}</div>
                                        </td>

                                        <td>
                                            <span className="admin-stadium-cell">{seat.stand}</span>
                                        </td>

                                        <td>
                                            <span className={`admin-event-seat-type ${String(seat.type).toLowerCase()}`}>
                                                {seat.type}
                                            </span>
                                        </td>

                                        <td>
                                            <strong className="admin-event-seat-price">
                                                ₹{Number(seat.price || 0).toLocaleString()}
                                            </strong>
                                        </td>

                                        <td>
                                            <span className={`admin-seat-status ${String(seat.status || "AVAILABLE").toLowerCase()}`}>
                                                <span className="seat-status-dot"></span>
                                                {seat.status || "AVAILABLE"}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="admin-table-actions">

                                                <button
                                                    type="button"
                                                    className="admin-action-button edit"
                                                    title="Edit"
                                                    onClick={() => openEditModal(seat)}
                                                >
                                                    ✏️
                                                </button>

                                                <button
                                                    type="button"
                                                    className="admin-action-button delete"
                                                    title="Delete"
                                                    onClick={() => handleDelete(seat.id)}
                                                >
                                                    🗑️
                                                </button>

                                            </div>
                                        </td>

                                    </tr>
                                ))
                            )}

                        </tbody>

                    </table>

                </div>


                <div className="admin-table-pagination">

                    <span>
                        Showing {filteredSeats.length} of {eventSeats.length} event seats
                    </span>

                    <div className="pagination-buttons">
                        <button type="button" disabled>Previous</button>
                        <button type="button" className="active">1</button>
                        <button type="button" disabled>Next</button>
                    </div>

                </div>

            </div>


            {/* MODAL */}

            {showModal && (

                <div
                    className="admin-modal-overlay"
                    onClick={closeModal}
                >

                    <div
                        className="admin-modal admin-event-seat-modal"
                        onClick={(e) => e.stopPropagation()}
                        style={bulkMode ? { maxWidth: "640px" } : undefined}
                    >

                        {/* HEADER */}

                        <div className="admin-modal-header">

                            <div>

                                <p className="page-tag">
                                    {bulkMode
                                        ? "BULK SET PRICE"
                                        : editingSeat
                                            ? "UPDATE EVENT SEAT"
                                            : "ADD EVENT SEAT"}
                                </p>

                                <h2>
                                    {bulkMode
                                        ? "Bulk Set Event Seat Price"
                                        : editingSeat
                                            ? "Edit Event Seat"
                                            : "Add Event Seat"}
                                </h2>

                            </div>

                            <button
                                type="button"
                                className="admin-modal-close"
                                onClick={closeModal}
                            >
                                ×
                            </button>

                        </div>


                        {error && (
                            <div
                                style={{
                                    marginBottom: "15px",
                                    padding: "10px 12px",
                                    borderRadius: "6px",
                                    background: "#fee2e2",
                                    color: "#991b1b"
                                }}
                            >
                                {error}
                            </div>
                        )}


                        {/* ============== BULK FORM ============== */}

                        {bulkMode ? (

                            <form onSubmit={handleBulkSubmit}>

                                <div className="admin-form-group">

                                    <label>
                                        Event <span>*</span>
                                    </label>

                                    <select
                                        name="eventId"
                                        value={bulkFormData.eventId}
                                        onChange={handleBulkChange}
                                        required
                                    >
                                        <option value="">Select Event</option>
                                        {events.map((event) => (
                                            <option key={event.id} value={event.id}>
                                                {event.name}
                                            </option>
                                        ))}
                                    </select>

                                </div>


                                {bulkFormData.eventId && (

                                    <div className="admin-form-group">

                                        <label>
                                            Select Seats <span>*</span>
                                            {" "}
                                            <span style={{ fontWeight: 400, color: "#64748b" }}>
                                                ({selectedSeatIds.size} selected)
                                            </span>
                                        </label>

                                        {groupedBulkSeats.length === 0 ? (

                                            <div style={{ padding: "12px", color: "#64748b", fontSize: "13px" }}>
                                                No unpriced seats available for this event — every seat may already be assigned.
                                            </div>

                                        ) : (

                                            <div
                                                style={{
                                                    maxHeight: "280px",
                                                    overflowY: "auto",
                                                    border: "1px solid #e2e8f0",
                                                    borderRadius: "8px",
                                                    padding: "10px"
                                                }}
                                            >

                                                {groupedBulkSeats.map((standGroup) => (

                                                    <div key={standGroup.standName} style={{ marginBottom: "14px" }}>

                                                        <strong style={{ display: "block", marginBottom: "6px" }}>
                                                            {standGroup.standName}
                                                        </strong>

                                                        {standGroup.rows.map((row) => {

                                                            const rowIds = row.seats.map((seat) => seat.id);
                                                            const allRowSelected = rowIds.every((id) => selectedSeatIds.has(id));

                                                            return (

                                                                <div key={row.rowKey} style={{ marginBottom: "8px" }}>

                                                                    <label
                                                                        style={{
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            gap: "6px",
                                                                            fontSize: "12px",
                                                                            color: "#475569",
                                                                            marginBottom: "4px",
                                                                            cursor: "pointer"
                                                                        }}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={allRowSelected}
                                                                            onChange={() => toggleRow(row.seats)}
                                                                        />
                                                                        Row {row.rowKey} — select all ({row.seats.length})
                                                                    </label>

                                                                    <div
                                                                        style={{
                                                                            display: "flex",
                                                                            flexWrap: "wrap",
                                                                            gap: "6px",
                                                                            paddingLeft: "18px"
                                                                        }}
                                                                    >

                                                                        {row.seats.map((seat) => (

                                                                            <label
                                                                                key={seat.id}
                                                                                style={{
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    gap: "4px",
                                                                                    fontSize: "12px",
                                                                                    padding: "4px 8px",
                                                                                    borderRadius: "6px",
                                                                                    border: "1px solid #e2e8f0",
                                                                                    background: selectedSeatIds.has(seat.id) ? "#dbeafe" : "#fff",
                                                                                    cursor: "pointer"
                                                                                }}
                                                                            >
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={selectedSeatIds.has(seat.id)}
                                                                                    onChange={() => toggleSeat(seat.id)}
                                                                                />
                                                                                {seat.seatNumber}
                                                                            </label>

                                                                        ))}

                                                                    </div>

                                                                </div>

                                                            );
                                                        })}

                                                    </div>

                                                ))}

                                            </div>

                                        )}

                                        {selectedSeatIds.size > 0 && (
                                            <button
                                                type="button"
                                                onClick={clearSelection}
                                                style={{
                                                    marginTop: "8px",
                                                    background: "none",
                                                    border: "none",
                                                    color: "#2563eb",
                                                    fontSize: "12px",
                                                    cursor: "pointer",
                                                    padding: 0
                                                }}
                                            >
                                                Clear selection
                                            </button>
                                        )}

                                    </div>

                                )}


                                <div className="admin-form-group">

                                    <label>
                                        Price for Selected Seats <span>*</span>
                                    </label>

                                    <input
                                        type="number"
                                        name="price"
                                        value={bulkFormData.price}
                                        onChange={handleBulkChange}
                                        placeholder="Enter price"
                                        min="0"
                                        required
                                    />

                                </div>


                                <div className="admin-form-actions">

                                    <button
                                        type="button"
                                        className="admin-secondary-button"
                                        onClick={closeModal}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="admin-submit-button"
                                        disabled={submitting || selectedSeatIds.size === 0}
                                    >
                                        {submitting
                                            ? "Saving..."
                                            : `Set Price for ${selectedSeatIds.size} Seat(s)`}
                                    </button>

                                </div>

                            </form>

                        ) : (

                            /* ============== SINGLE FORM ============== */

                            <form onSubmit={handleSubmit}>

                                <div className="admin-form-group">

                                    <label>
                                        Event <span>*</span>
                                    </label>

                                    <select
                                        name="eventId"
                                        value={formData.eventId}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Event</option>
                                        {events.map((event) => (
                                            <option key={event.id} value={event.id}>
                                                {event.name}
                                            </option>
                                        ))}
                                    </select>

                                </div>


                                <div className="admin-form-group">

                                    <label>
                                        Seat <span>*</span>
                                    </label>

                                    <select
                                        name="seatId"
                                        value={formData.seatId}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.eventId}
                                    >
                                        <option value="">
                                            {!formData.eventId ? "Select Event First" : "Select Seat"}
                                        </option>

                                        {availableFormSeats.map((seat) => (
                                            <option key={seat.id} value={seat.id}>
                                                {getSeatDisplayName(seat)} — {seat.standName || "Stand"}
                                            </option>
                                        ))}
                                    </select>

                                </div>


                                {selectedFormSeat && (

                                    <div
                                        style={{
                                            marginBottom: "18px",
                                            padding: "14px",
                                            borderRadius: "9px",
                                            background: "#f8fafc",
                                            border: "1px solid #e2e8f0"
                                        }}
                                    >

                                        <div
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "repeat(2, 1fr)",
                                                gap: "12px"
                                            }}
                                        >

                                            <div>
                                                <small style={{ color: "#64748b" }}>Stand</small>
                                                <strong style={{ display: "block", marginTop: "3px" }}>
                                                    {selectedFormSeat.standName || "—"}
                                                </strong>
                                            </div>

                                            <div>
                                                <small style={{ color: "#64748b" }}>Row / Seat</small>
                                                <strong style={{ display: "block", marginTop: "3px" }}>
                                                    {getSeatDisplayName(selectedFormSeat)}
                                                </strong>
                                            </div>

                                        </div>

                                    </div>

                                )}


                                <div className="admin-form-group">

                                    <label>
                                        Event Seat Price <span>*</span>
                                    </label>

                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        placeholder="Enter price"
                                        min="0"
                                        required
                                    />

                                </div>


                                <div
                                    style={{
                                        marginBottom: "18px",
                                        padding: "12px 14px",
                                        borderRadius: "8px",
                                        background: "#f8fafc",
                                        fontSize: "13px",
                                        lineHeight: "1.5"
                                    }}
                                >
                                    <strong>Note:</strong>{" "}
                                    Event seat availability is managed by the booking system. Newly assigned
                                    seats are normally <strong>AVAILABLE</strong>.
                                </div>


                                <div className="admin-form-actions">

                                    <button
                                        type="button"
                                        className="admin-secondary-button"
                                        onClick={closeModal}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="admin-submit-button"
                                        disabled={submitting}
                                    >
                                        {submitting
                                            ? "Saving..."
                                            : editingSeat
                                                ? "Update Event Seat"
                                                : "Add Event Seat"}
                                    </button>

                                </div>

                            </form>

                        )}

                    </div>

                </div>

            )}

        </div>
    );
}

export default ManageEventSeats;