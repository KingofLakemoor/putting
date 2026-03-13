import React, { useState, useEffect } from 'react';
import { getPlayers, getScores, getRounds } from '../db';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [filter, setFilter] = useState('global');

  useEffect(() => {
    const players = getPlayers();
    let scores = getScores();
    const allRounds = getRounds();

    setRounds(allRounds);

    if (filter !== 'global' && filter !== 'season') {
      scores = scores.filter(s => String(s.round_id) === String(filter));
    }

    // Calculate aggregated score
    const playerStats = players.map(player => {
      const playerScores = scores.filter(s => s.player_id === player.player_id);

      const totalScore = playerScores.reduce((sum, score) => sum + (parseInt(score.score) || 0), 0);

      return {
        ...player,
        totalScore,
        roundsPlayed: playerScores.length
      };
    });

    // Filter out players who haven't played any rounds yet to avoid
    // 0 scores automatically placing them at the top.
    const activePlayers = playerStats.filter(p => p.roundsPlayed > 0);

    // Sort by score ascending (lower is better)
    activePlayers.sort((a, b) => {
      return a.totalScore - b.totalScore;
    });

    setLeaderboard(activePlayers);
  }, [filter]);

  return (
    <div className="page-container">
      <div className="leaderboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{filter === 'global' ? 'Global Rankings' : filter === 'season' ? 'Season Rankings' : 'Event Leaderboard'}</h2>
        <div className="form-group" style={{ width: 'auto', marginBottom: 0 }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
          >
            <option value="global">Global Rankings</option>
            <option value="season">Season Rankings</option>
            <optgroup label="Events / Rounds">
              {rounds.map(round => (
                <option key={round.round_id} value={round.round_id}>
                  {new Date(round.date).toLocaleDateString('en-US', { timeZone: 'UTC' })} - {round.location}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <p>No data yet. Add players and scores to see the leaderboard!</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Score</th>
              <th>Rounds Played</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((player, index) => (
              <tr key={player.player_id}>
                <td>{index + 1}</td>
                <td>{player.name}</td>
                <td><strong>{player.totalScore}</strong></td>
                <td>{player.roundsPlayed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Leaderboard;
