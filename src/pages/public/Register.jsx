import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { post } from "../../services/api";

function Register() {

    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    // =========================================================
    // REGISTER
    // =========================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!name.trim() || !email.trim() || !password) {
            setError("Please fill in all fields.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            await post("/auth/register", {
                name: name.trim(),
                email: email.trim(),
                password: password,
            });

            setSuccess("Account created successfully! Redirecting to login...");

            setTimeout(() => {
                navigate("/login");
            }, 1500);

        } catch (err) {
            console.error("Registration error:", err);
            setError(err.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
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
                        <p>Register for your BookNow account</p>
                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="register-form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your full name"
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
                                required
                            />
                        </div>

                        <div className="register-form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <div className="register-form-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                                required
                            />
                        </div>

                        {error && <p className="register-error">{error}</p>}
                        {success && <p className="register-success">{success}</p>}

                        <button type="submit" className="register-submit" disabled={loading}>
                            {loading ? "Creating account..." : "Create Account"}
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