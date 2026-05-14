const fs = require('fs');

const code = fs.readFileSync('src/pages/Admin.jsx', 'utf8');

const updated = code.replace(
  '  const [editingId, setEditingId] = useState(null);',
  `  const [editingId, setEditingId] = useState(null);\n  const [filterRoundId, setFilterRoundId] = useState("");\n  const [filterPlayerId, setFilterPlayerId] = useState("");\n  const [showArchived, setShowArchived] = useState(false);`
).replace(
  '  const getRoundDetails = (id) => {',
  `  const filteredScores = useMemo(() => {
    return scores.filter((score) => {
      // 1. Check if the round is archived
      const round = roundsMap.get(score.round_id);
      const isArchived =
        round && (round.status || "").toLowerCase() === "archived";

      if (!showArchived && isArchived) {
        return false;
      }

      // 2. Check round filter
      if (filterRoundId && score.round_id !== filterRoundId) {
        return false;
      }

      // 3. Check player filter
      if (filterPlayerId && score.player_id !== filterPlayerId) {
        return false;
      }

      return true;
    });
  }, [scores, roundsMap, showArchived, filterRoundId, filterPlayerId]);

  const getRoundDetails = (id) => {`
).replace(
  '        {scores.length === 0 ? (',
  `        <div className="bg-dark-surface border border-slate-800 rounded-2xl p-4 shadow-xl mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label
              className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
              htmlFor="filterRound"
            >
              Filter by Round
            </label>
            <select
              id="filterRound"
              value={filterRoundId}
              onChange={(e) => setFilterRoundId(e.target.value)}
              className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:border-kelly-green focus:outline-none transition-colors appearance-none"
            >
              <option value="">All Rounds</option>
              {rounds.map((round) => (
                <option key={round.round_id} value={round.round_id}>
                  {round.name || "Unnamed Round"} -{" "}
                  {round.date
                    ? new Date(round.date).toLocaleDateString("en-US", {
                        timeZone: "UTC",
                      })
                    : "No Date"}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label
              className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
              htmlFor="filterPlayer"
            >
              Filter by Player
            </label>
            <select
              id="filterPlayer"
              value={filterPlayerId}
              onChange={(e) => setFilterPlayerId(e.target.value)}
              className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:border-kelly-green focus:outline-none transition-colors appearance-none"
            >
              <option value="">All Players</option>
              {players
                .slice()
                .sort((a, b) => {
                  const aName = a.name ? a.name.toLowerCase() : "";
                  const bName = b.name ? b.name.toLowerCase() : "";
                  return aName.localeCompare(bName);
                })
                .map((player) => (
                  <option key={player.player_id} value={player.player_id}>
                    {formatDisplayName(player.name, players)}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="w-4 h-4 rounded bg-dark-bg border-slate-700 text-kelly-green focus:ring-kelly-green focus:ring-offset-dark-surface"
              />
              Show Archived Rounds
            </label>
          </div>
        </div>

        {filteredScores.length === 0 ? (`
).replace(
  '                {scores.map((score) => (',
  '                {filteredScores.map((score) => ('
).replace(
  '            No scores reported yet.',
  '            No scores found matching criteria.'
);

fs.writeFileSync('src/pages/Admin.jsx', updated);
