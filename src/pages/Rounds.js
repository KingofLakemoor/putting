import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRounds, addRound, getScores } from '../db';

function Rounds() {
  const [rounds, setRounds] = useState([]);
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [scores, setScores] = useState([]);

  useEffect(() => {
    setRounds(getRounds());
    setScores(getScores());
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!date || !location.trim()) return;

    const newRound = {
      date,
      location
    };

    const created = addRound(newRound);
    setRounds([...rounds, created]);

    // Reset form
    setDate('');
    setLocation('');
  };

  const getParticipantCount = (roundId) => {
    return scores.filter(score => score.round_id === roundId).length;
  };

  return (
    <div className="page-container">
      <div className="layout-grid">
        <div className="list-section">
          <h2>Rounds / Events List</h2>
          {rounds.length === 0 ? (
            <p>No rounds added yet.</p>
          ) : (
            <div className="rounds-list">
              {rounds.map(round => (
                <div key={round.round_id} className="round-card">
                  <div className="round-header">
                    <h3>{new Date(round.date).toLocaleDateString('en-US', { timeZone: 'UTC' })} - {round.location}</h3>
                    <span className={`status-badge ${round.status.toLowerCase()}`}>{round.status}</span>
                  </div>
                  <div className="round-details">
                    <p><strong>Participants:</strong> {getParticipantCount(round.round_id)}</p>
                    <Link to={`/rounds/${round.round_id}`} className="btn-secondary">
                      View / Manage Scores
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-section">
          <h2>Create New Round</h2>
          <form onSubmit={handleSubmit} className="add-form">
            <div className="form-group">
              <label htmlFor="date">Date *</label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Location / Venue *</label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary">Create Round</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Rounds;
