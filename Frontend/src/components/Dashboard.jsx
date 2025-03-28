import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { FaUserCog } from "react-icons/fa";
import Sidebar from "./Sidebar";
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
            <Sidebar 
                isSidebarOpen={isSidebarOpen} 
                setIsSidebarOpen={setIsSidebarOpen} 
                handleLogout={handleLogout}
            />

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