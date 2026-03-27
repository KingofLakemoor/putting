const { performance } = require('perf_hooks');

const numPlayers = 1000;
const numRounds = 100;
const numScores = 5000;

const players = [];
for (let i = 0; i < numPlayers; i++) {
  players.push({
    player_id: `p_${i}`,
    uid: `u_${i}`,
    name: `Player ${i}`
  });
}

const rounds = [];
for (let i = 0; i < numRounds; i++) {
  rounds.push({
    round_id: `r_${i}`,
    player_id: `p_${i % numPlayers}`,
    player_name: `Player ${i % numPlayers}`,
    date: '2023-10-01',
    name: `Round ${i}`,
    location: `Course ${i}`
  });
}

const scores = [];
for (let i = 0; i < numScores; i++) {
  scores.push({
    score_id: `s_${i}`,
    player_id: `p_${i % numPlayers}`,
    round_id: `r_${i % numRounds}`,
    score: 30 + (i % 20)
  });
}

// O(N^2) Approach
function getPlayerName(id, round_id) {
    let player = players.find(p => p.player_id === id || p.uid === id);
    if (!player && round_id) {
       const round = rounds.find(r => r.round_id === round_id);
       if (round && round.player_id === id && round.player_name) {
           player = players.find(p => p.name.toLowerCase() === round.player_name.toLowerCase());
       }
    }

    if (!player && round_id) {
        const round = rounds.find(r => r.round_id === round_id);
        if (round && round.player_id === id && round.player_name) {
             return round.player_name;
        }
    }

    return player ? player.name : 'Unknown Player';
}

function getRoundDetails(id) {
    const round = rounds.find(r => r.round_id === id);
    if (!round) return 'Unknown Round';

    const dateStr = new Date(round.date).toLocaleDateString('en-US', { timeZone: 'UTC' });
    return round.name ? `${round.name} - ${dateStr} - ${round.location}` : `${dateStr} - ${round.location}`;
}

const startUnoptimized = performance.now();
let resultsUnoptimized = 0;
for (const score of scores) {
  const pName = getPlayerName(score.player_id, score.round_id);
  const rDetails = getRoundDetails(score.round_id);
  if (pName && rDetails) resultsUnoptimized++;
}
const endUnoptimized = performance.now();
console.log(`Unoptimized Time: ${(endUnoptimized - startUnoptimized).toFixed(2)} ms`);

// O(1) Approach + Precomputed Date
const playersMap = new Map();
players.forEach(p => {
  if (p.player_id) playersMap.set(p.player_id, p);
  if (p.uid) playersMap.set(p.uid, p);
});

const playersByName = new Map();
players.forEach(p => {
  if (p.name) playersByName.set(p.name.toLowerCase(), p);
});

const roundsMap = new Map();
rounds.forEach(r => {
  if (r.round_id) {
    const dateStr = new Date(r.date).toLocaleDateString('en-US', { timeZone: 'UTC' });
    const details = r.name ? `${r.name} - ${dateStr} - ${r.location}` : `${dateStr} - ${r.location}`;
    roundsMap.set(r.round_id, { round: r, details });
  }
});

function getPlayerNameOptimized(id, round_id) {
    let player = playersMap.get(id);
    if (!player && round_id) {
       const roundInfo = roundsMap.get(round_id);
       const round = roundInfo ? roundInfo.round : null;
       if (round && round.player_id === id && round.player_name) {
           player = playersByName.get(round.player_name.toLowerCase());
       }
    }

    if (!player && round_id) {
        const roundInfo = roundsMap.get(round_id);
        const round = roundInfo ? roundInfo.round : null;
        if (round && round.player_id === id && round.player_name) {
             return round.player_name;
        }
    }

    return player ? player.name : 'Unknown Player';
}

function getRoundDetailsOptimized(id) {
    const roundInfo = roundsMap.get(id);
    if (!roundInfo) return 'Unknown Round';
    return roundInfo.details;
}

const startOptimized = performance.now();
let resultsOptimized = 0;
for (const score of scores) {
  const pName = getPlayerNameOptimized(score.player_id, score.round_id);
  const rDetails = getRoundDetailsOptimized(score.round_id);
  if (pName && rDetails) resultsOptimized++;
}
const endOptimized = performance.now();
console.log(`Optimized Time: ${(endOptimized - startOptimized).toFixed(2)} ms`);
