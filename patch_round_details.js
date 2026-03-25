const fs = require('fs');
const file = 'src/pages/RoundDetails.js';
let content = fs.readFileSync(file, 'utf8');

const oldLogic = `  const scoredPlayers = scores.map(score => {
    const player = players.find(p => p.player_id === score.player_id || p.uid === score.player_id);
    return {
      ...score,
      playerName: player ? player.name : 'Unknown Player',
    };
  })`;

const newLogic = `  const scoredPlayers = scores.map(score => {
    let player = players.find(p => p.player_id === score.player_id || p.uid === score.player_id);

    // Fallback: Link by player_name if the score belongs to the round's creator
    if (!player && round.player_id === score.player_id && round.player_name) {
       player = players.find(p => p.name.toLowerCase() === round.player_name.toLowerCase());
    }

    const fallbackName = (round.player_id === score.player_id && round.player_name) ? round.player_name : 'Unknown Player';

    return {
      ...score,
      playerName: player ? player.name : fallbackName,
    };
  })`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync(file, content);
console.log('Patched RoundDetails.js successfully');
