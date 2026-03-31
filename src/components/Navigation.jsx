import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navigation() {
  const { currentUser, logout } = useAuth();

  if (!currentUser) return null;
  const isVenue = window.location.pathname === '/venue' || window.location.pathname === '/tv';
  if (isVenue) return null;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <nav className="bg-dark-surface border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="font-sports text-2xl tracking-wide uppercase text-white">Club 602</div>
      <ul className="flex flex-wrap justify-center gap-4 sm:gap-8 text-sm font-bold uppercase tracking-wider text-slate-400">
        <li>
          <Link to="/" className="hover:text-kelly-green transition-colors">Dashboard</Link>
        </li>
        <li>
          <Link to="/leaderboard" className="hover:text-kelly-green transition-colors">Leaderboard</Link>
        </li>
        <li>
          <Link to="/history" className="hover:text-kelly-green transition-colors">History</Link>
        </li>
        <li>
          <Link to="/venue" className="hover:text-kelly-green transition-colors">Venue Dashboard</Link>
        </li>
        <li>
          <Link to="/admin" className="hover:text-kelly-green transition-colors">Admin</Link>
        </li>
        <li>
          <button onClick={handleLogout} className="hover:text-white transition-colors">
            Sign Out
          </button>
        </li>
      </ul>
    </nav>
  );
}