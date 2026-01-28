import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { format } from 'date-fns';
import { Clock, Radio, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

export default function PublicView() {
  const { timeline, isConnected } = useSocket();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const liveItem = timeline.find(t => t.status === 'live');
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

  const getDelay = (item) => {
      if (!item.time || !item.date) return null;
      
      // Parse Scheduled Start
      const dateStr = item.date; // "27 Jan 2026"
      const timeStr = item.time.split('-')[0].trim(); // "8:30 AM"
      const scheduledStart = new Date(`${dateStr} ${timeStr}`);
      
      if (isNaN(scheduledStart.getTime())) return null;

      let comparisonTime = new Date();
      if (item.actual_start) {
          comparisonTime = new Date(item.actual_start);
      } else if (item.status === 'completed' && item.actual_end) {
           // For completed items, we might not care about delay display as much, 
           // but if we did, we'd need actual start. 
           // If we don't store actual start for completed permanently (we do in updated server code),
           // check if we have it.
           // However, for Public View, usually we show delay on Upcoming/Live.
           comparisonTime = new Date(); 
      }

      // If scheduled time is in future relative to comparison time, no delay
      if (scheduledStart > comparisonTime) return null;

      const diffMs = comparisonTime - scheduledStart;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins <= 5) return null; // Ignore negligible delays

      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      
      return `+${hours > 0 ? `${hours}h ` : ''}${mins}m Delay`;
  };

  return (
    <div className="min-h-screen bg-white p-6 md:p-12 font-sans text-slate-900 flex flex-col items-center">
        {/* Header */}
        <header className="mb-12 text-center w-full max-w-5xl border-b border-gray-100 pb-8">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 mb-2 uppercase">
                Event Schedule
            </h1>
            <div className="flex items-center justify-center gap-6 text-slate-500 mt-4">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span className="text-xl font-mono font-medium">{format(now, 'HH:mm:ss')}</span>
                </div>
                {!isConnected && <span className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded-full border border-red-100">OFFLINE</span>}
            </div>
        </header>

        <div className="w-full max-w-6xl space-y-12">
            
            {/* LIVE Section */}
            {liveItem ? (
                <div key={liveItem.id} className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-green-600 rounded-3xl opacity-30 group-hover:opacity-50 transition duration-1000 animate-pulse"></div>
                    <div className="relative bg-white ring-1 ring-green-100 rounded-2xl p-8 md:p-12 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-green-500/10">
                        <div className="absolute top-0 right-0 p-6 flex flex-col items-end gap-2">
                            <span className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-bold border border-green-200 animate-pulse shadow-sm">
                                <Radio className="w-4 h-4" /> LIVE
                            </span>
                            {getDelay(liveItem) && (
                                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
                                    {getDelay(liveItem)}
                                </span>
                            )}
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 text-slate-500 text-sm font-bold uppercase tracking-widest">
                                    <Calendar className="w-4 h-4" />
                                    {liveItem.day} • {liveItem.time}
                                </div>
                                <h2 className="text-4xl md:text-6xl font-bold text-slate-900 leading-none tracking-tight">
                                    {liveItem.title}
                                </h2>
                                <p className="text-xl md:text-2xl text-slate-600 max-w-3xl leading-relaxed font-light">{liveItem.description}</p>
                                
                                {liveItem.remarks && (
                                    <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg max-w-2xl">
                                        <p className="text-sm font-bold text-yellow-800 uppercase mb-1">Update</p>
                                        <p className="text-yellow-900">{liveItem.remarks}</p>
                                    </div>
                                )}
                            </div>
                            <div className="text-right min-w-[200px] border-l-2 border-green-100 pl-8 hidden md:block">
                                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Duration</p>
                                <p className="text-5xl font-mono font-bold text-green-600 tracking-tighter">
                                    {getElapsedTime(liveItem.actual_start)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-3xl text-slate-400 font-light">Waiting for event to start...</p>
                </div>
            )}

            {/* UPCOMING & COMPLETED Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* UPCOMING */}
                <section>
                    <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 text-slate-800 border-b border-gray-100 pb-4">
                        <span className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-100"></span>
                        Upcoming
                    </h3>
                    <div className="space-y-4">
                        {upcomingItems.length === 0 && <p className="text-slate-400 italic pl-4">No upcoming events.</p>}
                        {upcomingItems.map((item, idx) => {
                             const delayText = getDelay(item);
                             return (
                            <div key={item.id} className={cn("p-6 rounded-xl border transition-all hover:border-blue-200 hover:shadow-md bg-white", 
                                item.status === 'delayed' ? "border-yellow-200 bg-yellow-50/50" : "border-gray-100"
                            )}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1 block">
                                            {item.day} • {item.time}
                                        </span>
                                        <h4 className="text-xl font-bold text-slate-900">{item.title}</h4>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                         {item.status === 'delayed' && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded border border-yellow-200">DELAYED</span>}
                                         {delayText && (
                                             <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-bold rounded border border-red-100">{delayText}</span>
                                         )}
                                    </div>
                                </div>
                                <p className="text-slate-500 text-sm mt-2">{item.description}</p>
                                {item.remarks && (
                                    <p className="mt-3 text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                        <span className="font-bold text-slate-500 text-xs uppercase mr-2">Note:</span>
                                        {item.remarks}
                                    </p>
                                )}
                            </div>
                        )})}
                    </div>
                </section>

                {/* COMPLETED */}
                <section>
                    <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 text-slate-400 border-b border-gray-100 pb-4">
                        <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                        Completed
                    </h3>
                    <div className="space-y-4 opacity-75 grayscale hover:grayscale-0 transition-all duration-500">
                        {completedItems.length === 0 && <p className="text-slate-400 italic pl-4">No events completed yet.</p>}
                        {completedItems.map(item => (
                            <div key={item.id} className="p-6 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block line-through">
                                            {item.day} • {item.time}
                                        </span>
                                        <h4 className="text-lg font-semibold text-slate-500 line-through decoration-slate-300">{item.title}</h4>
                                        {item.remarks && (
                                            <p className="mt-2 text-xs text-slate-400">
                                                Note: {item.remarks}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-xs font-mono text-slate-400 bg-gray-200 px-2 py-1 rounded">Ended</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    </div>
  );
}
