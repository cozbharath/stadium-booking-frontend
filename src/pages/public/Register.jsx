import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { authPost } from "../../services/api";

function Register() {

    const navigate = useNavigate();
    const { login } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [mobile, setMobile] = useState("");
    const [otp, setOtp] = useState("");

    // step 1 = details, step 2 = enter the OTP that was texted
    const [step, setStep] = useState(1);
    const [resendIn, setResendIn] = useState(0);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
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


    // =========================================================
    // STEP 1: SEND OTP
    // =========================================================

    const sendOtp = async () => {

        setError("");
        setSuccess("");

        if (!name.trim() || !email.trim() || !mobile.trim()) {
            setError("Please fill in all fields.");
            return;
        }

        setLoading(true);

        try {

            const data = await authPost("/auth/register/request-otp", {
                name: name.trim(),
                email: email.trim(),
                mobile: mobile.trim(),
            });

            setStep(2);
            setOtp("");
            setResendIn(data.resendAfterSeconds || 30);
            setSuccess(`OTP sent to ${data.maskedMobile}.`);

        } catch (err) {

            setError(err.message || "Could not send the OTP. Please try again.");

        } finally {

            setLoading(false);
        }
    };


    // =========================================================
    // STEP 2: VERIFY OTP, ACCOUNT IS CREATED AND SIGNED IN
    // =========================================================

    const verifyOtp = async () => {

        setError("");
        setSuccess("");
        setLoading(true);

        try {

            const data = await authPost("/auth/register/verify-otp", {
                mobile: mobile.trim(),
                otp: otp.trim(),
            });

            login(
                {
                    id: data.userId ?? data.id,
                    name: data.name,
                    email: data.email,
                    mobile: data.mobile,
                    role: data.role,
                },
                data.token
            );

            navigate("/customer/dashboard");

        } catch (err) {

            setError(err.message || "Verification failed. Please try again.");

        } finally {

            setLoading(false);
        }
    };


    const handleSubmit = (e) => {

        e.preventDefault();

        if (step === 1) {
            sendOtp();
        } else {
            verifyOtp();
        }
    };


    return (
        <div className="register-page">
            <div className="register-container">

                {/* Left Side */}
                <div className="register-info">
                    <p className="register-tag">JOIN BOOKNOW</p>
                    <h1>Your Stadium<br />Experience Starts Here</h1>
                    <p>
                        Create your BookNow account and discover upcoming
                        stadium events, choose your seats, and book your
                        tickets easily.
                    </p>
                    <div className="register-features">
                        <div><span>🎟</span><p>Easy Ticket Booking</p></div>
                        <div><span>💺</span><p>Choose Your Seats</p></div>
                        <div><span>📱</span><p>Digital QR Tickets</p></div>
                    </div>
                </div>

                {/* Registration Card */}
                <div className="register-card">
                    <div className="register-card-header">
                        <h2>Create Account</h2>
                        <p>
                            {step === 1
                                ? "Register for your BookNow account"
                                : "Enter the OTP sent to your mobile"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="register-form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your full name"
                                disabled={step === 2}
                                required
                            />
                        </div>

                        <div className="register-form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                disabled={step === 2}
                                required
                            />
                        </div>

                        <div className="register-form-group">
                            <label>Mobile Number</label>
                            <input
                                type="tel"
                                inputMode="numeric"
                                autoComplete="tel"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                placeholder="10-digit mobile number"
                                disabled={step === 2}
                                required
                            />
                        </div>

                        {step === 2 && (
                            <div className="register-form-group">
                                <label>OTP</label>
                                <input
                                    className="otp-input"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) =>
                                        setOtp(e.target.value.replace(/\D/g, ""))
                                    }
                                    placeholder="6-digit OTP"
                                    autoFocus
                                    required
                                />

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
                                            setStep(1);
                                            setOtp("");
                                            setError("");
                                            setSuccess("");
                                        }}
                                    >
                                        Edit details
                                    </button>
                                </div>
                            </div>
                        )}

                        {error && <p className="register-error">{error}</p>}
                        {success && !error && (
                            <p className="register-success">{success}</p>
                        )}

                        <button type="submit" className="register-submit" disabled={loading}>
                            {loading
                                ? "Please wait..."
                                : step === 1
                                    ? "Send OTP"
                                    : "Verify & Create Account"}
                        </button>

                    </form>

                    <p className="login-message">
                        Already have an account?{" "}
                        <Link to="/login">Login</Link>
                    </p>
                </div>

            </div>
        </div>
    );
}

export default Register;
