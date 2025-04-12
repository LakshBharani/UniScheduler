import React, { useState } from 'react';
import axios from 'axios';
import styles from './SchedulerForm.module.css';

function SchedulerForm({ onScheduleGenerated }) {
  const [courses, setCourses] = useState([{ department: "", number: "", professor: "" }]);
  const [preferences, setPreferences] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCourseChange = (index, e) => {
    const { name, value } = e.target;
    const newCourses = [...courses];
    newCourses[index][name] = value;
    setCourses(newCourses);
  };

  const addCourse = () => {
    setCourses([...courses, { department: "", number: "", professor: "" }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate: Ensure department and course number fields are filled.
    for (let course of courses) {
      if (!course.department || !course.number) {
        setError("Department and Course Number are required for each course.");
        return;
      }
    }

    setError("");
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8080/api/generate_schedule", {
        courses,
        preferences
      });
      onScheduleGenerated(response.data);
    } catch (err) {
      setError("Failed to generate schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      <h2 className={styles.formTitle}>Enter Courses</h2>
      {courses.map((course, index) => (
        <div key={index} className={styles.inputRow}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Department</label>
            <input
              type="text"
              name="department"
              value={course.department}
              onChange={(e) => handleCourseChange(index, e)}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Course Number</label>
            <input
              type="text"
              name="number"
              value={course.number}
              onChange={(e) => handleCourseChange(index, e)}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Professor Name (Optional)</label>
            <input
              type="text"
              name="professor"
              value={course.professor}
              onChange={(e) => handleCourseChange(index, e)}
              className={styles.input}
            />
          </div>
        </div>
      ))}
      <div className={styles.inputRow}>
        <button type="button" onClick={addCourse} className={styles.button}>
          Add Another Course
        </button>
      </div>
      <div className={styles.inputRow}>
        <label className={styles.label}>Schedule Preferences</label>
        <textarea
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          className={styles.textarea}
          rows="3"
          placeholder="e.g., No 8 AMs, prefer M/W classes"
        />
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.inputRow}>
        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? "Generating..." : "Create Schedule"}
        </button>
      </div>
    </form>
  );
}

export default SchedulerForm;
