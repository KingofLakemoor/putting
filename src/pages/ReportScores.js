import React, { useState, useEffect } from 'react';
import { getRounds, getPlayers, getScores } from '../db';
import PuttingDashboard from '../components/PuttingDashboard';

function ReportScores() {
  const [activeRounds, setActiveRounds] = useState([]);
  const [standings, setStandings] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const allRounds = await getRounds();
        const active = allRounds.filter(r => r.status === 'Active');
        setActiveRounds(active);

        // Fetch standings data
        const players = await getPlayers();
        const scores = await getScores();

        const scoresByPlayerId = {};
        for (let i = 0; i < scores.length; i++) {
          const score = scores[i];
          if (!scoresByPlayerId[score.player_id]) {
            scoresByPlayerId[score.player_id] = [];
          }
          scoresByPlayerId[score.player_id].push(score);
        }

        const playerStats = players.map(player => {
          const playerScores = scoresByPlayerId[player.player_id] || [];
          let totalScore = 0;
          for (let i = 0; i < playerScores.length; i++) {
            const parsedScore = parseInt(playerScores[i].score);
            totalScore += (parsedScore || 0);
          }
          return {
            ...player,
            totalScore,
            roundsPlayed: playerScores.length
          };
        });

        const activePlayers = playerStats.filter(p => p.roundsPlayed > 0);
        activePlayers.sort((a, b) => a.totalScore - b.totalScore);

        setStandings(activePlayers);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      }
    };
    loadData();
  }, []);

  return <PuttingDashboard activeRounds={activeRounds} standings={standings} />;
}

export default ReportScores;
