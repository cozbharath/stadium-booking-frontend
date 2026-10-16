import { useEffect, useMemo, useState } from "react";
import { get } from "../../services/api";


function StaffEvents() {

    const [events, setEvents] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [stadiumFilter, setStadiumFilter] = useState("ALL");

    const [selectedEvent, setSelectedEvent] = useState(null);


    // =========================================================
    // LOAD EVENTS
    // =========================================================

    const loadEvents = async () => {

        try {

            setLoading(true);
            setError("");

            const data = await get("/events");

            setEvents(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (err) {

            console.error(
                "Staff events error:",
                err
            );

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
            loadEvents();
        });
    }, []);


    // =========================================================
    // HELPERS
    // =========================================================

    const getEventName = (event) => {

        return (
            event.name ||
            event.eventName ||
            "Unnamed Event"
        );
    };


    const getEventDescription = (event) => {

        return (
            event.description ||
            event.eventDescription ||
            "Stadium event"
        );
    };


    const getStadiumName = (event) => {

        if (event.stadium?.name) {
            return event.stadium.name;
        }

        return (
            event.stadiumName ||
            "Stadium not available"
        );
    };


    const getEventDate = (event) => {

        return (
            event.eventDate ||
            event.date ||
            event.startDate ||
            null
        );
    };


    const getEventTime = (event) => {

        return (
            event.startTime ||
            event.time ||
            "Time not available"
        );
    };


    const getEventStatus = (event) => {

        return (
            event.status ||
            "SCHEDULED"
        ).toString().toUpperCase();
    };


    const getAvailableSeats = (event) => {

        return (
            event.availableSeats ??
            event.availableSeatCount ??
            null
        );
    };


    const getTotalSeats = (event) => {

        return (
            event.totalSeats ??
            event.totalSeatCount ??
            null
        );
    };


    // =========================================================
    // FORMAT DATE
    // =========================================================

    const formatDate = (dateValue) => {

        if (!dateValue) {
            return "Date not available";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };


    // =========================================================
    // STADIUM LIST
    // =========================================================

    const stadiums = useMemo(() => {

        const uniqueStadiums =
            events
                .map(getStadiumName)
                .filter(
                    (name) =>
                        name &&
                        name !==
                        "Stadium not available"
                );

        return [
            ...new Set(uniqueStadiums)
        ];

    }, [events]);


    // =========================================================
    // STATUS
    // =========================================================

    const getStatusClass = (status) => {

        const normalized =
            status.toLowerCase();

        if (
            normalized === "upcoming" ||
            normalized === "scheduled"
        ) {
            return "upcoming";
        }

        if (
            normalized === "ongoing" ||
            normalized === "in_progress"
        ) {
            return "ongoing";
        }

        if (
            normalized === "completed" ||
            normalized === "finished"
        ) {
            return "completed";
        }

        if (
            normalized === "cancelled" ||
            normalized === "canceled"
        ) {
            return "cancelled";
        }

        return "scheduled";
    };


    // =========================================================
    // FILTER EVENTS
    // =========================================================

    const filteredEvents = useMemo(() => {

        return events.filter((event) => {

            const eventName =
                getEventName(event)
                    .toLowerCase();

            const stadiumName =
                getStadiumName(event)
                    .toLowerCase();

            const searchValue =
                search.toLowerCase().trim();

            const matchesSearch =
                !searchValue ||
                eventName.includes(searchValue) ||
                stadiumName.includes(searchValue);

            const status =
                getEventStatus(event);

            const matchesStatus =
                statusFilter === "ALL" ||
                status === statusFilter;

            const matchesStadium =
                stadiumFilter === "ALL" ||
                getStadiumName(event) ===
                stadiumFilter;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesStadium
            );

        });

    }, [
        events,
        search,
        statusFilter,
        stadiumFilter
    ]);


    // =========================================================
    // STATISTICS
    // =========================================================

    const totalEvents =
        events.length;

    const upcomingEvents =
        events.filter((event) => {

            const status =
                getEventStatus(event);

            return (
                status === "UPCOMING" ||
                status === "SCHEDULED"
            );

        }).length;

    const ongoingEvents =
        events.filter((event) => {

            return (
                getEventStatus(event) ===
                "ONGOING"
            );

        }).length;

    const completedEvents =
        events.filter((event) => {

            const status =
                getEventStatus(event);

            return (
                status === "COMPLETED" ||
                status === "FINISHED"
            );

        }).length;


    // =========================================================
    // RENDER
    // =========================================================

    return (

        <div className="staff-events-page">

            {/* PAGE HEADER */}

            <div className="staff-events-header">

                <div className="staff-events-title-section">

                    <div className="staff-events-title-icon">
                        📅
                    </div>

                    <div>

                        <h1>
                            Events
                        </h1>

                        <p>
                            View all scheduled stadium events
                            and their details.
                        </p>

                    </div>

                </div>

            </div>


            {/* ERROR */}

            {error && (

                <div className="staff-events-error">

                    ⚠️ {error}

                    <button
                        onClick={loadEvents}
                    >
                        Retry
                    </button>

                </div>

            )}


            {/* STATISTICS */}

            <div className="staff-events-stats">

                <div className="staff-event-stat-card">

                    <div className="staff-event-stat-icon blue">
                        📅
                    </div>

                    <div>

                        <span>
                            Total Events
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : totalEvents}
                        </strong>

                    </div>

                </div>


                <div className="staff-event-stat-card">

                    <div className="staff-event-stat-icon green">
                        ▶
                    </div>

                    <div>

                        <span>
                            Upcoming Events
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : upcomingEvents}
                        </strong>

                    </div>

                </div>


                <div className="staff-event-stat-card">

                    <div className="staff-event-stat-icon orange">
                        ◷
                    </div>

                    <div>

                        <span>
                            Ongoing Events
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : ongoingEvents}
                        </strong>

                    </div>

                </div>


                <div className="staff-event-stat-card">

                    <div className="staff-event-stat-icon red">
                        ✓
                    </div>

                    <div>

                        <span>
                            Completed Events
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : completedEvents}
                        </strong>

                    </div>

                </div>

            </div>


            {/* EVENTS CARD */}

            <div className="staff-events-card">


                {/* FILTER BAR */}

                <div className="staff-events-filters">

                    <div className="staff-events-search">

                        <span>
                            🔍
                        </span>

                        <input
                            type="text"
                            placeholder="Search events by name or stadium..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                        />

                    </div>


                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value
                            )
                        }
                        className="staff-events-select"
                    >

                        <option value="ALL">
                            All Status
                        </option>

                        <option value="UPCOMING">
                            Upcoming
                        </option>

                        <option value="SCHEDULED">
                            Scheduled
                        </option>

                        <option value="ONGOING">
                            Ongoing
                        </option>

                        <option value="COMPLETED">
                            Completed
                        </option>

                        <option value="CANCELLED">
                            Cancelled
                        </option>

                    </select>


                    <select
                        value={stadiumFilter}
                        onChange={(e) =>
                            setStadiumFilter(
                                e.target.value
                            )
                        }
                        className="staff-events-select"
                    >

                        <option value="ALL">
                            All Stadiums
                        </option>

                        {stadiums.map(
                            (stadium) => (

                                <option
                                    key={stadium}
                                    value={stadium}
                                >
                                    {stadium}
                                </option>

                            )
                        )}

                    </select>

                </div>


                {/* TABLE */}

                <div className="staff-events-table-wrapper">

                    <table className="staff-events-table">

                        <thead>

                            <tr>

                                <th>
                                    #
                                </th>

                                <th>
                                    Event Name
                                </th>

                                <th>
                                    Stadium
                                </th>

                                <th>
                                    Date & Time
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Available Seats
                                </th>

                                <th>
                                    Actions
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {loading ? (

                                <tr>

                                    <td
                                        colSpan="7"
                                        className="staff-events-loading"
                                    >
                                        Loading events...
                                    </td>

                                </tr>

                            ) : filteredEvents.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="7"
                                        className="staff-events-empty"
                                    >

                                        <div>
                                            📅
                                        </div>

                                        <strong>
                                            No events found
                                        </strong>

                                        <span>
                                            Try changing your search
                                            or filters.
                                        </span>

                                    </td>

                                </tr>

                            ) : (

                                filteredEvents.map(
                                    (event, index) => {

                                        const status =
                                            getEventStatus(
                                                event
                                            );

                                        const available =
                                            getAvailableSeats(
                                                event
                                            );

                                        const total =
                                            getTotalSeats(
                                                event
                                            );

                                        return (

                                            <tr
                                                key={
                                                    event.id ||
                                                    index
                                                }
                                            >

                                                <td>
                                                    {index + 1}
                                                </td>


                                                {/* EVENT */}

                                                <td>

                                                    <div className="staff-event-name-cell">

                                                        <div className="staff-event-image">
                                                            🏟️
                                                        </div>

                                                        <div>

                                                            <strong>
                                                                {getEventName(
                                                                    event
                                                                )}
                                                            </strong>

                                                            <span>
                                                                {getEventDescription(
                                                                    event
                                                                )}
                                                            </span>

                                                        </div>

                                                    </div>

                                                </td>


                                                {/* STADIUM */}

                                                <td>

                                                    <div className="staff-event-stadium">

                                                        <span>
                                                            🏟️
                                                        </span>

                                                        <div>

                                                            <strong>
                                                                {getStadiumName(
                                                                    event
                                                                )}
                                                            </strong>

                                                            <small>
                                                                Hyderabad
                                                            </small>

                                                        </div>

                                                    </div>

                                                </td>


                                                {/* DATE */}

                                                <td>

                                                    <div className="staff-event-date">

                                                        <span>
                                                            📅
                                                        </span>

                                                        <div>

                                                            <strong>
                                                                {formatDate(
                                                                    getEventDate(
                                                                        event
                                                                    )
                                                                )}
                                                            </strong>

                                                            <span>
                                                                🕐{" "}
                                                                {getEventTime(
                                                                    event
                                                                )}
                                                            </span>

                                                        </div>

                                                    </div>

                                                </td>


                                                {/* STATUS */}

                                                <td>

                                                    <span
                                                        className={`staff-event-status-badge ${getStatusClass(
                                                            status
                                                        )}`}
                                                    >
                                                        {status}
                                                    </span>

                                                </td>


                                                {/* SEATS */}

                                                <td>

                                                    {available !==
                                                        null ? (

                                                        <div className="staff-event-seats">

                                                            <strong>
                                                                {Number(
                                                                    available
                                                                ).toLocaleString(
                                                                    "en-IN"
                                                                )}
                                                            </strong>

                                                            {total !==
                                                                null && (

                                                                <span>
                                                                    of{" "}
                                                                    {Number(
                                                                        total
                                                                    ).toLocaleString(
                                                                        "en-IN"
                                                                    )}
                                                                </span>

                                                            )}

                                                        </div>

                                                    ) : (

                                                        <span className="staff-no-seat-data">
                                                            —
                                                        </span>

                                                    )}

                                                </td>


                                                {/* ACTION */}

                                                <td>

                                                    <button
                                                        type="button"
                                                        className="staff-event-view-button"
                                                        onClick={() =>
                                                            setSelectedEvent(
                                                                event
                                                            )
                                                        }
                                                    >

                                                        👁 View

                                                    </button>

                                                </td>

                                            </tr>

                                        );

                                    }
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            {/* EVENT DETAILS MODAL */}

            {selectedEvent && (

                <div
                    className="staff-event-modal-overlay"
                    onClick={() =>
                        setSelectedEvent(null)
                    }
                >

                    <div
                        className="staff-event-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="staff-event-modal-header">

                            <div>

                                <p>
                                    EVENT DETAILS
                                </p>

                                <h2>
                                    {getEventName(
                                        selectedEvent
                                    )}
                                </h2>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedEvent(
                                        null
                                    )
                                }
                            >
                                ✕
                            </button>

                        </div>


                        <div className="staff-event-modal-content">

                            <div className="staff-event-detail-box">

                                <span>
                                    Stadium
                                </span>

                                <strong>
                                    {getStadiumName(
                                        selectedEvent
                                    )}
                                </strong>

                            </div>


                            <div className="staff-event-detail-box">

                                <span>
                                    Date
                                </span>

                                <strong>
                                    {formatDate(
                                        getEventDate(
                                            selectedEvent
                                        )
                                    )}
                                </strong>

                            </div>


                            <div className="staff-event-detail-box">

                                <span>
                                    Start Time
                                </span>

                                <strong>
                                    {getEventTime(
                                        selectedEvent
                                    )}
                                </strong>

                            </div>


                            <div className="staff-event-detail-box">

                                <span>
                                    Status
                                </span>

                                <strong>

                                    <span
                                        className={`staff-event-status-badge ${getStatusClass(
                                            getEventStatus(
                                                selectedEvent
                                            )
                                        )}`}
                                    >
                                        {getEventStatus(
                                            selectedEvent
                                        )}
                                    </span>

                                </strong>

                            </div>


                            <div className="staff-event-detail-box full">

                                <span>
                                    Description
                                </span>

                                <strong>
                                    {getEventDescription(
                                        selectedEvent
                                    )}
                                </strong>

                            </div>

                        </div>


                        <div className="staff-event-modal-footer">

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedEvent(
                                        null
                                    )
                                }
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default StaffEvents;