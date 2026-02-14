import React, { useEffect, useState } from 'react';
import { useTimeline } from '../context/TimelineContext';
import { useNavigate } from 'react-router-dom';
import { Play, Square, Pause, RotateCcw, LogOut, Plus, Edit2, Check, X, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminDashboard() {
  const { timeline, startEvent, endEvent, resetEvent, updateRemark, updateEventTime, updateVenue, delayEvent } = useTimeline();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [remarkInputs, setRemarkInputs] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', time: '', venue: '' });

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
      setRemarkInputs(prev => ({...inputs, ...prev}));
  }, [timeline]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleStart = (id) => {
    if (confirm('Start this event?')) {
        startEvent(id);
    }
  };

  const handleEnd = (id) => {
      if (confirm('End this event?')) {
          endEvent(id);
      }
  };

  const handleReset = (id) => {
    if (confirm('Reset this event to upcoming?')) {
        resetEvent(id);
    }
  };

  const handleDelay = (id) => {
      if (confirm('Mark this event as delayed?')) {
          delayEvent(id);
      }
  };

  const handleRemarkChange = (id, value) => {
      setRemarkInputs(prev => ({ ...prev, [id]: value }));
  };

  const saveRemark = (id) => {
      updateRemark(id, remarkInputs[id]);
      alert('Remark updated');
  };

  const startEditing = (item) => {
      setEditingId(item.id);
      setEditForm({ date: item.date, time: item.time, venue: item.venue || '' });
  };

  const cancelEditing = () => {
      setEditingId(null);
      setEditForm({ date: '', time: '', venue: '' });
  };

  const saveChanges = (id) => {
      updateEventTime(id, editForm.date, editForm.time);
      updateVenue(id, editForm.venue);
      setEditingId(null);
  };

  const getDelay = (item) => {
      if (!item.time || !item.date) return null;
      
      const dateStr = item.date; 
      const timeStr = item.time.split('-')[0].trim();
      const scheduledStart = new Date(`${dateStr} ${timeStr}`);
      
      if (isNaN(scheduledStart.getTime())) return null;

      let comparisonTime = new Date();
      if (item.actual_start) {
          comparisonTime = new Date(item.actual_start);
      }

      if (scheduledStart > comparisonTime) return null;

      const diffMs = comparisonTime - scheduledStart;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins <= 5) return null; 

      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      
      return `+${hours > 0 ? `${hours}h ` : ''}${mins}m Delay`;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans pb-20">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
               <span className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Admin<span className="hidden sm:inline"> Console</span></span>
               <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] md:text-xs font-medium bg-green-100 text-green-700">
                   <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                   Online
               </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-500 border-l pl-4 ml-2">
                  <span className="hidden sm:inline font-medium">{user.name}</span>
                  <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-slate-500" title="Logout">
                    <LogOut className="w-5 h-5" />
                  </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl md:text-2xl font-bold text-slate-800">Timeline</h2>
        </div>

        <div className="space-y-4">
            {timeline.map((item) => {
                const delayText = getDelay(item);
                const isEditing = editingId === item.id;
                
                return (
                <div key={item.id} className={cn("flex flex-col md:flex-row gap-4 p-4 md:p-6 rounded-xl border transition-all duration-200", 
                    item.status === 'live' ? "bg-white border-green-500 ring-2 ring-green-500/20 shadow-lg" : "bg-white border-gray-200 shadow-sm"
                )}>
                    {/* Time Slot & Venue */}
                    <div className="min-w-full md:min-w-[240px] flex flex-col justify-center md:border-r md:border-gray-100 md:pr-6 pb-4 md:pb-0 border-b md:border-b-0 border-gray-50">
                        {!isEditing ? (
                            <>
                                <div className="flex justify-between items-start md:block">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                                            {item.day} • {item.date}
                                        </span>
                                        <span className="text-lg md:text-xl font-bold text-slate-900 leading-tight block">
                                            {item.time}
                                        </span>
                                    </div>
                                    <button onClick={() => startEditing(item)} className="text-xs text-blue-600 md:mt-2 p-1 hover:bg-blue-50 rounded flex items-center gap-1">
                                        <Edit2 className="w-3 h-3" /> <span className="hidden md:inline">Edit</span>
                                    </button>
                                </div>
                                <div className="mt-2 flex items-center gap-1 text-slate-600 text-sm font-medium">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {item.venue || 'No Venue'}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col gap-2 bg-gray-50 p-2 rounded">
                                <label className="text-[10px] font-bold text-slate-400">Date</label>
                                <input 
                                    type="text" 
                                    className="text-xs border rounded p-1.5 w-full bg-white" 
                                    value={editForm.date} 
                                    onChange={e => setEditForm(prev => ({...prev, date: e.target.value}))}
                                />
                                <label className="text-[10px] font-bold text-slate-400">Time</label>
                                <input 
                                    type="text" 
                                    className="text-xs border rounded p-1.5 w-full bg-white" 
                                    value={editForm.time} 
                                    onChange={e => setEditForm(prev => ({...prev, time: e.target.value}))}
                                />
                                <label className="text-[10px] font-bold text-slate-400">Venue</label>
                                <input 
                                    type="text" 
                                    className="text-xs border rounded p-1.5 w-full bg-white" 
                                    value={editForm.venue} 
                                    onChange={e => setEditForm(prev => ({...prev, venue: e.target.value}))}
                                />
                                <div className="flex gap-2 mt-2">
                                    <button onClick={() => saveChanges(item.id)} className="flex-1 bg-green-500 text-white rounded p-1.5 text-xs font-bold shadow-sm hover:bg-green-600">Save</button>
                                    <button onClick={cancelEditing} className="flex-1 bg-gray-200 text-gray-700 rounded p-1.5 text-xs font-bold hover:bg-gray-300">Cancel</button>
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-3 flex flex-wrap gap-2">
                             {item.status === 'live' && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 animate-pulse uppercase tracking-wide">LIVE NOW</span>}
                             {item.status === 'completed' && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wide">COMPLETED</span>}
                             {item.status === 'upcoming' && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 uppercase tracking-wide">UPCOMING</span>}
                             {item.status === 'delayed' && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700 uppercase tracking-wide">DELAYED</span>}
                             
                             {delayText && (
                                 <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                                     {delayText}
                                 </span>
                             )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-center pl-0 md:pl-2">
                        <h3 className={cn("text-lg font-bold text-slate-900 leading-snug", item.status === 'completed' && 'line-through text-slate-400')}>{item.title}</h3>
                        <p className="text-slate-500 text-sm mt-1 mb-4 line-clamp-2 md:line-clamp-none">{item.description}</p>
                        
                        {/* Remarks Section */}
                        <div className="mt-auto pt-4 border-t border-gray-100">
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Remarks / Updates</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Add updates..." 
                                    className="flex-1 text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-blue-500 ui-sans-serif"
                                    value={remarkInputs[item.id] || ''}
                                    onChange={(e) => handleRemarkChange(item.id, e.target.value)}
                                />
                                <button 
                                    onClick={() => saveRemark(item.id)}
                                    className="text-xs bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded font-bold transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex md:flex-col items-center justify-between md:justify-center gap-2 pt-4 md:pt-0 md:pl-6 border-t md:border-t-0 md:border-l border-gray-100 mt-2 md:mt-0">
                        {/* Start Button */}
                        {item.status !== 'live' ? (
                            <button
                                onClick={() => handleStart(item.id)}
                                className={cn("flex-1 md:flex-none w-full flex items-center justify-center p-3 rounded-xl transition-all border font-bold text-sm gap-2",
                                    item.status === 'completed' 
                                        ? "bg-gray-50 text-gray-500 border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200" 
                                        : "bg-green-50 text-green-600 border-green-200 hover:bg-green-600 hover:text-white"
                                )}
                            >
                                <Play className="w-4 h-4 fill-current" /> <span className="md:hidden">Start</span>
                            </button>
                        ) : null}

                        {/* End Button */}
                        {item.status === 'live' && (
                             <button
                                onClick={() => handleEnd(item.id)}
                                className="flex-1 md:flex-none w-full flex items-center justify-center p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all border border-red-200 font-bold text-sm gap-2"
                             >
                                 <Square className="w-4 h-4 fill-current" /> <span className="md:hidden">End</span>
                             </button>
                        )}
                        
                        {/* Reset Button */}
                        <button
                            onClick={() => handleReset(item.id)}
                            className="flex-1 md:flex-none w-full md:w-auto flex items-center justify-center p-3 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-all font-bold text-sm gap-2"
                            title="Reset to Upcoming"
                        >
                            <RotateCcw className="w-4 h-4" /> <span className="md:hidden">Reset</span>
                        </button>
                    </div>
                </div>
            )})}
        </div>
      </div>
    </div>
  );
}
