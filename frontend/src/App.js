import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import RegisterStudent from './components/RegisterStudent';
import MarkAttendance from './components/MarkAttendance';
import AttendanceReport from './components/AttendanceReport';
import AppLayout from './components/AppLayout';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAttendanceMarked = () => {
    // Trigger refresh by changing the key
    setRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <AppLayout>
      <div className="content">
        <h1>Student Attendance System</h1>
        <RegisterStudent />
        <MarkAttendance onAttendanceMarked={handleAttendanceMarked} />
        <AttendanceReport key={refreshKey} />
      </div>
    </AppLayout>
  );
}

export default App;
