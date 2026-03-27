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

const LeagueStandings = () => {
  const [filter, setFilter] = useState('all_time');
  const [players, setPlayers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [scores, setScores] = useState([]);
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

    return () => {
      unsubscribePlayers();
      unsubscribeRounds();
      unsubscribeScores();
    };
  }, []);

  const calculateRankings = useCallback((targetDateMs = null, filterParam = 'all_time') => {
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

    const scoresByPlayerId = {};
    for (const score of currentScores) {
      // Find the actual player id if the score used the UID
      let player = players.find(p => p.uid === score.player_id || p.player_id === score.player_id);

      // Fallback: If UID connection is broken, link by player_name from the score's round
      if (!player) {
         const round = currentRounds.find(r => r.round_id === score.round_id);
         if (round && round.player_name && round.player_id === score.player_id) {
             player = players.find(p => p.name.toLowerCase() === round.player_name.toLowerCase());
         }
      }

      const targetId = player ? player.player_id : score.player_id;

      if (!scoresByPlayerId[targetId]) {
        scoresByPlayerId[targetId] = [];
      }
      scoresByPlayerId[targetId].push(score);
    }

    const playerStats = players.map((player) => {
      const playerScores = scoresByPlayerId[player.player_id] || [];
      let totalScore = 0;
      let playedCount = 0;
      for (const s of playerScores) {
        const parsed = parseInt(s.score);
        if (!isNaN(parsed)) {
            totalScore += parsed;
            playedCount++;
        }
      }
      const avgScore = playedCount > 0 ? (totalScore / playedCount).toFixed(1) : 0;
      return {
        ...player,
        name: formatDisplayName(player.name),
        score: avgScore,
        played: playedCount,
      };
    });

    // Handle truly orphaned scores that couldn't be linked to any player profile
    const knownPlayerIds = new Set(players.map(p => p.player_id));
    const orphanIds = Object.keys(scoresByPlayerId).filter(id => !knownPlayerIds.has(id));

    const orphanStats = orphanIds.map(id => {
       const playerScores = scoresByPlayerId[id];
       const roundWithPlayer = currentRounds.find(r => r.player_id === id);
       const rawName = roundWithPlayer && roundWithPlayer.player_name ? roundWithPlayer.player_name : "Unknown Player";
       const name = formatDisplayName(rawName);

       let totalScore = 0;
       let playedCount = 0;
       for (const s of playerScores) {
         const parsed = parseInt(s.score);
         if (!isNaN(parsed)) {
             totalScore += parsed;
             playedCount++;
         }
       }
       const avgScore = playedCount > 0 ? (totalScore / playedCount).toFixed(1) : 0;
       return {
         player_id: id,
         uid: id,
         name: name,
         score: avgScore,
         played: playedCount,
       };
    });

    const activePlayers = [...playerStats, ...orphanStats].filter((p) => p.played > 0);
    activePlayers.sort((a, b) => parseFloat(a.score) - parseFloat(b.score));

    return activePlayers.map((p, index) => ({
      ...p,
      id: p.player_id || p.uid,
      rank: index + 1
    }));
  }, [players, rounds, scores, liveSeason]);

  const currentRankings = useMemo(() => {
     return calculateRankings(null, filter);
  }, [calculateRankings, filter]);

  const previousRankings = useMemo(() => {
     const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
     return calculateRankings(sevenDaysAgo, filter);
  }, [calculateRankings, filter]);

  const topPlayers = useMemo(() => {
      return currentRankings.map(player => {
          const prevPlayer = previousRankings.find(p => p.id === player.id);
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
          {['all_time', 'this_month', 'current_tournament'].map((f) => (
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
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Avg Score</p>
                <p className={`text-2xl font-data font-black ${index === 0 ? 'text-kelly-green' : 'text-white'}`}>
                  {player.score}
                </p>
              </div>

              <div className="hidden sm:block text-center border-l border-slate-800 pl-8">
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Rounds</p>
                <p className="text-2xl font-data font-bold text-slate-300">{player.played}</p>
              </div>
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