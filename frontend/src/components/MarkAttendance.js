import React, { useState } from "react";
import { markAttendance } from "../services/api";

const MarkAttendance = ({ onAttendanceMarked }) => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!file) {
      setError("Please select an image file");
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await markAttendance(formData);
      
      if (response?.count >= 0) {
        setSuccess({
          message: response.message || "Attendance marked successfully",
          count: response.count
        });
        
        // Trigger parent component refresh
        if (typeof onAttendanceMarked === "function") {
          onAttendanceMarked();
        }
      } else {
        setError("Unexpected response format from server");
      }

    } catch (err) {
      setError(err.message || "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="attendance-container">
      <h2>Mark Attendance</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            Upload Face Image:
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
              disabled={isLoading}
            />
          </label>
        </div>

	  <button 
  type="submit" 
  disabled={isLoading}
  className={isLoading ? "loading" : ""}
>
  {isLoading ? (
    <>
      <div className="loading-spinner" />
      Processing...
    </>
  ) : (
    "Mark Attendance"
  )}
</button>



               {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message">
            <p>{success.message}</p>
            <p>Recognized {success.count} people</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default MarkAttendance;
