import React, { useState, useRef, useEffect } from "react";
import SchedulerForm from "./components/SchedulerForm";
import ScheduleViewer from "./components/ScheduleViewer";

function App() {
  const [schedule, setSchedule] = useState(null);
  const scheduleRef = useRef(null);

  // Auto-scroll to calendar when a schedule is generated.
  useEffect(() => {
    if (schedule) {
      scheduleRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [schedule]);

  const handleScheduleGenerated = (data) => {
    setSchedule(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#861F41] sm:text-4xl">
            VT Hokie Scheduler
          </h1>
          <p className="mt-2 text-lg text-[#75787B]">
            Create your perfect class schedule with ease
          </p>
        </header>

        <main className="space-y-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-[#E5751F]">
            <SchedulerForm onScheduleGenerated={handleScheduleGenerated} />
          </div>

          {schedule && (
            <div
              ref={scheduleRef}
              className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-[#E5751F]"
            >
              <ScheduleViewer schedule={schedule} />
            </div>
          )}
        </main>

        <footer className="mt-12 text-center text-sm text-[#75787B]">
          <p>
            © {new Date().getFullYear()} Virginia Tech Hokie Scheduler. All
            rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
