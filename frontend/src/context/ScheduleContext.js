import React, { createContext, useContext, useReducer, useEffect } from 'react';

const ScheduleContext = createContext();

const initialState = {
  currentSchedule: null,
  savedSchedules: [],
  isLoading: false,
  error: null,
  preferences: {
    semester: '',
    email: '',
    schedulePreferences: ''
  }
};

const scheduleReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_CURRENT_SCHEDULE':
      return { ...state, currentSchedule: action.payload, error: null };
    case 'SAVE_SCHEDULE':
      const newSchedule = {
        ...action.payload,
        id: Date.now().toString(),
        savedAt: new Date().toISOString()
      };
      return {
        ...state,
        savedSchedules: [...state.savedSchedules, newSchedule],
        currentSchedule: newSchedule
      };
    case 'DELETE_SCHEDULE':
      return {
        ...state,
        savedSchedules: state.savedSchedules.filter(s => s.id !== action.payload),
        currentSchedule: state.currentSchedule?.id === action.payload ? null : state.currentSchedule
      };
    case 'SET_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload }
      };
    case 'CLEAR_CURRENT_SCHEDULE':
      return { ...state, currentSchedule: null };
    default:
      return state;
  }
};

export const ScheduleProvider = ({ children }) => {
  const [state, dispatch] = useReducer(scheduleReducer, initialState);

  // Load saved schedules from localStorage on mount
  useEffect(() => {
    const savedSchedules = localStorage.getItem('savedSchedules');
    if (savedSchedules) {
      try {
        const parsed = JSON.parse(savedSchedules);
        parsed.forEach(schedule => {
          dispatch({ type: 'SAVE_SCHEDULE', payload: schedule });
        });
      } catch (error) {
        console.error('Error loading saved schedules:', error);
      }
    }
  }, []);

  // Save schedules to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('savedSchedules', JSON.stringify(state.savedSchedules));
  }, [state.savedSchedules]);

  const value = {
    ...state,
    dispatch,
    setLoading: (loading) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error) => dispatch({ type: 'SET_ERROR', payload: error }),
    setCurrentSchedule: (schedule) => dispatch({ type: 'SET_CURRENT_SCHEDULE', payload: schedule }),
    saveSchedule: (schedule) => dispatch({ type: 'SAVE_SCHEDULE', payload: schedule }),
    deleteSchedule: (id) => dispatch({ type: 'DELETE_SCHEDULE', payload: id }),
    setPreferences: (preferences) => dispatch({ type: 'SET_PREFERENCES', payload: preferences }),
    clearCurrentSchedule: () => dispatch({ type: 'CLEAR_CURRENT_SCHEDULE' })
  };

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};
