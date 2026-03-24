import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Leaderboard from './pages/Leaderboard';
import RoundDetails from './pages/RoundDetails';
import Scorecard from './pages/Scorecard';
import Admin from './pages/Admin';
import SignIn from './pages/SignIn';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './contexts/AuthContext';
import LeagueStandings from './components/LeagueStandings';
import PuttingDashboard from './components/PuttingDashboard';
import './App.css';

function App() {
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    // Force dark theme globally for the new design
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-dark-bg text-white font-sans flex flex-col">
        {currentUser && (
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
                <Link to="/admin" className="hover:text-kelly-green transition-colors">Admin</Link>
              </li>
              <li>
                <button onClick={handleLogout} className="hover:text-white transition-colors">
                  Sign Out
                </button>
              </li>
            </ul>
          </nav>
        )}

        <main className="flex-1 w-full">
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/" element={<PrivateRoute><PuttingDashboard /></PrivateRoute>} />
            <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
            <Route path="/rounds/:id" element={<PrivateRoute><RoundDetails /></PrivateRoute>} />
            <Route path="/scorecard/:roundId" element={<PrivateRoute><Scorecard /></PrivateRoute>} />
            <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
            <Route path="/preview-standings" element={<LeagueStandings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
