import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSchedule } from '../context/ScheduleContext';
import { 
  ArrowLeftIcon,
  CalendarIcon,
  TableCellsIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import CalendarView from '../components/CalendarView';
import toast from 'react-hot-toast';

const API_HOST = process.env.REACT_APP_API_HOST || "http://localhost:8080";

const ScheduleViewerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { savedSchedules, deleteSchedule, currentSchedule } = useSchedule();
  const [viewMode, setViewMode] = useState('calendar');
  const [schedule, setSchedule] = useState(null);
  const [crnColors, setCrnColors] = useState({});

  useEffect(() => {
    // Find schedule by ID
    const foundSchedule = savedSchedules.find(s => s.id === id) || currentSchedule;
    if (foundSchedule) {
      setSchedule(foundSchedule);
      generateColors(foundSchedule);
    } else {
      toast.error('Schedule not found');
      navigate('/scheduler');
    }
  }, [id, savedSchedules, currentSchedule, navigate]);

  const generateColors = (scheduleData) => {
    if (!scheduleData || !scheduleData.classes) return;

    const colors = [
      "#FECACA", "#BFDBFE", "#BBF7D0", "#FEF08A", "#E9D5FF",
      "#FBCFE8", "#C7D2FE", "#99F6E4", "#FED7AA", "#A5F3FC",
      "#D9F99D", "#FDE68A", "#A7F3D0", "#DDD6FE", "#F5D0FE"
    ];

    const crnColorMap = {};
    scheduleData.classes.forEach((cls, index) => {
      if (!crnColorMap[cls.crn]) {
        crnColorMap[cls.crn] = colors[index % colors.length];
      }
    });

    setCrnColors(crnColorMap);
  };

  const handleDownload = async () => {
    try {
      toast.loading('Preparing download...', { id: 'download' });

      if (!schedule || !schedule.classes || schedule.classes.length === 0) {
        toast.error('No schedule data to download', { id: 'download' });
        return;
      }

      // Convert color hex values to RGB format for matplotlib
      const colorMapping = {};
      Object.keys(crnColors).forEach((crn) => {
        const hex = crnColors[crn].replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        colorMapping[crn] = [r, g, b];
      });

      const response = await fetch(`${API_HOST}/api/downloadSchedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schedule,
          crnColors: colorMapping,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to download schedule');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `schedule-${schedule.semester || 'fallback'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Download started!', { id: 'download' });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download schedule', { id: 'download' });
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      deleteSchedule(id);
      toast.success('Schedule deleted');
      navigate('/scheduler');
    }
  };

  if (!schedule) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#861F41] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <button
                onClick={() => navigate('/scheduler')}
                className="mr-4 p-2 text-gray-600 dark:text-gray-400 hover:text-[#861F41] dark:hover:text-[#E5751F] hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Your Schedule
                </h1>
                {schedule.semester && (
                  <p className="text-gray-600 dark:text-gray-400">
                    {schedule.semester}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-4 py-2 bg-[#861F41] hover:bg-[#6B1934] text-white font-medium rounded-lg transition-colors"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Download PDF
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-8">
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-[#861F41] text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendar View
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#861F41] text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <TableCellsIcon className="h-4 w-4 mr-2" />
              Table View
            </button>
          </div>
        </div>

        {/* Schedule Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {viewMode === 'calendar' ? (
            <CalendarView schedule={schedule} setCrnColors={setCrnColors} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th className="border border-gray-300 dark:border-gray-600 p-3 text-left font-semibold text-gray-900 dark:text-white">
                      Course
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 p-3 text-left font-semibold text-gray-900 dark:text-white">
                      Course Name
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 p-3 text-left font-semibold text-gray-900 dark:text-white">
                      CRN
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 p-3 text-left font-semibold text-gray-900 dark:text-white">
                      Instructor
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 p-3 text-left font-semibold text-gray-900 dark:text-white">
                      Schedule
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 p-3 text-left font-semibold text-gray-900 dark:text-white">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.classes && schedule.classes.length > 0 ? (
                    schedule.classes.map((cls, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="border border-gray-300 dark:border-gray-600 p-3">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {cls.courseNumber}
                          </div>
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 p-3">
                          <div className="text-gray-700 dark:text-gray-300">
                            {cls.courseName}
                          </div>
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 p-3">
                          <div className="text-gray-600 dark:text-gray-400">
                            {cls.crn}
                          </div>
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 p-3">
                          <div className="flex items-center text-gray-700 dark:text-gray-300">
                            <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                            {cls.professorName}
                          </div>
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 p-3">
                          <div className="flex items-center text-gray-700 dark:text-gray-300">
                            <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                            {cls.time} on {cls.days}
                          </div>
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 p-3">
                          <div className="flex items-center text-gray-700 dark:text-gray-300">
                            <MapPinIcon className="h-4 w-4 mr-2 text-gray-500" />
                            {cls.location}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center p-8 text-gray-500 dark:text-gray-400">
                        No classes scheduled.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Online Courses Section */}
          {schedule.classes && schedule.classes.some(cls => 
            cls.location.toLowerCase().includes("online")
          ) && (
            <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
                Online Courses
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {schedule.classes
                  .filter(cls => cls.location.toLowerCase().includes("online"))
                  .filter((cls, index, self) => 
                    index === self.findIndex(c => c.crn === cls.crn)
                  )
                  .map((cls, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-blue-100 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                          {cls.courseNumber}
                        </h4>
                        <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full">
                          Online
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div><span className="font-medium">Instructor:</span> {cls.professorName}</div>
                        <div><span className="font-medium">Schedule:</span> {cls.time} on {cls.days}</div>
                        <div><span className="font-medium">CRN:</span> {cls.crn}</div>
                        <div><span className="font-medium">Platform:</span> {cls.location}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleViewerPage;
