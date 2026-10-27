import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { authPost } from "../../services/api";

function Login() {

    const navigate = useNavigate();
    const { login } = useAuth();

    // CUSTOMER signs in with mobile + OTP, STAFF (and admin) with email + password
    const [mode, setMode] = useState("CUSTOMER");

    // customer (OTP)
    const [mobile, setMobile] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [resendIn, setResendIn] = useState(0);
    const [info, setInfo] = useState("");

    // admin / staff (password)
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [rememberMe, setRememberMe] = useState(false);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);


    // =========================================================
    // RESEND COUNTDOWN
    // =========================================================

    useEffect(() => {

        if (resendIn <= 0) {
            return undefined;
        }

        const timer = setTimeout(() => setResendIn(resendIn - 1), 1000);

        return () => clearTimeout(timer);

    }, [resendIn]);


    const switchMode = (newMode) => {

        setMode(newMode);
        setError("");
        setInfo("");
        setOtp("");
        setOtpSent(false);
    };


    // =========================================================
    // FINISH LOGIN (shared by both ways of signing in)
    // =========================================================

    const finishLogin = (data) => {

        const token = data.token;

        if (!token || !data.role) {
            throw new Error("The server did not return the login details.");
        }

        const user = {
            id: data.userId ?? data.id,
            name: data.name,
            email: data.email,
            mobile: data.mobile,
            role: data.role,
        };

        login(user, token);

        if (rememberMe) {
            localStorage.setItem("rememberMe", "true");
        } else {
            localStorage.removeItem("rememberMe");
        }

        if (user.role === "ADMIN") {
            navigate("/admin/dashboard");
        } else if (user.role === "STAFF") {
            navigate("/staff/dashboard");
        } else if (user.role === "CUSTOMER") {
            navigate("/customer/dashboard");
        } else {
            throw new Error(`Unknown user role: ${user.role}`);
        }
    };


    // =========================================================
    // CUSTOMER: SEND OTP
    // =========================================================

    const sendOtp = async () => {

        setError("");
        setInfo("");
        setLoading(true);

        try {

            const data = await authPost("/auth/login/request-otp", {
                mobile: mobile.trim(),
            });

            setOtpSent(true);
            setOtp("");
            setResendIn(data.resendAfterSeconds || 30);
            setInfo(data.message);

        } catch (err) {

            setError(err.message || "Could not send the OTP.");

        } finally {

            setLoading(false);
        }
    };


    // =========================================================
    // SUBMIT
    // =========================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        // customer, first step: ask for the OTP
        if (mode === "CUSTOMER" && !otpSent) {
            await sendOtp();
            return;
        }

        setLoading(true);

        try {

            const data = mode === "CUSTOMER"
                ? await authPost("/auth/login/verify-otp", {
                    mobile: mobile.trim(),
                    otp: otp.trim(),
                })
                : await authPost("/auth/login", {
                    email: email.trim(),
                    password: password,
                });

            finishLogin(data);

        } catch (err) {

            setError(err.message || "Login failed. Please try again.");

        } finally {

            setLoading(false);
        }
    };


    // =========================================================
    // RETURN
    // =========================================================

    return (

        <div className="login-page">

            {/* =================================================
                LOGIN BODY
            ================================================= */}

            <div className="login-body">


                {/* =================================================
                    STADIUM SECTION
                ================================================= */}

                <div className="stadium-section">

                    <div className="stadium-overlay"></div>


                    <div className="stadium-content">

                        <p className="stadium-tag">
                            YourTurn
                        </p>


                        <h1>
                            Live the
                            <br />
                            Stadium Experience
                        </h1>


                        <p className="stadium-description">

                            Book your favorite events, choose
                            the best seats and make unforgettable
                            memories.

                        </p>


                        {/* =================================================
                            FEATURES
                        ================================================= */}

                        <div className="stadium-features">


                            <div className="stadium-feature">

                                <div className="feature-symbol">
                                    🎟
                                </div>

                                <span>
                                    Easy Booking
                                </span>

                            </div>


                            <div className="stadium-feature">

                                <div className="feature-symbol">
                                    💺
                                </div>

                                <span>
                                    Premium Seats
                                </span>

                            </div>


                            <div className="stadium-feature">

                                <div className="feature-symbol">
                                    🔒
                                </div>

                                <span>
                                    Secure Payments
                                </span>

                            </div>


                        </div>


                        {/* =================================================
                            QUOTE
                        ================================================= */}

                        <div className="stadium-quote">

                            <strong>

                                "More Than a Ticket.
                                <br />
                                It's an Experience."

                            </strong>

                            <div className="quote-line"></div>

                        </div>

                    </div>

                </div>



                {/* =================================================
                    LOGIN CARD
                ================================================= */}

                <div className="login-card">

                    <div className="login-card-header">

                        <h2>
                            Welcome Back
                        </h2>

                        <p>
                            Login to your BookNow account
                        </p>

                    </div>


                    {/* CUSTOMER / STAFF SWITCH */}

                    <div className="login-mode-tabs">

                        <button
                            type="button"
                            className={mode === "CUSTOMER" ? "active" : ""}
                            onClick={() => switchMode("CUSTOMER")}
                        >
                            Customer
                        </button>

                        <button
                            type="button"
                            className={mode === "STAFF" ? "active" : ""}
                            onClick={() => switchMode("STAFF")}
                        >
                            Admin / Staff
                        </button>

                    </div>


                    <form onSubmit={handleSubmit}>

                        {mode === "CUSTOMER" ? (

                            <>

                                <div className="login-form-group">

                                    <label>
                                        Mobile Number
                                    </label>

                                    <div className="input-wrapper">

                                        <span className="input-icon">
                                            📱
                                        </span>

                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            autoComplete="tel"
                                            value={mobile}
                                            onChange={(e) =>
                                                setMobile(e.target.value)
                                            }
                                            placeholder="10-digit mobile number"
                                            disabled={otpSent}
                                            required
                                        />

                                    </div>

                                </div>


                                {otpSent && (

                                    <div className="login-form-group">

                                        <label>
                                            Enter OTP
                                        </label>

                                        <div className="input-wrapper">

                                            <span className="input-icon">
                                                🔑
                                            </span>

                                            <input
                                                className="otp-input"
                                                type="text"
                                                inputMode="numeric"
                                                autoComplete="one-time-code"
                                                maxLength={6}
                                                value={otp}
                                                onChange={(e) =>
                                                    setOtp(
                                                        e.target.value.replace(/\D/g, "")
                                                    )
                                                }
                                                placeholder="6-digit OTP"
                                                autoFocus
                                                required
                                            />

                                        </div>

                                        <div className="otp-actions">

                                            <button
                                                type="button"
                                                className="otp-link"
                                                onClick={sendOtp}
                                                disabled={loading || resendIn > 0}
                                            >
                                                {resendIn > 0
                                                    ? `Resend OTP in ${resendIn}s`
                                                    : "Resend OTP"}
                                            </button>

                                            <button
                                                type="button"
                                                className="otp-link"
                                                onClick={() => {
                                                    setOtpSent(false);
                                                    setOtp("");
                                                    setInfo("");
                                                    setError("");
                                                }}
                                            >
                                                Change number
                                            </button>

                                        </div>

                                    </div>

                                )}

                            </>

                        ) : (

                            <>

                                <div className="login-form-group">

                                    <label>
                                        Email
                                    </label>

                                    <div className="input-wrapper">

                                        <span className="input-icon">
                                            ✉
                                        </span>

                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                            placeholder="Enter your email"
                                            required
                                        />

                                    </div>

                                </div>


                                <div className="login-form-group">

                                    <label>
                                        Password
                                    </label>

                                    <div className="input-wrapper">

                                        <span className="input-icon">
                                            🔒
                                        </span>

                                        <input
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            placeholder="Enter your password"
                                            required
                                        />

                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                        >
                                            {showPassword ? "◉" : "◌"}
                                        </button>

                                    </div>

                                </div>

                            </>

                        )}


                        {info && !error && (

                            <p className="login-info">
                                {info}
                            </p>

                        )}

                        {error && (

                            <p className="login-error">
                                {error}
                            </p>

                        )}


                        <div className="login-options">

                            <label className="remember-me">

                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) =>
                                        setRememberMe(e.target.checked)
                                    }
                                />

                                <span>
                                    Remember me
                                </span>

                            </label>

                        </div>


                        <button
                            type="submit"
                            className="login-submit"
                            disabled={loading}
                        >

                            {loading
                                ? "Please wait..."
                                : mode === "CUSTOMER" && !otpSent
                                    ? "Send OTP"
                                    : "Login"
                            }

                        </button>

                    </form>


                    <p className="register-message">

                        New customer?{" "}

                        <Link to="/register">
                            Register
                        </Link>

                    </p>

                </div>

            </div>

        </div>
    );
}


export default Login;