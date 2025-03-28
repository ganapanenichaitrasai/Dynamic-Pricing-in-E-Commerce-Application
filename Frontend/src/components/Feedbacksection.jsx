import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./Feedbacksection.css"

const StarRating = ({ rating }) => {
  return (
    <div className="feedback-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span 
          key={star} 
          className={`star ${star <= rating ? 'filled' : ''}`}
        >
          ★
        </span>
      ))}
    </div>
  );
};

const FeedbackSection = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/feedbacks');
        setFeedbacks(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch feedbacks');
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  if (loading) return <div className="feedback-loading">Loading feedbacks...</div>;
  if (error) return <div className="feedback-error">{error}</div>;

  return (
    <section className="feedback-section">
      <h2 className="feedback-title">What Our Users Say</h2>
      <div className="feedback-grid">
        {feedbacks.map((feedback, index) => (
          <div key={index} className="feedback-card">
            <div className="feedback-header">
              <div className="feedback-user">
                <span className="feedback-username">{feedback.username}</span>
                <span className="feedback-email">{feedback.email}</span>
              </div>
              <StarRating rating={feedback.rating} />
            </div>
            <p className="feedback-text">{feedback.feedback}</p>
            <span className="feedback-date">
              {new Date(feedback.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeedbackSection;