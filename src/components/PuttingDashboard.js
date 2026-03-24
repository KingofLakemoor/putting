import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, PlusCircle, Activity, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Dialog } from '@headlessui/react';
import { useAuth } from '../contexts/AuthContext';
import { getActiveRoundForUser, createActiveRound } from '../db';

const PuttingDashboard = ({ activeRounds = [], standings = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeRoundId, setActiveRoundId] = useState(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    const checkActiveRound = async () => {
      if (currentUser) {
        try {
          const round = await getActiveRoundForUser(currentUser.uid);
          if (round) {
            setActiveRoundId(round.round_id);
          }
        } catch (error) {
          console.error("Error fetching active round:", error);
        }
      }
    };
    checkActiveRound();
  }, [currentUser]);

  const handleStartRound = async () => {
    try {
      if (activeRoundId) {
        navigate(`/scorecard/${activeRoundId}`);
      } else {
        const userName = currentUser.displayName || currentUser.email;
        const newRound = await createActiveRound(currentUser.uid, userName);
        navigate(`/scorecard/${newRound.round_id}`);
      }
    } catch (error) {
      console.error("Error starting round:", error);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white p-4 md:p-8 font-sans">
      {/* Header Area */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-sports text-4xl tracking-wide uppercase">Club 602</h1>
          <p className="text-slate-400 text-sm font-data">LEAGUE MANAGEMENT v2.0</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-kelly-green rounded-full animate-ping" />
          <span className="text-xs uppercase font-bold tracking-widest text-kelly-green">Live Session</span>
        </div>
      </header>

      {/* BENTO GRID START */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[180px]">

        {/* TOP LEFT: LIVE LEADERBOARD (Large) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="order-2 md:order-none md:col-span-2 md:row-span-2 bg-dark-surface border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="flex items-center gap-2 font-sports text-2xl">
              <Trophy className="text-kelly-green" size={24} />
              Current Standings
            </h2>
            <button className="text-xs text-slate-400 hover:text-white transition-colors">VIEW ALL</button>
          </div>

          {/* Leaderboard Row Example */}
          <div className="space-y-3">
            {standings.slice(0, 3).map((player, index) => {
              const rank = index + 1;
              return (
                <div key={player.player_id} className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-xl border-l-4 border-kelly-green group-hover:translate-x-1 transition-transform">
                  <div className="flex items-center gap-4">
                    <span className="font-data font-black text-2xl italic text-slate-600">0{rank}</span>
                    <div>
                      <p className="font-bold text-lg">{player.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Rounds: {player.roundsPlayed}</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center">
                      <p className="text-[9px] text-slate-500 uppercase">Score</p>
                      <p className="text-2xl font-data font-bold text-kelly-green">{player.totalScore}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <TrendingUp size={16} className="text-kelly-green mb-1" />
                      <span className="text-[9px] text-slate-500">POS</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {standings.length === 0 && (
              <p className="text-slate-400 text-sm italic">No standings available yet.</p>
            )}
          </div>
        </motion.div>

        {/* TOP RIGHT: QUICK ACTION (Small Square) */}
        <motion.button
          whileHover={{ scale: 0.98 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStartRound}
          className="order-1 md:order-none bg-kelly-green text-dark-bg rounded-2xl flex flex-col items-center justify-center gap-3 font-sports text-3xl group p-4 text-center"
        >
          <PlusCircle size={48} className="group-hover:rotate-90 transition-transform duration-300" />
          {activeRoundId ? "RESUME ROUND" : "START ROUND"}
        </motion.button>

        {/* Start Round Modal */}
        <AnimatePresence>
          {isOpen && (
            <Dialog
              static
              as={motion.div}
              open={isOpen}
              onClose={() => setIsOpen(false)}
              className="relative z-50"
            >
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              />

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                  <Dialog.Panel
                    as={motion.div}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="w-full max-w-md bg-dark-surface border border-slate-700/50 rounded-2xl p-6 text-white shadow-xl"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <Dialog.Title className="font-sports text-2xl text-kelly-green tracking-wide">
                        Select a Round
                      </Dialog.Title>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                      {activeRounds.length === 0 ? (
                        <p className="text-slate-400 text-sm">No active rounds available right now.</p>
                      ) : (
                        activeRounds.map((round) => {
                          const dateStr = new Date(round.date).toLocaleDateString('en-US', { timeZone: 'UTC' });
                          return (
                            <button
                              key={round.round_id}
                              onClick={() => {
                                setIsOpen(false);
                                navigate(`/rounds/${round.round_id}/scorecard`);
                              }}
                              className="w-full text-left p-4 bg-dark-bg/50 border border-slate-700 hover:border-kelly-green/50 hover:bg-slate-800/50 rounded-xl transition-all group flex justify-between items-center"
                            >
                              <div>
                                <h3 className="font-bold text-lg group-hover:text-kelly-green transition-colors">
                                  {round.name || 'Round'}
                                </h3>
                                <p className="text-xs text-slate-400">
                                  {dateStr} • {round.location}
                                </p>
                              </div>
                              <PlusCircle className="text-slate-500 group-hover:text-kelly-green transition-colors" size={20} />
                            </button>
                          );
                        })
                      )}
                    </div>
                  </Dialog.Panel>
                </div>
              </div>
            </Dialog>
          )}
        </AnimatePresence>

        {/* MIDDLE RIGHT: RECENT PERFORMANCE (Small Square) */}
        <div className="order-3 md:order-none bg-dark-surface border border-slate-700/50 rounded-2xl p-6 flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">My Avg</h3>
          <div className="text-5xl font-data font-black text-white">2.4</div>
          <div className="text-kelly-green text-xs flex items-center gap-1">
            <TrendingUp size={14} /> +0.2 from last week
          </div>
        </div>

        {/* BOTTOM FULL: ACTIVE ROUNDS / REPORTING (Horizontal) */}
        <div className="order-4 md:order-none md:col-span-3 bg-dark-surface border border-slate-700/50 rounded-2xl p-6">
           <div className="flex items-center gap-2 mb-4">
              <Activity size={18} className="text-kelly-green" />
              <h2 className="font-sports text-xl uppercase">Report Scores</h2>
           </div>
           {activeRounds.length === 0 ? (
             <p className="text-slate-400">
               Have an idea for a putting league? Let Club 602 know on <a href="https://www.instagram.com/club_602/" className="text-kelly-green hover:underline">Instagram</a>.
             </p>
           ) : (
             <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {activeRounds.map(round => {
                  const dateStr = new Date(round.date).toLocaleDateString('en-US', { timeZone: 'UTC' });
                  return (
                    <div key={round.round_id} className="min-w-[280px] bg-dark-bg p-4 rounded-xl border border-slate-800 flex justify-between items-center shrink-0">
                      <div>
                        <p className="font-bold">{round.name ? round.name : 'Round'}</p>
                        <p className="text-xs text-slate-500">{dateStr} - {round.location}</p>
                      </div>
                      <Link to={`/rounds/${round.round_id}/scorecard`} className="bg-slate-800 px-4 py-2 rounded-lg text-xs font-bold hover:bg-kelly-green hover:text-dark-bg transition-colors">
                        SCORE
                      </Link>
                    </div>
                  );
                })}
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default PuttingDashboard;
