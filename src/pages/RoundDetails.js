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
  const [roundScore, setRoundScore] = useState('');

  useEffect(() => {
    const loadData = async () => {
      // Load round
      const allRounds = await getRounds();
      const currentRound = allRounds.find(r => r.round_id === id);
      setRound(currentRound);

      // Load players and scores
      if (currentRound) {
        setPlayers(await getPlayers());
        setScores(await getScoresForRound(id));
      }
    };
    loadData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlayerId || roundScore === '') return;

    // Check if player already has a score for this round
    if (scores.some(s => s.player_id === selectedPlayerId)) {
      alert("This player already has a score recorded for this round.");
      return;
    }

    const newScore = {
      player_id: selectedPlayerId,
      round_id: id,
      score: parseInt(roundScore)
    };

    const created = await addScore(newScore);
    setScores([...scores, created]);

    // Reset form
    setSelectedPlayerId('');
    setRoundScore('');
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
    };
  }).sort((a, b) => {
    // Sort by score ascending (lower is better)
    return a.score - b.score;
  });

  // Get un-scored players for the dropdown
  const availablePlayers = players.filter(
    p => !scores.some(s => s.player_id === p.player_id)
  );

  return (
    <div className="page-container">
      <div className="round-header-details" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Link to="/leaderboard" className="back-link">&larr; Back to Leaderboard</Link>
          <h2>Round Details</h2>
          <div className="round-meta">
            <p><strong>Date:</strong> {new Date(round.date).toLocaleDateString('en-US', { timeZone: 'UTC' })}</p>
            <p><strong>Location:</strong> {round.location}</p>
            <p><strong>Status:</strong> {round.status}</p>
          </div>
        </div>
        {round.status === 'Active' && (
          <Link to={`/rounds/${id}/scorecard`} className="btn-primary" style={{ width: 'auto', display: 'inline-block' }}>
            Fill Scorecard
          </Link>
        )}
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
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {scoredPlayers.map((score, index) => (
                  <tr key={score.score_id}>
                    <td>{index + 1}</td>
                    <td>{score.playerName}</td>
                    <td><strong>{score.score}</strong></td>
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
                  <label htmlFor="score">Score *</label>
                  <input
                    type="number"
                    id="score"
                    min="0"
                    value={roundScore}
                    onChange={(e) => setRoundScore(e.target.value)}
                    required
                  />
                  <small>Lower score is better</small>
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
