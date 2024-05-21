// ReviewForm.jsx
import React, { useState } from "react";

const ReviewForm = ({ submitReview }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    // Validate form fields
    if (!rating || !review.trim()) {
      alert("Please provide a rating and a review.");
      return;
    }
    // Submit the review
    submitReview({ rating, review });
    // Clear form fields
    setRating(0);
    setReview("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="rating">Rating:</label>
        <input
          type="number"
          id="rating"
          value={rating}
          onChange={(event) => setRating(Number(event.target.value))}
          min="1"
          max="5"
        />
      </div>
      <div>
        <label htmlFor="review">Review:</label>
        <textarea
          id="review"
          value={review}
          onChange={(event) => setReview(event.target.value)}
        />
      </div>
      <button type="submit">Submit Review</button>
    </form>
  );
};

export default ReviewForm;
