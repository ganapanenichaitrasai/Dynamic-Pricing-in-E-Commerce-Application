import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthContext";
import Signup from "./components/SignUp";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import Products from "./components/Products";
import DynamicPricing from "./components/DynamicPricing";
import Analytics from "./components/Analytics";
import FeedbackForm from "./components/Userfeedback";
import FeedbackSection from "./components/Feedbacksection";
import "./App.css";

const NavButtons = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    
    const handleLoginClick = () => {
        if (isAuthenticated) {
            navigate("/dashboard");
        } else {
            navigate("/login");
        }
    };
    
    return (
        <div className="nav-buttons">
            <button className="sign-in" onClick={handleLoginClick}>Sign In</button>
            <button className="sign-up" onClick={() => navigate("/signup")}>Sign Up</button>
        </div>
    );
};

function HomePage() {
    return (
        <div className="home-page">
            <header className="header1">
                <div className="container1">
                    <nav className="nav">
                        <a href="/" className="logo">DPIECA</a>
                        <NavButtons />
                    </nav>
                </div>
            </header>

            <div className="welcome-section">
                <div className="container">
                    <p className="welcome-text">
                        Welcome to Dynamic Pricing Application. 
                        All-in-one pricing solution for your business needs.
                    </p>
                    <FeedbackSection />
                </div>
                <div className="image-overlay">
                    <img src="https://img.freepik.com/premium-vector/market-research-studies-abstract-concept-vector-illustration_107173-24938.jpg" alt="Dynamic Pricing Illustration" />
                </div>
            </div>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route exact path="/" element={<HomePage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/pricing" element={<DynamicPricing />}/>
                    <Route path="/analytics" element={<Analytics />}/>
                    <Route path="/feedback" element={<FeedbackForm/>}/>

                </Route>
            </Routes>
        </AuthProvider>
    );
}

export default App;
