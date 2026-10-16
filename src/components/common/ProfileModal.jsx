import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { get, put } from "../../services/api";
import "./ProfileModal.css";

// Shared profile modal for Admin, Staff and Customer.
// - Profile tab: always shown (name, email, role) - fetched from GET /users/me
// - Bookings / History / Orders / Password tabs: only rendered for role === "CUSTOMER"
function ProfileModal({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState("profile");

    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState("");

    const [bookings, setBookings] = useState(null);
    const [bookingsLoading, setBookingsLoading] = useState(false);
    const [bookingsError, setBookingsError] = useState("");

    const [orders, setOrders] = useState(null);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState("");

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
    });
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");

    // Reset to the Profile tab every time the modal is (re)opened.
    useEffect(() => {
        if (isOpen) {
            setActiveTab("profile");
        }
    }, [isOpen]);

    // Fetch the real profile whenever the modal opens.
    useEffect(() => {
        if (!isOpen) return;

        let cancelled = false;

        setProfileLoading(true);
        setProfileError("");

        get("/users/me")
            .then((data) => {
                if (!cancelled) setProfile(data);
            })
            .catch((err) => {
                if (!cancelled) setProfileError(err.message || "Failed to load profile");
            })
            .finally(() => {
                if (!cancelled) setProfileLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isOpen]);

    const isCustomer = profile?.role === "CUSTOMER";

    // Lazy-load bookings only when the Bookings/History tab is opened, and only once.
    useEffect(() => {
        if (!isOpen || !isCustomer) return;
        if (activeTab !== "bookings" && activeTab !== "history") return;
        if (bookings !== null || bookingsLoading) return;

        setBookingsLoading(true);
        setBookingsError("");

        get("/bookings/my")
            .then((data) => setBookings(data))
            .catch((err) => setBookingsError(err.message || "Failed to load bookings"))
            .finally(() => setBookingsLoading(false));
    }, [isOpen, isCustomer, activeTab, bookings, bookingsLoading]);

    // Lazy-load recent orders (payments) only when that tab is opened.
    useEffect(() => {
        if (!isOpen || !isCustomer) return;
        if (activeTab !== "orders") return;
        if (orders !== null || ordersLoading) return;

        setOrdersLoading(true);
        setOrdersError("");

        get("/payments/my/recent")
            .then((data) => setOrders(data))
            .catch((err) => setOrdersError(err.message || "Failed to load recent orders"))
            .finally(() => setOrdersLoading(false));
    }, [isOpen, isCustomer, activeTab, orders, ordersLoading]);

    // Prevent the page behind the modal from scrolling while it's open -
    // also stops the "clipped inside the header" illusion from getting worse
    // if the page itself is taller than the viewport.
    useEffect(() => {
        if (!isOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const isPastOrInactive = (booking) => {
        if (booking.status === "CANCELLED" || booking.status === "EXPIRED") return true;
        if (!booking.eventDate) return false;
        return new Date(booking.eventDate) < new Date(new Date().toDateString());
    };

    const activeBookings = (bookings || []).filter((b) => !isPastOrInactive(b));
    const pastBookings = (bookings || []).filter((b) => isPastOrInactive(b));

    function handlePasswordChange(e) {
        const { name, value } = e.target;
        setPasswordForm((prev) => ({ ...prev, [name]: value }));
        setPasswordError("");
        setPasswordSuccess("");
    }

    async function handlePasswordSubmit(e) {
        e.preventDefault();
        setPasswordError("");
        setPasswordSuccess("");

        if (!passwordForm.currentPassword || !passwordForm.newPassword) {
            setPasswordError("Please fill in all fields.");
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
            setPasswordError("New password and confirmation do not match.");
            return;
        }

        setPasswordSaving(true);

        try {
            await put("/users/me/password", {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });

            setPasswordSuccess("Password updated successfully.");
            setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
        } catch (err) {
            setPasswordError(err.message || "Failed to update password.");
        } finally {
            setPasswordSaving(false);
        }
    }

    const tabs = [{ id: "profile", label: "Profile" }];

    if (isCustomer) {
        tabs.push(
            { id: "bookings", label: "Bookings" },
            { id: "history", label: "History" },
            { id: "orders", label: "Recent Orders" },
            { id: "password", label: "Change Password" }
        );
    }

    return createPortal(
        <div className="profile-modal-overlay" onClick={onClose}>
            <div className="profile-modal" onClick={(e) => e.stopPropagation()}>

                <div className="profile-modal-header">
                    <h2>My Profile</h2>
                    <button type="button" className="profile-modal-close" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                {tabs.length > 1 && (
                    <div className="profile-tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                className={`profile-tab ${activeTab === tab.id ? "profile-tab-active" : ""}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="profile-modal-content">

                    {activeTab === "profile" && (
                        <div className="profile-section">
                            {profileLoading && <p>Loading profile...</p>}
                            {profileError && <p className="profile-error">{profileError}</p>}
                            {profile && !profileLoading && (
                                <div className="profile-details">
                                    <div className="profile-avatar-large">
                                        {profile.name ? profile.name.charAt(0).toUpperCase() : "?"}
                                    </div>
                                    <div className="profile-field">
                                        <span className="profile-field-label">Name</span>
                                        <span className="profile-field-value">{profile.name}</span>
                                    </div>
                                    <div className="profile-field">
                                        <span className="profile-field-label">Email</span>
                                        <span className="profile-field-value">{profile.email}</span>
                                    </div>
                                    <div className="profile-field">
                                        <span className="profile-field-label">Role</span>
                                        <span className="profile-field-value">{profile.role}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "bookings" && isCustomer && (
                        <div className="profile-section">
                            {bookingsLoading && <p>Loading bookings...</p>}
                            {bookingsError && <p className="profile-error">{bookingsError}</p>}
                            {bookings && activeBookings.length === 0 && !bookingsLoading && (
                                <p className="profile-empty">No active bookings yet.</p>
                            )}
                            {activeBookings.map((b) => (
                                <div key={b.bookingId} className="booking-card">
                                    <div className="booking-card-header">
                                        <strong>{b.eventName}</strong>
                                        <span className={`status-badge status-${b.status?.toLowerCase()}`}>
                                            {b.status}
                                        </span>
                                    </div>
                                    <p>{b.stadiumName} - {b.eventDate}</p>
                                    <p>Seats: {(b.seats || []).join(", ") || "N/A"}</p>
                                    <p>Total: ₹{b.totalAmount}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "history" && isCustomer && (
                        <div className="profile-section">
                            {bookingsLoading && <p>Loading history...</p>}
                            {bookingsError && <p className="profile-error">{bookingsError}</p>}
                            {bookings && pastBookings.length === 0 && !bookingsLoading && (
                                <p className="profile-empty">No past bookings yet.</p>
                            )}
                            {pastBookings.map((b) => (
                                <div key={b.bookingId} className="booking-card booking-card-past">
                                    <div className="booking-card-header">
                                        <strong>{b.eventName}</strong>
                                        <span className={`status-badge status-${b.status?.toLowerCase()}`}>
                                            {b.status}
                                        </span>
                                    </div>
                                    <p>{b.stadiumName} - {b.eventDate}</p>
                                    <p>Total: ₹{b.totalAmount}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "orders" && isCustomer && (
                        <div className="profile-section">
                            {ordersLoading && <p>Loading recent orders...</p>}
                            {ordersError && <p className="profile-error">{ordersError}</p>}
                            {orders && orders.length === 0 && !ordersLoading && (
                                <p className="profile-empty">No orders yet.</p>
                            )}
                            {(orders || []).map((p) => (
                                <div key={p.paymentId} className="order-card">
                                    <div className="booking-card-header">
                                        <strong>Order #{p.transactionId || p.paymentId}</strong>
                                        <span className={`status-badge status-${p.status?.toLowerCase()}`}>
                                            {p.status}
                                        </span>
                                    </div>
                                    <p>Amount: ₹{p.amount}</p>
                                    <p>Method: {p.paymentMethod}</p>
                                    <p>Date: {p.paymentDate}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "password" && isCustomer && (
                        <form className="profile-section password-form" onSubmit={handlePasswordSubmit}>
                            {passwordError && <p className="profile-error">{passwordError}</p>}
                            {passwordSuccess && <p className="profile-success">{passwordSuccess}</p>}

                            <label>
                                Current Password
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={passwordForm.currentPassword}
                                    onChange={handlePasswordChange}
                                />
                            </label>

                            <label>
                                New Password
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={passwordForm.newPassword}
                                    onChange={handlePasswordChange}
                                />
                            </label>

                            <label>
                                Confirm New Password
                                <input
                                    type="password"
                                    name="confirmNewPassword"
                                    value={passwordForm.confirmNewPassword}
                                    onChange={handlePasswordChange}
                                />
                            </label>

                            <button type="submit" className="password-submit-button" disabled={passwordSaving}>
                                {passwordSaving ? "Updating..." : "Update Password"}
                            </button>
                        </form>
                    )}

                </div>
            </div>
        </div>,
        document.body
    );
}

export default ProfileModal;
