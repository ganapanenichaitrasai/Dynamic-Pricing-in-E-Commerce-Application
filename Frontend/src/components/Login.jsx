import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./login.css"; // Importing the updated CSS

function Login() {
    const navigate = useNavigate();
    const { isAuthenticated, login } = useAuth();
    const [formData, setFormData] = useState({ username: "", password: "" });

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/dashboard");
        }
    }, [isAuthenticated, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (response.ok) {
                login(data.token);
                alert("Login successful!");
                navigate("/dashboard");
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("An error occurred during login.");
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="left-panel">
                    <h2>Welcome to Dynamic Pricing Application</h2>

                    <form onSubmit={handleSubmit}>
                        <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
                        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                        <button type="submit" className="login-button">Login</button>
                    </form>
                    <button onClick={() => navigate("/forgot-password")} className="forgot-password">Forgot Password?</button>
                </div>
                <div className="right-panel">
                    <div className="illustration"></div>
                </div>
            </div>
        </div>
    );
}

export default Login;
