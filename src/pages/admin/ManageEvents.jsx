import { useEffect, useMemo, useState } from "react";
import { get, post, put, remove } from "../../services/api";

function ManageEvents() {
    const [events, setEvents] = useState([]);
    const [stadiums, setStadiums] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [imageError, setImageError] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        stadiumId: "",
        date: "",
        startTime: "",
        endTime: "",
        imageUrl: ""
    });

    // =========================================================
    // LOAD EVENTS + STADIUMS
    // =========================================================

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [eventData, stadiumData] = await Promise.all([
                get("/events"),
                get("/stadiums")
            ]);

            setEvents(
                Array.isArray(eventData)
                    ? eventData
                    : []
            );

            setStadiums(
                Array.isArray(stadiumData)
                    ? stadiumData
                    : []
            );

        } catch (err) {
            console.error("Load events error:", err);

            setError(
                err.message ||
                "Failed to load events."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        queueMicrotask(() => {
            loadData();
        });
    }, []);

    // =========================================================
    // HELPERS
    // =========================================================

    const getEventId = (event) => {
        return event?.id;
    };

    const getStadiumName = (event) => {
        return (
            event?.stadiumName ||
            event?.stadium?.name ||
            "—"
        );
    };

    const getStadiumId = (event) => {
        return (
            event?.stadiumId ||
            event?.stadium?.id ||
            ""
        );
    };

    const formatDate = (date) => {
        if (!date) {
            return "—";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return date;
        }

        return parsedDate.toLocaleDateString("en-GB", {
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

        let hours = Number(parts[0]);
        const minutes = parts[1];

        const period = hours >= 12 ? "PM" : "AM";

        hours = hours % 12;

        if (hours === 0) {
            hours = 12;
        }

        return `${hours}:${minutes} ${period}`;
    };

    // =========================================================
    // FILTER
    // =========================================================

    const filteredEvents = useMemo(() => {
        return events.filter((event) => {

            const eventName =
                event?.name || "";

            const stadiumName =
                getStadiumName(event);

            const searchValue =
                search.toLowerCase().trim();

            const matchesSearch =
                !searchValue ||
                eventName
                    .toLowerCase()
                    .includes(searchValue) ||
                stadiumName
                    .toLowerCase()
                    .includes(searchValue);

            const matchesStatus =
                statusFilter === "ALL" ||
                event?.status === statusFilter;

            return (
                matchesSearch &&
                matchesStatus
            );
        });

    }, [events, search, statusFilter]);

    // =========================================================
    // STATISTICS
    // =========================================================

    const totalEvents =
        events.length;

    const upcomingEvents =
        events.filter(
            (event) =>
                event.status === "UPCOMING"
        ).length;

    const draftEvents =
        events.filter(
            (event) =>
                event.status === "DRAFT"
        ).length;

    const completedEvents =
        events.filter(
            (event) =>
                event.status === "COMPLETED"
        ).length;

    // =========================================================
    // ADD EVENT
    // =========================================================

    const openAddModal = () => {

        setEditingEvent(null);

        setFormData({
            name: "",
            stadiumId: "",
            date: "",
            startTime: "",
            endTime: "",
            imageUrl: ""
        });

        setImageError(false);
        setError("");

        setShowModal(true);
    };

    // =========================================================
    // EDIT EVENT
    // =========================================================

    const openEditModal = (event) => {

        setEditingEvent(event);

        setFormData({
            name: event?.name || "",
            stadiumId: getStadiumId(event),
            date: event?.eventDate || "",
            startTime: event?.startTime || "",
            endTime: event?.endTime || "",
            imageUrl: event?.imageUrl || ""
        });

        setImageError(false);
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
        setEditingEvent(null);
        setError("");
        setImageError(false);
    };

    // =========================================================
    // FORM CHANGE
    // =========================================================

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        if (name === "imageUrl") {
            setImageError(false);
        }
    };

    // =========================================================
    // CREATE / UPDATE
    // =========================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        if (
            !formData.name.trim() ||
            !formData.stadiumId ||
            !formData.date ||
            !formData.startTime ||
            !formData.endTime ||
            !formData.imageUrl.trim()
        ) {
            setError(
                "Please fill all required fields."
            );

            return;
        }

        try {

            setSubmitting(true);

            const eventData = {
                name: formData.name.trim(),

                eventDate:
                    formData.date,

                startTime:
                    formData.startTime,

                endTime:
                    formData.endTime,

                stadiumId:
                    Number(formData.stadiumId),

                imageUrl:
                    formData.imageUrl.trim()
            };

            console.log(
                "Event request:",
                eventData
            );

            if (editingEvent) {

                await put(
                    `/events/${getEventId(editingEvent)}`,
                    eventData
                );

                alert(
                    "Event updated successfully."
                );

            } else {

                await post(
                    "/events",
                    eventData
                );

                alert(
                    "Event created successfully."
                );
            }

            setShowModal(false);
            setEditingEvent(null);

            await loadData();

        } catch (err) {

            console.error(
                "Save event error:",
                err
            );

            setError(
                err.message ||
                "Failed to save event."
            );

        } finally {

            setSubmitting(false);
        }
    };

    // =========================================================
    // DELETE
    // =========================================================

    const handleDelete = async (id) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this event?"
            );

        if (!confirmed) {
            return;
        }

        try {

            setError("");

            await remove(
                `/events/${id}`
            );

            alert(
                "Event deleted successfully."
            );

            await loadData();

        } catch (err) {

            console.error(
                "Delete event error:",
                err
            );

            setError(
                err.message ||
                "Failed to delete event."
            );
        }
    };

    // =========================================================
    // VIEW
    // =========================================================

    const handleView = (event) => {

        alert(
            `Event: ${event?.name || "—"}\n\n` +
            `Stadium: ${getStadiumName(event)}\n` +
            `Date: ${formatDate(event?.eventDate)}\n` +
            `Start Time: ${formatTime(event?.startTime)}\n` +
            `End Time: ${formatTime(event?.endTime)}\n` +
            `Image URL: ${event?.imageUrl || "—"}\n` +
            `Status: ${event?.status || "—"}`
        );
    };

    // =========================================================
    // IMAGE ERROR
    // =========================================================

    const handleImageError = (e) => {
        e.currentTarget.style.display = "none";
    };

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="admin-management-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="admin-page-header">

                <div>

                    <p className="page-tag">
                        EVENT MANAGEMENT
                    </p>

                    <h1>
                        Manage Events
                    </h1>

                    <p>
                        Create, update and manage stadium events.
                    </p>

                </div>

                <button
                    type="button"
                    className="admin-primary-button"
                    onClick={openAddModal}
                >
                    + Create Event
                </button>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

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


            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="admin-management-stats">

                <div className="admin-management-stat">

                    <div className="admin-stat-icon">
                        🎟️
                    </div>

                    <div>

                        <span>
                            Total Events
                        </span>

                        <strong>
                            {totalEvents}
                        </strong>

                    </div>

                </div>


                <div className="admin-management-stat">

                    <div className="admin-stat-icon">
                        📅
                    </div>

                    <div>

                        <span>
                            Upcoming
                        </span>

                        <strong>
                            {upcomingEvents}
                        </strong>

                    </div>

                </div>


                <div className="admin-management-stat">

                    <div className="admin-stat-icon">
                        📝
                    </div>

                    <div>

                        <span>
                            Draft Events
                        </span>

                        <strong>
                            {draftEvents}
                        </strong>

                    </div>

                </div>


                <div className="admin-management-stat">

                    <div className="admin-stat-icon">
                        ✅
                    </div>

                    <div>

                        <span>
                            Completed
                        </span>

                        <strong>
                            {completedEvents}
                        </strong>

                    </div>

                </div>

            </div>


            {/* =================================================
                TABLE
            ================================================= */}

            <div className="admin-table-card">

                <div className="admin-table-header">

                    <div>

                        <h2>
                            All Events
                        </h2>

                        <p>
                            Manage your stadium events and schedules.
                        </p>

                    </div>


                    <div className="admin-table-tools">

                        <input
                            type="text"
                            placeholder="Search events..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            className="admin-search-input"
                        />


                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value)
                            }
                            className="admin-filter-select"
                        >

                            <option value="ALL">
                                All Status
                            </option>

                            <option value="UPCOMING">
                                Upcoming
                            </option>

                            <option value="DRAFT">
                                Draft
                            </option>

                            <option value="COMPLETED">
                                Completed
                            </option>

                            <option value="CANCELLED">
                                Cancelled
                            </option>

                        </select>

                    </div>

                </div>


                <div className="admin-table-wrapper">

                    <table className="admin-users-table admin-events-table">

                        <thead>

                            <tr>

                                <th>IMAGE</th>

                                <th>EVENT</th>

                                <th>STADIUM</th>

                                <th>DATE</th>

                                <th>START TIME</th>

                                <th>END TIME</th>

                                <th>STATUS</th>

                                <th>ACTIONS</th>

                            </tr>

                        </thead>


                        <tbody>

                            {loading ? (

                                <tr>

                                    <td
                                        colSpan="8"
                                        style={{
                                            textAlign: "center",
                                            padding: "30px"
                                        }}
                                    >
                                        Loading events...
                                    </td>

                                </tr>

                            ) : filteredEvents.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="8"
                                        style={{
                                            textAlign: "center",
                                            padding: "30px"
                                        }}
                                    >
                                        No events found.
                                    </td>

                                </tr>

                            ) : (

                                filteredEvents.map(
                                    (event) => (

                                        <tr
                                            key={
                                                getEventId(
                                                    event
                                                )
                                            }
                                        >

                                            {/* IMAGE */}

                                            <td>

                                                {event.imageUrl ? (

                                                    <img
                                                        src={
                                                            event.imageUrl
                                                        }
                                                        alt={
                                                            event.name
                                                        }
                                                        onError={
                                                            handleImageError
                                                        }
                                                        style={{
                                                            width: "75px",
                                                            height: "50px",
                                                            objectFit: "cover",
                                                            borderRadius: "7px",
                                                            border: "1px solid #e2e8f0"
                                                        }}
                                                    />

                                                ) : (

                                                    <div
                                                        style={{
                                                            width: "75px",
                                                            height: "50px",
                                                            borderRadius: "7px",
                                                            background: "#f1f5f9",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            color: "#94a3b8",
                                                            fontSize: "12px"
                                                        }}
                                                    >
                                                        No Image
                                                    </div>

                                                )}

                                            </td>


                                            {/* EVENT */}

                                            <td>

                                                <div className="admin-event-table-info">

                                                    <div className="admin-event-table-icon">
                                                        🎟️
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {event.name}
                                                        </strong>

                                                        <span>
                                                            Event #
                                                            {event.id}
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* STADIUM */}

                                            <td>

                                                <span className="admin-stadium-cell">

                                                    {getStadiumName(
                                                        event
                                                    )}

                                                </span>

                                            </td>


                                            {/* DATE */}

                                            <td>

                                                <strong>
                                                    {formatDate(
                                                        event.eventDate
                                                    )}
                                                </strong>

                                            </td>


                                            {/* START */}

                                            <td>

                                                <span className="admin-time-cell">

                                                    {formatTime(
                                                        event.startTime
                                                    )}

                                                </span>

                                            </td>


                                            {/* END */}

                                            <td>

                                                <span className="admin-time-cell">

                                                    {formatTime(
                                                        event.endTime
                                                    )}

                                                </span>

                                            </td>


                                            {/* STATUS */}

                                            <td>

                                                <span
                                                    className={`admin-status-badge ${
                                                        (
                                                            event.status ||
                                                            "UPCOMING"
                                                        ).toLowerCase()
                                                    }`}
                                                >

                                                    <span className="status-dot"></span>

                                                    {event.status ||
                                                        "UPCOMING"}

                                                </span>

                                            </td>


                                            {/* ACTIONS */}

                                            <td>

                                                <div className="admin-table-actions">

                                                    <button
                                                        type="button"
                                                        className="admin-action-button view"
                                                        title="View"
                                                        onClick={() =>
                                                            handleView(
                                                                event
                                                            )
                                                        }
                                                    >
                                                        👁
                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="admin-action-button edit"
                                                        title="Edit"
                                                        onClick={() =>
                                                            openEditModal(
                                                                event
                                                            )
                                                        }
                                                    >
                                                        ✏️
                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="admin-action-button delete"
                                                        title="Delete"
                                                        onClick={() =>
                                                            handleDelete(
                                                                event.id
                                                            )
                                                        }
                                                    >
                                                        🗑️
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>


                {/* =================================================
                    PAGINATION
                ================================================= */}

                <div className="admin-table-pagination">

                    <span>
                        Showing{" "}
                        {filteredEvents.length}{" "}
                        of{" "}
                        {events.length} events
                    </span>

                    <div className="pagination-buttons">

                        <button
                            type="button"
                            disabled
                        >
                            Previous
                        </button>

                        <button
                            type="button"
                            className="active"
                        >
                            1
                        </button>

                        <button
                            type="button"
                            disabled
                        >
                            Next
                        </button>

                    </div>

                </div>

            </div>


            {/* =================================================
                CREATE / EDIT MODAL
            ================================================= */}

            {showModal && (

                <div
                    className="admin-modal-overlay"
                    onClick={closeModal}
                >

                    <div
                        className="admin-modal admin-event-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* HEADER */}

                        <div className="admin-modal-header">

                            <div>

                                <p className="page-tag">

                                    {editingEvent
                                        ? "UPDATE EVENT"
                                        : "CREATE EVENT"}

                                </p>

                                <h2>

                                    {editingEvent
                                        ? "Edit Event"
                                        : "Create New Event"}

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


                        {/* FORM */}

                        <form onSubmit={handleSubmit}>

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


                            {/* EVENT NAME */}

                            <div className="admin-form-group">

                                <label>
                                    Event Name <span>*</span>
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter event name"
                                    required
                                />

                            </div>


                            {/* IMAGE URL */}

                            <div className="admin-form-group">

                                <label>
                                    Event Image URL <span>*</span>
                                </label>

                                <input
                                    type="url"
                                    name="imageUrl"
                                    value={formData.imageUrl}
                                    onChange={handleChange}
                                    placeholder="https://example.com/event-image.jpg"
                                    required
                                />

                                <small
                                    style={{
                                        display: "block",
                                        marginTop: "7px",
                                        color: "#64748b",
                                        fontSize: "12px"
                                    }}
                                >
                                    Enter a direct URL for the event image.
                                </small>

                                {/* IMAGE PREVIEW */}

                                {formData.imageUrl && !imageError && (

                                    <div
                                        style={{
                                            marginTop: "12px"
                                        }}
                                    >

                                        <img
                                            src={
                                                formData.imageUrl
                                            }
                                            alt="Event preview"
                                            onError={() =>
                                                setImageError(true)
                                            }
                                            style={{
                                                width: "100%",
                                                maxWidth: "360px",
                                                height: "150px",
                                                objectFit: "cover",
                                                borderRadius: "8px",
                                                border: "1px solid #e2e8f0"
                                            }}
                                        />

                                    </div>

                                )}

                                {formData.imageUrl &&
                                    imageError && (

                                        <p
                                            style={{
                                                marginTop: "8px",
                                                color: "#dc2626",
                                                fontSize: "12px"
                                            }}
                                        >
                                            Image URL could not be loaded.
                                            Please check that you entered a
                                            direct image URL.
                                        </p>

                                    )}

                            </div>


                            {/* STADIUM */}

                            <div className="admin-form-group">

                                <label>
                                    Stadium <span>*</span>
                                </label>

                                <select
                                    name="stadiumId"
                                    value={formData.stadiumId}
                                    onChange={handleChange}
                                    required
                                >

                                    <option value="">
                                        Select Stadium
                                    </option>

                                    {stadiums.map(
                                        (stadium) => (

                                            <option
                                                key={
                                                    stadium.id
                                                }
                                                value={
                                                    stadium.id
                                                }
                                            >
                                                {stadium.name}
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            {/* DATE + START TIME */}

                            <div className="admin-form-row">

                                <div className="admin-form-group">

                                    <label>
                                        Event Date <span>*</span>
                                    </label>

                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        required
                                    />

                                </div>


                                <div className="admin-form-group">

                                    <label>
                                        Start Time <span>*</span>
                                    </label>

                                    <input
                                        type="time"
                                        name="startTime"
                                        value={formData.startTime}
                                        onChange={handleChange}
                                        required
                                    />

                                </div>

                            </div>


                            {/* END TIME */}

                            <div className="admin-form-group">

                                <label>
                                    End Time <span>*</span>
                                </label>

                                <input
                                    type="time"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    required
                                />

                            </div>


                            {/* STATUS NOTE */}

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
                                <strong>
                                    Note:
                                </strong>{" "}
                                New events are created as{" "}
                                <strong>
                                    UPCOMING
                                </strong>{" "}
                                by the backend.
                            </div>


                            {/* BUTTONS */}

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
                                        : editingEvent
                                            ? "Update Event"
                                            : "Create Event"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default ManageEvents;