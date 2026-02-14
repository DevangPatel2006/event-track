import React, { useEffect, useState } from 'react';
import { useTimeline } from '../context/TimelineContext';
import { format } from 'date-fns';
import { Clock, Radio, Calendar, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import Logo from '../components/Logo';

export default function PublicView() {
  const { timeline } = useTimeline();
  const [now, setNow] = useState(new Date());

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

  // Calculate Cumulative Delay
  const getDelayMs = (item) => {
      let delay = 0;
      if (item && item.actual_start) {
          const scheduled = parseSchedule(item.date, item.time);
          const actual = new Date(item.actual_start);
          if (scheduled && actual) {
              delay = actual - scheduled;
          }
      }
      return delay;
  };

  const liveItems = timeline.filter(t => t.status === 'live');
  const primaryLiveItem = liveItems[0]; 
  const currentDelayMs = primaryLiveItem ? getDelayMs(primaryLiveItem) : 0;

  const formatDelay = (ms) => {
      if (ms <= 300000) return null; // Ignore < 5 mins
      const mins = Math.floor(ms / 60000);
      const hours = Math.floor(mins / 60);
      const m = mins % 60;
      return `+${hours > 0 ? `${hours}h ` : ''}${m}m Delay`;
  };

  const upcomingItems = timeline.filter(t => t.status === 'upcoming' || t.status === 'delayed');
  const completedItems = timeline.filter(t => t.status === 'completed').reverse();

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
        {/* Header */}
        <header className="mb-8 w-full max-w-lg flex flex-col items-center border-b border-gray-100 pb-6">
            <div className="flex items-center gap-3 mb-2">
                <Logo className="w-8 h-8 text-black" />
                <h1 className="text-2xl font-black tracking-tighter uppercase text-black">
                    Event Schedule
                </h1>
            </div>
            <div className="flex items-center justify-center gap-4 text-slate-500 text-xs font-medium tracking-wide">
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-mono">{format(now, 'HH:mm:ss')}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                <span className="uppercase">{format(now, 'EEE, dd MMM')}</span>
            </div>
        </header>

        <div className="w-full max-w-lg space-y-8 pb-10">
            
            {/* LIVE Section */}
            {liveItems.length > 0 ? (
                <div className="space-y-4">
                    {liveItems.map(liveItem => {
                         const currentDelayMs = getDelayMs(liveItem);

                         return (
                        <div key={liveItem.id} className="relative group overflow-hidden bg-black text-white rounded-xl shadow-xl">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-white text-black rounded-full text-[10px] font-bold animate-pulse uppercase tracking-wider">
                                        <Radio className="w-3 h-3" /> LIVE NOW
                                    </span>
                                    {formatDelay(currentDelayMs) && (
                                        <span className="text-[10px] font-bold text-yellow-500 bg-white/10 px-2 py-1 rounded">
                                            {formatDelay(currentDelayMs)}
                                        </span>
                                    )}
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
                    )})}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-slate-400 font-medium text-sm">Waiting for event to start...</p>
                </div>
            )}

            {/* UPCOMING & COMPLETED Grid */}
            <div className="space-y-8">
                
                {/* UPCOMING */}
                <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                        Upcoming
                    </h3>
                    <div className="space-y-3">
                        {upcomingItems.length === 0 && <p className="text-slate-400 text-xs italic">No upcoming events.</p>}
                        {upcomingItems.map((item) => {
                             const delayText = formatDelay(currentDelayMs);
                             return (
                            <div key={item.id} className={cn("p-4 rounded-xl border bg-white shadow-sm transition-shadow", 
                                item.status === 'delayed' ? "border-yellow-200 bg-yellow-50/50" : "border-gray-100"
                            )}>
                                <div className="flex justify-between items-start gap-4 mb-2">
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                                            {item.time}
                                        </div>
                                        <h4 className="text-base font-bold text-slate-900 leading-snug">{item.title}</h4>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                         {item.status === 'delayed' && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded">DELAYED</span>}
                                         {delayText && (
                                             <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded">{delayText}</span>
                                         )}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mt-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {item.venue || 'TBA'}
                                </div>

                                {item.remarks && (
                                    <p className="mt-3 text-[10px] text-slate-600 bg-gray-50 p-2 rounded border border-gray-100">
                                        <span className="font-bold text-slate-500">NOTE:</span> {item.remarks}
                                    </p>
                                )}
                            </div>
                        )})}
                    </div>
                </section>

                {/* COMPLETED */}
                <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                        Completed
                    </h3>
                    <div className="space-y-3 opacity-60">
                        {completedItems.length === 0 && <p className="text-slate-400 text-xs italic">No events completed yet.</p>}
                        {completedItems.map(item => (
                            <div key={item.id} className="p-3 rounded-lg border border-gray-100 bg-gray-50 flex justify-between items-center">
                                <div className="min-w-0">
                                    <span className="text-[10px] font-bold text-slate-400 block line-through">
                                        {item.time}
                                    </span>
                                    <h4 className="text-sm font-medium text-slate-500 line-through truncate">{item.title}</h4>
                                </div>
                                <span className="text-[10px] text-slate-400 bg-gray-200 px-2 py-1 rounded font-medium">Ended</span>
                            </div>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    </div>
  );
}
