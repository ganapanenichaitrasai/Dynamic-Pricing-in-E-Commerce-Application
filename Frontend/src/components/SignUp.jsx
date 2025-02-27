import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./signup.css"; // Ensure this file contains alert styles

function Signup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [alertMessage, setAlertMessage] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const isPasswordStrong = (password) => {
        return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlertMessage(null);

        if (formData.password !== formData.confirmPassword) {
            setAlertMessage("❌ Passwords do not match!");
            return;
        }

        if (!isPasswordStrong(formData.password)) {
            setAlertMessage("⚠️ Password must be at least 8 characters, contain an uppercase letter and a number.");
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await response.json();
            if (response.ok) {
                alert("✅ Signup successful! Redirecting to login...");
                navigate("/login");
            } else {
                setAlertMessage(`❌ ${data.message || "Signup failed. Try again!"}`);
            }
        } catch (error) {
            console.error("Signup error:", error);
            setAlertMessage("❌ Server error. Please try again later.");
        }
    };

    return (
        <div className="signup-container">
            <div className="signup-box">
                <div className="form-section">
                    <h2>Welcome to Dynamic Pricing Application</h2>

                    {alertMessage && <div className="alert-box">{alertMessage}</div>}

                    <form onSubmit={handleSubmit}>
                        <input type="text" name="username" placeholder="Full Name" value={formData.username} onChange={handleChange} required />
                        <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
                        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                        <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />
                        <button type="submit">Sign Up</button>
                    </form>

                    <p className="login-link">Already have an account? <span onClick={() => navigate("/login")}>Login</span></p>
                </div>
                <div className="image-section"></div>
            </div>
        </div>
    );
}

export default Signup;
