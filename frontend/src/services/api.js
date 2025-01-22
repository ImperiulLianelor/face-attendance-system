import axios from "axios";

// Base URL of the backend API
const API_URL = "http://localhost:5000"; // Update this if your backend is running on a different port or URL

/**
 * Mark attendance by sending a POST request to the backend.
 * @param {FormData} formData - The form data containing the file (image).
 * @returns {Object} - The response data from the backend.
 */

export const registerStudent = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("Error registering student:", error);
    throw error;
  }
};

export const markAttendance = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/mark_attendance`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // Ensure response data exists
    if (!response.data) {
      throw new Error("No data received from server");
    }

    return response.data;

  } catch (error) {
    // Handle Axios errors properly
    const errorMessage = error.response?.data?.error || 
                        error.message || 
                        "Failed to mark attendance";
    throw new Error(errorMessage);
  }
};



export const getAttendanceReport = async (timeframe = "daily") => {
  try {
    const response = await axios.get(`${API_URL}/attendance_report`, {
      params: { 
        timeframe,
        // Prevent caching
        _: new Date().getTime() 
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching attendance report:", error);
    throw error;
  }
};


