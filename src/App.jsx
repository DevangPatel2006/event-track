import { Routes, Route } from 'react-router-dom';
import PublicView from './pages/PublicView';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans antialiased selection:bg-pink-500 selection:text-white">
      <Routes>
        <Route path="/" element={<PublicView />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </div>
  );
}

export default App;
