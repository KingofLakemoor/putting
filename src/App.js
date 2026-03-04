import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Leaderboard from './pages/Leaderboard';
import Players from './pages/Players';
import Rounds from './pages/Rounds';
import RoundDetails from './pages/RoundDetails';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="App-nav">
          <ul>
            <li>
              <Link to="/">Leaderboard</Link>
            </li>
            <li>
              <Link to="/players">Players</Link>
            </li>
            <li>
              <Link to="/rounds">Rounds</Link>
            </li>
          </ul>
        </nav>

        <main className="App-main">
          <Routes>
            <Route path="/" element={<Leaderboard />} />
            <Route path="/players" element={<Players />} />
            <Route path="/rounds" element={<Rounds />} />
            <Route path="/rounds/:id" element={<RoundDetails />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
