const fs = require('fs');
const file = 'src/pages/Admin.js';
let content = fs.readFileSync(file, 'utf8');

const oldLogic = `  const getPlayerName = (id) => {
    const player = players.find(p => p.player_id === id || p.uid === id);
    return player ? player.name : 'Unknown Player';
  };`;

const newLogic = `  const getPlayerName = (id, round_id) => {
    let player = players.find(p => p.player_id === id || p.uid === id);
    if (!player && round_id) {
       const round = rounds.find(r => r.round_id === round_id);
       if (round && round.player_id === id && round.player_name) {
           player = players.find(p => p.name.toLowerCase() === round.player_name.toLowerCase());
       }
    }

    // Fallback if player document STILL not found, just show the name from the round so it's not "Unknown"
    if (!player && round_id) {
        const round = rounds.find(r => r.round_id === round_id);
        if (round && round.player_id === id && round.player_name) {
             return round.player_name;
        }
    }

    return player ? player.name : 'Unknown Player';
  };`;

content = content.replace(oldLogic, newLogic);
content = content.replace('{getPlayerName(score.player_id)}', '{getPlayerName(score.player_id, score.round_id)}');
fs.writeFileSync(file, content);
console.log('Patched Admin.js successfully');
