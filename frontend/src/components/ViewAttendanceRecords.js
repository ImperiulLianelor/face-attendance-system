import React, { useEffect, useState } from "react";
import { getAttendanceReport } from "../services/api";

const ViewAttendanceRecords = () => {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getAttendanceReport();
        setRecords(response.report || []);
      } catch (error) {
        alert("Error fetching attendance records.");
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <h2>Attendance Records</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Total Attendances</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <tr key={index}>
              <td>{record.name}</td>
              <td>{record.attendance_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ViewAttendanceRecords;
