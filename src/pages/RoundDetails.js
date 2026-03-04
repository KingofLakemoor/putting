import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRounds, getPlayers, getScoresForRound, addScore } from '../db';

function RoundDetails() {
  const { id } = useParams();
  const [round, setRound] = useState(null);
  const [players, setPlayers] = useState([]);
  const [scores, setScores] = useState([]);

  // Form State
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [totalPutts, setTotalPutts] = useState('');
  const [pointsEarned, setPointsEarned] = useState('');

  useEffect(() => {
    // Load round
    const allRounds = getRounds();
    const currentRound = allRounds.find(r => r.round_id === id);
    setRound(currentRound);

    // Load players and scores
    if (currentRound) {
      setPlayers(getPlayers());
      setScores(getScoresForRound(id));
    }
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPlayerId || totalPutts === '' || pointsEarned === '') return;

    // Check if player already has a score for this round
    if (scores.some(s => s.player_id === selectedPlayerId)) {
      alert("This player already has a score recorded for this round.");
      return;
    }

    const newScore = {
      player_id: selectedPlayerId,
      round_id: id,
      total_putts: parseInt(totalPutts),
      points_earned: parseInt(pointsEarned)
    };

    const created = addScore(newScore);
    setScores([...scores, created]);

    // Reset form
    setSelectedPlayerId('');
    setTotalPutts('');
    setPointsEarned('');
  };

  if (!round) {
    return <div className="page-container">Loading round...</div>;
  }

  // Map player info to scores for display
  const scoredPlayers = scores.map(score => {
    const player = players.find(p => p.player_id === score.player_id);
    return {
      ...score,
      playerName: player ? player.name : 'Unknown Player',
      handicap: player ? player.handicap : null
    };
  }).sort((a, b) => {
    // Sort by points earned descending, then by putts descending
    if (b.points_earned !== a.points_earned) {
      return b.points_earned - a.points_earned;
    }
    return b.total_putts - a.total_putts;
  });

  // Get un-scored players for the dropdown
  const availablePlayers = players.filter(
    p => !scores.some(s => s.player_id === p.player_id)
  );

  return (
    <div className="page-container">
      <div className="round-header-details">
        <Link to="/rounds" className="back-link">&larr; Back to Rounds</Link>
        <h2>Round Details</h2>
        <div className="round-meta">
          <p><strong>Date:</strong> {new Date(round.date).toLocaleDateString()}</p>
          <p><strong>Location:</strong> {round.location}</p>
          <p><strong>Status:</strong> {round.status}</p>
        </div>
      </div>

      <div className="layout-grid">
        <div className="list-section">
          <h3>Round Leaderboard</h3>
          {scoredPlayers.length === 0 ? (
            <p>No scores submitted for this round yet.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Total Putts</th>
                  <th>Points Earned</th>
                </tr>
              </thead>
              <tbody>
                {scoredPlayers.map((score, index) => (
                  <tr key={score.score_id}>
                    <td>{index + 1}</td>
                    <td>{score.playerName}</td>
                    <td>{score.total_putts}</td>
                    <td><strong>{score.points_earned}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {round.status === 'Active' && (
          <div className="form-section">
            <h3>Enter Score</h3>
            {availablePlayers.length === 0 ? (
              <p>All players have scores for this round!</p>
            ) : (
              <form onSubmit={handleSubmit} className="add-form">
                <div className="form-group">
                  <label htmlFor="player">Select Player *</label>
                  <select
                    id="player"
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose a player --</option>
                    {availablePlayers.map(player => (
                      <option key={player.player_id} value={player.player_id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="putts">Total Putts *</label>
                  <input
                    type="number"
                    id="putts"
                    min="0"
                    value={totalPutts}
                    onChange={(e) => setTotalPutts(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="points">Points Earned *</label>
                  <input
                    type="number"
                    id="points"
                    min="0"
                    value={pointsEarned}
                    onChange={(e) => setPointsEarned(e.target.value)}
                    required
                  />
                  <small>e.g., 10 for 1st, 8 for 2nd, etc.</small>
                </div>

                <button type="submit" className="btn-primary">Submit Score</button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default RoundDetails;
