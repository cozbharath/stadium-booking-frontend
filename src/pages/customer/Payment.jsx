import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { post } from "../../services/api";

function Payment() {
    const navigate = useNavigate();

    const [paymentMethod, setPaymentMethod] = useState("UPI");
    const [booking, setBooking] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    // =========================================================
    // LOAD BOOKING DATA
    // =========================================================

    useEffect(() => {
        queueMicrotask(() => {
            const storedBooking =
                sessionStorage.getItem("bookingData");

            if (!storedBooking) {
                setError(
                    "Booking information not found. Please complete your booking again."
                );
                setLoading(false);
                return;
            }

            try {
                const parsedBooking =
                    JSON.parse(storedBooking);

                if (!parsedBooking.bookingId) {
                    setError(
                        "Booking ID is missing. Please complete the booking again."
                    );
                    setLoading(false);
                    return;
                }

                setBooking(parsedBooking);

            } catch (err) {
                console.error(
                    "Failed to parse booking data:",
                    err
                );

                setError(
                    "Invalid booking information."
                );
            } finally {
                setLoading(false);
            }
        });
    }, []);

    // =========================================================
    // EVENT DATA
    // =========================================================

    const eventData = booking?.event || {};

    const eventName =
        eventData.name ||
        eventData.eventName ||
        eventData.title ||
        "Selected Event";

    const stadiumName =
        eventData.stadiumName ||
        eventData.stadium?.name ||
        eventData.stadium ||
        "Stadium";

    const eventDate =
        eventData.eventDate ||
        eventData.date ||
        "—";

    const eventTime =
        eventData.startTime ||
        eventData.time ||
        "—";

    // =========================================================
    // SELECTED SEATS
    // =========================================================

    const selectedSeats =
        Array.isArray(booking?.selectedSeats)
            ? booking.selectedSeats
            : [];

    const seatNames = selectedSeats.map(
        (seat) =>
            seat.number ||
            seat.seatNumber ||
            seat.seatName ||
            seat.name ||
            seat.id
    );

    // =========================================================
    // AMOUNT
    // =========================================================

    const totalAmount = Number(
        booking?.totalAmount ||
        booking?.booking?.totalAmount ||
        0
    );

    // =========================================================
    // LOAD RAZORPAY
    // =========================================================

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {

            if (window.Razorpay) {
                resolve(true);
                return;
            }

            const script =
                document.createElement("script");

            script.src =
                "https://checkout.razorpay.com/v1/checkout.js";

            script.onload = () => {
                resolve(true);
            };

            script.onerror = () => {
                resolve(false);
            };

            document.body.appendChild(script);
        });
    };

    // =========================================================
    // CREATE RAZORPAY ORDER
    // =========================================================

    const createRazorpayOrder = async () => {

        if (!booking?.bookingId) {
            throw new Error(
                "Booking ID is missing."
            );
        }

        console.log(
            "CREATE RAZORPAY ORDER:",
            {
                bookingId: booking.bookingId
            }
        );

        /*
         * This goes through services/api.js.
         *
         * POST:
         * /api/payments/create-order
         *
         * JWT is automatically attached by api.js.
         */

        const response = await post(
            "/payments/create-order",
            {
                bookingId:
                    Number(booking.bookingId)
            }
        );

        console.log(
            "RAZORPAY ORDER RESPONSE:",
            response
        );

        if (!response) {
            throw new Error(
                "Razorpay order was not created."
            );
        }

        return response;
    };

    // =========================================================
    // VERIFY PAYMENT
    // =========================================================

    const verifyPayment = async (
        razorpayResponse
    ) => {

        if (!booking?.bookingId) {
            throw new Error(
                "Booking ID is missing."
            );
        }

        if (
            !razorpayResponse?.razorpay_order_id ||
            !razorpayResponse?.razorpay_payment_id ||
            !razorpayResponse?.razorpay_signature
        ) {
            throw new Error(
                "Razorpay payment response is incomplete."
            );
        }

        const request = {
            bookingId:
                Number(booking.bookingId),

            razorpayOrderId:
                razorpayResponse.razorpay_order_id,

            razorpayPaymentId:
                razorpayResponse.razorpay_payment_id,

            razorpaySignature:
                razorpayResponse.razorpay_signature
        };

        console.log(
            "VERIFY PAYMENT REQUEST:",
            request
        );

        /*
         * POST:
         * /api/payments/verify
         */

        const response = await post(
            "/payments/verify",
            request
        );

        console.log(
            "PAYMENT VERIFY RESPONSE:",
            response
        );

        return response;
    };

    // =========================================================
    // HANDLE PAYMENT
    // =========================================================

    const handlePayment = async (event) => {

        event.preventDefault();

        if (!booking) {
            setError(
                "Booking information is unavailable."
            );
            return;
        }

        if (!booking.bookingId) {
            setError(
                "Booking ID is missing."
            );
            return;
        }

        if (totalAmount <= 0) {
            setError(
                "Invalid booking amount."
            );
            return;
        }

        setError("");
        setIsProcessing(true);

        try {

            // -------------------------------------------------
            // STEP 1
            // Load Razorpay
            // -------------------------------------------------

            const razorpayLoaded =
                await loadRazorpayScript();

            if (!razorpayLoaded) {
                throw new Error(
                    "Unable to load Razorpay. Please check your internet connection."
                );
            }

            // -------------------------------------------------
            // STEP 2
            // Create Razorpay order
            // -------------------------------------------------

            const order =
                await createRazorpayOrder();

            /*
             * Expected backend response:
             *
             * {
             *   razorpayOrderId: "...",
             *   bookingId: 1,
             *   amount: 2500,
             *   currency: "INR",
             *   keyId: "rzp_test_..."
             * }
             */

            if (!order.razorpayOrderId) {
                throw new Error(
                    "Razorpay order ID is missing."
                );
            }

            if (!order.keyId) {
                throw new Error(
                    "Razorpay key ID is missing."
                );
            }

            // -------------------------------------------------
            // STEP 3
            // Open Razorpay
            // -------------------------------------------------

            const options = {

                key: order.keyId,

                amount:
                    Math.round(
                        Number(order.amount) * 100
                    ),

                currency:
                    order.currency || "INR",

                name: "YourTurn",

                description:
                    `Stadium Ticket Booking #${booking.bookingId}`,

                order_id:
                    order.razorpayOrderId,

                prefill: {
                    name:
                        booking.customerName ||
                        "",

                    email:
                        booking.customerEmail ||
                        "",

                    contact:
                        booking.customerPhone ||
                        ""
                },

                notes: {
                    bookingId:
                        String(
                            booking.bookingId
                        )
                },

                theme: {
                    color: "#2563eb"
                },

                handler:
                    async function (
                        razorpayResponse
                    ) {

                        try {

                            console.log(
                                "RAZORPAY RESPONSE:",
                                razorpayResponse
                            );

                            setError("");
                            setIsProcessing(true);

                            // --------------------------------
                            // VERIFY WITH BACKEND
                            // --------------------------------

                            const verifiedPayment =
                                await verifyPayment(
                                    razorpayResponse
                                );

                            console.log(
                                "VERIFIED PAYMENT:",
                                verifiedPayment
                            );

                            // Save payment response
                            sessionStorage.setItem(
                                "paymentData",
                                JSON.stringify(
                                    verifiedPayment
                                )
                            );

                            // Update booking data
                            const updatedBooking = {
                                ...booking,

                                payment:
                                    verifiedPayment,

                                paymentStatus:
                                    verifiedPayment?.status ||
                                    "SUCCESS",

                                bookingStatus:
                                    "CONFIRMED"
                            };

                            sessionStorage.setItem(
                                "bookingData",
                                JSON.stringify(
                                    updatedBooking
                                )
                            );

                            // --------------------------------
                            // GO TO TICKETS
                            // --------------------------------

                            navigate(
                                "/customer/tickets"
                            );

                        } catch (err) {

                            console.error(
                                "Payment verification failed:",
                                err
                            );

                            setError(
                                err?.message ||
                                "Payment verification failed."
                            );

                            setIsProcessing(false);
                        }
                    },

                modal: {
                    ondismiss: function () {

                        console.log(
                            "Razorpay checkout closed."
                        );

                        setIsProcessing(false);
                    }
                }
            };

            const razorpay =
                new window.Razorpay(
                    options
                );

            // Payment failed
            razorpay.on(
                "payment.failed",
                function (response) {

                    console.error(
                        "RAZORPAY PAYMENT FAILED:",
                        response
                    );

                    const message =
                        response?.error?.description ||
                        "Payment failed. Please try again.";

                    setError(message);
                    setIsProcessing(false);
                }
            );

            razorpay.open();

        } catch (err) {

            console.error(
                "PAYMENT ERROR:",
                err
            );

            setError(
                err?.message ||
                "Unable to process payment."
            );

            setIsProcessing(false);
        }
    };

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="payment-page">
                <section className="payment-header">
                    <div>
                        <p className="page-tag">
                            SECURE PAYMENT
                        </p>

                        <h1>
                            Loading Payment...
                        </h1>

                        <p>
                            Loading your booking
                            information.
                        </p>
                    </div>
                </section>
            </div>
        );
    }

    // =========================================================
    // ERROR WITHOUT BOOKING
    // =========================================================

    if (!booking) {
        return (
            <div className="payment-page">

                <section className="payment-header">

                    <div>

                        <p className="page-tag">
                            PAYMENT
                        </p>

                        <h1>
                            Booking Not Found
                        </h1>

                        <p>
                            {error}
                        </p>

                        <button
                            type="button"
                            className="pay-now-button"
                            onClick={() =>
                                navigate(
                                    "/customer/events"
                                )
                            }
                        >
                            Back to Events
                        </button>

                    </div>

                </section>

            </div>
        );
    }

    // =========================================================
    // MAIN PAYMENT PAGE
    // =========================================================

    return (
        <div className="payment-page">

            {/* HEADER */}

            <section className="payment-header">

                <div>

                    <p className="page-tag">
                        SECURE PAYMENT
                    </p>

                    <h1>
                        Complete Your Payment
                    </h1>

                    <p>
                        Review your booking and
                        complete your payment securely.
                    </p>

                </div>

                <div className="secure-badge">
                    🔒 Secure Checkout
                </div>

            </section>


            {/* CONTENT */}

            <section className="payment-content">

                {/* LEFT */}

                <div className="payment-main">

                    {/* PAYMENT METHOD */}

                    <div className="payment-card">

                        <div className="payment-card-title">

                            <div>

                                <p className="page-tag">
                                    PAYMENT METHOD
                                </p>

                                <h2>
                                    Choose Payment Method
                                </h2>

                            </div>

                        </div>


                        <div className="payment-methods">

                            {/* UPI */}

                            <button
                                type="button"
                                className={`payment-method ${
                                    paymentMethod === "UPI"
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    setPaymentMethod(
                                        "UPI"
                                    )
                                }
                            >

                                <span className="payment-method-icon">
                                    📱
                                </span>

                                <span className="payment-method-content">

                                    <strong>
                                        UPI
                                    </strong>

                                    <small>
                                        Google Pay,
                                        PhonePe,
                                        Paytm
                                    </small>

                                </span>

                                <span className="payment-radio">
                                    {paymentMethod === "UPI"
                                        ? "●"
                                        : "○"}
                                </span>

                            </button>


                            {/* CARD */}

                            <button
                                type="button"
                                className={`payment-method ${
                                    paymentMethod === "CARD"
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    setPaymentMethod(
                                        "CARD"
                                    )
                                }
                            >

                                <span className="payment-method-icon">
                                    💳
                                </span>

                                <span className="payment-method-content">

                                    <strong>
                                        Credit / Debit Card
                                    </strong>

                                    <small>
                                        Visa, Mastercard,
                                        RuPay
                                    </small>

                                </span>

                                <span className="payment-radio">
                                    {paymentMethod === "CARD"
                                        ? "●"
                                        : "○"}
                                </span>

                            </button>


                            {/* NET BANKING */}

                            <button
                                type="button"
                                className={`payment-method ${
                                    paymentMethod ===
                                    "NET_BANKING"
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    setPaymentMethod(
                                        "NET_BANKING"
                                    )
                                }
                            >

                                <span className="payment-method-icon">
                                    🏦
                                </span>

                                <span className="payment-method-content">

                                    <strong>
                                        Net Banking
                                    </strong>

                                    <small>
                                        All major banks
                                        supported
                                    </small>

                                </span>

                                <span className="payment-radio">
                                    {paymentMethod ===
                                    "NET_BANKING"
                                        ? "●"
                                        : "○"}
                                </span>

                            </button>

                        </div>

                    </div>


                    {/* PAYMENT CARD */}

                    <div className="payment-card">

                        <div className="payment-card-title">

                            <div>

                                <p className="page-tag">
                                    {paymentMethod === "UPI"
                                        ? "UPI PAYMENT"
                                        : paymentMethod ===
                                          "CARD"
                                        ? "CARD PAYMENT"
                                        : "NET BANKING"}
                                </p>

                                <h2>
                                    Secure Razorpay Checkout
                                </h2>

                            </div>

                        </div>


                        <div className="payment-security-note">

                            <span>
                                🔒
                            </span>

                            <p>
                                Your payment is securely
                                processed by Razorpay.
                                YourTurn does not store
                                your card, UPI or banking
                                credentials.
                            </p>

                        </div>


                        {error && (
                            <div
                                className="payment-error"
                                style={{
                                    marginTop: "18px",
                                    padding: "13px",
                                    borderRadius: "8px",
                                    background:
                                        "#fee2e2",
                                    color:
                                        "#b91c1c"
                                }}
                            >
                                ⚠️ {error}
                            </div>
                        )}


                        <button
                            type="button"
                            className="pay-now-button"
                            disabled={
                                isProcessing
                            }
                            onClick={
                                handlePayment
                            }
                        >

                            {isProcessing
                                ? "Processing Payment..."
                                : `Pay ₹${totalAmount.toLocaleString(
                                      "en-IN"
                                  )}`}

                        </button>

                    </div>

                </div>


                {/* RIGHT */}

                <aside className="payment-summary-card">

                    <p className="page-tag">
                        ORDER SUMMARY
                    </p>

                    <h2>
                        Booking Details
                    </h2>


                    {/* EVENT */}

                    <div className="payment-event-summary">

                        <h3>
                            {eventName}
                        </h3>

                        <p>
                            📍 {stadiumName}
                        </p>

                        <div className="payment-event-info">

                            <div>
                                <span>
                                    DATE
                                </span>

                                <strong>
                                    {eventDate}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    TIME
                                </span>

                                <strong>
                                    {eventTime}
                                </strong>
                            </div>

                        </div>

                    </div>


                    {/* BOOKING */}

                    <div className="payment-summary-section">

                        <div className="summary-row">

                            <span>
                                Booking ID
                            </span>

                            <strong>
                                #{booking.bookingId}
                            </strong>

                        </div>


                        <div className="summary-row">

                            <span>
                                Selected Seats
                            </span>

                            <strong>
                                {selectedSeats.length}
                            </strong>

                        </div>


                        <div className="summary-row">

                            <span>
                                Seats
                            </span>

                            <strong>
                                {seatNames.length > 0
                                    ? seatNames.join(
                                          ", "
                                      )
                                    : "—"}
                            </strong>

                        </div>

                    </div>


                    <div className="summary-divider"></div>


                    <div className="summary-row">

                        <span>
                            Ticket Amount
                        </span>

                        <strong>
                            ₹
                            {totalAmount.toLocaleString(
                                "en-IN"
                            )}
                        </strong>

                    </div>


                    <div className="summary-row">

                        <span>
                            Booking Fee
                        </span>

                        <strong>
                            ₹0
                        </strong>

                    </div>


                    <div className="summary-divider"></div>


                    <div className="payment-total-row">

                        <span>
                            Total Payable
                        </span>

                        <strong>
                            ₹
                            {totalAmount.toLocaleString(
                                "en-IN"
                            )}
                        </strong>

                    </div>


                    {/* TRUST */}

                    <div className="payment-trust">

                        <div>

                            <span>
                                🔒
                            </span>

                            <p>
                                Secure Payment
                                <small>
                                    Razorpay encrypted
                                    transaction
                                </small>
                            </p>

                        </div>


                        <div>

                            <span>
                                🎟️
                            </span>

                            <p>
                                Digital Ticket
                                <small>
                                    QR ticket after
                                    successful payment
                                </small>
                            </p>

                        </div>

                    </div>

                </aside>

            </section>

        </div>
    );
}

export default Payment;