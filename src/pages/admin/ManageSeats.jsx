import { useEffect, useMemo, useState } from "react";
import { get, post, put, remove } from "../../services/api";

function ManageSeats() {

    const [seats, setSeats] = useState([]);
    const [stadiums, setStadiums] = useState([]);
    const [stands, setStands] = useState([]);

    const [showForm, setShowForm] = useState(false);
    const [editingSeat, setEditingSeat] = useState(null);

    const [bulkMode, setBulkMode] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [formData, setFormData] = useState({
        stadiumId: "",
        standId: "",
        seatNumber: "",
        rowNumber: ""
    });

    const [bulkFormData, setBulkFormData] = useState({
        stadiumId: "",
        standId: "",
        rows: "",
        seatStart: "",
        seatEnd: ""
    });


    // ================= SUCCESS BANNER =================

    const showSuccess = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(""), 2500);
    };


    // ================= LOAD DATA =================

    const loadData = async () => {

        try {

            setLoading(true);
            setError("");

            const [
                stadiumData,
                standData,
                seatData
            ] = await Promise.all([
                get("/stadiums"),
                get("/stands"),
                get("/seats")
            ]);

            setStadiums(
                Array.isArray(stadiumData)
                    ? stadiumData
                    : []
            );

            setStands(
                Array.isArray(standData)
                    ? standData
                    : []
            );

            setSeats(
                Array.isArray(seatData)
                    ? seatData
                    : []
            );

        } catch (err) {

            console.error("Failed to load seat data:", err);

            setError(
                err.message || "Failed to load seat information."
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


    // ================= FORM CHANGE (SINGLE) =================

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

    };


    // ================= FORM CHANGE (BULK) =================

    const handleBulkChange = (e) => {

        const { name, value } = e.target;

        setBulkFormData((previous) => ({
            ...previous,
            [name]: value
        }));

    };


    // ================= ADD FORM =================

    const openAddForm = () => {

        setEditingSeat(null);
        setBulkMode(false);

        setFormData({
            stadiumId: "",
            standId: "",
            seatNumber: "",
            rowNumber: ""
        });

        setError("");
        setShowForm(true);

    };


    // ================= BULK ADD FORM =================

    const openBulkForm = () => {

        setEditingSeat(null);
        setBulkMode(true);

        setBulkFormData({
            stadiumId: "",
            standId: "",
            rows: "",
            seatStart: "",
            seatEnd: ""
        });

        setError("");
        setShowForm(true);

    };


    // ================= EDIT FORM =================

    const openEditForm = (seat) => {

        setEditingSeat(seat);
        setBulkMode(false);

        setFormData({
            stadiumId:
                seat.stadiumId ??
                seat.stadium?.id ??
                "",
            standId:
                seat.standId ??
                seat.stand?.id ??
                "",
            seatNumber:
                seat.seatNumber ??
                seat.number ??
                "",
            rowNumber:
                seat.rowNumber ??
                seat.row ??
                ""
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
        setEditingSeat(null);
        setBulkMode(false);
        setError("");

    };


    // ================= CREATE / UPDATE (SINGLE) =================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        if (!formData.standId) {
            setError("Please select a stand.");
            return;
        }

        if (!formData.seatNumber.toString().trim()) {
            setError("Seat number is required.");
            return;
        }

        if (!formData.rowNumber.trim()) {
            setError("Row number is required.");
            return;
        }

        try {

            setSubmitting(true);

            const seatData = {
                standId: Number(formData.standId),
                seatNumber: formData.seatNumber,
                rowNumber: formData.rowNumber
            };


            if (editingSeat) {

                await put(
                    `/seats/${editingSeat.id}`,
                    seatData
                );

                showSuccess("Seat updated successfully.");

            } else {

                await post(
                    "/seats",
                    seatData
                );

                showSuccess("Seat created successfully.");

            }


            closeForm();

            await loadData();

        } catch (err) {

            console.error("Seat save error:", err);

            setError(
                err.message || "Failed to save seat."
            );

        } finally {

            setSubmitting(false);

        }

    };


    // ================= CREATE (BULK) =================

    const handleBulkSubmit = async (e) => {

        e.preventDefault();

        setError("");

        if (!bulkFormData.standId) {
            setError("Please select a stand.");
            return;
        }

        const rowsList = bulkFormData.rows
            .split(",")
            .map((row) => row.trim())
            .filter((row) => row.length > 0);

        if (rowsList.length === 0) {
            setError("Enter at least one row (e.g. A,B,C,D).");
            return;
        }

        const seatStart = Number(bulkFormData.seatStart);
        const seatEnd = Number(bulkFormData.seatEnd);

        if (
            !bulkFormData.seatStart ||
            !bulkFormData.seatEnd ||
            seatStart < 1 ||
            seatEnd < seatStart
        ) {
            setError("Enter a valid seat number range.");
            return;
        }

        const seatCount = rowsList.length * (seatEnd - seatStart + 1);

        try {

            setSubmitting(true);

            const bulkData = {
                standId: Number(bulkFormData.standId),
                rows: rowsList,
                seatStart,
                seatEnd
            };

            const created = await post("/seats/bulk", bulkData);

            const createdCount = Array.isArray(created) ? created.length : 0;
            const skippedCount = seatCount - createdCount;

            showSuccess(
                skippedCount > 0
                    ? `${createdCount} seat(s) created. ${skippedCount} already existed and were skipped.`
                    : `${createdCount} seat(s) created successfully.`
            );

            closeForm();

            await loadData();

        } catch (err) {

            console.error("Bulk seat save error:", err);

            setError(
                err.message || "Failed to create seats."
            );

        } finally {

            setSubmitting(false);

        }

    };


    // ================= DELETE =================

    const handleDelete = async (seat) => {

        const confirmed = window.confirm(
            `Are you sure you want to delete seat "${getSeatNumber(
                seat
            )}"?`
        );

        if (!confirmed) {
            return;
        }

        try {

            setError("");

            await remove(`/seats/${seat.id}`);

            showSuccess("Seat deleted successfully.");

            await loadData();

        } catch (err) {

            console.error("Delete seat error:", err);

            setError(
                err.message || "Failed to delete seat."
            );

        }

    };


    // ================= HELPERS =================

    const getSeatNumber = (seat) => {

        return (
            seat.seatNumber ??
            seat.number ??
            "—"
        );

    };


    const getRowNumber = (seat) => {

        return (
            seat.rowNumber ??
            seat.row ??
            "—"
        );

    };


    const getStadiumName = (seat) => {

        if (seat.stadiumName) {
            return seat.stadiumName;
        }

        if (seat.stadium?.name) {
            return seat.stadium.name;
        }

        const stand = stands.find(
            (item) =>
                String(item.id) ===
                String(
                    seat.standId ??
                    seat.stand?.id
                )
        );

        if (stand) {

            if (stand.stadiumName) {
                return stand.stadiumName;
            }

            const stadium = stadiums.find(
                (item) =>
                    String(item.id) ===
                    String(stand.stadiumId)
            );

            return stadium?.name || "—";

        }

        return "—";

    };


    const getStandName = (seat) => {

        if (seat.standName) {
            return seat.standName;
        }

        if (seat.stand?.name) {
            return seat.stand.name;
        }

        const stand = stands.find(
            (item) =>
                String(item.id) ===
                String(
                    seat.standId ??
                    seat.stand?.id
                )
        );

        return stand?.name || "—";

    };


    const getStandTypeName = (seat) => {

        if (seat.standTypeName) {
            return seat.standTypeName;
        }

        if (seat.standType?.name) {
            return seat.standType.name;
        }

        const stand = stands.find(
            (item) =>
                String(item.id) ===
                String(
                    seat.standId ??
                    seat.stand?.id
                )
        );

        if (stand?.standTypeName) {
            return stand.standTypeName;
        }

        return "—";

    };


    // ================= FILTER STANDS =================

    const availableStands = useMemo(() => {

        if (!formData.stadiumId) {
            return stands;
        }

        return stands.filter((stand) => {

            const standStadiumId =
                stand.stadiumId ??
                stand.stadium?.id;

            return (
                String(standStadiumId) ===
                String(formData.stadiumId)
            );

        });

    }, [
        stands,
        formData.stadiumId
    ]);


    const availableBulkStands = useMemo(() => {

        if (!bulkFormData.stadiumId) {
            return stands;
        }

        return stands.filter((stand) => {

            const standStadiumId =
                stand.stadiumId ??
                stand.stadium?.id;

            return (
                String(standStadiumId) ===
                String(bulkFormData.stadiumId)
            );

        });

    }, [
        stands,
        bulkFormData.stadiumId
    ]);


    // ================= FILTER SEATS =================

    const filteredSeats = useMemo(() => {

        return seats.filter((seat) => {

            const seatNumber =
                getSeatNumber(seat);

            const rowNumber =
                getRowNumber(seat);

            const stadiumName =
                getStadiumName(seat);

            const standName =
                getStandName(seat);

            const search =
                searchTerm
                    .toLowerCase()
                    .trim();

            const matchesSearch =
                !search ||
                seatNumber
                    .toString()
                    .toLowerCase()
                    .includes(search) ||
                rowNumber
                    .toString()
                    .toLowerCase()
                    .includes(search) ||
                stadiumName
                    .toLowerCase()
                    .includes(search) ||
                standName
                    .toLowerCase()
                    .includes(search);

            return matchesSearch;

        });

    }, [
        seats,
        stadiums,
        stands,
        searchTerm
    ]);


    // ================= SUMMARY =================

    const totalSeats =
        seats.length;


    return (
        <div className="admin-management-page">

            {/* ================= HEADER ================= */}

            <section className="admin-page-header">

                <div>

                    <p className="page-tag">
                        STADIUM MANAGEMENT
                    </p>

                    <h1>
                        Manage Seats
                    </h1>

                    <p>
                        Create and manage individual seats inside
                        stadium stands.
                    </p>

                </div>


                <div style={{ display: "flex", gap: "10px" }}>

                    <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={openBulkForm}
                    >
                        + Bulk Add Seats
                    </button>

                    <button
                        type="button"
                        className="admin-submit-button"
                        onClick={openAddForm}
                    >
                        + Add Seat
                    </button>

                </div>

            </section>


            {/* ================= SUCCESS ================= */}

            {successMessage && (
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


            {/* ================= ERROR ================= */}

            {error && !showForm && (
                <div className="admin-form-error">
                    {error}
                </div>
            )}


            {/* ================= SUMMARY ================= */}

            <section className="admin-management-stats">

                <div className="admin-management-stat">

                    <span>
                        Total Seats
                    </span>

                    <strong>
                        {totalSeats}
                    </strong>

                </div>

            </section>


            {/* ================= FILTER CARD ================= */}

            <section className="admin-table-card">

                <div className="admin-table-header">

                    <div>

                        <h2>
                            All Seats
                        </h2>

                        <span>
                            Manage seats across all stadium stands
                        </span>

                    </div>


                    <div className="admin-table-tools">

                        <input
                            type="text"
                            placeholder="Search seat..."
                            className="admin-search-input"
                            value={searchTerm}
                            onChange={(e) =>
                                setSearchTerm(
                                    e.target.value
                                )
                            }
                        />

                    </div>

                </div>


                {/* ================= TABLE ================= */}

                <div className="admin-table-wrapper">

                    <table className="admin-users-table">

                        <thead>

                            <tr>

                                <th>Seat</th>
                                <th>Stadium</th>
                                <th>Stand</th>
                                <th>Row</th>
                                <th>Type</th>
                                <th>Actions</th>

                            </tr>

                        </thead>


                        <tbody>

                            {loading ? (

                                <tr>
                                    <td colSpan="6" style={{ textAlign: "center", padding: "30px" }}>
                                        Loading seats...
                                    </td>
                                </tr>

                            ) : filteredSeats.length === 0 ? (

                                <tr>
                                    <td colSpan="6" style={{ textAlign: "center", padding: "30px" }}>
                                        No seats found.
                                    </td>
                                </tr>

                            ) : (

                                filteredSeats.map((seat) => {

                                    const seatNumber = getSeatNumber(seat);
                                    const rowNumber = getRowNumber(seat);
                                    const stadiumName = getStadiumName(seat);
                                    const standName = getStandName(seat);
                                    const type = getStandTypeName(seat);

                                    return (

                                        <tr key={seat.id}>

                                            <td>
                                                <div className="admin-user-table-info">
                                                    <div className="admin-user-table-avatar">💺</div>
                                                    <strong>{seatNumber}</strong>
                                                </div>
                                            </td>

                                            <td>
                                                <span className="admin-description-cell">
                                                    {stadiumName}
                                                </span>
                                            </td>

                                            <td>{standName}</td>

                                            <td>{rowNumber}</td>

                                            <td>
                                                <span
                                                    className={`admin-role-badge ${type.toLowerCase().replace(" ", "-")}`}
                                                >
                                                    {type}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="admin-table-actions">

                                                    <button
                                                        type="button"
                                                        className="admin-action-button edit"
                                                        title="Edit seat"
                                                        onClick={() => openEditForm(seat)}
                                                    >
                                                        ✏️
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="admin-action-button delete"
                                                        title="Delete seat"
                                                        onClick={() => handleDelete(seat)}
                                                    >
                                                        🗑
                                                    </button>

                                                </div>
                                            </td>

                                        </tr>

                                    );

                                })

                            )}

                        </tbody>

                    </table>

                </div>


                {/* ================= PAGINATION ================= */}

                <div className="admin-table-pagination">

                    <span>
                        Showing {filteredSeats.length} of {seats.length} seats
                    </span>

                    <div className="pagination-buttons">
                        <button type="button" disabled>←</button>
                        <button type="button" className="active">1</button>
                        <button type="button" disabled>→</button>
                    </div>

                </div>

            </section>


            {/* =================================================
                ADD / EDIT SEAT MODAL
            ================================================= */}

            {showForm && (

                <div
                    className="admin-modal-overlay"
                    onClick={closeForm}
                >

                    <div
                        className="admin-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        {/* HEADER */}

                        <div className="admin-modal-header">

                            <div>

                                <p className="page-tag">
                                    STADIUM MANAGEMENT
                                </p>

                                <h2>
                                    {bulkMode
                                        ? "Bulk Add Seats"
                                        : editingSeat
                                            ? "Edit Seat"
                                            : "Add Seat"}
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

                                    <label htmlFor="bulk-stadium">
                                        Stadium
                                    </label>

                                    <select
                                        id="bulk-stadium"
                                        name="stadiumId"
                                        value={bulkFormData.stadiumId}
                                        onChange={(e) => {
                                            handleBulkChange(e);
                                            setBulkFormData((previous) => ({
                                                ...previous,
                                                standId: ""
                                            }));
                                        }}
                                        required
                                        disabled={submitting}
                                    >
                                        <option value="">Select Stadium</option>
                                        {stadiums.map((stadium) => (
                                            <option key={stadium.id} value={stadium.id}>
                                                {stadium.name}
                                            </option>
                                        ))}
                                    </select>

                                </div>


                                <div className="admin-form-group">

                                    <label htmlFor="bulk-stand">
                                        Stand
                                    </label>

                                    <select
                                        id="bulk-stand"
                                        name="standId"
                                        value={bulkFormData.standId}
                                        onChange={handleBulkChange}
                                        required
                                        disabled={submitting || !bulkFormData.stadiumId}
                                    >
                                        <option value="">Select Stand</option>
                                        {availableBulkStands.map((stand) => (
                                            <option key={stand.id} value={stand.id}>
                                                {stand.name}
                                            </option>
                                        ))}
                                    </select>

                                </div>


                                <div className="admin-form-group">

                                    <label htmlFor="bulk-rows">
                                        Rows (comma-separated)
                                    </label>

                                    <input
                                        id="bulk-rows"
                                        name="rows"
                                        type="text"
                                        placeholder="A,B,C,D"
                                        value={bulkFormData.rows}
                                        onChange={handleBulkChange}
                                        required
                                        disabled={submitting}
                                    />

                                    <small style={{ color: "#64748b" }}>
                                        One seat will be created per seat number, for each row listed.
                                    </small>

                                </div>


                                <div className="admin-form-row">

                                    <div className="admin-form-group">

                                        <label htmlFor="bulk-seat-start">
                                            Seat Start
                                        </label>

                                        <input
                                            id="bulk-seat-start"
                                            name="seatStart"
                                            type="number"
                                            min="1"
                                            placeholder="1"
                                            value={bulkFormData.seatStart}
                                            onChange={handleBulkChange}
                                            required
                                            disabled={submitting}
                                        />

                                    </div>


                                    <div className="admin-form-group">

                                        <label htmlFor="bulk-seat-end">
                                            Seat End
                                        </label>

                                        <input
                                            id="bulk-seat-end"
                                            name="seatEnd"
                                            type="number"
                                            min="1"
                                            placeholder="20"
                                            value={bulkFormData.seatEnd}
                                            onChange={handleBulkChange}
                                            required
                                            disabled={submitting}
                                        />

                                    </div>

                                </div>


                                {bulkFormData.rows && bulkFormData.seatStart && bulkFormData.seatEnd && (

                                    <div
                                        style={{
                                            marginBottom: "18px",
                                            padding: "10px 12px",
                                            borderRadius: "6px",
                                            background: "#f8fafc",
                                            fontSize: "13px"
                                        }}
                                    >
                                        This will attempt to create up to{" "}
                                        <strong>
                                            {
                                                bulkFormData.rows.split(",").filter((r) => r.trim()).length *
                                                Math.max(0, Number(bulkFormData.seatEnd) - Number(bulkFormData.seatStart) + 1)
                                            }
                                        </strong>{" "}
                                        seats. Any that already exist will be skipped automatically.
                                    </div>

                                )}


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
                                        {submitting ? "Creating..." : "Create Seats"}
                                    </button>

                                </div>

                            </form>

                        ) : (

                            /* ============== SINGLE FORM ============== */

                            <form onSubmit={handleSubmit}>

                                <div className="admin-form-group">

                                    <label htmlFor="seat-stadium">
                                        Stadium
                                    </label>

                                    <select
                                        id="seat-stadium"
                                        name="stadiumId"
                                        value={formData.stadiumId}
                                        onChange={(e) => {
                                            handleChange(e);
                                            setFormData((previous) => ({
                                                ...previous,
                                                standId: ""
                                            }));
                                        }}
                                        required
                                        disabled={submitting}
                                    >
                                        <option value="">Select Stadium</option>
                                        {stadiums.map((stadium) => (
                                            <option key={stadium.id} value={stadium.id}>
                                                {stadium.name}
                                            </option>
                                        ))}
                                    </select>

                                </div>


                                <div className="admin-form-group">

                                    <label htmlFor="seat-stand">
                                        Stand
                                    </label>

                                    <select
                                        id="seat-stand"
                                        name="standId"
                                        value={formData.standId}
                                        onChange={handleChange}
                                        required
                                        disabled={submitting || !formData.stadiumId}
                                    >
                                        <option value="">Select Stand</option>
                                        {availableStands.map((stand) => (
                                            <option key={stand.id} value={stand.id}>
                                                {stand.name}
                                            </option>
                                        ))}
                                    </select>

                                </div>


                                <div className="admin-form-row">

                                    <div className="admin-form-group">

                                        <label htmlFor="seat-number">
                                            Seat Number
                                        </label>

                                        <input
                                            id="seat-number"
                                            name="seatNumber"
                                            type="text"
                                            placeholder="1"
                                            value={formData.seatNumber}
                                            onChange={handleChange}
                                            required
                                            disabled={submitting}
                                        />

                                    </div>


                                    <div className="admin-form-group">

                                        <label htmlFor="seat-row">
                                            Row
                                        </label>

                                        <input
                                            id="seat-row"
                                            name="rowNumber"
                                            type="text"
                                            placeholder="A"
                                            value={formData.rowNumber}
                                            onChange={handleChange}
                                            required
                                            disabled={submitting}
                                        />

                                    </div>

                                </div>


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
                                            : editingSeat
                                                ? "Update Seat"
                                                : "Create Seat"}
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

export default ManageSeats;