import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Activity } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import LeagueStandings from '../components/LeagueStandings';

const ROUNDS_KEY = 'putting_league_rounds';
const PLAYERS_KEY = 'putting_league_players';

const VenueDashboard = () => {
  const [activeRounds, setActiveRounds] = useState([]);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const unsubscribePlayers = onSnapshot(collection(db, PLAYERS_KEY), (snapshot) => {
      setPlayers(snapshot.docs.map(doc => doc.data()));
    });

    // Listen for live rounds on the course
    const unsubscribeRounds = onSnapshot(collection(db, ROUNDS_KEY), (snapshot) => {
      const allRounds = snapshot.docs.map(doc => doc.data());
      // Only keep 'Active' rounds that have a current user playing
      const currentActive = allRounds.filter(r => (r.status || '').toLowerCase() === 'active' && r.player_id);

      // Sort by last updated (if available) or by date
      currentActive.sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0));
      setActiveRounds(currentActive);
    });

    return () => {
      unsubscribeRounds();
      unsubscribePlayers();
    };
  }, []);

  // Compute a snapshot of how far each player is in their current round
  const livePlayers = useMemo(() => {
    const playersMap = new Map();
    players.forEach(p => {
      if (p.player_id) playersMap.set(p.player_id, p);
      if (p.uid) playersMap.set(p.uid, p);
    });

    const playersList = [];

    activeRounds.forEach(r => {
      let currentScore = 0;
      let holesPlayed = 0;

      if (r.scores) {
        Object.values(r.scores).forEach(s => {
          if (s > 0) {
            currentScore += s;
            holesPlayed++;
          }
        });
      }

      playersList.push({
        id: r.round_id + '_p1',
        playerName: r.player_name || 'Unknown Player',
        eventName: r.event_round_name || 'Practice Round',
        currentScore,
        holesPlayed
      });

      if (r.opponent_id) {
        let oppScore = 0;
        let oppHolesPlayed = 0;
        if (r.opponent_scores) {
          Object.values(r.opponent_scores).forEach(s => {
            if (s > 0) {
              oppScore += s;
              oppHolesPlayed++;
            }
          });
        }

        const opponent = playersMap.get(r.opponent_id);
        const oppName = opponent ? opponent.name : 'Unknown Opponent';

        playersList.push({
          id: r.round_id + '_p2',
          playerName: oppName,
          eventName: r.event_round_name || 'Practice Round',
          currentScore: oppScore,
          holesPlayed: oppHolesPlayed
        });
      }
    });

    return playersList.sort((a, b) => b.holesPlayed - a.holesPlayed); // Most progress first
  }, [activeRounds, players]);

  return (
    <div className="min-h-screen bg-dark-bg text-white font-sans p-8 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="font-sports text-6xl tracking-wide uppercase text-white">Club 602</h1>
          <p className="text-kelly-green text-xl font-data tracking-widest uppercase">Live Event Dashboard</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-xl">
          <div className="h-4 w-4 bg-kelly-green rounded-full animate-pulse" />
          <span className="text-lg uppercase font-bold tracking-widest text-slate-300">Live Broadcast</span>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">

        {/* Left Column: Live Action on Course */}
        <div className="bg-dark-surface border border-slate-700/50 rounded-3xl p-8 flex flex-col">
          <div className="flex items-center gap-4 mb-8">
            <Activity className="text-kelly-green" size={32} />
            <h2 className="font-sports text-4xl uppercase">On The Course</h2>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
            {livePlayers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
                <Trophy size={64} className="mb-4" />
                <p className="font-sports text-2xl uppercase">Course is Clear</p>
                <p className="font-data text-sm uppercase">Waiting for players to tee off...</p>
              </div>
            ) : (
              livePlayers.map((player, index) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={player.id}
                  className="bg-dark-bg border border-slate-800 p-6 rounded-2xl flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-bold text-2xl uppercase text-white">{player.playerName}</h3>
                    <p className="text-kelly-green text-sm font-data uppercase tracking-wider">{player.eventName}</p>
                  </div>
                  <div className="flex gap-8 text-center">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Thru</p>
                      <p className="text-3xl font-data font-black text-slate-300">{player.holesPlayed}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Score</p>
                      <p className="text-3xl font-data font-black text-kelly-green">{player.currentScore > 0 ? player.currentScore : 'E'}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Embedded Leaderboard Standings */}
        <div className="bg-dark-surface border border-slate-700/50 rounded-3xl p-8 flex flex-col">
          <div className="scale-110 transform origin-top w-[90%] mx-auto">
            {/* Using the existing preview standings component which handles its own real-time data */}
            <LeagueStandings />
          </div>
        </div>

      </div>
    </div>
  );
};

export default VenueDashboard;