import React, { useState, useEffect } from 'react';
import { getPlayers, getScores } from '../db';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const players = getPlayers();
    const scores = getScores();

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
  }, []);

  return (
    <div className="page-container">
      <h2>Overall Leaderboard</h2>

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
