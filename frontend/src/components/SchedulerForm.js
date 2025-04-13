import React, { useState } from "react";
import axios from "axios";
import { TrashIcon } from "@heroicons/react/24/solid";


function SchedulerForm({ onScheduleGenerated }) {
  const [courses, setCourses] = useState([
    { department: "", number: "", professor: "" },
  ]);
  const [preferences, setPreferences] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCourseChange = (index, e) => {
    const { name, value } = e.target;
    const newCourses = [...courses];
    newCourses[index][name] = value;
    setCourses(newCourses);
  };

  const deleteCourse = (index) => {
    const newCourses = courses.filter((_, i) => i !== index);
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
      const response = await axios.post(
        "http://localhost:8080/api/generate_schedule",
        {
          courses,
          preferences,
        }
      );
      onScheduleGenerated(response.data);
    } catch (err) {
      setError("Failed to generate schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-lg p-5 mb-5"
    >
      <h2 className="text-2xl font-bold mb-4 text-center">Enter Courses</h2>
      {courses.map((course, index) => (
        <div key={index} className="flex flex-wrap mb-4">
          <div className="flex-1 min-w-[150px] mr-4 mb-2">
            <label className="block font-bold mb-1">Department</label>
            <input
              type="text"
              name="department"
              value={course.department}
              onChange={(e) => handleCourseChange(index, e)}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
          <div className="flex-1 min-w-[150px] mr-4 mb-2">
            <label className="block font-bold mb-1">Course Number</label>
            <input
              type="text"
              name="number"
              value={course.number}
              onChange={(e) => handleCourseChange(index, e)}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
          <div className="flex-1 min-w-[150px] mr-4 mb-2">
            <label className="block font-bold mb-1">
              Professor Name (Optional)
            </label>
            <input
              type="text"
              name="professor"
              value={course.professor}
              onChange={(e) => handleCourseChange(index, e)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <button
            type="button"
            onClick={() => deleteCourse(index)}
            className="w-[42px] h-[42px] bg-red-500 hover:bg-red-600 flex items-center justify-center rounded mt-[27px]" // mt aligns with label height
            title="Delete Course"
          >
            <TrashIcon className="h-5 w-5 text-white" />
          </button>
        </div>
      ))}
      <div className="mb-4">
        <button
          type="button"
          onClick={addCourse}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Another Course
        </button>
      </div>
      <div className="mb-4">
        <label className="block font-bold mb-1">Schedule Preferences</label>
        <textarea
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded resize-y"
          rows="3"
          placeholder="e.g., No 8 AMs, prefer M/W classes"
        />
      </div>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Generating..." : "Create Schedule"}
        </button>
      </div>
    </form>
  );
}

export default SchedulerForm;
