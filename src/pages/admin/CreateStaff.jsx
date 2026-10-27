import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { post } from "../../services/api";

function CreateStaff() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: "",
        role: "STAFF"
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        // Check password
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);

            const staffData = {
                name: formData.name,
                email: formData.email,
                mobile: formData.mobile,
                password: formData.password,
                role: "STAFF"
            };

            console.log("Creating staff:", staffData);

            await post("/users", staffData);

            alert("Staff account created successfully.");

            navigate("/admin/users");

        } catch (err) {
            console.error("Create staff error:", err);

            setError(
                err.message || "Failed to create staff account."
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-management-page">

            {/* ================= HEADER ================= */}

            <section className="admin-page-header">

                <div>

                    <p className="page-tag">
                        USER MANAGEMENT
                    </p>

                    <h1>
                        Create Staff
                    </h1>

                    <p>
                        Create login credentials for a new BookNow staff member.
                    </p>

                </div>

                <Link
                    to="/admin/users"
                    className="admin-secondary-button"
                >
                    ← Back to Users
                </Link>

            </section>


            {/* ================= FORM AREA ================= */}

            <div className="admin-form-layout">

                {/* FORM */}

                <section className="admin-form-card">

                    <div className="admin-form-card-header">

                        <div>

                            <p className="page-tag">
                                STAFF ACCOUNT
                            </p>

                            <h2>
                                Staff Information
                            </h2>

                            <p>
                                Enter the details below to create a staff account.
                            </p>

                        </div>

                        <div className="admin-form-header-icon">
                            👤
                        </div>

                    </div>


                    <form onSubmit={handleSubmit}>

                        {/* ERROR MESSAGE */}

                        {error && (
                            <div className="admin-form-error">
                                {error}
                            </div>
                        )}


                        {/* NAME */}

                        <div className="admin-form-group">

                            <label htmlFor="name">
                                Full Name
                            </label>

                            <input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="Enter staff full name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />

                        </div>


                        {/* EMAIL */}

                        <div className="admin-form-group">

                            <label htmlFor="email">
                                Email Address
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="staff@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />

                        </div>


                        {/* MOBILE */}

                        <div className="admin-form-group">

                            <label htmlFor="mobile">
                                Mobile Number
                            </label>

                            <input
                                id="mobile"
                                name="mobile"
                                type="tel"
                                inputMode="numeric"
                                placeholder="10-digit mobile number"
                                value={formData.mobile}
                                onChange={handleChange}
                                required
                            />

                        </div>


                        {/* PASSWORD ROW */}

                        <div className="admin-form-row">

                            {/* PASSWORD */}

                            <div className="admin-form-group">

                                <label htmlFor="password">
                                    Password
                                </label>

                                <div className="admin-password-field">

                                    <input
                                        id="password"
                                        name="password"
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        placeholder="Create password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="admin-password-toggle"
                                    >
                                        {showPassword ? "🙈" : "👁"}
                                    </button>

                                </div>

                            </div>


                            {/* CONFIRM PASSWORD */}

                            <div className="admin-form-group">

                                <label htmlFor="confirmPassword">
                                    Confirm Password
                                </label>

                                <div className="admin-password-field">

                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        placeholder="Confirm password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword
                                            )
                                        }
                                        className="admin-password-toggle"
                                    >
                                        {showConfirmPassword
                                            ? "🙈"
                                            : "👁"}
                                    </button>

                                </div>

                            </div>

                        </div>


                        {/* ROLE */}

                        <div className="admin-form-group">

                            <label htmlFor="role">
                                Role
                            </label>

                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                disabled
                            >

                                <option value="STAFF">
                                    STAFF
                                </option>

                            </select>

                            <small className="admin-form-help">
                                Staff accounts are created with the STAFF role.
                            </small>

                        </div>


                        {/* BUTTONS */}

                        <div className="admin-form-actions">

                            <Link
                                to="/admin/users"
                                className="admin-secondary-button"
                            >
                                Cancel
                            </Link>

                            <button
                                type="submit"
                                className="admin-submit-button"
                                disabled={loading}
                            >
                                {loading
                                    ? "Creating..."
                                    : "Create Staff Account"}
                            </button>

                        </div>

                    </form>

                </section>


                {/* INFORMATION CARD */}

                <aside className="admin-info-card">

                    <div className="admin-info-icon">
                        🛡️
                    </div>

                    <h2>
                        Staff Access
                    </h2>

                    <p>
                        Staff members can access operational features
                        required to manage bookings and validate tickets.
                    </p>


                    <div className="admin-info-list">

                        <div>
                            <span>✓</span>

                            <p>
                                View booking information
                            </p>
                        </div>

                        <div>
                            <span>✓</span>

                            <p>
                                Check payment information
                            </p>
                        </div>

                        <div>
                            <span>✓</span>

                            <p>
                                Validate customer tickets
                            </p>
                        </div>

                        <div>
                            <span>✓</span>

                            <p>
                                View event information
                            </p>
                        </div>

                    </div>


                    <div className="admin-info-warning">

                        <strong>
                            Important
                        </strong>

                        <p>
                            Staff accounts should only be created for
                            authorized BookNow employees.
                        </p>

                    </div>

                </aside>

            </div>

        </div>
    );
}

export default CreateStaff;