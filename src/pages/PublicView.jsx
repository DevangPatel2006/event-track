import React, { useEffect, useState } from 'react';
import { useTimeline } from '../context/TimelineContext';
import { format } from 'date-fns';
import { Clock, Radio, Calendar, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import Logo from '../components/Logo';

export default function PublicView() {
  const { timeline } = useTimeline();
  const [now, setNow] = useState(new Date());
  const [activeDay, setActiveDay] = useState('Day 1');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to parse "Day, Date Time" strings
  const parseSchedule = (dateStr, timeStr) => {
      // Handle "From 4:00 PM" -> "4:00 PM"
      const cleanTime = timeStr.split('-')[0].replace(/From/i, '').trim(); 
      const dt = new Date(`${dateStr} ${cleanTime}`);
      return isNaN(dt.getTime()) ? null : dt;
  };

  const liveItems = timeline.filter(t => t.status === 'live');

  const upcomingItems = timeline.filter(t => t.status === 'upcoming' || !t.status);
  // Removed .reverse() to keep them in chronological sequence 1...N
  const completedItems = timeline.filter(t => t.status === 'completed');

  const getElapsedTime = (start) => {
    if (!start) return '00:00:00';
    const diff = now - new Date(start);
    const seconds = Math.floor((diff / 1000) % 60);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col items-center p-4 md:p-8">
        
        <div className="w-full max-w-lg space-y-8 pb-10">
            
                {/* LIVE Section (Global) */}
                {liveItems.length > 0 && (
                    <div className="space-y-4 mb-8">
                        {liveItems.map(liveItem => (
                            <div key={liveItem.id} className="relative group overflow-hidden bg-black text-white rounded-xl shadow-xl">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-white text-black rounded-full text-[10px] font-bold animate-pulse uppercase tracking-wider">
                                            <Radio className="w-3 h-3" /> LIVE NOW
                                        </span>
                                    </div>
                                    
                                    <h2 className="text-2xl font-bold mb-1 leading-tight">
                                        {liveItem.title}
                                    </h2>
                                    
                                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/20">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                                <Calendar className="w-4 h-4" />
                                                <span className="font-medium">{liveItem.time}</span>
                                            </div>
                                            <div className="font-mono text-xl font-bold text-white tracking-tight">
                                                {getElapsedTime(liveItem.actual_start)}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <MapPin className="w-4 h-4" />
                                            <span className="font-medium">{liveItem.venue || 'No Venue'}</span>
                                        </div>
                                    </div>

                                    {liveItem.remarks && (
                                        <div className="mt-4 p-3 bg-white/10 rounded-lg">
                                            <p className="text-yellow-400 text-xs font-medium">{liveItem.remarks}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Day Selection Tabs */}
                <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                    {['Day 1', 'Day 2'].map(day => (
                        <button
                            key={day}
                            onClick={() => setActiveDay(day)}
                            className={cn(
                                "flex-1 py-3 text-sm font-bold rounded-lg transition-all",
                                activeDay === day ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-gray-200/50"
                            )}
                        >
                            {day}
                        </button>
                    ))}
                </div>

                {/* Unified Timeline Grouped by Day */}
                <div className="space-y-10">
                    {/* Render only items for the active day */}
                    {(() => {
                        const dayItems = timeline.filter(item => item.day === activeDay);
                        if (dayItems.length === 0) return <p className="text-center text-slate-400 italic">No events for this day.</p>;

                        const dateStr = dayItems[0]?.date || '';

                        return (
                            <section key={activeDay} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Day Header with Date */}
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center justify-center gap-2 border-b border-gray-100 pb-2">
                                    <span className="text-slate-500 text-xs">{dateStr}</span>
                                </h3>
                                
                                <div className="space-y-3 relative">
                                    {/* Vertical Line */}
                                    <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100 -z-10"></div>

                                    {dayItems.map((item) => {
                                        const isCompleted = item.status === 'completed';
                                        const isLive = item.status === 'live';
                                        
                                        return (
                                        <div key={item.id} className={cn("p-4 rounded-xl border transition-shadow bg-white", 
                                            isLive ? "border-green-500 shadow-md ring-1 ring-green-500/20" : 
                                            isCompleted ? "border-gray-100 bg-gray-50 opacity-70" : 
                                            "border-gray-200 shadow-sm"
                                        )}>
                                            <div className="flex justify-between items-start gap-4 mb-2">
                                                <div className="min-w-0">
                                                    <div className={cn("text-[10px] font-bold uppercase mb-1", isCompleted ? "text-slate-400 line-through" : "text-slate-500")}>
                                                        {item.time}
                                                    </div>
                                                    <h4 className={cn("text-base font-bold leading-snug", isCompleted ? "text-slate-500 line-through" : "text-slate-900")}>
                                                        {item.title}
                                                    </h4>
                                                </div>
                                                {isCompleted && <span className="text-[10px] text-slate-400 bg-gray-200 px-2 py-1 rounded font-medium shrink-0">Ended</span>}
                                                {isLive && <span className="text-[10px] text-green-700 bg-green-100 px-2 py-1 rounded font-bold shrink-0 animate-pulse">LIVE</span>}
                                            </div>
                                            
                                            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mt-1">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {item.venue || 'TBA'}
                                            </div>

                                            {item.remarks && (
                                                <p className={cn("mt-3 text-[10px] p-2 rounded border", isLive ? "bg-yellow-50 border-yellow-200 text-yellow-800" : "bg-gray-50 border-gray-100 text-slate-600")}>
                                                    <span className="font-bold">NOTE:</span> {item.remarks}
                                                </p>
                                            )}
                                        </div>
                                    )})}
                                </div>
                            </section>
                        );
                    })()}
                </div>
        </div>
    </div>
  );
}
