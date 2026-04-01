const fs = require('fs');

let code = fs.readFileSync('src/components/PuttingDashboard.jsx', 'utf8');

// 1. Add error state
code = code.replace(
  "const [trendColor, setTrendColor] = useState('text-slate-500');",
  "const [trendColor, setTrendColor] = useState('text-slate-500');\n  const [error, setError] = useState(null);"
);

// 2. Clear error on mount / dialog close
code = code.replace(
  "onClose={() => setIsOpen(false)}",
  "onClose={() => { setIsOpen(false); setError(null); }}"
);

code = code.replace(
  "setIsOpen(true);",
  "setIsOpen(true);\n        setError(null);"
);

// 3. Update handleSelectEventRound
const newHandleSelect = `
  const handleSelectEventRound = async (eventRound) => {
    try {
      if (eventRound.score_limit) {
         // Check how many scores they've submitted for this event
         const historicalScores = await getScoresForPlayer(currentUser.uid);
         // Filter for this event round
         const scoresForEvent = historicalScores.filter(s => s.round_id === eventRound.round_id);
         if (scoresForEvent.length >= eventRound.score_limit) {
            setError(\`You have reached the limit of \${eventRound.score_limit} score(s) for this event.\`);
            // Clear error after a few seconds
            setTimeout(() => setError(null), 5000);
            return;
         }
      }

      setIsOpen(false);
      setError(null);
      const userName = currentUser.displayName || currentUser.email;
      const newRound = await createActiveRound(currentUser.uid, userName, eventRound.round_id, eventRound.name, eventRound.course_id);
      navigate(\`/scorecard/\${newRound.round_id}\`);
    } catch (error) {
      console.error("Error creating round from event:", error);
    }
  };
`;

code = code.replace(
  /const handleSelectEventRound = async \(eventRound\) => {[\s\S]*?};\n/,
  newHandleSelect
);

// 4. Show error inside the dialog
code = code.replace(
  '<div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">',
  `{error && (
                      <div className="bg-red-500/10 text-red-500 p-3 rounded-xl text-xs font-bold uppercase tracking-wider mb-4">
                        {error}
                      </div>
                    )}
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">`
);

// 5. Show error on dashboard direct clicks
code = code.replace(
  '<div className="flex items-center gap-2 mb-4">',
  `{error && (
              <div className="bg-red-500/10 text-red-500 p-3 rounded-xl text-xs font-bold uppercase tracking-wider mb-4">
                {error}
              </div>
           )}
           <div className="flex items-center gap-2 mb-4">`
);

fs.writeFileSync('src/components/PuttingDashboard.jsx', code);
