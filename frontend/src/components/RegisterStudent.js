import React, { useState } from "react";
import { registerStudent } from "../services/api";

const RegisterStudent = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "image/jpeg") {
      setFile(selectedFile);
    } else {
      alert("Please upload a valid .jpeg file.");
      e.target.value = ""; // Clear the invalid file
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please upload a .jpeg file.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("photo", file);

    // Debugging: Log all form data entries
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, key === "photo" ? value.name : value);
    }

    try {
      const response = await registerStudent(formData);
      alert(response.message || "Student registered successfully!");
    } catch (error) {
      console.error("Error during registration:", error);
      const errorMessage =
        error.response?.data?.message || "Error registering student.";
      alert(errorMessage);
    }
  };

  return (
    <div>
      <h2>Register Student</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Student Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="file"
          accept=".jpeg"
          onChange={handleFileChange}
          required
        />
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default RegisterStudent;

