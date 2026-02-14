import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Hardcoded credentials
    const admins = [
        { email: 'admin1@example.com', password: 'password123', name: 'Admin One' },
        { email: 'admin2@example.com', password: 'password123', name: 'Admin Two' },
        { email: 'admin3@example.com', password: 'password123', name: 'Admin Three' },
        { email: 'admin4@example.com', password: 'password123', name: 'Admin Four' },
        { email: 'admin5@example.com', password: 'password123', name: 'Admin Five' },
    ];

    const user = admins.find(u => u.email === email && u.password === password);
      
    if (user) {
        localStorage.setItem('token', 'dummy-token-123'); // Dummy token for simple auth check
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/admin');
    } else {
        setError('Invalid credentials');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8 rounded-2xl bg-slate-900 p-8 shadow-xl border border-slate-800">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">Event Admin Login</h2>
        </div>
        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-slate-400">Email</label>
            <input
              id="email"
              type="email"
              required
              className="block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-slate-400">Password</label>
            <input
              id="password"
              type="password"
              required
              className="block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="flex w-full justify-center rounded-md bg-pink-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-pink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 transition-colors"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
