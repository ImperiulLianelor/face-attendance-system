import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
    const [report, setReport] = useState([]);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const response = await axios.get('http://localhost:5000/attendance_report');
                setReport(response.data.report);
            } catch (error) {
                console.error('Error fetching attendance report:', error);
            }
        };

        fetchReport();
    }, []);

    return (
        <div>
            <h2>Attendance Report</h2>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {report.map((entry) => (
                        <tr key={entry.date}>
                            <td>{entry.name}</td>
                            <td>{entry.date}</td>
                            <td>{entry.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Dashboard;

