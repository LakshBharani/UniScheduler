import React, { useState, useRef, useEffect } from 'react';
import SchedulerForm from './components/SchedulerForm';
import ScheduleViewer from './components/ScheduleViewer';

function App() {
  const [schedule, setSchedule] = useState(null);
  const scheduleRef = useRef(null);

  // Auto-scroll to calendar when a schedule is generated.
  useEffect(() => {
    if (schedule) {
      scheduleRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [schedule]);

  const handleScheduleGenerated = (data) => {
    setSchedule(data);
  };

  return (
    <div className="container">
      <h1 className="heading">Class Scheduler</h1>
      <SchedulerForm onScheduleGenerated={handleScheduleGenerated} />
      {schedule && (
        <div ref={scheduleRef}>
          <ScheduleViewer schedule={schedule} />
        </div>
      )}
    </div>
  );
}

export default App;
