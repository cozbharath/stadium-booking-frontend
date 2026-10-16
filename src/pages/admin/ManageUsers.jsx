import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get, put, remove } from "../../services/api";

function ManageUsers() {

    // =========================================================
    // USERS
    // =========================================================

    const [users, setUsers] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    // =========================================================
    // SEARCH / FILTER
    // =========================================================

    const [search, setSearch] = useState("");

    const [roleFilter, setRoleFilter] = useState("");


    // =========================================================
    // EDIT MODAL
    // =========================================================

    const [showEditModal, setShowEditModal] = useState(false);

    const [selectedUser, setSelectedUser] = useState(null);

    const [editForm, setEditForm] = useState({
        name: "",
        email: "",
        role: "CUSTOMER",
    });

    const [saving, setSaving] = useState(false);


    // =========================================================
    // LOAD USERS
    // =========================================================

    const loadUsers = async () => {

        try {

            setLoading(true);
            setError("");

            const data = await get("/users");

            setUsers(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (err) {

            console.error(
                "Failed to load users:",
                err
            );

            setError(
                err.message ||
                "Failed to load users."
            );

        } finally {

            setLoading(false);
        }
    };


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {

        queueMicrotask(() => {
            loadUsers();
        });

    }, []);


    // =========================================================
    // SEARCH + FILTER
    // =========================================================

    const filteredUsers = users.filter((user) => {

        const searchText =
            search.trim().toLowerCase();

        const matchesSearch =
            !searchText ||
            (user.name || "")
                .toLowerCase()
                .includes(searchText) ||
            (user.email || "")
                .toLowerCase()
                .includes(searchText);

        const matchesRole =
            !roleFilter ||
            user.role === roleFilter;

        return (
            matchesSearch &&
            matchesRole
        );
    });


    // =========================================================
    // STATISTICS
    // =========================================================

    const totalUsers =
        users.length;

    const totalCustomers =
        users.filter(
            (user) =>
                user.role === "CUSTOMER"
        ).length;

    const totalStaff =
        users.filter(
            (user) =>
                user.role === "STAFF"
        ).length;

    const totalActiveUsers =
        users.filter(
            (user) =>
                !user.status ||
                user.status === "ACTIVE"
        ).length;


    // =========================================================
    // FORMAT JOINED DATE
    // =========================================================

    const formatDate = (dateValue) => {

        if (!dateValue) {
            return "—";
        }

        const date =
            new Date(dateValue);

        if (isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };


    // =========================================================
    // VIEW USER
    // =========================================================

    const handleView = (user) => {

        alert(
            `User Details\n\n` +
            `Name: ${user.name}\n` +
            `Email: ${user.email}\n` +
            `Role: ${user.role}`
        );
    };


    // =========================================================
    // OPEN EDIT
    // =========================================================

    const handleEdit = (user) => {

        setSelectedUser(user);

        setEditForm({
            name: user.name || "",
            email: user.email || "",
            role: user.role || "CUSTOMER",
        });

        setShowEditModal(true);
    };


    // =========================================================
    // CLOSE EDIT
    // =========================================================

    const closeEditModal = () => {

        if (saving) {
            return;
        }

        setShowEditModal(false);

        setSelectedUser(null);

        setEditForm({
            name: "",
            email: "",
            role: "CUSTOMER",
        });
    };


    // =========================================================
    // EDIT FORM CHANGE
    // =========================================================

    const handleEditChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setEditForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };


    // =========================================================
    // UPDATE USER
    // =========================================================

    const handleUpdate = async (e) => {

        e.preventDefault();

        if (!selectedUser) {
            return;
        }

        try {

            setSaving(true);
            setError("");

            await put(
                `/users/${selectedUser.id}`,
                {
                    name: editForm.name,
                    email: editForm.email,
                    role: editForm.role,
                }
            );

            closeEditModal();

            await loadUsers();

        } catch (err) {

            console.error(
                "Failed to update user:",
                err
            );

            setError(
                err.message ||
                "Failed to update user."
            );

        } finally {

            setSaving(false);
        }
    };


    // =========================================================
    // DELETE USER
    // =========================================================

    const handleDelete = async (user) => {

        const confirmed =
            window.confirm(
                `Are you sure you want to delete ${user.name}?`
            );

        if (!confirmed) {
            return;
        }

        try {

            setError("");

            await remove(
                `/users/${user.id}`
            );

            await loadUsers();

        } catch (err) {

            console.error(
                "Failed to delete user:",
                err
            );

            setError(
                err.message ||
                "Failed to delete user."
            );
        }
    };


    // =========================================================
    // ROLE CLASS
    // =========================================================

    const getRoleClass = (role) => {

        if (!role) {
            return "";
        }

        return role.toLowerCase();
    };


    // =========================================================
    // STATUS
    // =========================================================

    const getStatus = (user) => {

        return user.status || "ACTIVE";
    };


    // =========================================================
    // RENDER
    // =========================================================

    return (

        <div className="admin-management-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <section className="admin-page-header">

                <div>

                    <p className="page-tag">
                        USER MANAGEMENT
                    </p>

                    <h1>
                        Manage Users
                    </h1>

                    <p>
                        View and manage customers and staff accounts.
                    </p>

                </div>


                <Link
                    to="/admin/staff/create"
                    className="admin-dashboard-primary-button"
                >
                    + Create Staff
                </Link>

            </section>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div className="admin-error-message">
                    {error}
                </div>

            )}


            {/* =================================================
                SUMMARY
            ================================================= */}

            <section className="admin-management-stats">


                <div className="admin-management-stat">

                    <span>
                        Total Users
                    </span>

                    <strong>
                        {loading
                            ? "..."
                            : totalUsers
                        }
                    </strong>

                </div>


                <div className="admin-management-stat">

                    <span>
                        Customers
                    </span>

                    <strong>
                        {loading
                            ? "..."
                            : totalCustomers
                        }
                    </strong>

                </div>


                <div className="admin-management-stat">

                    <span>
                        Staff
                    </span>

                    <strong>
                        {loading
                            ? "..."
                            : totalStaff
                        }
                    </strong>

                </div>


                <div className="admin-management-stat">

                    <span>
                        Active Users
                    </span>

                    <strong>
                        {loading
                            ? "..."
                            : totalActiveUsers
                        }
                    </strong>

                </div>


            </section>


            {/* =================================================
                USER TABLE
            ================================================= */}

            <section className="admin-table-card">


                {/* =================================================
                    TABLE HEADER
                ================================================= */}

                <div className="admin-table-header">


                    <div>

                        <h2>
                            All Users
                        </h2>

                        <span>
                            Manage registered users and staff accounts
                        </span>

                    </div>


                    {/* =================================================
                        TOOLS
                    ================================================= */}

                    <div className="admin-table-tools">


                        <input
                            type="text"
                            placeholder="Search users..."
                            className="admin-search-input"
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />


                        <select
                            className="admin-filter-select"
                            value={roleFilter}
                            onChange={(e) =>
                                setRoleFilter(e.target.value)
                            }
                        >

                            <option value="">
                                All Roles
                            </option>

                            <option value="CUSTOMER">
                                Customer
                            </option>

                            <option value="STAFF">
                                Staff
                            </option>

                            <option value="ADMIN">
                                Admin
                            </option>

                        </select>


                    </div>

                </div>


                {/* =================================================
                    TABLE
                ================================================= */}

                <div className="admin-table-wrapper">

                    <table className="admin-users-table">


                        <thead>

                            <tr>

                                <th>
                                    User
                                </th>

                                <th>
                                    Email
                                </th>

                                <th>
                                    Role
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Joined
                                </th>

                                <th>
                                    Actions
                                </th>

                            </tr>

                        </thead>


                        <tbody>


                            {/* LOADING */}

                            {loading && (

                                <tr>

                                    <td
                                        colSpan="6"
                                        style={{
                                            textAlign: "center",
                                            padding: "40px",
                                        }}
                                    >
                                        Loading users...
                                    </td>

                                </tr>

                            )}


                            {/* EMPTY */}

                            {!loading &&
                                filteredUsers.length === 0 && (

                                    <tr>

                                        <td
                                            colSpan="6"
                                            style={{
                                                textAlign: "center",
                                                padding: "40px",
                                            }}
                                        >
                                            No users found.
                                        </td>

                                    </tr>

                                )}


                            {/* USERS */}

                            {!loading &&
                                filteredUsers.map((user) => (

                                    <tr key={user.id}>


                                        {/* USER */}

                                        <td>

                                            <div className="admin-user-table-info">

                                                <div className="admin-user-table-avatar">

                                                    {user.name
                                                        ? user.name
                                                            .charAt(0)
                                                            .toUpperCase()
                                                        : "U"
                                                    }

                                                </div>


                                                <strong>
                                                    {user.name}
                                                </strong>

                                            </div>

                                        </td>


                                        {/* EMAIL */}

                                        <td>
                                            {user.email}
                                        </td>


                                        {/* ROLE */}

                                        <td>

                                            <span
                                                className={`admin-role-badge ${getRoleClass(user.role)}`}
                                            >
                                                {user.role}
                                            </span>

                                        </td>


                                        {/* STATUS */}

                                        <td>

                                            <span
                                                className={`admin-status-badge ${getStatus(user).toLowerCase()}`}
                                            >

                                                <span className="status-dot"></span>

                                                {getStatus(user)}

                                            </span>

                                        </td>


                                        {/* JOINED */}

                                        <td>
                                            {formatDate(
                                                user.createdAt ||
                                                user.joined ||
                                                user.createdDate
                                            )}
                                        </td>


                                        {/* ACTIONS */}

                                        <td>

                                            <div className="admin-table-actions">


                                                {/* VIEW */}

                                                <button
                                                    type="button"
                                                    className="admin-action-button view"
                                                    title="View user"
                                                    onClick={() =>
                                                        handleView(user)
                                                    }
                                                >
                                                    👁
                                                </button>


                                                {/* EDIT */}

                                                <button
                                                    type="button"
                                                    className="admin-action-button edit"
                                                    title="Edit user"
                                                    onClick={() =>
                                                        handleEdit(user)
                                                    }
                                                >
                                                    ✏️
                                                </button>


                                                {/* DELETE */}

                                                <button
                                                    type="button"
                                                    className="admin-action-button delete"
                                                    title="Delete user"
                                                    onClick={() =>
                                                        handleDelete(user)
                                                    }
                                                >
                                                    🗑
                                                </button>


                                            </div>

                                        </td>


                                    </tr>

                                ))}

                        </tbody>

                    </table>

                </div>


                {/* =================================================
                    PAGINATION
                ================================================= */}

                <div className="admin-table-pagination">

                    <span>

                        Showing{" "}
                        {filteredUsers.length}{" "}
                        of{" "}
                        {users.length} users

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
                EDIT USER MODAL
            ================================================= */}

            {showEditModal && (

                <div className="admin-modal-overlay">


                    <div className="admin-modal">


                        <div className="admin-modal-header">

                            <div>

                                <p className="page-tag">
                                    USER MANAGEMENT
                                </p>

                                <h2>
                                    Edit User
                                </h2>

                            </div>


                            <button
                                type="button"
                                className="admin-modal-close"
                                onClick={closeEditModal}
                                disabled={saving}
                            >
                                ×
                            </button>

                        </div>


                        <form onSubmit={handleUpdate}>


                            {/* NAME */}

                            <div className="admin-form-group">

                                <label>
                                    Name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={editForm.name}
                                    onChange={handleEditChange}
                                    required
                                />

                            </div>


                            {/* EMAIL */}

                            <div className="admin-form-group">

                                <label>
                                    Email
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={editForm.email}
                                    onChange={handleEditChange}
                                    required
                                />

                            </div>


                            {/* ROLE */}

                            <div className="admin-form-group">

                                <label>
                                    Role
                                </label>

                                <select
                                    name="role"
                                    value={editForm.role}
                                    onChange={handleEditChange}
                                >

                                    <option value="CUSTOMER">
                                        CUSTOMER
                                    </option>

                                    <option value="STAFF">
                                        STAFF
                                    </option>

                                    <option value="ADMIN">
                                        ADMIN
                                    </option>

                                </select>

                            </div>


                            {/* ACTIONS */}

                            <div className="admin-modal-actions">

                                <button
                                    type="button"
                                    className="admin-secondary-button"
                                    onClick={closeEditModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="admin-dashboard-primary-button"
                                    disabled={saving}
                                >

                                    {saving
                                        ? "Updating..."
                                        : "Update User"
                                    }

                                </button>

                            </div>


                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default ManageUsers;