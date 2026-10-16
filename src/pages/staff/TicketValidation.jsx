import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { post } from "../../services/api";

function TicketValidation() {

    const [ticketNumber, setTicketNumber] = useState("");
    const [validationStatus, setValidationStatus] = useState(null);
    const [ticket, setTicket] = useState(null);

    const [scannerOpen, setScannerOpen] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [validating, setValidating] = useState(false);

    const scannerRef = useRef(null);

    // =========================================================
    // STOP QR SCANNER
    // =========================================================

    const stopScanner = async () => {

        if (scannerRef.current) {

            try {

                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }

                await scannerRef.current.clear();

            } catch (error) {

                console.log(
                    "Scanner stop:",
                    error
                );

            }

            scannerRef.current = null;
        }

        setScanning(false);
        setScannerOpen(false);
    };


    // =========================================================
    // START QR SCANNER
    // =========================================================

    const startScanner = async () => {

        setValidationStatus(null);
        setTicket(null);

        setScannerOpen(true);
        setScanning(true);

        try {

            const scanner =
                new Html5Qrcode("ticket-qr-reader");

            scannerRef.current = scanner;

            await scanner.start(
                {
                    facingMode: "environment"
                },
                {
                    fps: 10,
                    qrbox: {
                        width: 250,
                        height: 250
                    }
                },
                async (decodedText) => {

                    const scannedValue =
                        decodedText.trim();

                    console.log(
                        "QR Code:",
                        scannedValue
                    );

                    await stopScanner();

                    /*
                     * QR can contain:
                     *
                     * TKT20260922001
                     *
                     * OR
                     *
                     * https://your-domain/ticket/TKT20260922001
                     *
                     * OR JSON containing ticketNumber.
                     */

                    const extractedTicketNumber =
                        extractTicketNumber(
                            scannedValue
                        );

                    if (!extractedTicketNumber) {

                        setValidationStatus({
                            type: "error",
                            message:
                                "QR code does not contain a valid ticket number."
                        });

                        return;
                    }

                    setTicketNumber(
                        extractedTicketNumber
                    );

                    await validateTicket(
                        extractedTicketNumber
                    );
                },
                (errorMessage) => {

                    // Scanner continuously reports
                    // "QR code not found" messages.
                    // We don't show those to the user.
                    console.log(
                        "QR scanning:",
                        errorMessage
                    );
                }
            );

        } catch (error) {

            console.error(
                "QR scanner error:",
                error
            );

            setScanning(false);
            setScannerOpen(false);

            setValidationStatus({
                type: "error",
                message:
                    "Unable to access the camera. Please allow camera permission or enter the ticket number manually."
            });
        }
    };


    // =========================================================
    // EXTRACT TICKET NUMBER FROM QR
    // =========================================================

    function extractTicketNumber(value) {

        if (!value) {
            return null;
        }

        const trimmedValue =
            value.trim();

        /*
         * Case 1:
         * QR directly contains ticket number
         */

        if (
            trimmedValue
                .toUpperCase()
                .startsWith("TKT")
        ) {
            return trimmedValue
                .split(/[?#/]/)[0]
                .trim()
                .toUpperCase();
        }


        /*
         * Case 2:
         * QR contains JSON
         */

        try {

            const json =
                JSON.parse(trimmedValue);

            if (json.ticketNumber) {

                return String(
                    json.ticketNumber
                )
                    .trim()
                    .toUpperCase();
            }

        } catch {

            // Not JSON - continue

        }


        /*
         * Case 3:
         * QR contains URL
         */

        try {

            const url =
                new URL(trimmedValue);

            const ticketFromQuery =
                url.searchParams.get(
                    "ticketNumber"
                );

            if (ticketFromQuery) {

                return ticketFromQuery
                    .trim()
                    .toUpperCase();
            }


            const parts =
                url.pathname
                    .split("/")
                    .filter(Boolean);

            const ticketPart =
                parts.find((part) =>
                    part
                        .toUpperCase()
                        .startsWith("TKT")
                );

            if (ticketPart) {

                return ticketPart
                    .trim()
                    .toUpperCase();
            }

        } catch {

            // Not a URL

        }

        return null;
    }


    // =========================================================
    // VALIDATE TICKET WITH BACKEND
    // =========================================================

    const validateTicket = async (
        number = ticketNumber
    ) => {

        const cleanedNumber =
            number.trim().toUpperCase();

        if (!cleanedNumber) {

            setValidationStatus({
                type: "error",
                message:
                    "Please scan a QR code or enter a ticket number."
            });

            return;
        }

        try {

            setValidating(true);
            setValidationStatus(null);
            setTicket(null);

            /*
             * Backend:
             *
             * POST /api/tickets/validate/{ticketNumber}
             */

            const response =
                await post(
                    `/tickets/validate/${encodeURIComponent(
                        cleanedNumber
                    )}`,
                    {}
                );

            console.log(
                "Ticket validation response:",
                response
            );


            /*
             * Backend successfully validated
             * the ticket.
             */

            setTicket(
                normalizeTicketResponse(
                    response,
                    cleanedNumber
                )
            );

            setValidationStatus({
                type: "success",
                message:
                    "Ticket is valid and active."
            });

        } catch (error) {

            console.error(
                "Ticket validation error:",
                error
            );

            setTicket(null);

            setValidationStatus({
                type: "error",
                message:
                    error.message ||
                    "Ticket not found or invalid."
            });

        } finally {

            setValidating(false);
        }
    };


    // =========================================================
    // NORMALIZE BACKEND RESPONSE
    // =========================================================

    function normalizeTicketResponse(
        response,
        fallbackTicketNumber
    ) {

        const data =
            response?.data ||
            response ||
            {};

        return {

            ticketNumber:
                data.ticketNumber ||
                fallbackTicketNumber,

            bookingNumber:
                data.bookingNumber ||
                data.bookingId ||
                data.booking?.id ||
                "—",

            customer:
                data.customer ||
                data.customerName ||
                data.userName ||
                data.user?.name ||
                "—",

            event:
                data.event ||
                data.eventName ||
                data.event?.name ||
                "—",

            stadium:
                data.stadium ||
                data.stadiumName ||
                data.event?.stadium?.name ||
                "—",

            date:
                data.date ||
                data.eventDate ||
                data.event?.eventDate ||
                "—",

            time:
                data.time ||
                data.startTime ||
                data.event?.startTime ||
                "—",

            seats:
                Array.isArray(data.seats)
                    ? data.seats
                    : data.seat
                        ? [data.seat]
                        : [],

            status:
                data.status ||
                "ACTIVE"
        };
    }


    // =========================================================
    // MANUAL FORM
    // =========================================================

    const handleValidate = async (e) => {

        e.preventDefault();

        await validateTicket(
            ticketNumber
        );
    };


    // =========================================================
    // ALLOW ENTRY
    // =========================================================

    const handleAllowEntry = () => {

        if (!ticket) {
            return;
        }

        if (
            String(ticket.status)
                .toUpperCase() !== "ACTIVE"
        ) {
            setValidationStatus({
                type: "error",
                message:
                    "This ticket is not active and entry cannot be allowed."
            });

            return;
        }

        alert(
            "Entry verified successfully."
        );
    };


    // =========================================================
    // CLEAR
    // =========================================================

    const handleClear = async () => {

        await stopScanner();

        setTicketNumber("");
        setTicket(null);
        setValidationStatus(null);
        setValidating(false);
    };


    // =========================================================
    // CLEANUP CAMERA
    // =========================================================

    useEffect(() => {

        return () => {

            if (scannerRef.current) {

                scannerRef.current
                    .stop()
                    .catch(() => {});

            }

        };

    }, []);


    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="staff-validation-page">

            {/* HEADER */}

            <div className="staff-validation-header">

                <div>

                    <p className="page-tag">
                        TICKET MANAGEMENT
                    </p>

                    <h1>
                        Validate Ticket
                    </h1>

                    <p>
                        Scan a customer's QR code or
                        enter the ticket number before entry.
                    </p>

                </div>

                <div className="staff-validation-security">
                    🔒 Staff Verification
                </div>

            </div>


            {/* VALIDATION AREA */}

            <div className="staff-validation-layout">

                <div className="staff-validation-main">

                    {/* VERIFICATION CARD */}

                    <div className="staff-validation-card">

                        <div className="staff-validation-card-header">

                            <div className="staff-validation-icon">
                                🎫
                            </div>

                            <div>

                                <h2>
                                    Ticket Verification
                                </h2>

                                <p>
                                    Scan the QR code first.
                                    If scanning is unavailable,
                                    enter the ticket number manually.
                                </p>

                            </div>

                        </div>


                        {/* QR SCANNER */}

                        <div
                            style={{
                                textAlign: "center",
                                marginBottom: "24px"
                            }}
                        >

                            <h3>
                                📷 Scan QR Code
                            </h3>

                            <p>
                                Point the camera at the
                                customer's ticket QR code.
                            </p>


                            {!scannerOpen && (

                                <button
                                    type="button"
                                    className="staff-validate-button"
                                    onClick={startScanner}
                                    disabled={validating}
                                >
                                    📷 Start QR Scanner
                                </button>

                            )}


                            {scannerOpen && (

                                <div>

                                    <div
                                        id="ticket-qr-reader"
                                        style={{
                                            width: "100%",
                                            maxWidth: "500px",
                                            margin: "20px auto"
                                        }}
                                    ></div>

                                    {scanning && (

                                        <p>
                                            📷 Scanning...
                                        </p>

                                    )}

                                    <button
                                        type="button"
                                        className="staff-clear-button"
                                        onClick={stopScanner}
                                    >
                                        ✕ Stop Scanner
                                    </button>

                                </div>

                            )}

                        </div>


                        {/* DIVIDER */}

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                margin: "24px 0"
                            }}
                        >

                            <span
                                style={{
                                    flex: 1,
                                    height: "1px",
                                    background: "#ddd"
                                }}
                            />

                            <strong>
                                OR
                            </strong>

                            <span
                                style={{
                                    flex: 1,
                                    height: "1px",
                                    background: "#ddd"
                                }}
                            />

                        </div>


                        {/* MANUAL TICKET NUMBER */}

                        <form
                            onSubmit={handleValidate}
                            className="staff-ticket-search-form"
                        >

                            <div className="staff-ticket-input-group">

                                <label>
                                    Ticket Number
                                </label>

                                <input
                                    type="text"
                                    value={ticketNumber}
                                    onChange={(e) =>
                                        setTicketNumber(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Example: TKT20260922001"
                                    disabled={validating}
                                />

                            </div>


                            <button
                                type="submit"
                                className="staff-validate-button"
                                disabled={validating}
                            >

                                {validating
                                    ? "⏳ Validating..."
                                    : "🔍 Validate Ticket"}

                            </button>

                        </form>


                        {/* VALIDATION RESULT */}

                        {validationStatus && (

                            <div
                                className={`staff-validation-result ${validationStatus.type}`}
                            >

                                <div className="staff-validation-result-icon">

                                    {validationStatus.type ===
                                    "success"
                                        ? "✓"
                                        : "!"}

                                </div>

                                <div>

                                    <strong>

                                        {validationStatus.type ===
                                        "success"
                                            ? "Valid Ticket"
                                            : "Validation Failed"}

                                    </strong>

                                    <span>
                                        {validationStatus.message}
                                    </span>

                                </div>

                            </div>

                        )}

                    </div>


                    {/* TICKET DETAILS */}

                    {validationStatus?.type ===
                        "success" &&
                        ticket && (

                            <div className="staff-validation-card">

                                <div className="staff-validation-card-header">

                                    <div className="staff-ticket-success-icon">
                                        ✓
                                    </div>

                                    <div>

                                        <h2>
                                            Ticket Details
                                        </h2>

                                        <p>
                                            Verify the details before
                                            allowing entry.
                                        </p>

                                    </div>

                                    <span className="staff-active-ticket">

                                        {ticket.status}

                                    </span>

                                </div>


                                <div className="staff-ticket-details">

                                    <div className="staff-ticket-detail">

                                        <span>
                                            Ticket Number
                                        </span>

                                        <strong>
                                            {ticket.ticketNumber}
                                        </strong>

                                    </div>


                                    <div className="staff-ticket-detail">

                                        <span>
                                            Booking Number
                                        </span>

                                        <strong>
                                            {ticket.bookingNumber}
                                        </strong>

                                    </div>


                                    <div className="staff-ticket-detail">

                                        <span>
                                            Customer
                                        </span>

                                        <strong>
                                            {ticket.customer}
                                        </strong>

                                    </div>


                                    <div className="staff-ticket-detail">

                                        <span>
                                            Event
                                        </span>

                                        <strong>
                                            {ticket.event}
                                        </strong>

                                    </div>


                                    <div className="staff-ticket-detail">

                                        <span>
                                            Stadium
                                        </span>

                                        <strong>
                                            {ticket.stadium}
                                        </strong>

                                    </div>


                                    <div className="staff-ticket-detail">

                                        <span>
                                            Date
                                        </span>

                                        <strong>
                                            {ticket.date}
                                        </strong>

                                    </div>


                                    <div className="staff-ticket-detail">

                                        <span>
                                            Time
                                        </span>

                                        <strong>
                                            {ticket.time}
                                        </strong>

                                    </div>


                                    <div className="staff-ticket-detail">

                                        <span>
                                            Seats
                                        </span>

                                        <strong className="staff-ticket-seats">

                                            {ticket.seats.length > 0

                                                ? ticket.seats.map(
                                                    (seat) => (

                                                        <span
                                                            key={seat}
                                                        >
                                                            {seat}
                                                        </span>

                                                    )
                                                )

                                                : "—"}

                                        </strong>

                                    </div>

                                </div>


                                {/* ENTRY CONFIRMATION */}

                                <div className="staff-entry-confirmation">

                                    <div>

                                        <strong>
                                            Entry Status
                                        </strong>

                                        <span>
                                            Ticket is active and
                                            eligible for entry.
                                        </span>

                                    </div>


                                    <button
                                        type="button"
                                        className="staff-entry-button"
                                        onClick={
                                            handleAllowEntry
                                        }
                                    >
                                        ✓ Allow Entry
                                    </button>

                                </div>

                            </div>

                        )}


                </div>


                {/* SIDE INFORMATION */}

                <aside className="staff-validation-sidebar">

                    <div className="staff-validation-info-card">

                        <div className="staff-info-card-icon">
                            🛡️
                        </div>

                        <h3>
                            Ticket Verification
                        </h3>

                        <p>
                            Follow these steps when checking
                            a customer's ticket.
                        </p>


                        <div className="staff-validation-steps">

                            <div className="staff-validation-step">

                                <span>
                                    1
                                </span>

                                <div>

                                    <strong>
                                        Scan QR Code
                                    </strong>

                                    <p>
                                        Scan the customer's
                                        QR code using the camera.
                                    </p>

                                </div>

                            </div>


                            <div className="staff-validation-step">

                                <span>
                                    2
                                </span>

                                <div>

                                    <strong>
                                        Validate Ticket
                                    </strong>

                                    <p>
                                        Check whether the ticket
                                        is active and valid.
                                    </p>

                                </div>

                            </div>


                            <div className="staff-validation-step">

                                <span>
                                    3
                                </span>

                                <div>

                                    <strong>
                                        Verify Details
                                    </strong>

                                    <p>
                                        Match the customer,
                                        event and seat information.
                                    </p>

                                </div>

                            </div>


                            <div className="staff-validation-step">

                                <span>
                                    4
                                </span>

                                <div>

                                    <strong>
                                        Allow Entry
                                    </strong>

                                    <p>
                                        Permit entry after
                                        successful verification.
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* WARNING */}

                    <div className="staff-validation-warning">

                        <span>
                            ⚠️
                        </span>

                        <div>

                            <strong>
                                Important
                            </strong>

                            <p>
                                Do not allow entry if the ticket
                                is expired, cancelled or already used.
                            </p>

                        </div>

                    </div>


                    {/* CLEAR */}

                    <button
                        type="button"
                        className="staff-clear-button"
                        onClick={handleClear}
                    >
                        Clear Verification
                    </button>

                </aside>

            </div>

        </div>
    );
}

export default TicketValidation;