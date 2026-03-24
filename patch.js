const fs = require('fs');
const filepath = 'src/components/ScoreEntry.js';
let content = fs.readFileSync(filepath, 'utf8');

// 1. We replace the useState and useEffect with derived state
content = content.replace(
  'const [score, setScore] = useState(scoreValue || par);\n  const [opponentScore, setOpponentScore] = useState(opponentScoreValue || par);\n\n  useEffect(() => {\n    setScore(scoreValue || par);\n    setOpponentScore(opponentScoreValue || par);\n  }, [holeNumber, scoreValue, opponentScoreValue, par]);',
  `const [score, setScore] = useState(scoreValue !== undefined ? scoreValue : null);
  const [opponentScore, setOpponentScore] = useState(opponentScoreValue !== undefined ? opponentScoreValue : null);
  const [prevHole, setPrevHole] = useState(holeNumber);

  if (holeNumber !== prevHole) {
    setPrevHole(holeNumber);
    setScore(scoreValue !== undefined ? scoreValue : null);
    setOpponentScore(opponentScoreValue !== undefined ? opponentScoreValue : null);
  }`
);

// 2. We replace the color logic
content = content.replace(
  `  const getScoreColor = (s) => {
    if (s < par) return 'text-kelly-green border-kelly-green bg-kelly-green/10';
    if (s > par) return 'text-red-500 border-red-500 bg-red-500/10';
    return 'text-white border-slate-700 bg-slate-800/50';
  };`,
  `  const getScoreColor = (s) => {
    if (s === null) return 'text-white border-slate-700 bg-slate-800/50';
    if (s < par) return 'text-kelly-green border-kelly-green bg-kelly-green/10';
    if (s > par) return 'text-red-500 border-red-500 bg-red-500/10';
    return 'text-white border-slate-700 bg-slate-800/50';
  };`
);

// 3. Update the display value from score to (score === null ? '-' : score)
content = content.replace(
  '<span className="text-6xl md:text-7xl font-data font-black">{score}</span>',
  '<span className="text-6xl md:text-7xl font-data font-black">{score === null ? \'-\' : score}</span>'
);

content = content.replace(
  '<span className="text-6xl md:text-7xl font-data font-black">{opponentScore}</span>',
  '<span className="text-6xl md:text-7xl font-data font-black">{opponentScore === null ? \'-\' : opponentScore}</span>'
);

// 4. Update the +/- logic for User
content = content.replace(
  'onClick={() => setScore(Math.max(1, score - 1))}',
  'onClick={() => setScore(score === null ? Math.max(1, par - 1) : Math.max(1, score - 1))}'
);

content = content.replace(
  'onClick={() => setScore(score + 1)}',
  'onClick={() => setScore(score === null ? par + 1 : score + 1)}'
);

// 5. Update the +/- logic for Opponent
content = content.replace(
  'onClick={() => setOpponentScore(Math.max(1, opponentScore - 1))}',
  'onClick={() => setOpponentScore(opponentScore === null ? Math.max(1, par - 1) : Math.max(1, opponentScore - 1))}'
);

content = content.replace(
  'onClick={() => setOpponentScore(opponentScore + 1)}',
  'onClick={() => setOpponentScore(opponentScore === null ? par + 1 : opponentScore + 1)}'
);

// 6. Disable Save Hole button if any score is missing
content = content.replace(
  `<button
            onClick={() => onSave(score, opponentId ? opponentScore : undefined)}
            className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold bg-kelly-green text-dark-bg shadow-[0_0_20px_rgba(76,187,23,0.3)]"
          >`,
  `{/* Disable SAVE HOLE if scores are not yet filled */}
          <button
            onClick={() => onSave(score, opponentId ? opponentScore : undefined)}
            disabled={score === null || (opponentId && opponentScore === null)}
            className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold bg-kelly-green text-dark-bg shadow-[0_0_20px_rgba(76,187,23,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >`
);


fs.writeFileSync(filepath, content);
