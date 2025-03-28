import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import "./Userfeedback.css";

const FeedbackForm = () => {
    const [user, setUser] = useState({ username: "", email: "" });
    const [feedback, setFeedback] = useState("");
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get("http://localhost:5000/api/auth/profile", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUser({ username: response.data.username, email: response.data.email });
            } catch (error) {
                console.error("Error fetching user data", error);
            }
        };
        fetchUser();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            await axios.post("http://localhost:5000/api/auth/feedback", {
                feedback,
                rating
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("Feedback submitted!");
            setFeedback("");
            setRating(0);
        } catch (error) {
            console.error("Error submitting feedback", error);
        }
    };

    return (
        <div className="page-container">
            <Sidebar 
                isSidebarOpen={isSidebarOpen} 
                setIsSidebarOpen={setIsSidebarOpen}
                handleLogout={handleLogout}
            />
            <div className={`content ${isSidebarOpen ? "shifted" : ""}`}>
                <div className="feedback-container">
                    <h2>Leave Your Feedback</h2>
                    <form onSubmit={handleSubmit} className="feedback-form">
                        <div className="form-group">
                            <label>Username</label>
                            <input type="text" value={user.username} disabled />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" value={user.email} disabled />
                        </div>
                        <div className="form-group">
                            <label>Rating</label>
                            <div className="star-rating">
                                {[...Array(5)].map((star, index) => {
                                    index += 1;
                                    return (
                                        <button
                                            type="button"
                                            key={index}
                                            className={index <= (hover || rating) ? "on" : "off"}
                                            onClick={() => setRating(index)}
                                            onMouseEnter={() => setHover(index)}
                                            onMouseLeave={() => setHover(rating)}
                                        >
                                            <span className="star">&#9733;</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Your Feedback</label>
                            <textarea 
                                value={feedback} 
                                onChange={(e) => setFeedback(e.target.value)} 
                                placeholder="Share your experience..."
                                required
                            />
                        </div>
                        <button type="submit" className="submit-btn">Submit Feedback</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default FeedbackForm;