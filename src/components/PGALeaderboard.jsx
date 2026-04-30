import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { formatDisplayName } from "../utils/format";

const ROUNDS_KEY = "putting_league_rounds";
const PLAYERS_KEY = "putting_league_players";
const COURSES_KEY = "putting_league_courses";

const PGALeaderboard = () => {
  const [allRounds, setAllRounds] = useState([]);
  const [activeRounds, setActiveRounds] = useState([]);
  const [targetRounds, setTargetRounds] = useState([]);
  const [players, setPlayers] = useState([]);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const unsubscribePlayers = onSnapshot(
      collection(db, PLAYERS_KEY),
      (snapshot) => {
        setPlayers(snapshot.docs.map((doc) => doc.data()));
      },
    );

    const unsubscribeCourses = onSnapshot(
      collection(db, COURSES_KEY),
      (snapshot) => {
        setCourses(snapshot.docs.map((doc) => doc.data()));
      },
    );

    const unsubscribeRounds = onSnapshot(
      collection(db, ROUNDS_KEY),
      (snapshot) => {
        const fetchedRounds = snapshot.docs.map((doc) => doc.data());

        // Find all active rounds (both events/template rounds and personal rounds)
        const currentActive = fetchedRounds.filter(
          (r) => (r.status || "").toLowerCase() === "active",
        );

        const getRoundTime = (r) => {
          if (r.date) return new Date(r.date).getTime();
          if (r.created_at) {
            // handle firestore timestamp or iso string
            if (typeof r.created_at === "string") {
              return new Date(r.created_at).getTime();
            }
            return r.created_at.toMillis
              ? r.created_at.toMillis()
              : r.created_at.seconds * 1000;
          }
          // Fallback: If it's a personal round missing a date/created_at, try to use its template round's date
          if (r.event_round_id) {
            const template = fetchedRounds.find(
              (tr) => tr.round_id === r.event_round_id,
            );
            if (template && template.date) {
              return new Date(template.date).getTime();
            }
          }
          return 0;
        };

        currentActive.sort((a, b) => getRoundTime(b) - getRoundTime(a));

        // Determine the target event/date to display.
        // Priority 1: Currently active event_id or date
        // Priority 2: Most recently completed event_id or date

        let targetEventId = null;
        let targetDate = null;

        const getTargetFromRound = (round) => {
          let tEventId = round.event_id;
          let tDate = round.date;

          // If this is a personal round linked to a template round, we need the template's event_id
          if (!tEventId && round.event_round_id) {
            const templateRound = fetchedRounds.find(
              (r) => r.round_id === round.event_round_id,
            );
            if (templateRound) {
              tEventId = templateRound.event_id;
              tDate = templateRound.date;
            }
          }
          return { tEventId, tDate };
        };

        if (currentActive.length > 0) {
          const { tEventId, tDate } = getTargetFromRound(currentActive[0]);
          targetEventId = tEventId;
          targetDate = tDate;
        } else {
          // No active rounds. Find the most recent round overall.
          const sortedAll = [...fetchedRounds].sort(
            (a, b) => getRoundTime(b) - getRoundTime(a),
          );
          if (sortedAll.length > 0) {
            const { tEventId, tDate } = getTargetFromRound(sortedAll[0]);
            targetEventId = tEventId;
            targetDate = tDate;
          }
        }

        let relevantRounds = [];
        if (targetEventId) {
          // Get all template rounds for this event
          const eventTemplateRounds = fetchedRounds.filter(
            (r) => r.event_id === targetEventId,
          );
          const templateRoundIds = eventTemplateRounds.map((r) => r.round_id);

          relevantRounds = fetchedRounds.filter(
            (r) =>
              r.event_id === targetEventId ||
              templateRoundIds.includes(r.event_round_id),
          );
        } else if (targetDate) {
          relevantRounds = fetchedRounds.filter((r) => r.date === targetDate);
        }

        setAllRounds(fetchedRounds);
        setActiveRounds(currentActive);
        setTargetRounds(relevantRounds);
      },
    );

    return () => {
      unsubscribeRounds();
      unsubscribePlayers();
      unsubscribeCourses();
    };
  }, []);

  const getScoreStyle = (score, par) => {
    if (!score || score === 0) return "";
    const diff = score - par;
    if (diff <= -3) {
      return "bg-kelly-green rounded-full border border-white text-dark-bg font-bold p-[2px] w-6 h-6 flex items-center justify-center mx-auto"; // Albatross
    } else if (diff === -2) {
      return "bg-kelly-green rounded-full text-dark-bg font-bold p-[2px] w-6 h-6 flex items-center justify-center mx-auto"; // Eagle
    } else if (diff === -1) {
      return "border border-kelly-green rounded-full text-kelly-green font-bold p-[2px] w-6 h-6 flex items-center justify-center mx-auto"; // Birdie
    } else if (diff === 1) {
      return "border border-red-500 text-red-500 font-bold p-[2px] w-6 h-6 flex items-center justify-center mx-auto"; // Bogey
    } else if (diff >= 2) {
      return "bg-red-500 text-white font-bold p-[2px] w-6 h-6 flex items-center justify-center mx-auto"; // Double Bogey+
    }
    return "w-6 h-6 flex items-center justify-center mx-auto"; // Par
  };

  const hybridPlayersData = useMemo(() => {
    const playersMap = new Map();
    players.forEach((p) => {
      if (p.player_id) playersMap.set(p.player_id, p);
      if (p.uid) playersMap.set(p.uid, p);
    });

    const coursesMap = new Map();
    courses.forEach((c) => {
      if (c.course_id) coursesMap.set(c.course_id, c);
    });

    const activeRoundIds = new Set(activeRounds.map((r) => r.round_id));

    // Determine dynamically how many rounds exist in this target group
    // (e.g. Round 1, Round 2)
    // We can infer this from the round names or assume up to max N.
    // For simplicity, we assign an index based on chronological order of their rounds.
    const playerStats = new Map();

    // Group target rounds by player
    targetRounds.forEach((r) => {
      const processPlayer = (id, isOpponent) => {
        if (!id) return;
        if (!playerStats.has(id)) {
          const profile = playersMap.get(id);
          let name = "Unknown Player";
          if (profile) name = profile.name;
          else if (!isOpponent && r.player_name) name = r.player_name;
          else if (isOpponent) name = "Unknown Opponent";

          playerStats.set(id, {
            id,
            playerName: formatDisplayName(name, players),
            isActive: false,
            rounds: [],
            aggregateRelative: 0,
            totalStrokes: 0,
            latestHolesPlayed: 0,
            latestScores: [],
            latestCurrentScore: 0,
            hasDNF: false,
          });
        }

        const stats = playerStats.get(id);

        // Check if this round is active
        const isRoundActive =
          activeRoundIds.has(r.round_id) &&
          (r.status || "").toLowerCase() === "active";
        if (isRoundActive) {
          stats.isActive = true;
        }

        const course = coursesMap.get(r.course_id);
        const holesMap = new Map();
        if (course?.holes) {
          course.holes.forEach((h) => holesMap.set(h.hole, h));
        }

        let roundStrokes = 0;
        let roundPar = 0;
        let roundHolesPlayed = 0;
        let dnf = false;

        const holeScores = [];
        for (let i = 1; i <= 18; i++) {
          const scoresObj = isOpponent ? r.opponent_scores : r.scores;
          const score = scoresObj && scoresObj[i] ? scoresObj[i] : null;

          if (score === "DNF" || (!isOpponent && r.status === "DNF")) {
            dnf = true;
          }

          const holeData = holesMap.get(i);
          const par = holeData ? holeData.par : 2;

          if (score && score > 0 && !dnf) {
            roundStrokes += score;
            roundPar += par;
            roundHolesPlayed++;
          }
          holeScores.push({
            hole: i,
            score: score && score > 0 ? score : null,
            par,
          });
        }

        if (dnf) {
          stats.hasDNF = true;
        }

        const roundRelative = roundStrokes - roundPar;
        const isComplete =
          roundHolesPlayed === 18 ||
          (r.status || "").toLowerCase() === "completed";

        stats.rounds.push({
          round_id: r.round_id,
          date: r.date,
          strokes: roundStrokes,
          relative: roundRelative,
          isComplete,
          isActive: isRoundActive,
          holeScores,
          holesPlayed: roundHolesPlayed,
        });
      };

      processPlayer(r.player_id || r.uid, false);
      if (r.opponent_id) {
        processPlayer(r.opponent_id, true);
      }
    });

    const maxRounds = Math.max(
      0,
      ...Array.from(playerStats.values()).map((p) => p.rounds.length),
    );

    const playersList = Array.from(playerStats.values()).map((stats) => {
      // Sort rounds chronologically for this player
      stats.rounds.sort(
        (a, b) =>
          new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime(),
      );

      // Compute aggregates
      if (!stats.hasDNF) {
        stats.rounds.forEach((r) => {
          stats.aggregateRelative += r.relative;
          stats.totalStrokes += r.strokes;
        });
      }

      // For the 1..18 view, grab their active round or their most recent round
      let displayRound = stats.rounds.find((r) => r.isActive);
      if (!displayRound && stats.rounds.length > 0) {
        displayRound = stats.rounds[stats.rounds.length - 1];
      }

      if (displayRound) {
        stats.latestScores = displayRound.holeScores;
        stats.latestHolesPlayed = displayRound.holesPlayed;
        stats.latestCurrentScore = displayRound.strokes;
      } else {
        // Fallback empty
        stats.latestScores = Array(18).fill({ hole: 0, score: null, par: 2 });
      }

      return stats;
    });

    playersList.sort((a, b) => {
      if (a.hasDNF && !b.hasDNF) return 1;
      if (!a.hasDNF && b.hasDNF) return -1;
      if (a.aggregateRelative === b.aggregateRelative) {
        return b.latestHolesPlayed - a.latestHolesPlayed;
      }
      return a.aggregateRelative - b.aggregateRelative;
    });

    return { playersList, maxRounds };
  }, [targetRounds, activeRounds, players, courses]);

  return (
    <div className="w-full bg-dark-bg p-6 text-white font-sans overflow-x-auto">
      <div className="min-w-[1000px]">
        <table className="w-full border-collapse text-center">
          <thead className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
            <tr>
              <th className="py-3 px-2 text-left font-bold w-12">Pos</th>
              <th className="py-3 px-2 text-left font-bold w-48">Player</th>
              <th className="py-3 px-2 font-bold w-16">Thru</th>
              <th className="py-3 px-2 font-bold w-16 border-r border-slate-700">
                Score
              </th>
              {[...Array(hybridPlayersData.maxRounds)].map((_, i) => (
                <th
                  key={`rnd_col_${i}`}
                  className="py-3 px-2 font-bold w-16 border-r border-slate-700"
                >
                  R{i + 1}
                </th>
              ))}
              <th className="py-3 px-2 font-bold w-16 border-r border-slate-700">
                Tot
              </th>
              {[...Array(18)].map((_, i) => (
                <th key={i} className="py-3 px-1 font-bold w-8">
                  {i + 1}
                </th>
              ))}
              <th className="py-3 px-2 font-bold w-16 border-l border-slate-700">
                Rnd
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {hybridPlayersData.playersList.length === 0 ? (
              <tr>
                <td
                  colSpan={23 + hybridPlayersData.maxRounds}
                  className="py-12 text-slate-500 italic text-center"
                >
                  No players found for this event.
                </td>
              </tr>
            ) : (
              hybridPlayersData.playersList.map((player, index) => (
                <motion.tr
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={player.id}
                  className={`transition-colors ${
                    player.isActive
                      ? "bg-kelly-green/10 shadow-[inset_0_0_10px_rgba(76,187,23,0.15)] border-l-4 border-l-kelly-green"
                      : "hover:bg-slate-800/30"
                  }`}
                >
                  <td className="py-3 px-2 text-left font-data font-bold text-slate-300">
                    {index + 1}
                  </td>
                  <td className="py-3 px-2 text-left font-bold uppercase truncate max-w-[12rem]">
                    {player.playerName}
                  </td>
                  <td className="py-3 px-2 font-data text-slate-400">
                    {player.latestHolesPlayed === 18
                      ? "F"
                      : player.latestHolesPlayed === 0
                        ? "-"
                        : player.latestHolesPlayed}
                  </td>

                  {/* Aggregate Score */}
                  <td className="py-3 px-2 font-data font-black text-lg border-r border-slate-800/50">
                    <span
                      className={
                        player.hasDNF
                          ? "text-red-500"
                          : player.aggregateRelative > 0
                            ? "text-red-500"
                            : player.aggregateRelative < 0
                              ? "text-kelly-green"
                              : "text-slate-300"
                      }
                    >
                      {player.hasDNF
                        ? "DNF"
                        : player.aggregateRelative > 0
                          ? `+${player.aggregateRelative}`
                          : player.aggregateRelative === 0
                            ? "E"
                            : player.aggregateRelative}
                    </span>
                  </td>

                  {/* Dynamic Rounds */}
                  {[...Array(hybridPlayersData.maxRounds)].map((_, i) => {
                    const r = player.rounds[i];
                    if (!r) {
                      return (
                        <td
                          key={`rnd_score_${i}`}
                          className="py-3 px-2 font-data text-slate-500 border-r border-slate-800/50"
                        >
                          -
                        </td>
                      );
                    }
                    return (
                      <td
                        key={`rnd_score_${i}`}
                        className={`py-3 px-2 font-data border-r border-slate-800/50 ${r.isComplete ? "font-bold text-white" : "text-slate-300"}`}
                      >
                        {r.strokes > 0 ? r.strokes : "-"}
                      </td>
                    );
                  })}

                  {/* Total Strokes */}
                  <td className="py-3 px-2 font-data font-bold text-slate-300 border-r border-slate-800/50">
                    {player.hasDNF ? "-" : player.totalStrokes || "-"}
                  </td>

                  {/* 1..18 Hole by Hole */}
                  {player.latestScores.map((scoreObj, i) => (
                    <td key={i} className="py-3 px-1 font-data text-sm">
                      <div
                        className={getScoreStyle(scoreObj.score, scoreObj.par)}
                      >
                        {scoreObj.score ? scoreObj.score : "-"}
                      </div>
                    </td>
                  ))}

                  {/* Latest Round Strokes */}
                  <td className="py-3 px-2 font-data text-slate-300 border-l border-slate-800/50">
                    {player.latestCurrentScore || "-"}
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PGALeaderboard;
