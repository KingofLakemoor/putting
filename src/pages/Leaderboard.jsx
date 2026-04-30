import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, MapPin, Calendar, Star } from "lucide-react";
import {
  getPlayers,
  getScores,
  getRounds,
  getSettings,
  getCourses,
} from "../db";
import { formatDisplayName } from "../utils/format";
import SkeletonLoader from "../components/SkeletonLoader";

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("global");
  const [sortMetric, setSortMetric] = useState("top2");
  const [rawPlayerStats, setRawPlayerStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      let [players, scores, allRounds, settings, courses] = await Promise.all([
        getPlayers(),
        getScores(),
        getRounds(),
        getSettings(),
        getCourses(),
      ]);

      const courseMap = {};
      courses.forEach((c) => {
        courseMap[c.course_id] = {
          ...c,
          _computedTotalPar: Array.isArray(c.holes)
            ? c.holes.reduce((sum, h) => sum + (h.par || 2), 0)
            : 36,
          _computedTotalHoles: Array.isArray(c.holes) ? c.holes.length : 18,
        };
      });

      const archivedSeasons = settings.archived_seasons || [];

      // Filter out rounds that belong to archived seasons
      const visibleRounds = allRounds.filter(
        (r) => !archivedSeasons.includes(r.season),
      );

      setRounds(visibleRounds);

      const uniqueSeasons = [
        ...new Set(allRounds.map((r) => r.season).filter(Boolean)),
      ];
      setSeasons(uniqueSeasons); // We keep all seasons for the "Seasons" dropdown

      const eventsList = [];
      const seenEventIds = new Set();
      const seenDates = new Set();

      visibleRounds.forEach((r) => {
        if (r.event_id) {
          if (!seenEventIds.has(r.event_id)) {
            seenEventIds.add(r.event_id);
            eventsList.push({
              filterValue: `event_${r.event_id}`,
              name: r.name
                ? r.name.replace(/\s*-?\s*Round\s*\d+.*$/i, "")
                : "Unnamed Event",
              date: r.date,
            });
          }
        } else if (r.date) {
          if (!seenDates.has(r.date)) {
            seenDates.add(r.date);
            eventsList.push({
              filterValue: `date_${r.date}`,
              name: new Date(r.date).toLocaleDateString("en-US", {
                timeZone: "UTC",
              }),
              date: r.date,
            });
          }
        }
      });

      eventsList.sort((a, b) => new Date(b.date) - new Date(a.date));
      setEvents(eventsList);

      let filteredRounds = visibleRounds;

      if (filter !== "global") {
        if (filter.startsWith("season_")) {
          const seasonName = filter.substring(7);
          const roundIdsInSeason = allRounds
            .filter((r) => r.season === seasonName)
            .map((r) => r.round_id);
          scores = scores.filter((s) => roundIdsInSeason.includes(s.round_id));
          filteredRounds = allRounds.filter((r) => r.season === seasonName);
        } else if (filter.startsWith("event_")) {
          const filterEventId = filter.substring(6);
          const roundIdsInEvent = visibleRounds
            .filter((r) => String(r.event_id) === filterEventId)
            .map((r) => r.round_id);
          scores = scores.filter((s) => roundIdsInEvent.includes(s.round_id));
          filteredRounds = visibleRounds.filter((r) => String(r.event_id) === filterEventId);
        } else if (filter.startsWith("date_")) {
          const filterDate = filter.substring(5);
          const roundIdsInDate = visibleRounds
            .filter((r) => r.date === filterDate)
            .map((r) => r.round_id);
          scores = scores.filter((s) => roundIdsInDate.includes(s.round_id));
          filteredRounds = visibleRounds.filter((r) => r.date === filterDate);
        } else {
          scores = scores.filter((s) => String(s.round_id) === String(filter));
          filteredRounds = visibleRounds.filter((r) => String(r.round_id) === String(filter));
        }
      } else {
        // Global filter - still exclude archived seasons rounds
        const visibleRoundIds = visibleRounds.map((r) => r.round_id);
        scores = scores.filter((s) => visibleRoundIds.includes(s.round_id));
      }

      const roundsMap = {};
      allRounds.forEach((r) => {
        roundsMap[r.round_id] = r;
      });

      const playersMap = new Map();
      players.forEach((p) => {
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

      // Calculate dynamic 602 Cup Points
      const cupPointsByPlayer = {};

      // Group filtered rounds by event_id or date if no event_id
      const eventsMap = {};
      filteredRounds.forEach(r => {
        const key = r.event_id ? `event_${r.event_id}` : `date_${r.date}`;
        if (!eventsMap[key]) {
          eventsMap[key] = {
            rounds: [],
            isSignature: false
          };
        }
        eventsMap[key].rounds.push(r.round_id);
        if (r.is_signature) {
          eventsMap[key].isSignature = true;
        }
      });

      // Calculate points per event
      Object.values(eventsMap).forEach(evt => {
        const eventScores = scores.filter(s => evt.rounds.includes(s.round_id));
        if (eventScores.length === 0) return;

        const playerEventStats = {};
        eventScores.forEach(s => {
          const pId = s.player_id;
          if (!playerEventStats[pId]) {
            playerEventStats[pId] = { total: 0, hasDNF: false };
          }
          if (s.status === "DNF") {
            playerEventStats[pId].hasDNF = true;
          } else {
            const scoreVal = parseInt(s.score, 10);
            if (!isNaN(scoreVal)) {
              playerEventStats[pId].total += scoreVal;
            }
          }
        });

        const validPlayers = Object.keys(playerEventStats)
          .filter(pId => !playerEventStats[pId].hasDNF)
          .map(pId => ({ player_id: pId, total: playerEventStats[pId].total }));

        validPlayers.sort((a, b) => a.total - b.total);

        const baseScale = [100, 75, 60, 50, 40, 35, 30, 25, 20, 15, 10, 10, 10, 10, 10];
        const signatureScale = [150, 115, 90, 75, 60, 50, 45, 35, 30, 20, 15, 15, 15, 15, 15];
        const scale = evt.isSignature ? signatureScale : baseScale;
        const participationPoints = evt.isSignature ? 10 : 5;

        let rank = 1;
        for (let i = 0; i < validPlayers.length; ) {
          const currentScore = validPlayers[i].total;
          let tieCount = 0;

          while (
            i + tieCount < validPlayers.length &&
            validPlayers[i + tieCount].total === currentScore
          ) {
            tieCount++;
          }

          let totalPointsForTie = 0;
          for (let j = 0; j < tieCount; j++) {
            const positionIndex = rank - 1 + j;
            if (positionIndex < scale.length) {
              totalPointsForTie += scale[positionIndex];
            } else {
              totalPointsForTie += participationPoints;
            }
          }

          const pointsPerPlayer = totalPointsForTie / tieCount;

          for (let j = 0; j < tieCount; j++) {
            const targetId = playersMap.get(validPlayers[i + j].player_id)?.player_id || validPlayers[i + j].player_id;
            if (!cupPointsByPlayer[targetId]) cupPointsByPlayer[targetId] = 0;
            cupPointsByPlayer[targetId] += pointsPerPlayer;
          }

          rank += tieCount;
          i += tieCount;
        }

        // Add participation points for DNFs (if they played but DNF'd)
        Object.keys(playerEventStats).forEach(pId => {
          if (playerEventStats[pId].hasDNF) {
            const targetId = playersMap.get(pId)?.player_id || pId;
            if (!cupPointsByPlayer[targetId]) cupPointsByPlayer[targetId] = 0;
            cupPointsByPlayer[targetId] += participationPoints;
          }
        });
      });

      // Calculate aggregated score
      const playerStats = players.map((player) => {
        const playerScores = scoresByPlayerId[player.player_id] || [];

        let totalScore = 0;
        let totalPar = 0;
        let totalHoles = 0;
        let hasDNF = false;

        const individualRounds = [];

        for (let i = 0; i < playerScores.length; i++) {
          const scoreObj = playerScores[i];

          if (scoreObj.status === "DNF") {
            hasDNF = true;
          }

          const parsedScore = parseInt(scoreObj.score);

          if (!isNaN(parsedScore) && scoreObj.status !== "DNF") {
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

            individualRounds.push({
               score: parsedScore,
               par: parForRound,
               relative: parsedScore - parForRound
            });
          }
        }

        const relativeScoreAll = totalScore - totalPar;
        const avgScore =
          totalHoles > 0 ? ((totalScore / totalHoles) * 18).toFixed(1) : 0;

        // Calculate Best 2 Rounds
        individualRounds.sort((a, b) => a.relative - b.relative);
        let relativeScoreTop2 = 0;
        let top2Holes = 0;
        let top2Par = 0;
        let top2Score = 0;

        for (let i = 0; i < Math.min(2, individualRounds.length); i++) {
            relativeScoreTop2 += individualRounds[i].relative;
            top2Holes += 18; // approximation
            top2Par += individualRounds[i].par;
            top2Score += individualRounds[i].score;
        }

        return {
          ...player,
          name: formatDisplayName(player.name, players),
          totalScore,
          totalPar,
          relativeScoreAll,
          relativeScoreTop2,
          totalHoles,
          top2Holes,
          top2Par,
          top2Score,
          avgScore,
          roundsPlayed: playerScores.length,
          validRoundsPlayed: individualRounds.length,
          hasDNF,
          cupPoints: cupPointsByPlayer[player.player_id] || 0,
        };
      });

      // Filter out players who haven't played any rounds yet to avoid
      // 0 scores automatically placing them at the top.
      const activePlayers = playerStats.filter((p) => p.roundsPlayed > 0);

      setRawPlayerStats(activePlayers);
      setIsLoading(false);
    };

    setIsLoading(true);
    fetchData().catch(e => {
        console.error("Error fetching leaderboard data", e);
        setIsLoading(false);
    });
  }, [filter]);

  useEffect(() => {
    let playersToSort = [...rawPlayerStats];

    playersToSort.sort((a, b) => {
      if (sortMetric === "total") {
        // DNF always at the bottom only for total metric
        if (a.hasDNF && !b.hasDNF) return 1;
        if (!a.hasDNF && b.hasDNF) return -1;
        if (a.hasDNF && b.hasDNF) return 0;
      }

      if (sortMetric === "top2") {
        // Minimum 2 valid rounds required to qualify, single round players go to the bottom
        const aHasMin = a.validRoundsPlayed >= 2;
        const bHasMin = b.validRoundsPlayed >= 2;
        if (aHasMin && !bHasMin) return -1;
        if (!aHasMin && bHasMin) return 1;

        return a.relativeScoreTop2 - b.relativeScoreTop2;
      } else if (sortMetric === "points") {
        // Sort by cup points descending
        return b.cupPoints - a.cupPoints;
      } else {
        // sortMetric === "total"
        return a.relativeScoreAll - b.relativeScoreAll;
      }
    });

    setLeaderboard(playersToSort);
  }, [rawPlayerStats, sortMetric]);

  const getActiveRound = () => {
    if (
      !filter.startsWith("season_") &&
      !filter.startsWith("date_") &&
      filter !== "global"
    ) {
      return rounds.find((r) => r.round_id === filter);
    }
    return null;
  };

  const activeRound = getActiveRound();
  const cutLine = activeRound?.cut_line;

  const getHeaderTitle = () => {
    if (filter.startsWith("season_")) return `${filter.substring(7)} Rankings`;
    if (filter.startsWith("event_")) {
      const evt = events.find((d) => d.filterValue === filter);
      return evt ? `${evt.name} Rankings` : "Event Rankings";
    }
    if (filter.startsWith("date_")) {
      const d = new Date(filter.substring(5));
      return !isNaN(d.getTime())
        ? `${d.toLocaleDateString("en-US", { timeZone: "UTC" })} Rankings`
        : "Event Rankings";
    }
    if (filter === "global") return "Global Rankings";
    return "Event Leaderboard";
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white p-4 md:p-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-slate-800 pb-4 gap-4">
        <div>
          <h2 className="font-sports text-4xl uppercase tracking-tighter flex items-center gap-3">
            <Trophy className="text-kelly-green" size={32} />
            {getHeaderTitle()}
          </h2>
          <p className="font-data text-[10px] text-slate-500 uppercase tracking-[0.2em]">
            Live Standings
          </p>
        </div>

        <div className="w-full md:w-auto flex flex-col md:flex-row gap-4">
          <select
            value={sortMetric}
            onChange={(e) => setSortMetric(e.target.value)}
            className="w-full md:w-48 bg-dark-surface border border-slate-700 text-white rounded-xl p-3 focus:border-kelly-green focus:outline-none transition-colors appearance-none font-bold text-sm"
          >
            <option value="points">602 Cup Points</option>
            <option value="top2">Best 2 Rounds</option>
            <option value="total">Total Strokes</option>
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full md:w-64 bg-dark-surface border border-slate-700 text-white rounded-xl p-3 focus:border-kelly-green focus:outline-none transition-colors appearance-none font-bold text-sm"
          >
            <option value="global">Global Rankings</option>
            {seasons.length > 0 && (
              <optgroup label="Seasons">
                {seasons.map((season) => (
                  <option key={`season_${season}`} value={`season_${season}`}>
                    {season} Rankings
                  </option>
                ))}
              </optgroup>
            )}
            {events.length > 0 && (
              <optgroup label="Events">
                {events.map((evt) => {
                  return (
                    <option key={evt.filterValue} value={evt.filterValue}>
                      {evt.name}
                    </option>
                  );
                })}
              </optgroup>
            )}
            <optgroup label="Rounds">
              {rounds.map((round) => {
                const d = new Date(round.date);
                const dateStr = !isNaN(d.getTime())
                  ? d.toLocaleDateString("en-US", { timeZone: "UTC" })
                  : "Unknown Date";
                const displayStr = round.name
                  ? `${round.name} - ${dateStr} - ${round.location}`
                  : `${dateStr} - ${round.location}`;
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
            let isBelowCut = cutLine && rank > cutLine;

            // For "top2" metric, gray out players with less than 2 valid rounds
            if (sortMetric === "top2" && player.validRoundsPlayed < 2) {
              isBelowCut = true;
            }

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
                  ${
                    index < 3
                      ? "bg-dark-surface border-slate-700 shadow-[0_0_15px_rgba(76,187,23,0.1)] border-l-4 border-l-kelly-green"
                      : isBelowCut
                        ? "bg-transparent border-slate-800 opacity-50"
                        : "bg-transparent border-slate-800 opacity-90 hover:opacity-100 hover:bg-dark-surface/50"
                  }`}
                >
                  {/* Rank and Name */}
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <span
                        className={`font-sports text-3xl sm:text-4xl italic tracking-tighter ${index < 3 ? "text-white" : "text-slate-600"}`}
                      >
                        {rank < 10 ? `0${rank}` : rank}
                      </span>
                      {index === 0 && (
                        <Medal
                          size={16}
                          className="absolute -top-2 -right-3 text-kelly-green animate-pulse"
                        />
                      )}
                    </div>

                    <div>
                      <p
                        className={`font-bold text-lg uppercase tracking-tight flex items-center gap-2 ${index === 0 ? "text-kelly-green" : "text-white"}`}
                      >
                        {player.name}
                        {player.level === "cup" && (
                          <Trophy size={14} className="text-yellow-500" />
                        )}
                        {player.level === "competitive" && (
                          <Star
                            size={14}
                            className="text-yellow-400 fill-current"
                          />
                        )}
                      </p>
                      <p className="text-[10px] text-slate-500 font-data uppercase flex items-center gap-1">
                        <Calendar size={10} /> Rounds Played:{" "}
                        {player.roundsPlayed}
                      </p>
                    </div>
                  </div>

                  {/* Stats Block */}
                  <div className="flex flex-1 sm:flex-none justify-between sm:justify-end items-center gap-4 sm:gap-8 mt-2 sm:mt-0">
                    <div className="text-center">
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">
                        Avg
                      </p>
                      <p className="text-xl font-data font-bold text-slate-300">
                        {player.avgScore}
                      </p>
                    </div>

                    <div className="text-center sm:border-l border-slate-800 sm:pl-8">
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">
                        Thru
                      </p>
                      <p className="text-xl font-data font-bold text-slate-300">
                        {player.totalHoles}
                      </p>
                    </div>

                    <div className="text-center sm:border-l border-slate-800 sm:pl-8 min-w-[60px]">
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">
                        {sortMetric === "points" ? "PTS" : "Tot"}
                      </p>
                      <p
                        className={`text-3xl font-data font-black ${
                          (player.hasDNF && sortMetric === "total")
                            ? "text-red-500 text-xl"
                            : sortMetric === "points"
                              ? "text-slate-300"
                              : (sortMetric === "top2" ? player.relativeScoreTop2 : player.relativeScoreAll) > 0
                                ? "text-red-500"
                                : (sortMetric === "top2" ? player.relativeScoreTop2 : player.relativeScoreAll) < 0
                                  ? "text-kelly-green"
                                  : "text-slate-300"
                        }`}
                      >
                        {(player.hasDNF && sortMetric === "total")
                          ? "DNF"
                          : sortMetric === "points"
                            ? Math.round(player.cupPoints * 10) / 10
                            : (sortMetric === "top2" ? player.relativeScoreTop2 : player.relativeScoreAll) > 0
                              ? `+${sortMetric === "top2" ? player.relativeScoreTop2 : player.relativeScoreAll}`
                              : (sortMetric === "top2" ? player.relativeScoreTop2 : player.relativeScoreAll) === 0
                                ? "E"
                                : (sortMetric === "top2" ? player.relativeScoreTop2 : player.relativeScoreAll)}
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
