import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { Play, Square, Pause, RotateCcw, LogOut, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
// Removed date-fns imports as we use static strings now

export default function AdminDashboard() {
  const { timeline, socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [remarkInputs, setRemarkInputs] = useState({});

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!storedUser || !token) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  // Sync local remark inputs with timeline data
  useEffect(() => {
      const inputs = {};
      timeline.forEach(item => {
          inputs[item.id] = item.remarks || '';
      });
      setRemarkInputs(prev => ({...inputs, ...prev})); // Keep local edits if any, but default to server
  }, [timeline]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const startItem = (id) => {
    if (confirm('Start this event? It will end any currently running event.')) {
        socket.emit('admin:start_item', id);
    }
  };

  const endItem = (id) => {
      if (confirm('End this event?')) {
          socket.emit('admin:end_item', id);
      }
  };

  const resetItem = (id) => {
    if (confirm('Reset this event to upcoming?')) {
        socket.emit('admin:reset_item', id);
    }
  };

  const delayItem = (id) => {
      socket.emit('admin:delay_item', { id });
  };

  const handleNextEvent = () => {
      const nextEvent = timeline.find(t => t.status === 'upcoming');
      if (nextEvent) {
          if (confirm(`Start next event: "${nextEvent.title}"? This will end the current live event.`)) {
              socket.emit('admin:start_item', nextEvent.id);
          }
      } else {
          alert('No upcoming events found.');
      }
  };

  const handleRemarkChange = (id, value) => {
      setRemarkInputs(prev => ({ ...prev, [id]: value }));
  };

  const saveRemark = (id) => {
      socket.emit('admin:update_remark', { id, remark: remarkInputs[id] });
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
               <span className="text-xl font-bold text-slate-900">Admin Console</span>
               <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium", isConnected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                   <span className={cn("w-1.5 h-1.5 rounded-full", isConnected ? "bg-green-600" : "bg-red-600")}></span>
                   {isConnected ? 'Online' : 'Offline'}
               </span>
            </div>
            <div className="flex items-center gap-4">
                 <button 
                    onClick={handleNextEvent}
                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    <Play className="w-4 h-4" /> Start Next Event
                </button>
              <div className="flex items-center gap-2 text-sm text-slate-500 border-l pl-4 ml-4">
                  <span>{user.name}</span>
                  <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-slate-500" title="Logout">
                    <LogOut className="w-5 h-5" />
                  </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
             <h2 className="text-2xl font-bold text-slate-800">Timeline Management</h2>
             <button className="md:hidden flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm" onClick={handleNextEvent}>
                  <Play className="w-4 h-4" /> Next
             </button>
        </div>

        <div className="space-y-4">
            {timeline.map((item) => {
                const delayText = getDelay(item);
                
                return (
                <div key={item.id} className={cn("flex flex-col md:flex-row gap-4 p-6 rounded-xl border transition-all duration-200", 
                    item.status === 'live' ? "bg-white border-green-500 ring-2 ring-green-500/20 shadow-lg" : "bg-white border-gray-200 shadow-sm"
                )}>
                    {/* Time Slot */}
                    <div className="min-w-[180px] flex flex-col justify-center border-r border-gray-100 pr-6">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            {item.day} • {item.date}
                        </span>
                        <span className="text-xl font-bold text-slate-900 leading-tight">
                            {item.time}
                        </span>
                        
                        <div className="mt-3 flex flex-col items-start gap-2">
                             {item.status === 'live' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 animate-pulse">LIVE NOW</span>}
                             {item.status === 'completed' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">COMPLETED</span>}
                             {item.status === 'upcoming' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">UPCOMING</span>}
                             {item.status === 'delayed' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">DELAYED</span>}
                             
                             {delayText && (
                                 <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                                     {delayText}
                                 </span>
                             )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-center pl-2">
                        <h3 className={cn("text-lg font-bold text-slate-900", item.status === 'completed' && 'line-through text-slate-400')}>{item.title}</h3>
                        <p className="text-slate-500 text-sm mt-1 mb-4">{item.description}</p>
                        
                        {/* Remarks Section */}
                        <div className="mt-auto pt-4 border-t border-gray-100">
                            <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">Remarks / Updates</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Add reason for delay or update..." 
                                    className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-500 ui-sans-serif"
                                    value={remarkInputs[item.id] || ''}
                                    onChange={(e) => handleRemarkChange(item.id, e.target.value)}
                                    disabled={item.status === 'completed'}
                                />
                                {item.status !== 'completed' && (
                                    <button 
                                        onClick={() => saveRemark(item.id)}
                                        className="text-xs bg-gray-100 hover:bg-gray-200 text-slate-600 px-3 py-1 rounded font-medium transition-colors"
                                    >
                                        Save
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 md:pl-6 border-l border-gray-100">
                        {item.status === 'upcoming' || item.status === 'delayed' ? (
                            <button
                                onClick={() => startItem(item.id)}
                                className="flex items-center justify-center p-3 rounded-full bg-green-50 text-green-600 hover:bg-green-100 hover:scale-105 transition-all border border-green-200"
                                title="Start Event"
                            >
                                <Play className="w-5 h-5 fill-current" />
                            </button>
                        ) : null}

                        {item.status === 'live' && (
                             <button
                                onClick={() => endItem(item.id)}
                                className="flex items-center justify-center p-3 rounded-full bg-red-50 text-red-600 hover:bg-red-100 hover:scale-105 transition-all border border-red-200"
                                title="End Event"
                             >
                                 <Square className="w-5 h-5 fill-current" />
                             </button>
                        )}

                        {(item.status === 'upcoming' || item.status === 'live') && (
                             <button
                                onClick={() => delayItem(item.id)}
                                className="flex items-center justify-center p-3 rounded-full bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-all border border-yellow-200"
                                title="Mark Delayed"
                             >
                                 <Pause className="w-5 h-5" />
                             </button>
                        )}
                        
                        {item.status === 'completed' && (
                            <button
                                onClick={() => resetItem(item.id)}
                                className="flex items-center justify-center p-3 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-all"
                                title="Reset"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            )})}
        </div>
      </div>
    </div>
  );
}
