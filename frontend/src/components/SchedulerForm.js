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
      if (response.data === "NO_VALID_SCHEDULE_FOUND") {
        setError(
          "No valid schedule found. Please try different courses or preferences."
        );
        onScheduleGenerated(null);
      } else {
        onScheduleGenerated(response.data);
      }
    } catch (err) {
      setError("Failed to generate schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-5"
    >
      <h2 className="text-xl font-semibold mb-6 text-center text-[#861F41] dark:text-[#E5751F]">
        Enter Courses
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((course, index) => (
          <div
            key={index}
            className="flex flex-wrap items-end gap-3 mb-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg"
          >
            <div className="flex-1 min-w-[120px]">
              <label className="block text-sm font-medium text-[#75787B] dark:text-gray-400 mb-1">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={course.department}
                onChange={(e) => handleCourseChange(index, e)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#E5751F] focus:border-[#E5751F] dark:bg-gray-800 dark:text-white"
                required
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-sm font-medium text-[#75787B] dark:text-gray-400 mb-1">
                Course Number
              </label>
              <input
                type="text"
                name="number"
                value={course.number}
                onChange={(e) => handleCourseChange(index, e)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#E5751F] focus:border-[#E5751F] dark:bg-gray-800 dark:text-white"
                required
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-sm font-medium text-[#75787B] dark:text-gray-400 mb-1">
                Professor (Optional)
              </label>
              <input
                type="text"
                name="professor"
                value={course.professor}
                onChange={(e) => handleCourseChange(index, e)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#E5751F] focus:border-[#E5751F] dark:bg-gray-800 dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={() => deleteCourse(index)}
              className="w-8 h-8 bg-[#861F41] hover:bg-[#6B1934] flex items-center justify-center rounded-md transition-colors"
              title="Delete Course"
            >
              <TrashIcon className="h-4 w-4 text-white" />
            </button>
          </div>
        ))}
      </div>
      <div className="mb-4 mt-4">
        <button
          type="button"
          onClick={addCourse}
          className="text-sm bg-[#E5751F] hover:bg-[#D46A1C] text-white px-3 py-1.5 rounded-md transition-colors"
        >
          Add Another Course
        </button>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-[#75787B] dark:text-gray-400 mb-1">
          Schedule Preferences
        </label>
        <textarea
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#E5751F] focus:border-[#E5751F] dark:bg-gray-800 dark:text-white resize-y"
          rows="2"
          placeholder="e.g., No 8 AMs, prefer M/W classes"
        />
      </div>
      {error && (
        <p className="text-red-500 dark:text-red-400 text-xs mb-2">{error}</p>
      )}
      <div>
        <button
          type="submit"
          disabled={loading}
          className="text-sm bg-[#861F41] hover:bg-[#6B1934] text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
        >
          {loading ? "Generating..." : "Create Schedule"}
        </button>
      </div>
    </form>
  );
}

export default SchedulerForm;
