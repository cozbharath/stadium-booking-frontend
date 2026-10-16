import { useEffect, useMemo, useState } from "react";
import { get, post, put, remove } from "../../services/api";

function ManageStandTypes() {
    const [standTypes, setStandTypes] = useState([]);
    const [stands, setStands] = useState([]);

    const [showForm, setShowForm] = useState(false);
    const [editingStandType, setEditingStandType] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        status: "ACTIVE"
    });

    // =========================================================
    // LOAD DATA
    // =========================================================

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [standTypeData, standData] = await Promise.all([
                get("/stand-types"),
                get("/stands")
            ]);

            setStandTypes(Array.isArray(standTypeData) ? standTypeData : []);
            setStands(Array.isArray(standData) ? standData : []);
        } catch (err) {
            console.error("Load stand types error:", err);
            setError(err.message || "Failed to load stand types.");
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

    const getStandTypeId = (standType) => {
        return standType?.id ?? standType?.standTypeId;
    };

    const getStandCount = (standType) => {
        const standTypeId = getStandTypeId(standType);

        return stands.filter((stand) => {
            const standTypeReference =
                stand.standTypeId ??
                stand.standType?.id;

            return Number(standTypeReference) === Number(standTypeId);
        }).length;
    };

    // =========================================================
    // FILTERING
    // =========================================================

    const filteredStandTypes = useMemo(() => {
        return standTypes.filter((standType) => {
            const search = searchTerm.toLowerCase().trim();

            const matchesSearch =
                !search ||
                standType.name?.toLowerCase().includes(search) ||
                standType.description?.toLowerCase().includes(search);

            const matchesStatus =
                !statusFilter ||
                standType.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [standTypes, searchTerm, statusFilter]);

    // =========================================================
    // SUMMARY
    // =========================================================

    const totalStandTypes = standTypes.length;

    const activeTypes = standTypes.filter(
        (standType) => standType.status === "ACTIVE"
    ).length;

    const totalStands = stands.length;

    const prices = standTypes
        .map((standType) => Number(standType.price))
        .filter((price) => !Number.isNaN(price));

    const minimumPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maximumPrice = prices.length > 0 ? Math.max(...prices) : 0;

    const priceRange =
        prices.length > 0
            ? `₹${minimumPrice.toLocaleString()}–₹${maximumPrice.toLocaleString()}`
            : "—";

    // =========================================================
    // FORM HANDLERS
    // =========================================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const openAddForm = () => {
        setEditingStandType(null);

        setFormData({
            name: "",
            description: "",
            price: "",
            status: "ACTIVE"
        });

        setError("");
        setShowForm(true);
    };

    const openEditForm = (standType) => {
        setEditingStandType(standType);

        setFormData({
            name: standType.name || "",
            description: standType.description || "",
            price: standType.price ?? "",
            status: standType.status || "ACTIVE"
        });

        setError("");
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingStandType(null);
        setError("");
    };

    // =========================================================
    // CREATE / UPDATE
    // =========================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSubmitting(true);
            setError("");

            const standTypeData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                price: Number(formData.price),
                status: formData.status
            };

            if (!standTypeData.name) {
                setError("Stand type name is required.");
                return;
            }

            if (!standTypeData.description) {
                setError("Description is required.");
                return;
            }

            if (Number.isNaN(standTypeData.price) || standTypeData.price < 0) {
                setError("Please enter a valid price.");
                return;
            }

            if (editingStandType) {
                const id = getStandTypeId(editingStandType);

                await put(`/stand-types/${id}`, standTypeData);

                alert("Stand type updated successfully.");
            } else {
                await post("/stand-types", standTypeData);

                alert("Stand type created successfully.");
            }

            closeForm();

            await loadData();
        } catch (err) {
            console.error("Save stand type error:", err);
            setError(err.message || "Failed to save stand type.");
        } finally {
            setSubmitting(false);
        }
    };

    // =========================================================
    // DELETE
    // =========================================================

    const handleDelete = async (standType) => {
        const id = getStandTypeId(standType);

        const confirmed = window.confirm(
            `Are you sure you want to delete "${standType.name}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");

            await remove(`/stand-types/${id}`);

            alert("Stand type deleted successfully.");

            await loadData();
        } catch (err) {
            console.error("Delete stand type error:", err);

            setError(
                err.message ||
                "Failed to delete stand type. It may be used by existing stands."
            );
        }
    };

    // =========================================================
    // VIEW
    // =========================================================

    const handleView = (standType) => {
        const standCount = getStandCount(standType);

        alert(
            `Stand Type: ${standType.name}\n\n` +
            `Description: ${standType.description || "—"}\n` +
            `Price Per Seat: ₹${Number(
                standType.price || 0
            ).toLocaleString()}\n` +
            `Stands: ${standCount}\n` +
            `Status: ${standType.status || "—"}`
        );
    };

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="admin-management-page">

            {/* ================= PAGE HEADER ================= */}

            <section className="admin-page-header">

                <div>

                    <p className="page-tag">
                        STADIUM MANAGEMENT
                    </p>

                    <h1>
                        Manage Stand Types
                    </h1>

                    <p>
                        Define seating categories and pricing used
                        across stadium stands.
                    </p>

                </div>

                <button
                    type="button"
                    className="admin-submit-button"
                    onClick={openAddForm}
                >
                    + Add Stand Type
                </button>

            </section>


            {/* ================= ERROR ================= */}

            {error && !showForm && (
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


            {/* ================= SUMMARY ================= */}

            <section className="admin-management-stats">

                <div className="admin-management-stat">
                    <span>Total Stand Types</span>
                    <strong>{totalStandTypes}</strong>
                </div>

                <div className="admin-management-stat">
                    <span>Active Types</span>
                    <strong>{activeTypes}</strong>
                </div>

                <div className="admin-management-stat">
                    <span>Total Stands</span>
                    <strong>{totalStands}</strong>
                </div>

                <div className="admin-management-stat">
                    <span>Price Range</span>
                    <strong>{priceRange}</strong>
                </div>

            </section>


            {/* ================= TABLE ================= */}

            <section className="admin-table-card">

                <div className="admin-table-header">

                    <div>

                        <h2>
                            All Stand Types
                        </h2>

                        <span>
                            Manage seating categories and their pricing
                        </span>

                    </div>


                    <div className="admin-table-tools">

                        <input
                            type="text"
                            placeholder="Search stand types..."
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

                                <th>Stand Type</th>

                                <th>Description</th>

                                <th>Price / Seat</th>

                                <th>Stands</th>

                                <th>Status</th>

                                <th>Actions</th>

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
                                        Loading stand types...
                                    </td>

                                </tr>

                            ) : filteredStandTypes.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="6"
                                        style={{
                                            textAlign: "center",
                                            padding: "30px"
                                        }}
                                    >
                                        No stand types found.
                                    </td>

                                </tr>

                            ) : (

                                filteredStandTypes.map((standType) => (

                                    <tr
                                        key={getStandTypeId(standType)}
                                    >

                                        {/* NAME */}

                                        <td>

                                            <div className="admin-user-table-info">

                                                <div className="admin-user-table-avatar">
                                                    🏷️
                                                </div>

                                                <strong>
                                                    {standType.name}
                                                </strong>

                                            </div>

                                        </td>


                                        {/* DESCRIPTION */}

                                        <td>

                                            <span className="admin-description-cell">

                                                {standType.description || "—"}

                                            </span>

                                        </td>


                                        {/* PRICE */}

                                        <td>

                                            <strong className="admin-price-cell">

                                                ₹
                                                {Number(
                                                    standType.price || 0
                                                ).toLocaleString()}

                                            </strong>

                                        </td>


                                        {/* STANDS */}

                                        <td>

                                            {getStandCount(standType)}

                                        </td>


                                        {/* STATUS */}

                                        <td>

                                            <span
                                                className={`admin-status-badge ${
                                                    (
                                                        standType.status ||
                                                        "INACTIVE"
                                                    ).toLowerCase()
                                                }`}
                                            >

                                                <span className="status-dot"></span>

                                                {standType.status || "INACTIVE"}

                                            </span>

                                        </td>


                                        {/* ACTIONS */}

                                        <td>

                                            <div className="admin-table-actions">

                                                <button
                                                    type="button"
                                                    className="admin-action-button view"
                                                    title="View stand type"
                                                    onClick={() =>
                                                        handleView(
                                                            standType
                                                        )
                                                    }
                                                >
                                                    👁
                                                </button>


                                                <button
                                                    type="button"
                                                    className="admin-action-button edit"
                                                    title="Edit stand type"
                                                    onClick={() =>
                                                        openEditForm(
                                                            standType
                                                        )
                                                    }
                                                >
                                                    ✏️
                                                </button>


                                                <button
                                                    type="button"
                                                    className="admin-action-button delete"
                                                    title="Delete stand type"
                                                    onClick={() =>
                                                        handleDelete(
                                                            standType
                                                        )
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
                        Showing{" "}
                        {filteredStandTypes.length > 0
                            ? `1–${filteredStandTypes.length}`
                            : "0"}{" "}
                        of {filteredStandTypes.length} stand types
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
                                    {editingStandType
                                        ? "Edit Stand Type"
                                        : "Add Stand Type"}
                                </h2>

                            </div>


                            <button
                                type="button"
                                className="admin-modal-close"
                                onClick={closeForm}
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


                            {/* NAME */}

                            <div className="admin-form-group">

                                <label htmlFor="stand-type-name">
                                    Stand Type Name
                                </label>

                                <input
                                    id="stand-type-name"
                                    name="name"
                                    type="text"
                                    placeholder="Example: Premium"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />

                            </div>


                            {/* DESCRIPTION */}

                            <div className="admin-form-group">

                                <label htmlFor="stand-type-description">
                                    Description
                                </label>

                                <textarea
                                    id="stand-type-description"
                                    name="description"
                                    placeholder="Describe this seating category..."
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="4"
                                    required
                                />

                            </div>


                            {/* PRICE */}

                            <div className="admin-form-group">

                                <label htmlFor="stand-type-price">
                                    Price Per Seat
                                </label>

                                <div className="admin-price-input">

                                    <span>₹</span>

                                    <input
                                        id="stand-type-price"
                                        name="price"
                                        type="number"
                                        min="0"
                                        placeholder="500"
                                        value={formData.price}
                                        onChange={handleChange}
                                        required
                                    />

                                </div>

                            </div>


                            {/* STATUS */}

                            <div className="admin-form-group">

                                <label htmlFor="stand-type-status">
                                    Status
                                </label>

                                <select
                                    id="stand-type-status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
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
                                        : editingStandType
                                            ? "Update Stand Type"
                                            : "Create Stand Type"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default ManageStandTypes;