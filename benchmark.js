const fs = require('fs');
const path = require('path');

// Generate mock data
const numPlayers = 1000;
const numScores = 10000;

const players = Array.from({ length: numPlayers }, (_, i) => ({ player_id: `p${i}` }));
const scores = Array.from({ length: numScores }, (_, i) => ({
  player_id: `p${Math.floor(Math.random() * numPlayers)}`,
  score: `${Math.floor(Math.random() * 100)}`
}));

// Function 1: Original
function originalMethod(players, scores) {
  return players.map(player => {
    const playerScores = scores.filter(s => s.player_id === player.player_id);

    let totalScore = 0;
    let bestRoundScore = null;

    for (let i = 0; i < playerScores.length; i++) {
      const parsedScore = parseInt(playerScores[i].score);
      totalScore += (parsedScore || 0);

      if (!isNaN(parsedScore)) {
        if (bestRoundScore === null || parsedScore < bestRoundScore) {
          bestRoundScore = parsedScore;
        }
      }
    }

    return {
      ...player,
      totalScore,
      bestRoundScore,
      roundsPlayed: playerScores.length
    };
  });
}

// Function 2: Optimized
function optimizedMethod(players, scores) {
  const scoreMap = {};
  for (let i = 0; i < scores.length; i++) {
    const score = scores[i];
    if (!scoreMap[score.player_id]) {
      scoreMap[score.player_id] = [];
    }
    scoreMap[score.player_id].push(score);
  }

  return players.map(player => {
    const playerScores = scoreMap[player.player_id] || [];

    let totalScore = 0;
    let bestRoundScore = null;

    for (let i = 0; i < playerScores.length; i++) {
      const parsedScore = parseInt(playerScores[i].score);
      totalScore += (parsedScore || 0);

      if (!isNaN(parsedScore)) {
        if (bestRoundScore === null || parsedScore < bestRoundScore) {
          bestRoundScore = parsedScore;
        }
      }
    }

    return {
      ...player,
      totalScore,
      bestRoundScore,
      roundsPlayed: playerScores.length
    };
  });
}

// Warmup
originalMethod(players, scores);
optimizedMethod(players, scores);

// Benchmark original
console.time('original');
for (let i = 0; i < 100; i++) {
  originalMethod(players, scores);
}
console.timeEnd('original');

// Benchmark optimized
console.time('optimized');
for (let i = 0; i < 100; i++) {
  optimizedMethod(players, scores);
}
console.timeEnd('optimized');
