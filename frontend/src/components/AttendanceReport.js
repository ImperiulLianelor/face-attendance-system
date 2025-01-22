import React, { useState, useEffect } from 'react';
import { getAttendanceReport } from '../services/api';

const AttendanceReport = () => {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchReport = async () => {
    try {
      const data = await getAttendanceReport();
      if (data?.report) {
        setReport(data.report);
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    fetchReport();
    const interval = setInterval(fetchReport, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="attendance-report">
      <div className="report-header">
        <h2>
          <span role="img" aria-label="report">📊</span> 
          Attendance Report
        </h2>
        {lastUpdated && (
          <p className="update-time">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {loading ? (
        <p>Loading report...</p>
      ) : error ? (
        <p className="error-message">Error: {error}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Attendance Count</th>
              <th>Last Attendance</th>
            </tr>
          </thead>
          <tbody>
            {report.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.attendance_count}</td>
                <td>
                  {item.last_attendance_date || 
                  new Date().toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AttendanceReport;
