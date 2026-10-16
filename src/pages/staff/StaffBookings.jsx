import { useEffect, useMemo, useState } from "react";
import { get } from "../../services/api";

function StaffBookings() {

    const [bookings, setBookings] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [selectedBooking, setSelectedBooking] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =========================================================
    // LOAD BOOKINGS
    // =========================================================

    const fetchBookings = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await get("/bookings/all");

            setBookings(Array.isArray(data) ? data : []);

        } catch (err) {
            console.error("Failed to load bookings:", err);
            setError(err.message || "Failed to load bookings.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        queueMicrotask(() => {
            fetchBookings();
        });
    }, []);

    // =========================================================
    // FORMAT DATE
    // =========================================================

    const formatDate = (date) => {

        if (!date) {
            return "—";
        }

        try {
            return new Date(date).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        } catch {
            return date;
        }
    };

    // =========================================================
    // FORMAT SEATS
    // =========================================================

    const formatSeats = (seats) => {

        if (!seats || seats.length === 0) {
            return "—";
        }

        if (Array.isArray(seats)) {
            return seats.join(", ");
        }

        return seats;
    };

    // =========================================================
    // SEARCH + FILTER
    // =========================================================

    const filteredBookings = useMemo(() => {

        const searchText = search.toLowerCase().trim();

        return bookings.filter((booking) => {

            const bookingId =
                String(booking.id ?? "").toLowerCase();

            const event =
                String(booking.eventName ?? booking.event ?? "")
                    .toLowerCase();

            const stadium =
                String(booking.stadiumName ?? booking.stadium ?? "")
                    .toLowerCase();

            const seats =
                formatSeats(booking.seats).toLowerCase();

            const status =
                String(booking.status ?? "").toLowerCase();

            const customer =
                String(
                    booking.customerName ??
                    booking.customer ??
                    ""
                ).toLowerCase();

            const email =
                String(booking.customerEmail ?? booking.email ?? "")
                    .toLowerCase();

            const matchesSearch =
                !searchText ||
                bookingId.includes(searchText) ||
                event.includes(searchText) ||
                stadium.includes(searchText) ||
                seats.includes(searchText) ||
                status.includes(searchText) ||
                customer.includes(searchText) ||
                email.includes(searchText);

            const matchesStatus =
                statusFilter === "ALL" ||
                booking.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

    }, [bookings, search, statusFilter]);

    // =========================================================
    // STATISTICS
    // =========================================================

    const totalBookings = bookings.length;

    const confirmedBookings = bookings.filter(
        (booking) => booking.status === "CONFIRMED"
    ).length;

    const pendingBookings = bookings.filter(
        (booking) => booking.status === "PENDING"
    ).length;

    const cancelledBookings = bookings.filter(
        (booking) => booking.status === "CANCELLED"
    ).length;

    const totalRevenue = bookings
        .filter((booking) => booking.status === "CONFIRMED")
        .reduce(
            (total, booking) =>
                total + Number(booking.totalAmount ?? booking.amount ?? 0),
            0
        );

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="staff-bookings-page">

            {/* HEADER */}

            <div className="staff-bookings-header">

                <div>
                    <p className="page-tag">
                        BOOKING MANAGEMENT
                    </p>

                    <h1>Customer Bookings</h1>

                    <p>
                        View and check customer booking information.
                    </p>
                </div>

            </div>


            {/* ERROR */}

            {error && (
                <div
                    style={{
                        padding: "12px 16px",
                        marginBottom: "20px",
                        borderRadius: "8px",
                        background: "#fff1f2",
                        color: "#b91c1c",
                    }}
                >
                    {error}
                </div>
            )}


            {/* STATS */}

            <div className="staff-booking-stats">

                <div className="staff-booking-stat">

                    <div className="staff-booking-stat-icon">
                        📋
                    </div>

                    <div>
                        <span>Total Bookings</span>
                        <strong>{loading ? "—" : totalBookings}</strong>
                    </div>

                </div>


                <div className="staff-booking-stat">

                    <div className="staff-booking-stat-icon">
                        ✅
                    </div>

                    <div>
                        <span>Confirmed</span>
                        <strong>
                            {loading ? "—" : confirmedBookings}
                        </strong>
                    </div>

                </div>


                <div className="staff-booking-stat">

                    <div className="staff-booking-stat-icon">
                        ⏳
                    </div>

                    <div>
                        <span>Pending</span>
                        <strong>
                            {loading ? "—" : pendingBookings}
                        </strong>
                    </div>

                </div>


                <div className="staff-booking-stat">

                    <div className="staff-booking-stat-icon">
                        ₹
                    </div>

                    <div>
                        <span>Confirmed Revenue</span>

                        <strong>
                            {loading
                                ? "—"
                                : `₹${totalRevenue.toLocaleString("en-IN")}`
                            }
                        </strong>
                    </div>

                </div>

            </div>


            {/* TABLE */}

            <div className="staff-bookings-card">

                <div className="staff-bookings-card-header">

                    <div>

                        <h2>All Bookings</h2>

                        <p>
                            {cancelledBookings} cancelled booking
                            {cancelledBookings !== 1 ? "s" : ""}
                        </p>

                    </div>


                    <div className="staff-booking-tools">

                        <input
                            type="text"
                            placeholder="Search booking, customer or event..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            className="staff-booking-search"
                        />


                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value)
                            }
                            className="staff-booking-filter"
                        >

                            <option value="ALL">
                                All Status
                            </option>

                            <option value="CONFIRMED">
                                Confirmed
                            </option>

                            <option value="PENDING">
                                Pending
                            </option>

                            <option value="CANCELLED">
                                Cancelled
                            </option>

                        </select>

                    </div>

                </div>


                <div className="staff-bookings-table-wrapper">

                    <table className="staff-bookings-table">

                        <thead>

                            <tr>
                                <th>BOOKING</th>
                                <th>CUSTOMER</th>
                                <th>EVENT</th>
                                <th>SEATS</th>
                                <th>AMOUNT</th>
                                <th>STATUS</th>
                                <th>ACTION</th>
                            </tr>

                        </thead>


                        <tbody>

                            {loading ? (

                                <tr>
                                    <td
                                        colSpan="7"
                                        className="staff-empty-bookings"
                                    >
                                        Loading bookings...
                                    </td>
                                </tr>

                            ) : filteredBookings.length === 0 ? (

                                <tr>
                                    <td
                                        colSpan="7"
                                        className="staff-empty-bookings"
                                    >
                                        No bookings found.
                                    </td>
                                </tr>

                            ) : (

                                filteredBookings.map((booking) => {

                                    const customer =
                                        booking.customerName ??
                                        booking.customer ??
                                        "Customer";

                                    const email =
                                        booking.customerEmail ??
                                        booking.email ??
                                        "—";

                                    const event =
                                        booking.eventName ??
                                        booking.event ??
                                        "—";

                                    const stadium =
                                        booking.stadiumName ??
                                        booking.stadium ??
                                        "—";

                                    const amount =
                                        Number(
                                            booking.totalAmount ??
                                            booking.amount ??
                                            0
                                        );

                                    return (

                                        <tr key={booking.id}>

                                            {/* BOOKING */}

                                            <td>

                                                <div className="staff-booking-id">

                                                    <strong>
                                                        #{booking.id}
                                                    </strong>

                                                    <span>
                                                        {formatDate(
                                                            booking.eventDate
                                                        )}
                                                    </span>

                                                </div>

                                            </td>


                                            {/* CUSTOMER */}

                                            <td>

                                                <div className="staff-customer-cell">

                                                    <div className="staff-customer-avatar">
                                                        {customer
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {customer}
                                                        </strong>

                                                        <span>
                                                            {email}
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* EVENT */}

                                            <td>

                                                <div className="staff-event-cell">

                                                    <strong>
                                                        {event}
                                                    </strong>

                                                    <span>
                                                        {stadium}
                                                    </span>

                                                </div>

                                            </td>


                                            {/* SEATS */}

                                            <td>

                                                <span className="staff-seats-badge">
                                                    {formatSeats(
                                                        booking.seats
                                                    )}
                                                </span>

                                            </td>


                                            {/* AMOUNT */}

                                            <td>

                                                <strong className="staff-amount-cell">
                                                    ₹
                                                    {amount.toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </strong>

                                            </td>


                                            {/* STATUS */}

                                            <td>

                                                <span
                                                    className={`staff-booking-table-status ${String(
                                                        booking.status ?? ""
                                                    ).toLowerCase()}`}
                                                >

                                                    <span className="staff-status-dot"></span>

                                                    {booking.status ?? "UNKNOWN"}

                                                </span>

                                            </td>


                                            {/* ACTION */}

                                            <td>

                                                <button
                                                    type="button"
                                                    className="staff-view-booking-button"
                                                    onClick={() =>
                                                        setSelectedBooking(
                                                            booking
                                                        )
                                                    }
                                                >
                                                    View
                                                </button>

                                            </td>

                                        </tr>

                                    );
                                })

                            )}

                        </tbody>

                    </table>

                </div>


                {/* PAGINATION */}

                <div className="staff-bookings-pagination">

                    <span>
                        Showing {filteredBookings.length} of{" "}
                        {bookings.length} bookings
                    </span>

                    <div>

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


            {/* DETAILS MODAL */}

            {selectedBooking && (

                <div className="staff-booking-modal-overlay">

                    <div className="staff-booking-modal">

                        <div className="staff-booking-modal-header">

                            <div>

                                <p className="page-tag">
                                    BOOKING DETAILS
                                </p>

                                <h2>
                                    #{selectedBooking.id}
                                </h2>

                            </div>


                            <button
                                type="button"
                                className="staff-booking-modal-close"
                                onClick={() =>
                                    setSelectedBooking(null)
                                }
                            >
                                ×
                            </button>

                        </div>


                        <div className="staff-booking-detail-status">

                            <span
                                className={`staff-booking-table-status ${String(
                                    selectedBooking.status ?? ""
                                ).toLowerCase()}`}
                            >

                                <span className="staff-status-dot"></span>

                                {selectedBooking.status}

                            </span>

                        </div>


                        <div className="staff-booking-detail-grid">

                            <div>
                                <span>Customer</span>

                                <strong>
                                    {selectedBooking.customerName ??
                                        selectedBooking.customer ??
                                        "Customer"}
                                </strong>
                            </div>


                            <div>
                                <span>Email</span>

                                <strong>
                                    {selectedBooking.customerEmail ??
                                        selectedBooking.email ??
                                        "—"}
                                </strong>
                            </div>


                            <div>
                                <span>Event</span>

                                <strong>
                                    {selectedBooking.eventName ??
                                        selectedBooking.event ??
                                        "—"}
                                </strong>
                            </div>


                            <div>
                                <span>Stadium</span>

                                <strong>
                                    {selectedBooking.stadiumName ??
                                        selectedBooking.stadium ??
                                        "—"}
                                </strong>
                            </div>


                            <div>
                                <span>Seats</span>

                                <strong>
                                    {formatSeats(
                                        selectedBooking.seats
                                    )}
                                </strong>
                            </div>


                            <div>
                                <span>Event Date</span>

                                <strong>
                                    {formatDate(
                                        selectedBooking.eventDate
                                    )}
                                </strong>
                            </div>


                            <div>
                                <span>Start Time</span>

                                <strong>
                                    {selectedBooking.startTime ?? "—"}
                                </strong>
                            </div>


                            <div>
                                <span>Total Amount</span>

                                <strong className="staff-modal-amount">

                                    ₹
                                    {Number(
                                        selectedBooking.totalAmount ??
                                        selectedBooking.amount ??
                                        0
                                    ).toLocaleString("en-IN")}

                                </strong>

                            </div>

                        </div>


                        <div className="staff-booking-modal-footer">

                            <button
                                type="button"
                                className="staff-modal-close-button"
                                onClick={() =>
                                    setSelectedBooking(null)
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

export default StaffBookings;