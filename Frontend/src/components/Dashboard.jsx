import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { FaBars, FaBox, FaChartBar, FaCommentDots, FaSignOutAlt, FaUserCog } from "react-icons/fa";
import "./Dashboard.css";

const Dashboard = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <div 
                className={`sidebar ${isSidebarOpen ? "open" : ""}`} 
                onMouseEnter={() => setIsSidebarOpen(true)} 
                onMouseLeave={() => setIsSidebarOpen(false)}
            >
                <FaBars className="menu-icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                <ul>
                    <li onClick={() => navigate("/products")}>
                        <FaBox /> {isSidebarOpen && <span>Products</span>}
                    </li>
                    <li onClick={() => navigate("/pricing")}>
                        <FaChartBar /> {isSidebarOpen && <span>Dynamic Pricing</span>}
                    </li>
                    <li onClick={() => navigate("/analytics")}>
                        <FaChartBar /> {isSidebarOpen && <span>Analytics</span>}
                    </li>
                    <li onClick={() => navigate("/feedback")}>
                        <FaCommentDots /> {isSidebarOpen && <span>Feedback</span>}
                    </li>
                    <li onClick={handleLogout}>
                        <FaSignOutAlt /> {isSidebarOpen && <span>Logout</span>}
                    </li>
                </ul>
            </div>

            {/* Main Content */}
            <div className="main-content">
                {/* Header with Welcome Text and Profile Settings */}
                <div className="header">
                    <h1>Welcome to Dashboard</h1>
                    <button className="profile-btn" onClick={() => navigate("/profile")}>
                        <FaUserCog />
                    </button>
                </div>

                {/* Dashboard Content Area */}
                <div className="content-area">
                    <p>Explore the features from the sidebar!</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;