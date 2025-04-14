import React, { useState } from "react";
import axios from "axios";
import CalendarView from "./CalendarView";

function ScheduleViewer({ schedule }) {
  const [email, setEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'calendar'

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
        schedule,
      });
      setEmailMessage("Schedule emailed successfully!");
    } catch (err) {
      setEmailMessage("Failed to email schedule.");
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="mt-5 bg-white p-5 border border-gray-300 rounded-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl text-center">Your Schedule</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode("table")}
            className={`px-4 py-2 rounded ${
              viewMode === "table"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Table View
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-4 py-2 rounded ${
              viewMode === "calendar"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Calendar View
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <div className="overflow-x-auto mb-5">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2 text-left bg-gray-100">
                  CRN
                </th>
                <th className="border border-gray-300 p-2 text-left bg-gray-100">
                  Course
                </th>
                <th className="border border-gray-300 p-2 text-left bg-gray-100">
                  Course Name
                </th>
                <th className="border border-gray-300 p-2 text-left bg-gray-100">
                  Instructor
                </th>
                <th className="border border-gray-300 p-2 text-left bg-gray-100">
                  Time &amp; Days
                </th>
                <th className="border border-gray-300 p-2 text-left bg-gray-100">
                  Location
                </th>
              </tr>
            </thead>
            <tbody>
              {schedule.classes && schedule.classes.length > 0 ? (
                schedule.classes.map((cls, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2">{cls.crn}</td>
                    <td className="border border-gray-300 p-2">
                      {cls.courseNumber}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {cls.courseName}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {cls.professorName}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {cls.time} on {cls.days}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {cls.location}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center p-2.5">
                    No classes scheduled.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="mb-5">
            <CalendarView schedule={schedule} />
          </div>

          {/* Online Courses Section */}
          {schedule.classes &&
            schedule.classes.some((cls) =>
              cls.location.toLowerCase().includes("online")
            ) && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-base font-medium text-blue-800 mb-2">
                  Other Courses
                </h3>
                <div className="space-y-2">
                  {schedule.classes
                    .filter((cls) =>
                      cls.location.toLowerCase().includes("online")
                    )
                    .filter(
                      (cls, index, self) =>
                        index === self.findIndex((c) => c.crn === cls.crn)
                    )
                    .map((cls, index) => (
                      <div
                        key={index}
                        className="bg-white p-2 rounded shadow-sm border border-blue-100"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-blue-900">
                            {cls.courseNumber}
                          </h4>
                          <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">
                            Online
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">Instructor:</span>{" "}
                            {cls.professorName}
                          </div>
                          <div>
                            <span className="font-medium">Schedule:</span>{" "}
                            {cls.time} on {cls.days}
                          </div>
                          <div>
                            <span className="font-medium">CRN:</span> {cls.crn}
                          </div>
                          <div>
                            <span className="font-medium">Platform:</span>{" "}
                            {cls.location}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
        </>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-[#861F41] mb-3">
          Email Your Schedule
        </h3>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1 w-full">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#E5751F] focus:border-[#E5751F]"
              title="Please enter a valid email address"
            />
          </div>
          <button
            onClick={handleEmailSchedule}
            disabled={emailLoading}
            className="w-full sm:w-auto px-4 py-2 bg-[#861F41] hover:bg-[#6B1934] text-white rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {emailLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending...
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Email Schedule
              </>
            )}
          </button>
        </div>
        {emailMessage && (
          <p
            className={`mt-2 text-sm ${
              emailMessage.includes("successfully")
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {emailMessage}
          </p>
        )}
      </div>
    </div>
  );
}

export default ScheduleViewer;
