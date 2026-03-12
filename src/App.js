import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Leaderboard from './pages/Leaderboard';
import Players from './pages/Players';
import Rounds from './pages/Rounds';
import RoundDetails from './pages/RoundDetails';
import Scorecard from './pages/Scorecard';
import ReportScores from './pages/ReportScores';
import Admin from './pages/Admin';
import './App.css';

function App() {
  // Use "dark" as the default theme
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <Router>
      <div className="App">
        <nav className="App-nav">
          <ul>
            <li>
              <Link to="/">Report Scores</Link>
            </li>
            <li>
              <Link to="/leaderboard">Leaderboard</Link>
            </li>
            <li>
              <Link to="/players">Players</Link>
            </li>
            <li>
              <Link to="/rounds">Rounds</Link>
            </li>
            <li>
              <Link to="/admin">Admin</Link>
            </li>
            <li>
              <button className="theme-toggle-btn" onClick={toggleTheme}>
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>
            </li>
          </ul>
        </nav>

        <main className="App-main">
          <Routes>
            <Route path="/" element={<ReportScores />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/players" element={<Players />} />
            <Route path="/rounds" element={<Rounds />} />
            <Route path="/rounds/:id" element={<RoundDetails />} />
            <Route path="/rounds/:id/scorecard" element={<Scorecard />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
