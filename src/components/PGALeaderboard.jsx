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
  const [activeRounds, setActiveRounds] = useState([]);
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

    // Listen for live rounds on the course
    const unsubscribeRounds = onSnapshot(
      collection(db, ROUNDS_KEY),
      (snapshot) => {
        const allRounds = snapshot.docs.map((doc) => doc.data());
        // Only keep 'Active' rounds that have a current user playing
        const currentActive = allRounds.filter(
          (r) => (r.status || "").toLowerCase() === "active" && r.player_id,
        );

        // Sort by last updated (if available) or by date
        currentActive.sort(
          (a, b) =>
            new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
        );
        setActiveRounds(currentActive);
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

  const livePlayers = useMemo(() => {
    const playersMap = new Map();
    players.forEach((p) => {
      if (p.player_id) playersMap.set(p.player_id, p);
      if (p.uid) playersMap.set(p.uid, p);
    });

    const coursesMap = new Map();
    courses.forEach((c) => {
      if (c.course_id) coursesMap.set(c.course_id, c);
    });

    const playersList = [];

    activeRounds.forEach((r) => {
      const course = coursesMap.get(r.course_id);

      const holesMap = new Map();
      if (course?.holes) {
        course.holes.forEach((h) => holesMap.set(h.hole, h));
      }

      let currentScore = 0;
      let holesPlayed = 0;
      let parSum = 0;

      const playerProfile =
        playersMap.get(r.player_id) || playersMap.get(r.uid);
      const actualName = playerProfile ? playerProfile.name : r.player_name;

      const playerScores = [];
      for (let i = 1; i <= 18; i++) {
        const score = r.scores && r.scores[i] ? r.scores[i] : null;
        const holeData = holesMap.get(i);
        const par = holeData ? holeData.par : 2; // Default par 2

        if (score && score > 0) {
          currentScore += score;
          holesPlayed++;
          parSum += par;
        }
        playerScores.push({ hole: i, score: score, par: par });
      }

      const relativeScore = currentScore - parSum;

      playersList.push({
        id: r.round_id + "_p1",
        playerName: formatDisplayName(actualName, players),
        currentScore,
        relativeScore,
        holesPlayed,
        scores: playerScores,
      });

      if (r.opponent_id) {
        let oppScore = 0;
        let oppHolesPlayed = 0;
        let oppParSum = 0;

        const oppScores = [];
        for (let i = 1; i <= 18; i++) {
          const score =
            r.opponent_scores && r.opponent_scores[i]
              ? r.opponent_scores[i]
              : null;
          const holeData = holesMap.get(i);
          const par = holeData ? holeData.par : 2; // Default par 2

          if (score && score > 0) {
            oppScore += score;
            oppHolesPlayed++;
            oppParSum += par;
          }
          oppScores.push({ hole: i, score: score, par: par });
        }

        const opponent = playersMap.get(r.opponent_id);
        const oppName = opponent
          ? formatDisplayName(opponent.name, players)
          : "Unknown Opponent";
        const oppRelativeScore = oppScore - oppParSum;

        playersList.push({
          id: r.round_id + "_p2",
          playerName: oppName,
          currentScore: oppScore,
          relativeScore: oppRelativeScore,
          holesPlayed: oppHolesPlayed,
          scores: oppScores,
        });
      }
    });

    return playersList.sort((a, b) => {
      if (a.relativeScore === b.relativeScore) {
        return b.holesPlayed - a.holesPlayed;
      }
      return a.relativeScore - b.relativeScore;
    });
  }, [activeRounds, players, courses]);

  return (
    <div className="w-full bg-dark-bg p-6 text-white font-sans overflow-x-auto">
      <div className="min-w-[1000px]">
        <table className="w-full border-collapse text-center">
          <thead className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
            <tr>
              <th className="py-3 px-2 text-left font-bold w-12">Pos</th>
              <th className="py-3 px-2 text-left font-bold w-48">Player</th>
              <th className="py-3 px-2 font-bold w-16">Thru</th>
              <th className="py-3 px-2 font-bold w-16">Tot</th>
              {[...Array(18)].map((_, i) => (
                <th key={i} className="py-3 px-1 font-bold w-8">
                  {i + 1}
                </th>
              ))}
              <th className="py-3 px-2 font-bold w-16">Rnd</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {livePlayers.length === 0 ? (
              <tr>
                <td
                  colSpan="23"
                  className="py-12 text-slate-500 italic text-center"
                >
                  No active players on the course.
                </td>
              </tr>
            ) : (
              livePlayers.map((player, index) => (
                <motion.tr
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={player.id}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-3 px-2 text-left font-data font-bold text-slate-300">
                    {index + 1}
                  </td>
                  <td className="py-3 px-2 text-left font-bold uppercase truncate max-w-[12rem]">
                    {player.playerName}
                  </td>
                  <td className="py-3 px-2 font-data text-slate-400">
                    {player.holesPlayed === 18
                      ? "F"
                      : player.holesPlayed === 0
                        ? "-"
                        : player.holesPlayed}
                  </td>
                  <td className="py-3 px-2 font-data font-bold">
                    <span
                      className={
                        player.relativeScore > 0
                          ? "text-red-500"
                          : player.relativeScore < 0
                            ? "text-kelly-green"
                            : "text-slate-300"
                      }
                    >
                      {player.holesPlayed === 0
                        ? "E"
                        : player.relativeScore > 0
                          ? `+${player.relativeScore}`
                          : player.relativeScore === 0
                            ? "E"
                            : player.relativeScore}
                    </span>
                  </td>
                  {player.scores.map((scoreObj, i) => (
                    <td key={i} className="py-3 px-1 font-data text-sm">
                      <div
                        className={getScoreStyle(scoreObj.score, scoreObj.par)}
                      >
                        {scoreObj.score ? scoreObj.score : "-"}
                      </div>
                    </td>
                  ))}
                  <td className="py-3 px-2 font-data text-slate-300">
                    {player.currentScore || "-"}
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
