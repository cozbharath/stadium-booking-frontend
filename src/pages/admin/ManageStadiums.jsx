import { useEffect, useMemo, useState } from "react";
import { get, post, put, remove } from "../../services/api";

function ManageStadiums() {

    const [stadiums, setStadiums] = useState([]);
    const [events, setEvents] = useState([]);

    const [showForm, setShowForm] = useState(false);
    const [editingStadium, setEditingStadium] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        location: "",
        capacity: "",
        status: "ACTIVE"
    });


    // ================= LOAD DATA =================

    const loadData = async () => {

        try {

            setLoading(true);
            setError("");

            const [stadiumData, eventData] = await Promise.all([
                get("/stadiums"),
                get("/events")
            ]);

            setStadiums(Array.isArray(stadiumData) ? stadiumData : []);
            setEvents(Array.isArray(eventData) ? eventData : []);

        } catch (err) {

            console.error("Failed to load stadiums:", err);

            setError(
                err.message || "Failed to load stadium information."
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


    // ================= FORM CHANGE =================

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

    };


    // ================= ADD FORM =================

    const openAddForm = () => {

        setEditingStadium(null);

        setFormData({
            name: "",
            location: "",
            capacity: "",
            status: "ACTIVE"
        });

        setError("");
        setShowForm(true);

    };


    // ================= EDIT FORM =================

    const openEditForm = (stadium) => {

        setEditingStadium(stadium);

        setFormData({
            name: stadium.name || "",
            location: stadium.location || "",
            capacity: stadium.capacity || "",
            status: stadium.status || "ACTIVE"
        });

        setError("");
        setShowForm(true);

    };


    // ================= CLOSE FORM =================

    const closeForm = () => {

        if (submitting) {
            return;
        }

        setShowForm(false);
        setEditingStadium(null);
        setError("");

    };


    // ================= CREATE / UPDATE =================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        try {

            setSubmitting(true);

            const stadiumData = {
                name: formData.name,
                location: formData.location,
                capacity: Number(formData.capacity),
                status: formData.status
            };


            if (editingStadium) {

                await put(
                    `/stadiums/${editingStadium.id}`,
                    stadiumData
                );

                alert("Stadium updated successfully.");

            } else {

                await post(
                    "/stadiums",
                    stadiumData
                );

                alert("Stadium created successfully.");

            }


            closeForm();

            await loadData();

        } catch (err) {

            console.error("Stadium save error:", err);

            setError(
                err.message || "Failed to save stadium."
            );

        } finally {

            setSubmitting(false);

        }

    };


    // ================= DELETE =================

    const handleDelete = async (stadium) => {

        const confirmed = window.confirm(
            `Are you sure you want to delete "${stadium.name}"?`
        );

        if (!confirmed) {
            return;
        }

        try {

            setError("");

            await remove(`/stadiums/${stadium.id}`);

            alert("Stadium deleted successfully.");

            await loadData();

        } catch (err) {

            console.error("Delete stadium error:", err);

            setError(
                err.message || "Failed to delete stadium."
            );

        }

    };


    // ================= EVENT COUNT =================

    const getEventCount = (stadiumId) => {

        return events.filter((event) => {

            const eventStadiumId =
                event.stadiumId ??
                event.stadium?.id;

            return String(eventStadiumId) === String(stadiumId);

        }).length;

    };


    // ================= SEARCH + FILTER =================

    const filteredStadiums = useMemo(() => {

        return stadiums.filter((stadium) => {

            const search = searchTerm.toLowerCase().trim();

            const matchesSearch =
                !search ||
                stadium.name?.toLowerCase().includes(search) ||
                stadium.location?.toLowerCase().includes(search);

            const matchesStatus =
                !statusFilter ||
                stadium.status === statusFilter;

            return matchesSearch && matchesStatus;

        });

    }, [stadiums, searchTerm, statusFilter]);


    // ================= SUMMARY =================

    const totalStadiums = stadiums.length;

    const activeStadiums = stadiums.filter(
        (stadium) => stadium.status === "ACTIVE"
    ).length;

    const totalCapacity = stadiums.reduce(
        (total, stadium) =>
            total + Number(stadium.capacity || 0),
        0
    );

    const upcomingEvents = events.length;


    return (
        <div className="admin-management-page">

            {/* ================= PAGE HEADER ================= */}

            <section className="admin-page-header">

                <div>

                    <p className="page-tag">
                        STADIUM MANAGEMENT
                    </p>

                    <h1>
                        Manage Stadiums
                    </h1>

                    <p>
                        Create, update and manage stadiums available
                        for BookNow events.
                    </p>

                </div>


                <button
                    type="button"
                    className="admin-submit-button"
                    onClick={openAddForm}
                >
                    + Add Stadium
                </button>

            </section>


            {/* ================= ERROR ================= */}

            {error && (
                <div className="admin-form-error">
                    {error}
                </div>
            )}


            {/* ================= SUMMARY ================= */}

            <section className="admin-management-stats">

                <div className="admin-management-stat">

                    <span>
                        Total Stadiums
                    </span>

                    <strong>
                        {totalStadiums}
                    </strong>

                </div>


                <div className="admin-management-stat">

                    <span>
                        Active Stadiums
                    </span>

                    <strong>
                        {activeStadiums}
                    </strong>

                </div>


                <div className="admin-management-stat">

                    <span>
                        Total Capacity
                    </span>

                    <strong>
                        {totalCapacity.toLocaleString()}
                    </strong>

                </div>


                <div className="admin-management-stat">

                    <span>
                        Upcoming Events
                    </span>

                    <strong>
                        {upcomingEvents}
                    </strong>

                </div>

            </section>


            {/* ================= TABLE ================= */}

            <section className="admin-table-card">

                <div className="admin-table-header">

                    <div>

                        <h2>
                            All Stadiums
                        </h2>

                        <span>
                            Manage stadium information and availability
                        </span>

                    </div>


                    <div className="admin-table-tools">

                        <input
                            type="text"
                            placeholder="Search stadiums..."
                            className="admin-search-input"
                            value={searchTerm}
                            onChange={(e) =>
                                setSearchTerm(e.target.value)
                            }
                        />


                        <select
                            className="admin-filter-select"
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value)
                            }
                        >

                            <option value="">
                                All Status
                            </option>

                            <option value="ACTIVE">
                                Active
                            </option>

                            <option value="INACTIVE">
                                Inactive
                            </option>

                        </select>

                    </div>

                </div>


                <div className="admin-table-wrapper">

                    <table className="admin-users-table">

                        <thead>

                            <tr>

                                <th>
                                    Stadium
                                </th>

                                <th>
                                    Location
                                </th>

                                <th>
                                    Capacity
                                </th>

                                <th>
                                    Events
                                </th>

                                <th>
                                    Status
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
                                        colSpan="6"
                                        style={{
                                            textAlign: "center",
                                            padding: "30px"
                                        }}
                                    >
                                        Loading stadiums...
                                    </td>

                                </tr>

                            ) : filteredStadiums.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="6"
                                        style={{
                                            textAlign: "center",
                                            padding: "30px"
                                        }}
                                    >
                                        No stadiums found.
                                    </td>

                                </tr>

                            ) : (

                                filteredStadiums.map((stadium) => (

                                    <tr key={stadium.id}>

                                        {/* STADIUM */}

                                        <td>

                                            <div className="admin-user-table-info">

                                                <div className="admin-user-table-avatar">
                                                    🏟️
                                                </div>

                                                <strong>
                                                    {stadium.name}
                                                </strong>

                                            </div>

                                        </td>


                                        {/* LOCATION */}

                                        <td>
                                            📍 {stadium.location}
                                        </td>


                                        {/* CAPACITY */}

                                        <td>

                                            {Number(
                                                stadium.capacity || 0
                                            ).toLocaleString()}

                                        </td>


                                        {/* EVENTS */}

                                        <td>

                                            {getEventCount(
                                                stadium.id
                                            )}

                                        </td>


                                        {/* STATUS */}

                                        <td>

                                            <span
                                                className={`admin-status-badge ${
                                                    (
                                                        stadium.status ||
                                                        "ACTIVE"
                                                    ).toLowerCase()
                                                }`}
                                            >

                                                <span className="status-dot"></span>

                                                {stadium.status}

                                            </span>

                                        </td>


                                        {/* ACTIONS */}

                                        <td>

                                            <div className="admin-table-actions">

                                                <button
                                                    type="button"
                                                    className="admin-action-button view"
                                                    title="View stadium"
                                                    onClick={() =>
                                                        alert(
                                                            `Stadium: ${stadium.name}\nLocation: ${stadium.location}\nCapacity: ${Number(
                                                                stadium.capacity || 0
                                                            ).toLocaleString()}`
                                                        )
                                                    }
                                                >
                                                    👁
                                                </button>


                                                <button
                                                    type="button"
                                                    className="admin-action-button edit"
                                                    title="Edit stadium"
                                                    onClick={() =>
                                                        openEditForm(stadium)
                                                    }
                                                >
                                                    ✏️
                                                </button>


                                                <button
                                                    type="button"
                                                    className="admin-action-button delete"
                                                    title="Delete stadium"
                                                    onClick={() =>
                                                        handleDelete(stadium)
                                                    }
                                                >
                                                    🗑
                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>


                {/* ================= PAGINATION ================= */}

                <div className="admin-table-pagination">

                    <span>
                        Showing {filteredStadiums.length} of {stadiums.length} stadiums
                    </span>

                    <div className="pagination-buttons">

                        <button
                            type="button"
                            disabled
                        >
                            ←
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
                            →
                        </button>

                    </div>

                </div>

            </section>


            {/* =================================================
                ADD / EDIT STADIUM MODAL
            ================================================= */}

            {showForm && (

                <div
                    className="admin-modal-overlay"
                    onClick={closeForm}
                >

                    <div
                        className="admin-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* MODAL HEADER */}

                        <div className="admin-modal-header">

                            <div>

                                <p className="page-tag">
                                    STADIUM MANAGEMENT
                                </p>

                                <h2>
                                    {editingStadium
                                        ? "Edit Stadium"
                                        : "Add Stadium"}
                                </h2>

                            </div>


                            <button
                                type="button"
                                className="admin-modal-close"
                                onClick={closeForm}
                                disabled={submitting}
                            >
                                ×
                            </button>

                        </div>


                        {/* FORM */}

                        <form onSubmit={handleSubmit}>

                            {/* NAME */}

                            <div className="admin-form-group">

                                <label htmlFor="stadium-name">
                                    Stadium Name
                                </label>

                                <input
                                    id="stadium-name"
                                    name="name"
                                    type="text"
                                    placeholder="Enter stadium name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    disabled={submitting}
                                />

                            </div>


                            {/* LOCATION */}

                            <div className="admin-form-group">

                                <label htmlFor="stadium-location">
                                    Location
                                </label>

                                <input
                                    id="stadium-location"
                                    name="location"
                                    type="text"
                                    placeholder="Enter stadium location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    required
                                    disabled={submitting}
                                />

                            </div>


                            {/* CAPACITY */}

                            <div className="admin-form-group">

                                <label htmlFor="stadium-capacity">
                                    Capacity
                                </label>

                                <input
                                    id="stadium-capacity"
                                    name="capacity"
                                    type="number"
                                    min="1"
                                    placeholder="Enter seating capacity"
                                    value={formData.capacity}
                                    onChange={handleChange}
                                    required
                                    disabled={submitting}
                                />

                            </div>


                            {/* STATUS */}

                            <div className="admin-form-group">

                                <label htmlFor="stadium-status">
                                    Status
                                </label>

                                <select
                                    id="stadium-status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    disabled={submitting}
                                >

                                    <option value="ACTIVE">
                                        ACTIVE
                                    </option>

                                    <option value="INACTIVE">
                                        INACTIVE
                                    </option>

                                </select>

                            </div>


                            {/* ACTIONS */}

                            <div className="admin-form-actions">

                                <button
                                    type="button"
                                    className="admin-secondary-button"
                                    onClick={closeForm}
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
                                        : editingStadium
                                            ? "Update Stadium"
                                            : "Create Stadium"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default ManageStadiums;