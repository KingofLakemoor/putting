import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { getSettings } from '../db';
import { formatDisplayName } from '../utils/format';


const PLAYERS_KEY = 'putting_league_players';
const ROUNDS_KEY = 'putting_league_rounds';
const SCORES_KEY = 'putting_league_scores';
const COURSES_KEY = 'putting_league_courses';
const CUP_POINTS_KEY = 'putting_league_cup_points';

const LeagueStandings = () => {
  const [filter, setFilter] = useState('602_cup');
  const [players, setPlayers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [scores, setScores] = useState([]);
  const [courses, setCourses] = useState([]);
  const [cupPoints, setCupPoints] = useState([]);
  const [liveSeason, setLiveSeason] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await getSettings();
      if (settings && settings.live_season) {
        setLiveSeason(settings.live_season);
      }
    };
    fetchSettings();

    const unsubscribePlayers = onSnapshot(collection(db, PLAYERS_KEY), (snapshot) => {
      setPlayers(snapshot.docs.map((doc) => doc.data()));
    });
    const unsubscribeRounds = onSnapshot(collection(db, ROUNDS_KEY), (snapshot) => {
      setRounds(snapshot.docs.map((doc) => doc.data()));
    });
    const unsubscribeScores = onSnapshot(collection(db, SCORES_KEY), (snapshot) => {
      setScores(snapshot.docs.map((doc) => doc.data()));
    });
    const unsubscribeCourses = onSnapshot(collection(db, COURSES_KEY), (snapshot) => {
      setCourses(snapshot.docs.map((doc) => doc.data()));
    });
    const unsubscribeCupPoints = onSnapshot(collection(db, CUP_POINTS_KEY), (snapshot) => {
      setCupPoints(snapshot.docs.map((doc) => doc.data()));
    });

    return () => {
      unsubscribePlayers();
      unsubscribeRounds();
      unsubscribeScores();
      unsubscribeCourses();
      unsubscribeCupPoints();
    };
  }, []);

  const calculateRankings = useCallback((targetDateMs = null, filterParam = '602_cup') => {
    let currentRounds = rounds;
    let currentScores = scores;

    // Filter by date for historical calculation
    if (targetDateMs) {
      currentRounds = rounds.filter(r => new Date(r.date || r.createdAt || Date.now()).getTime() <= targetDateMs);
      const validRoundIds = new Set(currentRounds.map(r => r.round_id));
      currentScores = scores.filter(s => validRoundIds.has(s.round_id) && new Date(s.timestamp).getTime() <= targetDateMs);
    }

    // Additional view filtering
    const now = targetDateMs ? new Date(targetDateMs) : new Date();

    if (filterParam === 'this_month') {
       const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
       const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();

       currentRounds = currentRounds.filter(r => {
           const rDate = new Date(r.date || r.createdAt || Date.now()).getTime();
           return rDate >= startOfMonth && rDate <= endOfMonth;
       });
       const validRoundIds = new Set(currentRounds.map(r => r.round_id));
       currentScores = currentScores.filter(s => validRoundIds.has(s.round_id));
    } else if (filterParam === 'current_tournament') {
       if (liveSeason) {
           currentRounds = currentRounds.filter(r => r.season === liveSeason);
           const validRoundIds = new Set(currentRounds.map(r => r.round_id));
           currentScores = currentScores.filter(s => validRoundIds.has(s.round_id));
       } else {
           // Using the latest active round's season or round_id
           const activeRounds = currentRounds.filter(r => (r.status || '').toLowerCase() === 'active');
           if (activeRounds.length > 0) {
               const latestActiveRound = activeRounds.sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0))[0];

               if (latestActiveRound.season) {
                   currentRounds = currentRounds.filter(r => r.season === latestActiveRound.season);
               } else {
                   currentRounds = currentRounds.filter(r => r.round_id === latestActiveRound.round_id);
               }

               const validRoundIds = new Set(currentRounds.map(r => r.round_id));
               currentScores = currentScores.filter(s => validRoundIds.has(s.round_id));
           }
       }
    }

    const playersMap = new Map();
    const playersByNameMap = new Map();
    players.forEach(p => {
        if (p.uid) playersMap.set(p.uid, p);
        if (p.player_id) playersMap.set(p.player_id, p);
        if (p.name) playersByNameMap.set(p.name.toLowerCase(), p);
    });

    if (filterParam === '602_cup') {
       const currentYear = now.getFullYear();
       const currentCupPoints = cupPoints.filter(cp => cp.year === currentYear);

       const pointsByPlayerId = {};
       for (const cp of currentCupPoints) {
          const targetId = cp.player_id;
          if (!pointsByPlayerId[targetId]) {
             pointsByPlayerId[targetId] = { totalPoints: 0, eventsPlayed: 0 };
          }
          pointsByPlayerId[targetId].totalPoints += cp.points || 0;
          pointsByPlayerId[targetId].eventsPlayed += 1;
       }

       const cupStats = Object.keys(pointsByPlayerId).map(playerId => {
           const player = playersMap.get(playerId);
           const playerName = player ? player.name : "Unknown Player";

           return {
               player_id: playerId,
               uid: playerId,
               name: formatDisplayName(playerName),
               totalPoints: pointsByPlayerId[playerId].totalPoints,
               eventsPlayed: pointsByPlayerId[playerId].eventsPlayed,
               played: pointsByPlayerId[playerId].eventsPlayed // For consistency with `.filter((p) => p.played > 0)`
           };
       });

       const activePlayers = cupStats.filter((p) => p.played > 0);
       activePlayers.sort((a, b) => b.totalPoints - a.totalPoints); // Highest points first

       return activePlayers.map((p, index) => ({
         ...p,
         id: p.player_id || p.uid,
         rank: index + 1
       }));
    }

    const roundsMap = new Map();
    currentRounds.forEach(r => {
        if (r.round_id) roundsMap.set(r.round_id, r);
    });

    const coursesMap = new Map();
    courses.forEach(c => {
        if (c.course_id) coursesMap.set(c.course_id, c);
    });

    const scoresByPlayerId = {};
    for (const score of currentScores) {
      // Find the actual player id if the score used the UID
      let player = playersMap.get(score.player_id);

      // Fallback: If UID connection is broken, link by player_name from the score's round
      if (!player) {
         const round = roundsMap.get(score.round_id);
         if (round && round.player_name && round.player_id === score.player_id) {
             player = playersByNameMap.get(round.player_name.toLowerCase());
         }
      }

      const targetId = player ? player.player_id : score.player_id;

      if (!scoresByPlayerId[targetId]) {
        scoresByPlayerId[targetId] = [];
      }
      scoresByPlayerId[targetId].push(score);
    }

    const calculateStats = (playerId, playerName, playerScores) => {
      let totalScore = 0;
      let totalPar = 0;
      let totalHoles = 0;
      let playedCount = 0;

      for (const s of playerScores) {
        const parsed = parseInt(s.score);
        if (!isNaN(parsed)) {
            totalScore += parsed;
            playedCount++;

            const round = roundsMap.get(s.round_id);
            let parForRound = 36;
            let holesForRound = 18;

            if (round && round.course_id) {
               const course = coursesMap.get(round.course_id);
               if (course && course.holes) {
                  parForRound = course.holes.reduce((sum, h) => sum + h.par, 0);
                  holesForRound = course.holes.length;
               }
            }

            totalPar += parForRound;
            totalHoles += holesForRound;
        }
      }

      const relativeScore = totalScore - totalPar;
      const avgScore = totalHoles > 0 ? ((totalScore / totalHoles) * 18).toFixed(1) : 0;

      return {
        player_id: playerId,
        uid: playerId,
        name: formatDisplayName(playerName),
        avgScore: avgScore,
        relativeScore: relativeScore,
        totalHoles: totalHoles,
        played: playedCount,
      };
    };

    const playerStats = players.map((player) => {
      const playerScores = scoresByPlayerId[player.player_id] || [];
      return calculateStats(player.player_id, player.name, playerScores);
    });

    // Handle truly orphaned scores that couldn't be linked to any player profile
    const knownPlayerIds = new Set(players.map(p => p.player_id));
    const orphanIds = Object.keys(scoresByPlayerId).filter(id => !knownPlayerIds.has(id));

    const orphanStats = orphanIds.map(id => {
       const playerScores = scoresByPlayerId[id];
       // Check if there is a round matching this player_id using the rounds we already fetched
       let roundWithPlayer = null;
       for (const round of currentRounds) {
           if (round.player_id === id) {
               roundWithPlayer = round;
               break;
           }
       }
       const rawName = roundWithPlayer && roundWithPlayer.player_name ? roundWithPlayer.player_name : "Unknown Player";

       return calculateStats(id, rawName, playerScores);
    });

    const activePlayers = [...playerStats, ...orphanStats].filter((p) => p.played > 0);
    activePlayers.sort((a, b) => a.relativeScore - b.relativeScore);

    return activePlayers.map((p, index) => ({
      ...p,
      id: p.player_id || p.uid,
      rank: index + 1
    }));
  }, [players, rounds, scores, liveSeason, cupPoints]);

  const currentRankings = useMemo(() => {
     return calculateRankings(null, filter);
  }, [calculateRankings, filter]);

  const previousRankings = useMemo(() => {
     const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
     return calculateRankings(sevenDaysAgo, filter);
  }, [calculateRankings, filter]);

  const topPlayers = useMemo(() => {
      const prevRankingsMap = new Map();
      previousRankings.forEach(p => prevRankingsMap.set(p.id, p));

      return currentRankings.map(player => {
          const prevPlayer = prevRankingsMap.get(player.id);
          let trend = 'stable';

          if (!prevPlayer) {
              trend = 'up'; // new player
          } else if (player.rank < prevPlayer.rank) {
              trend = 'up';
          } else if (player.rank > prevPlayer.rank) {
              trend = 'down';
          }

          return {
              ...player,
              trend
          };
      });
  }, [currentRankings, previousRankings]);

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <ChevronUp className="text-kelly-green" size={16} />;
    if (trend === 'down') return <ChevronDown className="text-red-500" size={16} />;
    return <Minus className="text-slate-600" size={16} />;
  };

  return (
    <div className="bg-dark-bg p-1 lg:p-6 text-white font-sans w-full max-w-2xl mx-auto">
      {/* Filter Toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-slate-800 p-1 rounded-lg inline-flex gap-1">
          {['602_cup', 'this_month', 'current_tournament'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-md transition-all ${
                filter === f
                  ? 'bg-kelly-green text-dark-bg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Header with Sports Aesthetic */}
      <div className="flex items-end justify-between mb-8 border-b border-slate-800 pb-4">
        <div>
          <h2 className="font-sports text-4xl uppercase tracking-tighter flex items-center gap-3">
            <Trophy className="text-kelly-green" size={32} />
            Leaderboard
          </h2>
          <p className="font-data text-[10px] text-slate-500 uppercase tracking-[0.2em]">Live Standings</p>
        </div>
        <div className="text-right">
          <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-1 rounded font-bold uppercase">Live Updates</span>
        </div>
      </div>

      {/* Rank List */}
      <div className="space-y-3">
        {topPlayers.length === 0 && (
            <div className="text-center text-slate-500 p-6 border border-dashed border-slate-800 rounded-xl">
                No active players found for this view.
            </div>
        )}
        {topPlayers.slice(0, 10).map((player, index) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            key={player.id}
            className={`relative group flex items-center justify-between p-4 rounded-xl border transition-all duration-300
              ${index < 3
                ? 'bg-dark-surface border-slate-700 shadow-[L-glow] border-l-4 border-l-kelly-green'
                : 'bg-transparent border-slate-800 opacity-80 hover:opacity-100 hover:bg-dark-surface/50'
              }`}
          >
            {/* Rank and Name */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <span className={`font-sports text-3xl italic tracking-tighter ${index < 3 ? 'text-white' : 'text-slate-600'}`}>
                  {player.rank < 10 ? `0${player.rank}` : player.rank}
                </span>
                {index === 0 && (
                  <Medal size={14} className="absolute -top-2 -right-2 text-kelly-green animate-pulse" />
                )}
              </div>

              <div>
                <p className={`font-bold text-lg uppercase tracking-tight ${index === 0 ? 'text-kelly-green' : 'text-white'}`}>
                  {player.name}
                </p>
                <div className="flex items-center gap-2">
                  {getTrendIcon(player.trend)}
                  <span className="text-[10px] text-slate-500 font-data uppercase">Pos Change</span>
                </div>
              </div>
            </div>

            {/* Stats Block */}
            <div className="flex flex-1 sm:flex-none justify-between sm:justify-end items-center gap-4 sm:gap-8 mt-2 sm:mt-0">
              {filter === '602_cup' ? (
                <>
                  <div className="text-center">
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Events</p>
                    <p className="text-xl font-data font-bold text-slate-300">
                      {player.eventsPlayed}
                    </p>
                  </div>

                  <div className="text-center sm:border-l border-slate-800 sm:pl-8 min-w-[60px]">
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Pts</p>
                    <p className="text-3xl font-data font-black text-kelly-green">
                      {player.totalPoints}
                    </p>
                  </div>
                </>
              ) : (
                <>
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
                      player.relativeScore > 0 ? 'text-red-500' :
                      player.relativeScore < 0 ? 'text-kelly-green' :
                      'text-slate-300'
                    }`}>
                      {player.relativeScore > 0 ? `+${player.relativeScore}` :
                       player.relativeScore === 0 ? 'E' :
                       player.relativeScore}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Subtle Glow Effect for Top Rank */}
            {index === 0 && (
              <div className="absolute inset-0 bg-kelly-green/5 rounded-xl pointer-events-none blur-xl -z-10" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Footer Call-to-Action */}
      <button className="w-full mt-6 py-3 border border-dashed border-slate-800 rounded-xl text-slate-500 font-data text-xs uppercase hover:border-kelly-green hover:text-white transition-all">
        Expand Full League Table
      </button>
    </div>
  );
};

export default LeagueStandings;