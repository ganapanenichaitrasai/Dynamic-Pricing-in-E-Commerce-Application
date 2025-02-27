import { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

function ResetPassword() {
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Extract token from URL query params
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get("token");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage("");

        if (!token) {
            setMessage("Invalid or missing token.");
            setIsLoading(false);
            return;
        }
        console.log(token, newPassword)

        try {
            const { data } = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/auth/reset-password`,
                { token, newPassword }
            );
            setMessage(data.message || "Password reset successfully! You can now log in.");
            setTimeout(() => navigate("/login"), 2000);
        } catch (error) {
            setMessage("Failed to reset password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="reset-password-overlay">
            <div className="reset-password-modal">
                <h2>Reset Password</h2>
                <p>Enter your new password.</p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <button type="submit" className="submit-button" disabled={isLoading}>
                        {isLoading ? "Resetting..." : "Reset Password"}
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

export default ResetPassword;
