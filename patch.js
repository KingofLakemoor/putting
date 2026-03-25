const fs = require('fs');
let file = fs.readFileSync('src/pages/VenueDashboard.js', 'utf8');

// add PLAYERS_KEY
file = file.replace("const ROUNDS_KEY = 'putting_league_rounds';", "const ROUNDS_KEY = 'putting_league_rounds';\nconst PLAYERS_KEY = 'putting_league_players';");

// add players state
file = file.replace("  const [activeRounds, setActiveRounds] = useState([]);", "  const [activeRounds, setActiveRounds] = useState([]);\n  const [players, setPlayers] = useState([]);");

// add players listener
file = file.replace("    // Listen for live rounds on the course", "    const unsubscribePlayers = onSnapshot(collection(db, PLAYERS_KEY), (snapshot) => {\n      setPlayers(snapshot.docs.map(doc => doc.data()));\n    });\n\n    // Listen for live rounds on the course");
file = file.replace("      unsubscribeRounds();", "      unsubscribeRounds();\n      unsubscribePlayers();");

// fix active round filter
file = file.replace("      const currentActive = allRounds.filter(r => (r.status || '').toLowerCase() === 'active' && r.player_id && r.course_id && r.scores);", "      const currentActive = allRounds.filter(r => (r.status || '').toLowerCase() === 'active' && r.player_id && r.scores);");

// calculate opponent scores in livePlayers
const searchStr = `  const livePlayers = useMemo(() => {
    return activeRounds.map(r => {
      let currentScore = 0;
      let holesPlayed = 0;

      if (r.scores) {
        Object.values(r.scores).forEach(s => {
          if (s > 0) {
            currentScore += s;
            holesPlayed++;
          }
        });
      }
      return {
        id: r.round_id,
        playerName: r.player_name || 'Unknown Player',
        eventName: r.event_round_name || 'Practice Round',
        currentScore,
        holesPlayed
      };
    }).sort((a, b) => b.holesPlayed - a.holesPlayed); // Most progress first
  }, [activeRounds]);`;

const replacementStr = `  const livePlayers = useMemo(() => {
    const playersList = [];

    activeRounds.forEach(r => {
      let currentScore = 0;
      let holesPlayed = 0;

      if (r.scores) {
        Object.values(r.scores).forEach(s => {
          if (s > 0) {
            currentScore += s;
            holesPlayed++;
          }
        });
      }

      playersList.push({
        id: r.round_id + '_p1',
        playerName: r.player_name || 'Unknown Player',
        eventName: r.event_round_name || 'Practice Round',
        currentScore,
        holesPlayed
      });

      if (r.opponent_id && r.opponent_scores) {
        let oppScore = 0;
        let oppHolesPlayed = 0;
        Object.values(r.opponent_scores).forEach(s => {
          if (s > 0) {
            oppScore += s;
            oppHolesPlayed++;
          }
        });

        const opponent = players.find(p => p.player_id === r.opponent_id || p.uid === r.opponent_id);
        const oppName = opponent ? opponent.name : 'Unknown Opponent';

        playersList.push({
          id: r.round_id + '_p2',
          playerName: oppName,
          eventName: r.event_round_name || 'Practice Round',
          currentScore: oppScore,
          holesPlayed: oppHolesPlayed
        });
      }
    });

    return playersList.sort((a, b) => b.holesPlayed - a.holesPlayed); // Most progress first
  }, [activeRounds, players]);`;

file = file.replace(searchStr, replacementStr);

// remove pointer-events-none
file = file.replace('className="scale-110 transform origin-top w-[90%] mx-auto pointer-events-none"', 'className="scale-110 transform origin-top w-[90%] mx-auto"');

fs.writeFileSync('src/pages/VenueDashboard.js', file);
