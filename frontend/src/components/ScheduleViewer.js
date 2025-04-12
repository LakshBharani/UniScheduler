import React, { useState } from 'react';
import axios from 'axios';
import styles from './ScheduleViewer.module.css';

function ScheduleViewer({ schedule }) {
  const [email, setEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const handleEmailSchedule = async () => {
    if (!email) {
      setEmailMessage("Email is required.");
      return;
    }
    setEmailMessage("");
    try {
      setEmailLoading(true);
      await axios.post("http://localhost:8080/api/email_schedule", {
        email,
        schedule
      });
      setEmailMessage("Schedule emailed successfully!");
    } catch (err) {
      setEmailMessage("Failed to email schedule.");
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className={styles.scheduleContainer}>
      <h2 className={styles.heading}>Your Schedule</h2>
      <div className={styles.tableWrapper}>
        <table className={styles.scheduleTable}>
          <thead>
            <tr>
              <th>CRN</th>
              <th>Course</th>
              <th>Course Name</th>
              <th>Instructor</th>
              <th>Time &amp; Days</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {schedule.classes && schedule.classes.length > 0 ? (
              schedule.classes.map((cls, index) => (
                <tr key={index}>
                  <td>{cls.crn}</td>
                  <td>{cls.courseNumber}</td>
                  <td>{cls.courseName}</td>
                  <td>{cls.professorName}</td>
                  <td>
                    {cls.time} on {cls.days}
                  </td>
                  <td>{cls.location}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '10px' }}>
                  No classes scheduled.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className={styles.emailContainer}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="student@vt.edu"
          className={styles.emailInput}
        />
        <button
          onClick={handleEmailSchedule}
          disabled={emailLoading}
          className={styles.emailButton}
        >
          {emailLoading ? "Sending..." : "Email My Schedule"}
        </button>
      </div>
      {emailMessage && <p className={styles.emailMessage}>{emailMessage}</p>}
    </div>
  );
}

export default ScheduleViewer;
