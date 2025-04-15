import React, { useState } from "react";

const CalendarView = ({ schedule, setCrnColors }) => {
  const [selectedClass, setSelectedClass] = useState(null);
  const [hoveredClass, setHoveredClass] = useState(null);

  // Generate time slots from 7 AM to 8 PM
  const timeSlots = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 7;
    return `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? "PM" : "AM"}`;
  });

  // Days of the week (only weekdays)
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  // Generate 15 distinct colors for classes
  const colors = [
    "bg-red-200",
    "bg-blue-200",
    "bg-green-200",
    "bg-yellow-200",
    "bg-purple-200",
    "bg-pink-200",
    "bg-indigo-200",
    "bg-teal-200",
    "bg-orange-200",
    "bg-cyan-200",
    "bg-lime-200",
    "bg-amber-200",
    "bg-emerald-200",
    "bg-violet-200",
    "bg-fuchsia-200",
  ];

  // Map Tailwind colors to their hex codes
  const colorToHex = {
    "bg-red-200": "#FECACA",
    "bg-blue-200": "#BFDBFE",
    "bg-green-200": "#BBF7D0",
    "bg-yellow-200": "#FEF08A",
    "bg-purple-200": "#E9D5FF",
    "bg-pink-200": "#FBCFE8",
    "bg-indigo-200": "#C7D2FE",
    "bg-teal-200": "#99F6E4",
    "bg-orange-200": "#FED7AA",
    "bg-cyan-200": "#A5F3FC",
    "bg-lime-200": "#D9F99D",
    "bg-amber-200": "#FDE68A",
    "bg-emerald-200": "#A7F3D0",
    "bg-violet-200": "#DDD6FE",
    "bg-fuchsia-200": "#F5D0FE",
  };

  // Create a mapping of CRNs to colors
  const crnToColor = {};
  if (schedule && schedule.classes) {
    schedule.classes.forEach((cls, index) => {
      if (!crnToColor[cls.crn]) {
        crnToColor[cls.crn] = colors[index % colors.length];
      }
    });
  }

  // Helper function to convert time string to grid position
  const getTimePosition = (timeStr) => {
    try {
      // Handle time format like "12:20PM"
      const timePart = timeStr.replace(/([AP]M)$/, " $1"); // Add space before AM/PM
      const [time, period] = timePart.split(" ");
      const [hours, minutes] = time.split(":").map(Number);

      // Convert to 24-hour format
      let hour = hours;
      if (period === "PM" && hours !== 12) {
        hour = hours + 12;
      } else if (period === "AM" && hours === 12) {
        hour = 0;
      }

      // Calculate position (each hour has 4 slots for 15-minute intervals)
      // Subtract 7 because we start at 7 AM
      return (hour - 7) * 4 + Math.floor(minutes / 15);
    } catch (error) {
      console.error("Error parsing time:", timeStr, error);
      return 0;
    }
  };

  // Helper function to get duration in grid units
  const getDuration = (startTime, endTime) => {
    const startPos = getTimePosition(startTime);
    const endPos = getTimePosition(endTime);
    return Math.max(1, endPos - startPos);
  };

  // Group classes by CRN and time
  const groupedClasses = {};
  if (schedule && schedule.classes) {
    schedule.classes.forEach((cls) => {
      const key = `${cls.crn}-${cls.time}`;
      if (!groupedClasses[key]) {
        groupedClasses[key] = {
          ...cls,
          days: new Set(cls.days.split("")),
        };
      } else {
        // Add days to the existing set
        cls.days.split("").forEach((day) => groupedClasses[key].days.add(day));
      }
    });
  }

  // Create a grid of events
  const events = [];
  Object.values(groupedClasses).forEach((cls) => {
    try {
      const [startTime, endTime] = cls.time.split(" - ");
      const classDays = Array.from(cls.days)
        .map((day) => {
          switch (day) {
            case "M":
              return 0; // Monday
            case "T":
              return 1; // Tuesday
            case "W":
              return 2; // Wednesday
            case "R":
              return 3; // Thursday
            case "F":
              return 4; // Friday
            default:
              return null;
          }
        })
        .filter((day) => day !== null); // Only include weekdays

      classDays.forEach((day) => {
        const startPos = getTimePosition(startTime);
        const duration = getDuration(startTime, endTime);

        // Only add events that fall within our time range (7 AM - 8 PM)
        if (startPos >= 0 && startPos + duration <= 14 * 4) {
          events.push({
            ...cls,
            day,
            startPos,
            duration,
            color: crnToColor[cls.crn],
            allDays: Array.from(cls.days).join(""),
          });
        }
      });
    } catch (error) {
      console.error("Error processing class:", cls, error);
    }
  });

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header with days */}
        <div className="grid grid-cols-5 border-b ml-20">
          {days.map((day, index) => (
            <div key={index} className="p-2 font-bold text-center border-r">
              {day}
            </div>
          ))}
        </div>

        {/* Time slots and events */}
        <div className="relative">
          {/* Time labels */}
          <div className="absolute left-0 w-20">
            {timeSlots.map((time, index) => (
              <div key={index} className="h-12 border-b text-sm p-1">
                {time}
              </div>
            ))}
          </div>

          {/* Grid and events */}
          <div className="ml-20 grid grid-cols-5 relative">
            {/* Grid cells */}
            {Array.from({ length: 14 * 4 }).map((_, rowIndex) =>
              Array.from({ length: 5 }).map((_, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`h-3 border-b border-r`}
                />
              ))
            )}

            {/* Events */}
            {events.map((event, index) => (
              <div
                key={index}
                className={`absolute ${event.color} p-1 text-[8px] rounded border border-gray-300 overflow-hidden hover:z-50 cursor-pointer`}
                style={{
                  left: `${event.day * 20}%`,
                  top: `${event.startPos * 12}px`,
                  width: "20%",
                  height: `${event.duration * 12}px`,
                }}
                onMouseEnter={() => setHoveredClass(event)}
                onMouseLeave={() => setHoveredClass(null)}
              >
                <div className="font-bold truncate">{event.courseNumber}</div>
                <div className="truncate">{event.location}</div>
              </div>
            ))}

            {/* Side Modal for Class Details */}
            {hoveredClass && (
              <div
                className="absolute bg-white shadow-xl rounded-lg p-2 z-50 max-w-xs border-l-2"
                style={{
                  top: `${hoveredClass.startPos * 12}px`,
                  left:
                    hoveredClass.day === 4
                      ? `calc(${hoveredClass.day * 20}% - 5px)`
                      : `calc(${hoveredClass.day * 20}% + 20% + 5px)`,
                  transform:
                    hoveredClass.day === 4 ? "translateX(-100%)" : "none",
                  borderLeftColor: colorToHex[hoveredClass.color],
                  borderColor: colorToHex[hoveredClass.color],
                }}
              >
                <div className="flex items-center mb-1">
                  <div
                    className={`w-2 h-2 rounded-full ${hoveredClass.color} mr-1`}
                  ></div>
                  <h2 className={`text-xs font-bold`}>
                    {hoveredClass.courseNumber}
                  </h2>
                </div>
                <div className="space-y-1 text-[10px]">
                  <div className="flex items-start">
                    <span className="font-semibold w-12">Course:</span>
                    <span className="flex-1">{hoveredClass.courseName}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-semibold w-12">CRN:</span>
                    <span className="flex-1">{hoveredClass.crn}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-semibold w-12">Time:</span>
                    <span className="flex-1">{hoveredClass.time}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-semibold w-12">Days:</span>
                    <span className="flex-1">{hoveredClass.allDays}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-semibold w-12">Loc:</span>
                    <span className="flex-1">{hoveredClass.location}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-semibold w-12">Prof:</span>
                    <span className="flex-1">{hoveredClass.professorName}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
