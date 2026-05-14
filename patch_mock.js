const fs = require('fs');

const code = fs.readFileSync('src/pages/Admin.jsx', 'utf8');

const updated = code.replace(
  '  const loadData = async () => {',
  `  const loadData = async () => {
    // Return early if we mock
    if (window.location.pathname === '/test-scores') {
      setScores([
        { score_id: '1', round_id: 'r1', player_id: 'p1', score: 25 },
        { score_id: '2', round_id: 'r2', player_id: 'p2', score: 30 }
      ]);
      setRounds([
        { round_id: 'r1', name: 'Round 1', date: '2023-01-01', location: 'Location 1', status: 'Active' },
        { round_id: 'r2', name: 'Round 2', date: '2023-02-01', location: 'Location 2', status: 'Archived' }
      ]);
      setPlayers([
        { player_id: 'p1', name: 'Player 1' },
        { player_id: 'p2', name: 'Player 2' }
      ]);
      return;
    }`
);

fs.writeFileSync('src/pages/Admin.jsx', updated);

const appCode = fs.readFileSync('src/App.jsx', 'utf8');

const updatedAppCode = appCode.replace(
  'import Admin from "./pages/Admin";',
  `import Admin from "./pages/Admin";\nimport { AdminScores } from "./pages/Admin";`
).replace(
  '<Route path="/admin"',
  `<Route path="/test-scores" element={<AdminScores />} />\n              <Route path="/admin"`
);

fs.writeFileSync('src/App.jsx', updatedAppCode);
