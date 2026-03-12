import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRounds } from '../db';

function ReportScores() {
  const [activeRounds, setActiveRounds] = useState([]);

  useEffect(() => {
    const allRounds = getRounds();
    const active = allRounds.filter(r => r.status === 'Active');
    setActiveRounds(active);
  }, []);

  return (
    <div className="page-container">
      <h2>Report Scores</h2>
      {activeRounds.length === 0 ? (
        <p>
          There are currently no active rounds. Please navigate to the <Link to="/rounds">Rounds</Link> page to create one.
        </p>
      ) : (
        <div className="rounds-list">
          {activeRounds.map(round => (
            <div key={round.round_id} className="round-card">
              <div className="round-header">
                <h3>{new Date(round.date).toLocaleDateString()} - {round.location}</h3>
                <span className={`status-badge ${round.status.toLowerCase()}`}>{round.status}</span>
              </div>
              <div className="round-details">
                <Link to={`/rounds/${round.round_id}/scorecard`} className="btn-primary">
                  Fill Scorecard
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReportScores;
