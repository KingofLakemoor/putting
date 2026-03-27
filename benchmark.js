const fs = require('fs');
const players = [];
const filteredScores = [];

// Generate dummy data
for (let i = 0; i < 5000; i++) {
  players.push({
    player_id: `player_${i}`,
    uid: i % 2 === 0 ? `uid_${i}` : null,
    name: `Player ${i}`
  });
}

for (let i = 0; i < 20000; i++) {
  filteredScores.push({
    player_id: `player_${Math.floor(Math.random() * 5000)}`,
    score: Math.floor(Math.random() * 50) + 18,
    round_id: `round_${Math.floor(Math.random() * 100)}`
  });
}

// O(N^2) Original
const startOriginal = process.hrtime.bigint();

const scoresByPlayerIdOriginal = {};
for (const score of filteredScores) {
  const player = players.find(p => p.uid === score.player_id || p.player_id === score.player_id);
  const targetId = player ? player.player_id : score.player_id;

  if (!scoresByPlayerIdOriginal[targetId]) {
    scoresByPlayerIdOriginal[targetId] = [];
  }
  scoresByPlayerIdOriginal[targetId].push(score);
}

const endOriginal = process.hrtime.bigint();
const originalTimeMs = Number(endOriginal - startOriginal) / 1000000;
console.log(`Original Time: ${originalTimeMs.toFixed(2)} ms`);


// O(N) Optimized
const startOptimized = process.hrtime.bigint();

const playersMap = new Map();
for (const p of players) {
  if (p.uid) playersMap.set(p.uid, p);
  if (p.player_id) playersMap.set(p.player_id, p);
}

const scoresByPlayerIdOptimized = {};
for (const score of filteredScores) {
  const player = playersMap.get(score.player_id);
  const targetId = player ? player.player_id : score.player_id;

  if (!scoresByPlayerIdOptimized[targetId]) {
    scoresByPlayerIdOptimized[targetId] = [];
  }
  scoresByPlayerIdOptimized[targetId].push(score);
}

const endOptimized = process.hrtime.bigint();
const optimizedTimeMs = Number(endOptimized - startOptimized) / 1000000;
console.log(`Optimized Time: ${optimizedTimeMs.toFixed(2)} ms`);
console.log(`Speedup: ${(originalTimeMs / optimizedTimeMs).toFixed(2)}x`);
