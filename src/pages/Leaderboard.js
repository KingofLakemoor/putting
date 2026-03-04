import React, { useState, useEffect } from 'react';
import { getPlayers, getScores } from '../db';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const players = getPlayers();
    const scores = getScores();

    // Calculate aggregated points and total putts
    const playerStats = players.map(player => {
      const playerScores = scores.filter(s => s.player_id === player.player_id);

      const totalPoints = playerScores.reduce((sum, score) => sum + (parseInt(score.points_earned) || 0), 0);
      const totalPutts = playerScores.reduce((sum, score) => sum + (parseInt(score.total_putts) || 0), 0);

      return {
        ...player,
        totalPoints,
        totalPutts,
        roundsPlayed: playerScores.length
      };
    });

    // Sort by points descending, then total putts descending
    playerStats.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return b.totalPutts - a.totalPutts;
    });

    setLeaderboard(playerStats);
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
              <th>Total Points</th>
              <th>Total Putts</th>
              <th>Rounds Played</th>
              <th>Handicap</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((player, index) => (
              <tr key={player.player_id}>
                <td>{index + 1}</td>
                <td>{player.name}</td>
                <td><strong>{player.totalPoints}</strong></td>
                <td>{player.totalPutts}</td>
                <td>{player.roundsPlayed}</td>
                <td>{player.handicap || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Leaderboard;
