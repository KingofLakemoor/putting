const fs = require('fs');

let code = fs.readFileSync('src/pages/Admin.jsx', 'utf8');

// 1. Add scoreLimit state
code = code.replace(
  "const [isSignature, setIsSignature] = useState(false);",
  "const [isSignature, setIsSignature] = useState(false);\n  const [scoreLimit, setScoreLimit] = useState('');"
);

// 2. Update newRound object in handleSubmit
code = code.replace(
  "course_id: courseId,\n      is_signature: isSignature",
  "course_id: courseId,\n      is_signature: isSignature,\n      score_limit: scoreLimit ? parseInt(scoreLimit, 10) : null"
);

// 3. Clear scoreLimit in handleSubmit
code = code.replace(
  "setIsSignature(false);\n    loadData();",
  "setIsSignature(false);\n    setScoreLimit('');\n    loadData();"
);

// 4. Add Input in Form
const formInsert = `
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="scoreLimit">Score Submission Limit</label>
              <input
                type="number"
                id="scoreLimit"
                className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors"
                value={scoreLimit}
                onChange={(e) => setScoreLimit(e.target.value)}
                placeholder="Leave blank for unlimited"
                min="1"
              />
              <p className="text-[10px] text-slate-500 mt-2">Maximum number of scores a single player can submit for this round.</p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-dark-bg border border-slate-700 rounded-xl cursor-pointer" onClick={() => setIsSignature(!isSignature)}>`;

code = code.replace(
  '<div className="flex items-center gap-3 p-4 bg-dark-bg border border-slate-700 rounded-xl cursor-pointer" onClick={() => setIsSignature(!isSignature)}>',
  formInsert
);

// 5. Update render to show limit
code = code.replace(
  '<span className="text-xs text-slate-400">{round.location}</span>\n                      </div>\n                    </td>',
  '<span className="text-xs text-slate-400">{round.location}</span>\n                        {round.score_limit && (\n                          <span className="text-[10px] text-kelly-green uppercase font-bold mt-1">Limit: {round.score_limit} Scores</span>\n                        )}\n                      </div>\n                    </td>'
);

fs.writeFileSync('src/pages/Admin.jsx', code);
