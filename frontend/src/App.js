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
        </header>
        <SchedulerForm onScheduleGenerated={handleScheduleGenerated} />
        {schedule && (
          <div ref={scheduleRef}>
            <ScheduleViewer schedule={schedule} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
