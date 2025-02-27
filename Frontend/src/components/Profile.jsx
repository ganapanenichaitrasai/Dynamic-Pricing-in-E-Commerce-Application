import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const Profile = () => {
    const { token } = useAuth();
    const [userData, setUserData] = useState({ username: "", email: "", password: "" });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch user details
        const fetchProfile = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await response.json();
                if (response.ok) {
                    setUserData({ username: data.username, email: data.email, password: "" });
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            }
            setLoading(false);
        };
        fetchProfile();
    }, [token]);

    const handleChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();
            if (response.ok) {
                alert("Profile updated successfully!");
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("Update error:", error);
            alert("An error occurred while updating profile.");
        }
    };

    if (loading) return <h2>Loading profile...</h2>;

    return (
        <div>
            <h2>Profile Settings</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Username:</label>
                    <input type="text" name="username" value={userData.username} onChange={handleChange} required />
                </div>
                <div>
                    <label>Email:</label>
                    <input type="email" name="email" value={userData.email} onChange={handleChange} required />
                </div>
                <div>
                    <label>New Password (optional):</label>
                    <input type="password" name="password" value={userData.password} onChange={handleChange} />
                </div>
                <button type="submit">Update Profile</button>
            </form>
        </div>
    );
};

export default Profile;
