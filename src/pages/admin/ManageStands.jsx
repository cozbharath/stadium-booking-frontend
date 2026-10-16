import { useEffect, useMemo, useState } from "react";
import { get, post, put, remove } from "../../services/api";

function ManageStands() {

    const [stands, setStands] = useState([]);
    const [stadiums, setStadiums] = useState([]);
    const [standTypes, setStandTypes] = useState([]);

    const [showForm, setShowForm] = useState(false);
    const [editingStand, setEditingStand] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        stadiumId: "",
        standTypeId: "",
        rows: "",
        seatsPerRow: "",
        status: "ACTIVE"
    });


    // ================= LOAD DATA =================

    const loadData = async () => {

        try {

            setLoading(true);
            setError("");

            const [
                stadiumData,
                standTypeData,
                standData
            ] = await Promise.all([
                get("/stadiums"),
                get("/stand-types"),
                get("/stands")
            ]);

            setStadiums(
                Array.isArray(stadiumData)
                    ? stadiumData
                    : []
            );

            setStandTypes(
                Array.isArray(standTypeData)
                    ? standTypeData
                    : []
            );

            setStands(
                Array.isArray(standData)
                    ? standData
                    : []
            );

        } catch (err) {

            console.error("Failed to load stand data:", err);

            setError(
                err.message || "Failed to load stand information."
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

        setEditingStand(null);

        setFormData({
            name: "",
            stadiumId: "",
            standTypeId: "",
            rows: "",
            seatsPerRow: "",
            status: "ACTIVE"
        });

        setError("");
        setShowForm(true);

    };


    // ================= EDIT FORM =================

    const openEditForm = (stand) => {

        setEditingStand(stand);

        setFormData({
            name: stand.name || "",
            stadiumId: stand.stadiumId || "",
            standTypeId: stand.standTypeId || "",
            rows: stand.rows || "",
            seatsPerRow: stand.seatsPerRow || "",
            status: stand.status || "ACTIVE"
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
        setEditingStand(null);
        setError("");

    };


    // ================= CREATE / UPDATE =================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        if (!formData.name.trim()) {
            setError("Stand name is required.");
            return;
        }

        if (!formData.stadiumId) {
            setError("Please select a stadium.");
            return;
        }

        if (!formData.standTypeId) {
            setError("Please select a stand type.");
            return;
        }

        try {

            setSubmitting(true);

            /*
             * Backend StandRequest accepts:
             * name
             * stadiumId
             * standTypeId
             *
             * rows, seatsPerRow and status are kept
             * in the frontend UI only.
             */

            const standData = {
                name: formData.name,
                stadiumId: Number(formData.stadiumId),
                standTypeId: Number(formData.standTypeId)
            };


            if (editingStand) {

                await put(
                    `/stands/${editingStand.id}`,
                    standData
                );

                alert("Stand updated successfully.");

            } else {

                await post(
                    "/stands",
                    standData
                );

                alert("Stand created successfully.");

            }


            closeForm();

            await loadData();

        } catch (err) {

            console.error("Stand save error:", err);

            setError(
                err.message || "Failed to save stand."
            );

        } finally {

            setSubmitting(false);

        }

    };


    // ================= DELETE =================

    const handleDelete = async (stand) => {

        const confirmed = window.confirm(
            `Are you sure you want to delete "${stand.name}"?`
        );

        if (!confirmed) {
            return;
        }

        try {

            setError("");

            await remove(`/stands/${stand.id}`);

            alert("Stand deleted successfully.");

            await loadData();

        } catch (err) {

            console.error("Delete stand error:", err);

            setError(
                err.message || "Failed to delete stand."
            );

        }

    };


    // ================= GET STADIUM NAME =================

    const getStadiumName = (stand) => {

        if (stand.stadiumName) {
            return stand.stadiumName;
        }

        const stadium = stadiums.find(
            (item) =>
                String(item.id) ===
                String(stand.stadiumId)
        );

        return stadium?.name || "—";

    };


    // ================= GET STAND TYPE NAME =================

    const getStandTypeName = (stand) => {

        if (stand.standTypeName) {
            return stand.standTypeName;
        }

        const standType = standTypes.find(
            (item) =>
                String(item.id) ===
                String(stand.standTypeId)
        );

        return standType?.name || "—";

    };


    // ================= FILTER =================

    const filteredStands = useMemo(() => {

        return stands.filter((stand) => {

            const standTypeName =
                getStandTypeName(stand);

            const stadiumName =
                getStadiumName(stand);

            const search =
                searchTerm.toLowerCase().trim();

            const matchesSearch =
                !search ||
                stand.name
                    ?.toLowerCase()
                    .includes(search) ||
                stadiumName
                    ?.toLowerCase()
                    .includes(search) ||
                standTypeName
                    ?.toLowerCase()
                    .includes(search);

            const matchesType =
                !typeFilter ||
                String(stand.standTypeId) ===
                    String(typeFilter);

            return matchesSearch && matchesType;

        });

    }, [
        stands,
        stadiums,
        standTypes,
        searchTerm,
        typeFilter
    ]);


    // ================= SUMMARY =================

    const totalStands = stands.length;

    const activeStands = stands.filter(
        (stand) =>
            !stand.status ||
            stand.status === "ACTIVE"
    ).length;

    const totalSeats = stands.reduce(
        (total, stand) =>
            total +
            (
                Number(stand.rows || 0) *
                Number(stand.seatsPerRow || 0)
            ),
        0
    );

    const stadiumsUsed = new Set(
        stands
            .map((stand) => stand.stadiumId)
            .filter(Boolean)
    ).size;


    return (
        <div className="admin-management-page">

            {/* ================= HEADER ================= */}

            <section className="admin-page-header">

                <div>

                    <p className="page-tag">
                        STADIUM MANAGEMENT
                    </p>

                    <h1>
                        Manage Stands
                    </h1>

                    <p>
                        Create stadium stands and assign their seating
                        category and capacity.
                    </p>

                </div>


                <button
                    type="button"
                    className="admin-submit-button"
                    onClick={openAddForm}
                >
                    + Add Stand
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
                        Total Stands
                    </span>

                    <strong>
                        {totalStands}
                    </strong>

                </div>


                <div className="admin-management-stat">

                    <span>
                        Active Stands
                    </span>

                    <strong>
                        {activeStands}
                    </strong>

                </div>


                <div className="admin-management-stat">

                    <span>
                        Total Seats
                    </span>

                    <strong>
                        {totalSeats.toLocaleString()}
                    </strong>

                </div>


                <div className="admin-management-stat">

                    <span>
                        Stadiums Used
                    </span>

                    <strong>
                        {stadiumsUsed}
                    </strong>

                </div>

            </section>


            {/* ================= TABLE ================= */}

            <section className="admin-table-card">

                <div className="admin-table-header">

                    <div>

                        <h2>
                            All Stands
                        </h2>

                        <span>
                            Manage stadium stands and seating capacity
                        </span>

                    </div>


                    <div className="admin-table-tools">

                        <input
                            type="text"
                            placeholder="Search stands..."
                            className="admin-search-input"
                            value={searchTerm}
                            onChange={(e) =>
                                setSearchTerm(e.target.value)
                            }
                        />


                        <select
                            className="admin-filter-select"
                            value={typeFilter}
                            onChange={(e) =>
                                setTypeFilter(e.target.value)
                            }
                        >

                            <option value="">
                                All Types
                            </option>

                            {standTypes.map((type) => (

                                <option
                                    key={type.id}
                                    value={type.id}
                                >
                                    {type.name}
                                </option>

                            ))}

                        </select>

                    </div>

                </div>


                <div className="admin-table-wrapper">

                    <table className="admin-users-table">

                        <thead>

                            <tr>

                                <th>
                                    Stand
                                </th>

                                <th>
                                    Stadium
                                </th>

                                <th>
                                    Stand Type
                                </th>

                                <th>
                                    Layout
                                </th>

                                <th>
                                    Total Seats
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
                                        colSpan="7"
                                        style={{
                                            textAlign: "center",
                                            padding: "30px"
                                        }}
                                    >
                                        Loading stands...
                                    </td>

                                </tr>

                            ) : filteredStands.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="7"
                                        style={{
                                            textAlign: "center",
                                            padding: "30px"
                                        }}
                                    >
                                        No stands found.
                                    </td>

                                </tr>

                            ) : (

                                filteredStands.map((stand) => {

                                    const stadiumName =
                                        getStadiumName(stand);

                                    const standTypeName =
                                        getStandTypeName(stand);

                                    const rows =
                                        Number(stand.rows || 0);

                                    const seatsPerRow =
                                        Number(
                                            stand.seatsPerRow || 0
                                        );

                                    const calculatedSeats =
                                        rows * seatsPerRow;

                                    const status =
                                        stand.status || "ACTIVE";

                                    return (

                                        <tr key={stand.id}>

                                            {/* STAND */}

                                            <td>

                                                <div className="admin-user-table-info">

                                                    <div className="admin-user-table-avatar">
                                                        🪑
                                                    </div>

                                                    <strong>
                                                        {stand.name}
                                                    </strong>

                                                </div>

                                            </td>


                                            {/* STADIUM */}

                                            <td>

                                                <span className="admin-description-cell">
                                                    {stadiumName}
                                                </span>

                                            </td>


                                            {/* TYPE */}

                                            <td>

                                                <span
                                                    className={`admin-role-badge ${
                                                        standTypeName
                                                            .toLowerCase()
                                                            .replace(
                                                                " ",
                                                                "-"
                                                            )
                                                    }`}
                                                >
                                                    {standTypeName}
                                                </span>

                                            </td>


                                            {/* LAYOUT */}

                                            <td>

                                                {rows > 0 &&
                                                seatsPerRow > 0
                                                    ? `${rows} × ${seatsPerRow}`
                                                    : "—"}

                                            </td>


                                            {/* SEATS */}

                                            <td>

                                                <strong className="admin-price-cell">
                                                    {calculatedSeats}
                                                </strong>

                                            </td>


                                            {/* STATUS */}

                                            <td>

                                                <span
                                                    className={`admin-status-badge ${
                                                        status.toLowerCase()
                                                    }`}
                                                >

                                                    <span className="status-dot"></span>

                                                    {status}

                                                </span>

                                            </td>


                                            {/* ACTIONS */}

                                            <td>

                                                <div className="admin-table-actions">

                                                    <button
                                                        type="button"
                                                        className="admin-action-button view"
                                                        title="View stand"
                                                        onClick={() =>
                                                            alert(
                                                                `Stand: ${stand.name}\n` +
                                                                `Stadium: ${stadiumName}\n` +
                                                                `Type: ${standTypeName}\n` +
                                                                `Capacity: ${calculatedSeats}`
                                                            )
                                                        }
                                                    >
                                                        👁
                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="admin-action-button edit"
                                                        title="Edit stand"
                                                        onClick={() =>
                                                            openEditForm(
                                                                stand
                                                            )
                                                        }
                                                    >
                                                        ✏️
                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="admin-action-button delete"
                                                        title="Delete stand"
                                                        onClick={() =>
                                                            handleDelete(
                                                                stand
                                                            )
                                                        }
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
                        Showing {filteredStands.length} of{" "}
                        {stands.length} stands
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
                ADD / EDIT MODAL
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

                        {/* HEADER */}

                        <div className="admin-modal-header">

                            <div>

                                <p className="page-tag">
                                    STADIUM MANAGEMENT
                                </p>

                                <h2>
                                    {editingStand
                                        ? "Edit Stand"
                                        : "Add Stand"}
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

                            {/* STAND NAME */}

                            <div className="admin-form-group">

                                <label htmlFor="stand-name">
                                    Stand Name
                                </label>

                                <input
                                    id="stand-name"
                                    name="name"
                                    type="text"
                                    placeholder="Example: A Stand"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    disabled={submitting}
                                />

                            </div>


                            {/* STADIUM */}

                            <div className="admin-form-group">

                                <label htmlFor="stand-stadium">
                                    Stadium
                                </label>

                                <select
                                    id="stand-stadium"
                                    name="stadiumId"
                                    value={formData.stadiumId}
                                    onChange={handleChange}
                                    required
                                    disabled={submitting}
                                >

                                    <option value="">
                                        Select Stadium
                                    </option>

                                    {stadiums.map((stadium) => (

                                        <option
                                            key={stadium.id}
                                            value={stadium.id}
                                        >
                                            {stadium.name}
                                        </option>

                                    ))}

                                </select>

                            </div>


                            {/* STAND TYPE */}

                            <div className="admin-form-group">

                                <label htmlFor="stand-type">
                                    Stand Type
                                </label>

                                <select
                                    id="stand-type"
                                    name="standTypeId"
                                    value={formData.standTypeId}
                                    onChange={handleChange}
                                    required
                                    disabled={submitting}
                                >

                                    <option value="">
                                        Select Stand Type
                                    </option>

                                    {standTypes.map((type) => (

                                        <option
                                            key={type.id}
                                            value={type.id}
                                        >
                                            {type.name}
                                        </option>

                                    ))}

                                </select>

                            </div>


                            {/* LAYOUT */}

                            <div className="admin-form-row">

                                <div className="admin-form-group">

                                    <label htmlFor="stand-rows">
                                        Number of Rows
                                    </label>

                                    <input
                                        id="stand-rows"
                                        name="rows"
                                        type="number"
                                        min="1"
                                        placeholder="10"
                                        value={formData.rows}
                                        onChange={handleChange}
                                        required
                                        disabled={submitting}
                                    />

                                </div>


                                <div className="admin-form-group">

                                    <label htmlFor="seats-per-row">
                                        Seats Per Row
                                    </label>

                                    <input
                                        id="seats-per-row"
                                        name="seatsPerRow"
                                        type="number"
                                        min="1"
                                        placeholder="20"
                                        value={formData.seatsPerRow}
                                        onChange={handleChange}
                                        required
                                        disabled={submitting}
                                    />

                                </div>

                            </div>


                            {/* CAPACITY PREVIEW */}

                            {formData.rows &&
                                formData.seatsPerRow && (

                                    <div className="admin-capacity-preview">

                                        <span>
                                            Calculated Capacity
                                        </span>

                                        <strong>

                                            {Number(formData.rows) *
                                                Number(
                                                    formData.seatsPerRow
                                                )}

                                            {" "}
                                            Seats

                                        </strong>

                                    </div>

                                )}


                            {/* STATUS */}

                            <div className="admin-form-group">

                                <label htmlFor="stand-status">
                                    Status
                                </label>

                                <select
                                    id="stand-status"
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
                                        : editingStand
                                            ? "Update Stand"
                                            : "Create Stand"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default ManageStands;