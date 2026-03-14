import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Leaderboard from './pages/Leaderboard';
import RoundDetails from './pages/RoundDetails';
import Scorecard from './pages/Scorecard';
import ReportScores from './pages/ReportScores';
import Admin from './pages/Admin';
import SignIn from './pages/SignIn';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './contexts/AuthContext';
import './App.css';

function App() {
  // Use "dark" as the default theme
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme : 'dark';
  });

  const { currentUser, logout } = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <Router>
      <div className="App">
        {currentUser && (
          <nav className="App-nav">
            <ul>
              <li>
                <Link to="/">Report Scores</Link>
              </li>
              <li>
                <Link to="/leaderboard">Leaderboard</Link>
              </li>
              <li>
                <Link to="/admin">Admin</Link>
              </li>
              <li>
                <button className="theme-toggle-btn" onClick={toggleTheme}>
                  {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </button>
              </li>
              <li>
                <button className="theme-toggle-btn" onClick={handleLogout} style={{ marginLeft: '10px' }}>
                  Sign Out
                </button>
              </li>
            </ul>
          </nav>
        )}

        <main className="App-main">
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/" element={<PrivateRoute><ReportScores /></PrivateRoute>} />
            <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
            <Route path="/rounds/:id" element={<PrivateRoute><RoundDetails /></PrivateRoute>} />
            <Route path="/rounds/:id/scorecard" element={<PrivateRoute><Scorecard /></PrivateRoute>} />
            <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
