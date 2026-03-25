const fs = require('fs');
const file = 'src/components/LeagueStandings.js';
let content = fs.readFileSync(file, 'utf8');

const oldLogic = `    const scoresByPlayerId = {};
    for (const score of currentScores) {
      // Find the actual player id if the score used the UID
      const player = players.find(p => p.uid === score.player_id || p.player_id === score.player_id);
      const targetId = player ? player.player_id : score.player_id;

      if (!scoresByPlayerId[targetId]) {
        scoresByPlayerId[targetId] = [];
      }
      scoresByPlayerId[targetId].push(score);
    }

    const playerStats = players.map((player) => {
      const playerScores = scoresByPlayerId[player.player_id] || [];
      let totalScore = 0;
      let playedCount = 0;
      for (const s of playerScores) {
        const parsed = parseInt(s.score);
        if (!isNaN(parsed)) {
            totalScore += parsed;
            playedCount++;
        }
      }
      const avgScore = playedCount > 0 ? (totalScore / playedCount).toFixed(1) : 0;
      return {
        ...player,
        score: avgScore,
        played: playedCount,
      };
    });

    const activePlayers = playerStats.filter((p) => p.played > 0);`;

const newLogic = `    const scoresByPlayerId = {};
    for (const score of currentScores) {
      // Find the actual player id if the score used the UID
      let player = players.find(p => p.uid === score.player_id || p.player_id === score.player_id);

      // Fallback: If UID connection is broken, link by player_name from the score's round
      if (!player) {
         const round = currentRounds.find(r => r.round_id === score.round_id);
         if (round && round.player_name && round.player_id === score.player_id) {
             player = players.find(p => p.name.toLowerCase() === round.player_name.toLowerCase());
         }
      }

      const targetId = player ? player.player_id : score.player_id;

      if (!scoresByPlayerId[targetId]) {
        scoresByPlayerId[targetId] = [];
      }
      scoresByPlayerId[targetId].push(score);
    }

    const playerStats = players.map((player) => {
      const playerScores = scoresByPlayerId[player.player_id] || [];
      let totalScore = 0;
      let playedCount = 0;
      for (const s of playerScores) {
        const parsed = parseInt(s.score);
        if (!isNaN(parsed)) {
            totalScore += parsed;
            playedCount++;
        }
      }
      const avgScore = playedCount > 0 ? (totalScore / playedCount).toFixed(1) : 0;
      return {
        ...player,
        score: avgScore,
        played: playedCount,
      };
    });

    // Handle truly orphaned scores that couldn't be linked to any player profile
    const knownPlayerIds = new Set(players.map(p => p.player_id));
    const orphanIds = Object.keys(scoresByPlayerId).filter(id => !knownPlayerIds.has(id));

    const orphanStats = orphanIds.map(id => {
       const playerScores = scoresByPlayerId[id];
       const roundWithPlayer = currentRounds.find(r => r.player_id === id);
       const name = roundWithPlayer && roundWithPlayer.player_name ? roundWithPlayer.player_name : "Unknown Player";

       let totalScore = 0;
       let playedCount = 0;
       for (const s of playerScores) {
         const parsed = parseInt(s.score);
         if (!isNaN(parsed)) {
             totalScore += parsed;
             playedCount++;
         }
       }
       const avgScore = playedCount > 0 ? (totalScore / playedCount).toFixed(1) : 0;
       return {
         player_id: id,
         uid: id,
         name: name,
         score: avgScore,
         played: playedCount,
       };
    });

    const activePlayers = [...playerStats, ...orphanStats].filter((p) => p.played > 0);`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync(file, content);
console.log('Patched LeagueStandings.js successfully');
