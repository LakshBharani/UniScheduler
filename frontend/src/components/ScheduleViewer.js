import React, { useState } from "react";
import axios from "axios";

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
      <h2 className="text-2xl mb-4 text-center">Your Schedule</h2>
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
                  <td className="border border-gray-300 p-2">{cls.location}</td>
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
      <div className="flex items-center flex-wrap">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="student@vt.edu"
          className="flex-1 p-2 border border-gray-300 rounded-md box-border"
        />
        <button
          onClick={handleEmailSchedule}
          disabled={emailLoading}
          className="ml-2.5 mt-2.5 bg-purple-600 text-white py-2.5 px-4 rounded-md cursor-pointer hover:bg-purple-700 disabled:opacity-50"
        >
          {emailLoading ? "Sending..." : "Email My Schedule"}
        </button>
      </div>
      {emailMessage && <p className="text-sm mt-2.5">{emailMessage}</p>}
    </div>
  );
}

export default ScheduleViewer;
