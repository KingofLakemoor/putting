import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, MapPin, Calendar } from 'lucide-react';
import { getPlayers, getScores, getRounds, getSettings, getCourses } from '../db';
import { formatDisplayName } from '../utils/format';
import SkeletonLoader from '../components/SkeletonLoader';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [dates, setDates] = useState([]);
  const [filter, setFilter] = useState('global');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const players = await getPlayers();
      let scores = await getScores();
      const allRounds = await getRounds();
      const settings = await getSettings();
      const courses = await getCourses();

      const courseMap = {};
      courses.forEach(c => {
        courseMap[c.course_id] = {
            ...c,
            _computedTotalPar: Array.isArray(c.holes) ? c.holes.reduce((sum, h) => sum + (h.par || 2), 0) : 36,
            _computedTotalHoles: Array.isArray(c.holes) ? c.holes.length : 18
        };
      });

      const archivedSeasons = settings.archived_seasons || [];

      // Filter out rounds that belong to archived seasons
      const visibleRounds = allRounds.filter(r => !archivedSeasons.includes(r.season));

      setRounds(visibleRounds);

      const uniqueSeasons = [...new Set(allRounds.map(r => r.season).filter(Boolean))];
      setSeasons(uniqueSeasons); // We keep all seasons for the "Seasons" dropdown

      const uniqueDates = [...new Set(visibleRounds.map(r => r.date).filter(Boolean))];
      // Sort dates descending
      uniqueDates.sort((a, b) => new Date(b) - new Date(a));
      setDates(uniqueDates);

      if (filter !== 'global') {
        if (filter.startsWith('season_')) {
          const seasonName = filter.substring(7);
          const roundIdsInSeason = allRounds.filter(r => r.season === seasonName).map(r => r.round_id);
          scores = scores.filter(s => roundIdsInSeason.includes(s.round_id));
        } else if (filter.startsWith('date_')) {
          const filterDate = filter.substring(5);
          const roundIdsInDate = visibleRounds.filter(r => r.date === filterDate).map(r => r.round_id);
          scores = scores.filter(s => roundIdsInDate.includes(s.round_id));
        } else {
          scores = scores.filter(s => String(s.round_id) === String(filter));
        }
      } else {
         // Global filter - still exclude archived seasons rounds
         const visibleRoundIds = visibleRounds.map(r => r.round_id);
         scores = scores.filter(s => visibleRoundIds.includes(s.round_id));
      }

      const roundsMap = {};
      allRounds.forEach(r => {
        roundsMap[r.round_id] = r;
      });

      const playersMap = new Map();
      players.forEach(p => {
        if (p.uid) playersMap.set(p.uid, p);
        if (p.player_id) playersMap.set(p.player_id, p);
      });

      // Pre-calculate a map of player_id to an array of scores
      // to reduce complexity of calculating aggregated score below
      // from O(N*M) to O(N+M)
      const scoresByPlayerId = {};
      for (let i = 0; i < scores.length; i++) {
        const score = scores[i];
        const player = playersMap.get(score.player_id);
        const targetId = player ? player.player_id : score.player_id;

        if (!scoresByPlayerId[targetId]) {
          scoresByPlayerId[targetId] = [];
        }
        scoresByPlayerId[targetId].push(score);
      }

      // Calculate aggregated score
      const playerStats = players.map(player => {
        const playerScores = scoresByPlayerId[player.player_id] || [];

        let totalScore = 0;
        let totalPar = 0;
        let totalHoles = 0;
        let hasDNF = false;

        for (let i = 0; i < playerScores.length; i++) {
          const scoreObj = playerScores[i];

          if (scoreObj.status === 'DNF') {
            hasDNF = true;
          }

          const parsedScore = parseInt(scoreObj.score);

          if (!isNaN(parsedScore) && scoreObj.status !== 'DNF') {
            totalScore += parsedScore;

            // Find round and course to determine par and holes
            const round = roundsMap[scoreObj.round_id];
            let parForRound = 36; // Default to 18 holes of par 2
            let holesForRound = 18;

            if (round && round.course_id) {
               const course = courseMap[round.course_id];
               if (course) {
                  parForRound = course._computedTotalPar || 36;
                  holesForRound = course._computedTotalHoles || 18;
               }
            }

            totalPar += parForRound;
            totalHoles += holesForRound;
          }
        }

        const relativeScore = totalScore - totalPar;
        const avgScore = totalHoles > 0 ? ((totalScore / totalHoles) * 18).toFixed(1) : 0;

        return {
          ...player,
          name: formatDisplayName(player.name, players),
          totalScore,
          totalPar,
          relativeScore,
          totalHoles,
          avgScore,
          roundsPlayed: playerScores.length,
          hasDNF
        };
      });

      // Filter out players who haven't played any rounds yet to avoid
      // 0 scores automatically placing them at the top.
      const activePlayers = playerStats.filter(p => p.roundsPlayed > 0);

      // Sort by score ascending (lower is better), push DNF to bottom
      activePlayers.sort((a, b) => {
        if (a.hasDNF && !b.hasDNF) return 1;
        if (!a.hasDNF && b.hasDNF) return -1;
        return a.relativeScore - b.relativeScore;
      });

      setLeaderboard(activePlayers);
      setIsLoading(false);
    };

    setIsLoading(true);
    fetchData();
  }, [filter]);

  const getActiveRound = () => {
    if (!filter.startsWith('season_') && !filter.startsWith('date_') && filter !== 'global') {
      return rounds.find(r => r.round_id === filter);
    }
    return null;
  };

  const activeRound = getActiveRound();
  const cutLine = activeRound?.cut_line;

  const getHeaderTitle = () => {
    if (filter.startsWith('season_')) return `${filter.substring(7)} Rankings`;
    if (filter.startsWith('date_')) {
      const d = new Date(filter.substring(5));
      return !isNaN(d.getTime()) ? `${d.toLocaleDateString('en-US', { timeZone: 'UTC' })} Rankings` : 'Date Rankings';
    }
    if (filter === 'global') return 'Global Rankings';
    return 'Event Leaderboard';
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white p-4 md:p-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-slate-800 pb-4 gap-4">
        <div>
          <h2 className="font-sports text-4xl uppercase tracking-tighter flex items-center gap-3">
            <Trophy className="text-kelly-green" size={32} />
            {getHeaderTitle()}
          </h2>
          <p className="font-data text-[10px] text-slate-500 uppercase tracking-[0.2em]">Live Standings</p>
        </div>

        <div className="w-full md:w-auto">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full md:w-64 bg-dark-surface border border-slate-700 text-white rounded-xl p-3 focus:border-kelly-green focus:outline-none transition-colors appearance-none font-bold text-sm"
          >
            <option value="global">Global Rankings</option>
            {seasons.length > 0 && (
              <optgroup label="Seasons">
                {seasons.map(season => (
                  <option key={`season_${season}`} value={`season_${season}`}>
                    {season} Rankings
                  </option>
                ))}
              </optgroup>
            )}
            {dates.length > 0 && (
              <optgroup label="Dates">
                {dates.map(date => {
                  const d = new Date(date);
                  const validDate = !isNaN(d.getTime());
                  return (
                    <option key={`date_${date}`} value={`date_${date}`}>
                      {validDate ? d.toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'Unknown Date'}
                    </option>
                  );
                })}
              </optgroup>
            )}
            <optgroup label="Events / Rounds">
              {rounds.map(round => {
                const d = new Date(round.date);
                const dateStr = !isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'Unknown Date';
                const displayStr = round.name ? `${round.name} - ${dateStr} - ${round.location}` : `${dateStr} - ${round.location}`;
                return (
                  <option key={round.round_id} value={round.round_id}>
                    {displayStr}
                  </option>
                );
              })}
            </optgroup>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonLoader count={5} />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center text-slate-500 p-12 border border-dashed border-slate-800 rounded-2xl bg-dark-surface/30">
          No data yet. Add players and scores to see the leaderboard!
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((player, index) => {
            const rank = index + 1;
            const isBelowCut = cutLine && rank > cutLine;

            return (
              <React.Fragment key={player.player_id}>
                {cutLine && rank === cutLine + 1 && (
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t-2 border-dashed border-purple-500/50"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-dark-bg px-4 text-[10px] font-bold uppercase tracking-widest text-purple-400">
                        Projected Cut Line
                      </span>
                    </div>
                  </div>
                )}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`relative group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all duration-300 gap-4 sm:gap-0
                  ${index < 3
                    ? 'bg-dark-surface border-slate-700 shadow-[0_0_15px_rgba(76,187,23,0.1)] border-l-4 border-l-kelly-green'
                    : isBelowCut
                      ? 'bg-transparent border-slate-800 opacity-50'
                      : 'bg-transparent border-slate-800 opacity-90 hover:opacity-100 hover:bg-dark-surface/50'
                  }`}
              >
                {/* Rank and Name */}
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <span className={`font-sports text-3xl sm:text-4xl italic tracking-tighter ${index < 3 ? 'text-white' : 'text-slate-600'}`}>
                      {rank < 10 ? `0${rank}` : rank}
                    </span>
                    {index === 0 && (
                      <Medal size={16} className="absolute -top-2 -right-3 text-kelly-green animate-pulse" />
                    )}
                  </div>

                  <div>
                    <p className={`font-bold text-lg uppercase tracking-tight ${index === 0 ? 'text-kelly-green' : 'text-white'}`}>
                      {player.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-data uppercase flex items-center gap-1">
                      <Calendar size={10} /> Rounds Played: {player.roundsPlayed}
                    </p>
                  </div>
                </div>

                {/* Stats Block */}
                <div className="flex flex-1 sm:flex-none justify-between sm:justify-end items-center gap-4 sm:gap-8 mt-2 sm:mt-0">
                  <div className="text-center">
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Avg</p>
                    <p className="text-xl font-data font-bold text-slate-300">
                      {player.avgScore}
                    </p>
                  </div>

                  <div className="text-center sm:border-l border-slate-800 sm:pl-8">
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Thru</p>
                    <p className="text-xl font-data font-bold text-slate-300">
                      {player.totalHoles}
                    </p>
                  </div>

                  <div className="text-center sm:border-l border-slate-800 sm:pl-8 min-w-[60px]">
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Tot</p>
                    <p className={`text-3xl font-data font-black ${
                      player.hasDNF ? 'text-red-500 text-xl' :
                      player.relativeScore > 0 ? 'text-red-500' :
                      player.relativeScore < 0 ? 'text-kelly-green' :
                      'text-slate-300'
                    }`}>
                      {player.hasDNF ? 'DNF' :
                       player.relativeScore > 0 ? `+${player.relativeScore}` :
                       player.relativeScore === 0 ? 'E' :
                       player.relativeScore}
                    </p>
                  </div>
                </div>

                {/* Subtle Glow Effect for Top Rank */}
                {index === 0 && (
                  <div className="absolute inset-0 bg-kelly-green/5 rounded-xl pointer-events-none blur-xl -z-10" />
                )}
              </motion.div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
