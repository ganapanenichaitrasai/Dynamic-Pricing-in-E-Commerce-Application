import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./forgotpassword.css"; // Import CSS file

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate(); // Ensure navigation is used

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage("");

        try {
            const { data } = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/auth/forgot-password`,
                { email }
            );
            setMessage(data.message || "Password reset link sent! Check your email.");
        } catch (error) {
            setMessage("Error sending reset link. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="forgot-password-overlay">
            <div className="forgot-password-modal">
                <div className="icon-container">
                    <img src="https://img.freepik.com/free-vector/access-control-system-abstract-concept_335657-3180.jpg?t=st=1740481042~exp=1740484642~hmac=694b7cb51c2913803cad70ae8ced38711066ec01514afcb8b77d8162ede001db&w=900" alt="Lock Icon" className="lock-icon" />
                </div>
                <h2>Forgot your password?</h2>
                <p>Hey, we received a request to reset your password.</p>
                <p>Let’s get you a new one!</p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <button type="submit" className="submit-button" disabled={isLoading}>
                        {isLoading ? "Sending..." : "RESET MY PASSWORD"}
                    </button>
                </form>

                {message && <p className="message">{message}</p>}

                <button onClick={() => navigate("/login")} className="back-button">
                    Back to Login
                </button>
            </div>
        </div>
    );
}

export default ForgotPassword;
