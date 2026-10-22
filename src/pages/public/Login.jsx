import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { API_BASE_URL } from "../../services/api";

function Login() {

    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);


    // =========================================================
    // LOGIN
    // =========================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setLoading(true);

        try {

            const response = await fetch(
                `${API_BASE_URL}/auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        email: email.trim(),
                        password: password,
                    }),
                }
            );


            // =================================================
            // READ RESPONSE
            // =================================================

            const data = await response.json();

            console.log("=================================");
            console.log("LOGIN RESPONSE");
            console.log(data);
            console.log("=================================");


            // =================================================
            // BACKEND ERROR
            // =================================================

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    data.error ||
                    "Invalid email or password"
                );
            }


            // =================================================
            // GET JWT TOKEN
            // =================================================

            const token =
                data.token ||
                data.accessToken ||
                data.jwt;


            if (!token) {

                console.error(
                    "JWT token missing from response:",
                    data
                );

                throw new Error(
                    "JWT token was not returned by the server."
                );
            }


            // =================================================
            // GET USER
            // =================================================

            /*
             * Expected backend response:
             *
             * {
             *     token: "...",
             *     user: {
             *         id: 1,
             *         name: "...",
             *         email: "...",
             *         role: "ADMIN"
             *     }
             * }
             *
             * But this code also supports:
             *
             * {
             *     token: "...",
             *     id: 1,
             *     name: "...",
             *     email: "...",
             *     role: "ADMIN"
             * }
             */

            let user = data.user;


            // If backend sends user details directly
            if (!user && data.role) {

                user = {
                    id: data.id,
                    name: data.name,
                    email: data.email || email,
                    role: data.role,
                };
            }


            // =================================================
            // USER NOT FOUND
            // =================================================

            if (!user) {

                console.error(
                    "User details missing from login response:",
                    data
                );

                throw new Error(
                    "User details were not returned by the server."
                );
            }


            // =================================================
            // ROLE
            // =================================================

            const role = user.role;


            if (!role) {

                console.error(
                    "User role missing from login response:",
                    user
                );

                throw new Error(
                    "User role was not returned by the server."
                );
            }


            console.log("Logged-in user:", user);
            console.log("User role:", role);


            // =================================================
            // STORE LOGIN INFORMATION
            // =================================================

            login(user, token);


            // =================================================
            // REMEMBER ME
            // =================================================

            if (rememberMe) {

                localStorage.setItem(
                    "rememberMe",
                    "true"
                );

            } else {

                localStorage.removeItem(
                    "rememberMe"
                );
            }


            // =================================================
            // ROLE BASED REDIRECT
            // =================================================

            if (role === "ADMIN") {

                navigate("/admin/dashboard");

            } else if (role === "STAFF") {

                navigate("/staff/dashboard");

            } else if (role === "CUSTOMER") {

                navigate("/customer/dashboard");

            } else {

                throw new Error(
                    `Unknown user role: ${role}`
                );
            }

        } catch (err) {

            console.error(
                "Login error:",
                err
            );

            setError(
                err.message ||
                "Login failed. Please try again."
            );

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


                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <div className="login-card-header">

                        <h2>
                            Welcome Back
                        </h2>

                        <p>
                            Login to your BookNow account
                        </p>

                    </div>



                    {/* =================================================
                        LOGIN FORM
                    ================================================= */}

                    <form onSubmit={handleSubmit}>


                        {/* =================================================
                            EMAIL
                        ================================================= */}

                        <div className="login-form-group">

                            <label>
                                Email or Username
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
                                    placeholder="Enter your email or username"
                                    required
                                />

                            </div>

                        </div>



                        {/* =================================================
                            PASSWORD
                        ================================================= */}

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
                                        setShowPassword(
                                            !showPassword
                                        )
                                    }
                                >

                                    {showPassword
                                        ? "◉"
                                        : "◌"
                                    }

                                </button>

                            </div>

                        </div>



                        {/* =================================================
                            ERROR
                        ================================================= */}

                        {error && (

                            <p className="login-error">
                                {error}
                            </p>

                        )}



                        {/* =================================================
                            OPTIONS
                        ================================================= */}

                        <div className="login-options">


                            <label className="remember-me">

                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) =>
                                        setRememberMe(
                                            e.target.checked
                                        )
                                    }
                                />

                                <span>
                                    Remember me
                                </span>

                            </label>


                            <button
                                type="button"
                                className="forgot-password"
                            >
                                Forgot password?
                            </button>


                        </div>



                        {/* =================================================
                            LOGIN BUTTON
                        ================================================= */}

                        <button
                            type="submit"
                            className="login-submit"
                            disabled={loading}
                        >

                            {loading
                                ? "Signing in..."
                                : "Login"
                            }

                        </button>


                    </form>



                    {/* =================================================
                        DIVIDER
                    ================================================= */}

                    <div className="login-divider">

                        <span></span>

                        <p>
                            OR
                        </p>

                        <span></span>

                    </div>



                    {/* =================================================
                        SOCIAL LOGIN
                    ================================================= */}

                    <div className="social-login">


                        <button
                            type="button"
                            className="social-button"
                        >

                            <span className="google-icon">
                                G
                            </span>

                            Continue with Google

                        </button>


                        <button
                            type="button"
                            className="social-button"
                        >

                            <span className="apple-icon">
                                ●
                            </span>

                            Continue with Apple

                        </button>


                    </div>



                    {/* =================================================
                        REGISTER
                    ================================================= */}

                    <p className="register-message">

                        Don't have an account?{" "}

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