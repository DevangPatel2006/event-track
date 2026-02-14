import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_TIMELINE } from '../data/timeline';

const TimelineContext = createContext();

export const useTimeline = () => useContext(TimelineContext);

export const TimelineProvider = ({ children }) => {
  const [timeline, setTimeline] = useState(() => {
    const saved = localStorage.getItem('timeline_data');
    return saved ? JSON.parse(saved) : INITIAL_TIMELINE;
  });

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'timeline_data') {
        const newValue = e.newValue;
        if (newValue) {
          setTimeline(JSON.parse(newValue));
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Persist to local storage whenever timeline changes
  useEffect(() => {
    localStorage.setItem('timeline_data', JSON.stringify(timeline));
  }, [timeline]);

  const startEvent = (id) => {
    setTimeline(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'live',
          actual_start: new Date().toISOString()
        };
      }
      return item;
    }));
  };

  const endEvent = (id) => {
    setTimeline(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'completed',
          actual_end: new Date().toISOString()
        };
      }
      return item;
    }));
  };

  const resetEvent = (id) => {
    setTimeline(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'upcoming',
          actual_start: null,
          actual_end: null,
          remarks: ''
        };
      }
      return item;
    }));
  };

  const updateRemark = (id, remark) => {
    setTimeline(prev => prev.map(item => 
      item.id === id ? { ...item, remarks: remark } : item
    ));
  };

  const updateEventTime = (id, newDate, newTime) => {
    setTimeline(prev => prev.map(item => 
      item.id === id ? { ...item, date: newDate, time: newTime } : item
    ));
  };

  const updateVenue = (id, newVenue) => {
    setTimeline(prev => prev.map(item => 
      item.id === id ? { ...item, venue: newVenue } : item
    ));
  };

  return (
    <TimelineContext.Provider value={{
      timeline,
      startEvent,
      endEvent,
      resetEvent,
      updateRemark,
      updateEventTime,
      updateVenue
    }}>
      {children}
    </TimelineContext.Provider>
  );
};
