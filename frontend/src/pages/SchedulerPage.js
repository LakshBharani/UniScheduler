import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSchedule } from "../context/ScheduleContext";
import toast from "react-hot-toast";
import {
  PlusIcon,
  TrashIcon,
  AcademicCapIcon,
  ClockIcon,
  UserIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

const API_HOST = process.env.REACT_APP_API_HOST || "http://localhost:8080";

const SchedulerPage = () => {
  const navigate = useNavigate();
  const {
    setLoading,
    setError,
    setCurrentSchedule,
    saveSchedule,
    preferences,
    setPreferences,
  } = useSchedule();

  const [courses, setCourses] = useState([
    { department: "", number: "", professor: "" },
  ]);
  const [semesterOptions, setSemesterOptions] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");

  useEffect(() => {
    generateSemesterOptions();
  }, []);

  const generateSemesterOptions = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    let currentSemester;
    if (currentMonth >= 0 && currentMonth <= 4) {
      currentSemester = "Spring";
    } else if (currentMonth >= 5 && currentMonth <= 7) {
      currentSemester = "Summer";
    } else {
      currentSemester = "Fall";
    }

    const options = [];
    let year = currentYear;
    let semester = currentSemester;

    for (let i = 0; i < 3; i++) {
      let termYearCode;
      if (semester === "Spring") {
        termYearCode = `${year}01`;
      } else if (semester === "Summer") {
        termYearCode = `${year}06`;
      } else {
        termYearCode = `${year}09`;
      }

      options.push({
        display: `${semester} ${year}`,
        termYear: termYearCode,
      });

      if (semester === "Spring") {
        semester = "Summer";
      } else if (semester === "Summer") {
        semester = "Fall";
      } else {
        semester = "Spring";
        year++;
      }
    }

    setSemesterOptions(options);
    setSelectedSemester(options[0].termYear);
  };

  const handleCourseChange = (index, field, value) => {
    const newCourses = [...courses];
    newCourses[index][field] = value;
    setCourses(newCourses);
  };

  const addCourse = () => {
    setCourses([...courses, { department: "", number: "", professor: "" }]);
  };

  const removeCourse = (index) => {
    if (courses.length > 1) {
      setCourses(courses.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    for (let course of courses) {
      if (!course.department || !course.number) {
        toast.error(
          "Department and Course Number are required for each course."
        );
        return;
      }
    }

    if (!selectedSemester) {
      toast.error("Please select a semester.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      toast.loading("Generating your Virginia Tech schedule...", {
        id: "schedule",
      });

      const response = await fetch(`${API_HOST}/api/generate_schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courses,
          preferences: preferences.schedulePreferences,
          term_year: selectedSemester,
          email: preferences.email || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate schedule");
      }

      if (data === "NO_VALID_SCHEDULE_FOUND") {
        toast.error(
          "No valid Virginia Tech schedule found. Please try different courses or preferences.",
          { id: "schedule" }
        );
        setError(
          "No valid Virginia Tech schedule found. Please try different courses or preferences."
        );
        return;
      }

      toast.success("Virginia Tech schedule generated successfully!", {
        id: "schedule",
      });

      // Save schedule and navigate to viewer
      const scheduleWithId = {
        ...data,
        courses,
        preferences: preferences.schedulePreferences,
        semester: semesterOptions.find(
          (opt) => opt.termYear === selectedSemester
        )?.display,
        email: preferences.email,
      };

      saveSchedule(scheduleWithId);
      setCurrentSchedule(scheduleWithId);
      navigate(`/schedule/${scheduleWithId.id}`);
    } catch (error) {
      console.error("Error generating schedule:", error);
      toast.error(
        error.message ||
          "Failed to generate Virginia Tech schedule. Please try again.",
        { id: "schedule" }
      );
      setError(
        error.message ||
          "Failed to generate Virginia Tech schedule. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="p-4 bg-[#861F41] dark:bg-[#E5751F] rounded-2xl shadow-lg">
              <AcademicCapIcon className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Create Your Virginia Tech Schedule
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Enter your Virginia Tech courses and preferences to generate an
            optimal, conflict-free schedule.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Semester Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="p-2 bg-[#861F41] dark:bg-[#E5751F] rounded-lg mr-3">
                <ClockIcon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                Virginia Tech Semester Selection
              </h2>
            </div>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#861F41] dark:focus:ring-[#E5751F] focus:border-[#861F41] dark:focus:border-[#E5751F] dark:bg-gray-700 dark:text-white transition-colors duration-200 text-base"
            >
              {semesterOptions.map((option) => (
                <option key={option.termYear} value={option.termYear}>
                  {option.display}
                </option>
              ))}
            </select>
          </div>

          {/* Courses Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div className="flex items-center">
                <div className="p-2 bg-[#861F41] dark:bg-[#E5751F] rounded-lg mr-3">
                  <AcademicCapIcon className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Virginia Tech Courses
                </h2>
              </div>
              <button
                type="button"
                onClick={addCourse}
                className="inline-flex items-center px-4 py-2 bg-[#861F41] hover:bg-[#6B1934] text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add VT Course
              </button>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {courses.map((course, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 sm:p-6 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={course.department}
                      onChange={(e) =>
                        handleCourseChange(index, "department", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#861F41] dark:focus:ring-[#E5751F] focus:border-[#861F41] dark:focus:border-[#E5751F] dark:bg-gray-600 dark:text-white transition-colors duration-200 text-sm"
                      placeholder="e.g., CS"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Course Number
                    </label>
                    <input
                      type="text"
                      value={course.number}
                      onChange={(e) =>
                        handleCourseChange(index, "number", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#861F41] dark:focus:ring-[#E5751F] focus:border-[#861F41] dark:focus:border-[#E5751F] dark:bg-gray-600 dark:text-white transition-colors duration-200 text-sm"
                      placeholder="e.g., 1114"
                      required
                    />
                  </div>
                  <div className="flex items-end space-x-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        VT Professor (Optional)
                      </label>
                      <input
                        type="text"
                        value={course.professor}
                        onChange={(e) =>
                          handleCourseChange(index, "professor", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#861F41] dark:focus:ring-[#E5751F] focus:border-[#861F41] dark:focus:border-[#E5751F] dark:bg-gray-600 dark:text-white transition-colors duration-200 text-sm"
                        placeholder="e.g., Dr. Smith"
                      />
                    </div>
                    {courses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCourse(index)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="p-2 bg-[#861F41] dark:bg-[#E5751F] rounded-lg mr-3">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                Virginia Tech Schedule Preferences
              </h2>
            </div>
            <textarea
              value={preferences.schedulePreferences}
              onChange={(e) =>
                setPreferences({ schedulePreferences: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#861F41] dark:focus:ring-[#E5751F] focus:border-[#861F41] dark:focus:border-[#E5751F] dark:bg-gray-700 dark:text-white transition-colors duration-200 resize-y text-sm"
              rows="4"
              placeholder="e.g., No classes before 10 AM, prefer afternoon classes on T/Th, need a lunch break between 12-1 PM, want classes close together on Virginia Tech campus"
            />
          </div>

          {/* Email Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="p-2 bg-[#861F41] dark:bg-[#E5751F] rounded-lg mr-3">
                <EnvelopeIcon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                Email (Optional)
              </h2>
            </div>
            <input
              type="email"
              value={preferences.email}
              onChange={(e) => setPreferences({ email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#861F41] dark:focus:ring-[#E5751F] focus:border-[#861F41] dark:focus:border-[#E5751F] dark:bg-gray-700 dark:text-white transition-colors duration-200 text-sm"
              placeholder="Enter your Virginia Tech email (optional)"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              We'll use this to send you updates about your Virginia Tech
              schedule generation.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={false}
              className="inline-flex items-center px-8 py-4 bg-[#861F41] hover:bg-[#6B1934] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Generate Virginia Tech Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchedulerPage;
